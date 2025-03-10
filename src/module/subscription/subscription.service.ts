import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ClientSession, Model, Types } from "mongoose";
import { CreateSubscriptionDto } from "./subscription.dto";
import { Subscription } from "./subscription.entity";
import { PlanService } from "../plan/plan.service";

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
    private planService: PlanService,
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
    const existing = await this.subscriptionModel
      .findOne({
        userId: userIdObject,
        isActive: true,
      })
      .lean()
      .exec();
    if (existing) {
      return existing;
    }

    const freePlan = await this.planService.getFreePlan();

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
    const sub = await this.subscriptionModel
      .findOne({
        userId: userIdObject,
        isActive: true,
      })
      .lean();
    return sub;
  }

  /**
   * Example: canTranscribe checks if user has enough "minutes" left.
   */
  async canTranscribe(
    userId: Types.ObjectId | string,
    fileSeconds: number,
  ): Promise<Subscription> {
    const sub = await this.createFreSubscriptionIfNotExists(userId.toString());

    const dailyUsedSeconds = Math.round(sub.totalUsedMinutes * 60 || 0);
    const dailyLimitInSeconds = sub.totalLimit * 60;
    const wantedToUse = dailyUsedSeconds + fileSeconds;

    if (dailyUsedSeconds >= dailyLimitInSeconds) {
      throw new BadRequestException(
        "You have reached your daily limit and cannot transcribe more.",
      );
    } else if (wantedToUse > dailyLimitInSeconds) {
      throw new BadRequestException(
        "You are asking to transcribe more than your daily limit.",
      );
    }
    return sub;
  }

  /**
   * Increments daily usage after a successful transcription job.
   */
  async incrementDailyUsage(
    userId: Types.ObjectId | string,
    minutes: number,
  ): Promise<void> {
    try {
      const sub = await this.getActiveSubscription(userId);
      if (!sub) {
        throw new BadRequestException(
          "Subscription not found || Increment Daily Usage Failed",
        );
      }
      await this.subscriptionModel.updateOne(
        { _id: sub._id },
        { $inc: { totalUsedMinutes: minutes } },
      );
    } catch (error) {
      console.error(error);
      throw new BadRequestException("Could not increment daily usage", error);
    }
  }

  /**
   * Decrement usage if you need to revert a failed or canceled job.
   */
  async decrementDailyUsage(
    userId: Types.ObjectId | string,
    minutes: number,
  ): Promise<void> {
    const sub = await this.getActiveSubscription(userId);
    if (!sub) {
      console.error("Subscription not found || Decrement Daily Usage Failed");
      throw new BadRequestException(
        "Subscription not found || Decrement Daily Usage Failed",
      );
    }
    await this.subscriptionModel.updateOne(
      { _id: sub._id },
      { $inc: { totalUsedMinutes: -minutes } },
    );
  }

  /**
   * Resets usage to 0. (Call via cron daily if you want)
   */
  async resetDailyUsage(userId: Types.ObjectId | string): Promise<void> {
    const sub = await this.getActiveSubscription(userId);
    if (!sub) {
      console.error("Subscription not found || Reset Daily Usage Failed");
      throw new BadRequestException(
        "Subscription not found || Reset Daily Usage Failed",
      );
    }
    await this.subscriptionModel.updateOne(
      { _id: sub._id },
      { $set: { totalUsedMinutes: 0 } },
    );
  }

  // Used By Cron Job
  async resetDailyUsageForFreeUsers(): Promise<void> {
    await this.subscriptionModel.updateMany(
      { isPaid: false },
      { $set: { totalUsedMinutes: 0 } },
    );
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
   * If user has a paid subscription, update the planId and totalLimit
   */
  async upgradeSubscription(
    dto: CreateSubscriptionDto,
    session?: ClientSession,
  ): Promise<Subscription> {
    const { userId, planId } = dto;
    if (!planId) {
      throw new BadRequestException("planId is required");
    }
    const sub = await this.getActiveSubscription(userId);

    const oldSubId: string | null = sub
      ? (sub._id as Types.ObjectId).toHexString()
      : null;

    return this.createPaidSubscription(dto, planId, oldSubId, session);
  }

  private async createPaidSubscription(
    newSubDto: CreateSubscriptionDto,
    planId: string,
    oldSubId?: string | null,
    session?: ClientSession,
  ) {
    const plan = await this.planService.getPlanById(planId);
    let totalLimit = plan.totalLimit;

    if (oldSubId) {
      const oldSubIdObject = new Types.ObjectId(oldSubId);
      const oldSub = await this.subscriptionModel
        .findById(oldSubIdObject)
        .session(session);
      if (oldSub && oldSub.isActive) {
        totalLimit += oldSub.totalLimit;
        await this.subscriptionModel
          .updateOne(
            { _id: oldSubIdObject },
            { isActive: false, totalLimit: 0, endDate: new Date() },
          )
          .session(session);
      }
    }

    const userIdObject = new Types.ObjectId(newSubDto.userId);
    const newSub = await this.subscriptionModel.create({
      ...newSubDto,
      userId: userIdObject.toHexString(),
      totalLimit: totalLimit,
      isPaid: true,
    });
    return newSub;
  }

  async getCurrentUsage(userId: Types.ObjectId | string) {
    const sub = await this.getActiveSubscription(userId);

    if (!sub) {
      throw new BadRequestException(
        "Subscription not found || Increment Daily Usage Failed",
      );
    }

    return {
      totalLimit: sub.totalLimit,
      totalUsedMinutes: sub.totalUsedMinutes,
      remainingMinutes: sub.totalLimit - sub.totalUsedMinutes,
    };
  }
}
