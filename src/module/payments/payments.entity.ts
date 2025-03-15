// src/modules/payment/payment.entity.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export enum PaymentStatus {
  PAID = "paid",
  PENDING = "pending",
  FAILED = "failed",
}

@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({ required: true })
  razorpayOrderId: string; // The order ID from Razorpay

  @Prop({ required: true })
  amount: number; // in base currency units (e.g. rupees)

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ required: true })
  userId: string; // reference to user

  @Prop()
  planId: string; // reference to plan

  @Prop()
  razorpayPaymentId?: string;

  @Prop()
  razorpaySignature?: string;

  @Prop({ type: String })
  error?: any; // store error or failure reason if any
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
