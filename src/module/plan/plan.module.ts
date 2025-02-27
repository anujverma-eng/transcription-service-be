// src/modules/plan/plan.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Plan, PlanSchema } from "./plan.entity";
import { PlanService } from "./plan.service";
import { PlanController } from "./plan.controller";
import {
  Subscription,
  SubscriptionSchema,
} from "../subscription/subscription.entity";
import { NotificationModule } from "../notifications/notification.module";

@Module({
  imports: [
    NotificationModule,
    MongooseModule.forFeature([
      { name: Plan.name, schema: PlanSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
  ],
  controllers: [PlanController],
  providers: [PlanService],
  exports: [PlanService],
})
export class PlanModule {}
