// src/modules/payment/payment.controller.ts
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { CreatePaymentDto, VerifyPaymentDto } from "./payments.dto";
import { PaymentsService } from "./payments.service";
import { AuthRequest } from "../auth/auth.interface";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";

@Controller("api/v1/payments")
export class PaymentController {
  constructor(private readonly paymentService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("initiate")
  async createPayment(@Body() dto: CreatePaymentDto, @Req() req: AuthRequest) {
    const userId = req.user._id as string;
    return this.paymentService.initiatePayment(dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("verify")
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentService.verifyAndUpdatePayment(dto);
  }
}
