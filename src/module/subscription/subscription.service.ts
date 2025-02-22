import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateSubscriptionDto } from "./subscription.dto";
import { Subscription } from "./subscription.entity";

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
  ) {}

  /**
   * Create Free Subscription
   * If user already has an active subscription, return the existing one
   */
  async createFreeSubscription(
    dto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const { userId } = dto;
    const userIdObject = new Types.ObjectId(userId);
    const existing = await this.subscriptionModel.findOne({
      userId: userIdObject,
      isActive: true,
    });
    if (existing) {
      return existing;
    }

    // TODO: get the free plan from the database
    // const freePlan = await this.planModel.findOne({
    //   isPaid: false,
    // });

    const freePlan = {
      _id: new Types.ObjectId(),
    };

    // Default values
    // dailyLimit = 5;
    // dailyUsed = 0;
    // startDate = new Date();
    // endDate = null;
    // isActive = true;
    // isPaid = false;

    const created = new this.subscriptionModel({
      ...dto,
      userId: userIdObject,
      planId: freePlan._id,
    });

    return created.save();
  }

  /**
   * Retrieve the active subscription for a user.
   * If no active subscription is found, return null
   */
  async getActiveSubscription(
    userId: Types.ObjectId | string,
  ): Promise<Subscription | null> {
    const userIdObject = new Types.ObjectId(userId);
    const sub = await this.subscriptionModel.findOne({
      userId: userIdObject,
      isActive: true,
    });
    return sub;
  }

  /**
   * Example: canTranscribe checks if user has enough "minutes" left.
   */
  async canTranscribe(
    userId: Types.ObjectId | string,
    minutes: number,
  ): Promise<boolean> {
    try {
      const sub = await this.getActiveSubscription(userId);
      const { dailyUsedMinutes = 0 } = sub;
      const dailyLimit = sub.dailyLimit;
      return dailyUsedMinutes + minutes <= dailyLimit;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return false;
    }
  }

  /**
   * Increments daily usage after a successful transcription job.
   */
  async incrementDailyUsage(
    userId: Types.ObjectId | string,
    minutes: number,
  ): Promise<void> {
    const sub = await this.getActiveSubscription(userId);
    sub.dailyUsedMinutes += minutes;
    await sub.save();
  }

  /**
   * Decrement usage if you need to revert a failed or canceled job.
   */
  async decrementDailyUsage(
    userId: Types.ObjectId | string,
    minutes: number,
  ): Promise<void> {
    const sub = await this.getActiveSubscription(userId);
    sub.dailyUsedMinutes = Math.max(0, sub.dailyUsedMinutes - minutes);
    await sub.save();
  }

  /**
   * Resets usage to 0. (Call via cron daily if you want)
   */
  async resetDailyUsage(userId: Types.ObjectId | string): Promise<void> {
    const sub = await this.getActiveSubscription(userId);
    sub.dailyUsedMinutes = 0;
    await sub.save();
  }

  async createFreSubscriptionIfNotExists(
    userId: string,
  ): Promise<Subscription> {
    const userIdObject = new Types.ObjectId(userId);
    const sub = await this.getActiveSubscription(userIdObject);
    if (sub) {
      return sub;
    }
    return await this.createFreeSubscription({
      userId: userIdObject.toHexString(),
    });
  }

  /**
   * Upgrade Subscription:
   * planId is Mandatory
   * If user already have an active subscription, and its paid, remove and add the limitLeft to the new plan.
   * If user has a free subscription, remove it and create a new one with the new plan
   * If user has a paid subscription, update the planId and dailyLimit
   */
  async upgradeSubscription(dto: CreateSubscriptionDto): Promise<Subscription> {
    const { userId, planId } = dto;
    if (!planId) {
      throw new BadRequestException("planId is required");
    }
    const sub = await this.getActiveSubscription(userId);

    const oldSubId: string | null = sub
      ? (sub._id as Types.ObjectId).toHexString()
      : null;

    return this.createPaidSubscription(dto, planId, oldSubId);
  }

  private async createPaidSubscription(
    newSubDto: CreateSubscriptionDto,
    planId: string,
    oldSubId?: string | null,
  ) {
    // TODO: Get Plan from DB
    // const plan = await this.planModel.findById(new Types.ObjectId(planId));
    const plan = {
      _id: new Types.ObjectId(),
      dailyLimit: 100,
    };
    let dailyLimit = newSubDto.dailyLimit;

    if (oldSubId) {
      const oldSubIdObject = new Types.ObjectId(oldSubId);
      const oldSub = await this.subscriptionModel.findById(oldSubIdObject);
      if (oldSub && oldSub.isActive) {
        dailyLimit += oldSub.dailyLimit;
        await this.subscriptionModel.updateOne(
          { _id: oldSubIdObject },
          { isActive: false, dailyLimit: 0, endDate: new Date() },
        );
      }
    }

    const userIdObject = new Types.ObjectId(newSubDto.userId);
    const newSub = await this.createFreeSubscription({
      ...newSubDto,
      userId: userIdObject.toHexString(),
      dailyLimit: dailyLimit + plan.dailyLimit,
      isPaid: true,
    });
    return newSub;
  }
}
