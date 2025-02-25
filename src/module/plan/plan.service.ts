// src/modules/plan/plan.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Plan } from "./plan.entity";
import { CreatePlanDto, UpdatePlanDto } from "./plan.dto";
import { Subscription } from "../subscription/subscription.entity";

@Injectable()
export class PlanService {
  constructor(
    @InjectModel(Plan.name) private readonly planModel: Model<Plan>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<Subscription>,
  ) {}

  async createPlan(dto: CreatePlanDto): Promise<Plan> {
    // check if name is unique
    const existing = await this.planModel
      .findOne({ name: dto.name })
      .lean()
      .exec();
    if (existing) {
      throw new BadRequestException("Plan name already exists");
    }
    const plan = new this.planModel(dto);
    return plan.save();
  }

  async findAllPlans(includeInactive = false): Promise<Plan[]> {
    if (includeInactive) {
      return this.planModel.find().lean().exec();
    }
    // otherwise find only active
    return this.planModel.find({ isActive: true }).lean().exec();
  }

  async findPlanById(planId: string): Promise<Plan> {
    const plan = await this.planModel.findById(planId).lean().exec();
    if (!plan) {
      throw new NotFoundException("Plan not found");
    }
    return plan;
  }

  async updatePlan(planId: string, dto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.planModel
      .findByIdAndUpdate(planId, { $set: dto }, { new: true })
      .lean()
      .exec();
    if (!plan) {
      throw new NotFoundException("Plan not found or already removed");
    }
    return plan;
  }

  /**
   * Soft-delete => set isActive = false
   */
  async softDeletePlan(planId: string): Promise<Plan> {
    const plan = await this.planModel.findById(planId).lean().exec();
    if (!plan) {
      throw new NotFoundException("Plan not found");
    }
    if (!plan.isActive) {
      return plan; // already inactive
    }
    plan.isActive = false;
    return plan.save();
  }

  async getPlanById(planId: string): Promise<Plan> {
    const plan = await this.planModel.findById(planId).lean().exec();
    if (!plan) {
      throw new NotFoundException("Plan not found");
    }
    return plan;
  }

  async getFreePlan(): Promise<Plan> {
    let freePlan = await this.planModel
      .findOne({ isPaid: false })
      .lean()
      .exec();
    if (!freePlan) {
      const newPlan = new this.planModel({
        name: "Free",
        description: "Free testing plan",
        dailyLimit: 5,
        price: 0,
        currency: "INR",
        isPaid: false,
      });
      freePlan = await newPlan.save();
    }
    return freePlan;
  }

  /**
   * Return a list of users who have subscriptions for this plan (currently active or not).
   */
  // async getUsersForPlan(
  //   planId: string,
  // ): Promise<{ userId: string; subscriptionId: string }[]> {
  //   const subs = await this.subscriptionModel
  //     .find({ planId: planId })
  //     .lean()
  //     .exec();

  //   // Return minimal data or do a join if you want more user info
  //   return subs.map((s) => ({
  //     userId: s.userId,
  //     subscriptionId: s._id.toHexString(),
  //   }));
  // }
}
