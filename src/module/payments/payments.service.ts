/* eslint-disable */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ClientSession } from "mongoose";
import Razorpay from "razorpay";
import { Payment } from "./payments.entity";
import { CreatePaymentDto, VerifyPaymentDto } from "./payments.dto";
import { SubscriptionService } from "../subscription/subscription.service";
import { PaymentStatus } from "./payments.enum";
import * as crypto from "crypto";
import { PlanService } from "../plan/plan.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: Razorpay;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    private subscriptionService: SubscriptionService,
    private planService: PlanService,
    private configService: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>("RAZORPAY_KEY_ID"),
      key_secret: this.configService.get<string>("RAZORPAY_KEY_SECRET"),
    });
  }

  private async findPendingPaymentForUserPlan(userId: string, planId: string) {
    // Add check for orders less than 6 hours old
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    return this.paymentModel.findOne({
      userId,
      planId,
      status: PaymentStatus.PENDING,
      createdAt: { $gt: sixHoursAgo },
    });
  }

  /**
   * 1) Create a Razorpay order
   * 2) Store Payment doc with status = PENDING
   */
  async initiatePayment(dto: CreatePaymentDto, userId: string) {
    try {
      const isExistingOrder = await this.findPendingPaymentForUserPlan(
        userId,
        dto.planId,
      );
      if (isExistingOrder) {
        try {
          await this.razorpay.orders.fetch(isExistingOrder.razorpayOrderId);
          return {
            orderId: isExistingOrder.razorpayOrderId,
            amount: isExistingOrder.amount,
            currency: "INR",
            key: this.configService.get("razorpay.keyId"),
            isExistingOrder: true,
          };
        } catch (error) {
          await this.paymentModel.findByIdAndUpdate(isExistingOrder._id, {
            status: PaymentStatus.FAILED,
            error: "Order expired",
          });
        }
      }

      const plan = await this.planService.getPlanById(dto.planId);

      // 1) Create order in Razorpay
      const paymentOrder = await this.razorpay.orders.create({
        amount: plan.price,
        currency: plan.currency,
        receipt: `sub_${Date.now()}`,
      });

      // 2) Create local Payment doc
      const payment = new this.paymentModel({
        razorpayOrderId: paymentOrder.id,
        amount: plan.price,
        userId,
        planId: dto.planId,
        status: PaymentStatus.PENDING,
      });

      await payment.save();

      return {
        orderId: paymentOrder.id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        key: process.env.RAZORPAY_KEY_ID, // front-end uses this
        isExistingOrder: false,
      };
    } catch (err) {
      this.logger.error("Failed to initiate Payment", err);
      throw new InternalServerErrorException("Could not create Razorpay order");
    }
  }

  /**
   * 1) Verify signature from Razorpay
   * 2) Mark Payment => 'paid'
   * 3) Upgrade subscription in a concurrency-safe manner (optionally with a transaction)
   */
  async verifyAndUpdatePayment(dto: VerifyPaymentDto) {
    const payment = await this.paymentModel.findOne({
      razorpayOrderId: dto.razorpayOrderId,
    });

    if (!payment) {
      throw new BadRequestException("Invalid Payment: not found");
    }

    // idempotency check
    if (payment.status === PaymentStatus.PAID) {
      return { success: true, payment };
    }
    if (payment.status === PaymentStatus.FAILED) {
      return { success: false, message: "Payment already failed previously" };
    }

    // 1) Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== dto.razorpaySignature) {
      // set doc => failed
      payment.status = PaymentStatus.FAILED;
      payment.error = "Signature mismatch";
      await payment.save();
      throw new BadRequestException("Invalid signature");
    }

    // 2) If signature matches => mark paid, then upgrade subscription
    // We do this in a transaction if possible (replica set or future usage)
    const useTransactions = this.configService.get("mongodb.useTransactions");
    if (useTransactions) {
      return this.finalizePaymentWithTransaction(payment, dto);
    } else {
      return this.finalizePaymentWithoutTransaction(payment, dto);
    }
  }

  private async finalizePaymentWithoutTransaction(
    payment: Payment,
    dto: VerifyPaymentDto,
  ) {
    // straightforward approach
    payment.razorpayPaymentId = dto.razorpayPaymentId;
    payment.razorpaySignature = dto.razorpaySignature;
    payment.status = PaymentStatus.PAID;
    await payment.save();

    // upgrade subscription
    await this.subscriptionService.upgradeSubscription({
      userId: payment.userId,
      planId: payment.planId,
    });

    return { success: true, payment };
  }

  private async finalizePaymentWithTransaction(
    payment: Payment,
    dto: VerifyPaymentDto,
  ) {
    const session = await this.paymentModel.db.startSession();
    session.startTransaction();
    try {
      // re-find Payment doc inside session
      const paymentDoc = await this.paymentModel
        .findById(payment._id)
        .session(session);
      if (!paymentDoc) {
        await session.abortTransaction();
        return {
          success: false,
          message: "Payment doc not found in transaction",
        };
      }
      if (paymentDoc.status !== PaymentStatus.PENDING) {
        // Payment might already be updated
        await session.abortTransaction();
        return { success: true, payment: paymentDoc };
      }

      // set doc => paid
      paymentDoc.razorpayPaymentId = dto.razorpayPaymentId;
      paymentDoc.razorpaySignature = dto.razorpaySignature;
      paymentDoc.status = PaymentStatus.PAID;
      await paymentDoc.save({ session });

      // Then upgrade subscription in same session
      await this.subscriptionService.upgradeSubscription(
        { userId: paymentDoc.userId, planId: paymentDoc.planId },
        session,
      );

      await session.commitTransaction();
      return { success: true, payment: paymentDoc };
    } catch (err) {
      await session.abortTransaction();
      // mark payment => failed
      payment.status = PaymentStatus.FAILED;
      payment.error = err.message;
      await payment.save();
      throw new BadRequestException(
        "Payment verification with transaction failed",
      );
    } finally {
      session.endSession();
    }
  }

  async getPaymentHistory(userId: string) {
    return await this.paymentModel.find({ userId });
  }
}
