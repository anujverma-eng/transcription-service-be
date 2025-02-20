// src/modules/subscription/subscription.service.ts
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Subscription } from "./subscription.entity";

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
  ) {}

  async getActiveSubscription(
    userId: Types.ObjectId | string,
  ): Promise<Subscription | null> {
    const userIdObject = new Types.ObjectId(userId);
    return this.subscriptionModel
      .findOne({ userId: userIdObject, isActive: true })
      .exec();
  }
}
