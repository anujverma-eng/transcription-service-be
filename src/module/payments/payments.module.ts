// src/modules/payment/payment.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Payment, PaymentSchema } from "./payments.entity";
import { PaymentsService } from "./payments.service";
import { PaymentController } from "./payments.controller";
import { SubscriptionModule } from "../subscription/subscription.module";
import { PlanService } from "../plan/plan.service";
import { PlanModule } from "../plan/plan.module";
import { Plan, PlanSchema } from "../plan/plan.entity";
import {
  Subscription,
  SubscriptionSchema,
} from "../subscription/subscription.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Plan.name, schema: PlanSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    PlanModule,
    SubscriptionModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentsService, PlanService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
