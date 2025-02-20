// src/modules/subscription/subscription.service.ts
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Subscription } from "./subscription.entity";

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
  ) {}

  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptionModel.findOne({ userId, isActive: true }).exec();
  }
}
