import { IsNotEmpty } from "class-validator";

export class CreatePaymentDto {
  @IsNotEmpty()
  planId: string;
}

export class VerifyPaymentDto {
  @IsNotEmpty()
  razorpayPaymentId: string;

  @IsNotEmpty()
  razorpaySignature: string;

  @IsNotEmpty()
  razorpayOrderId: string;
}
