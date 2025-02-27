// src/modules/feedback/feedback.service.ts

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateFeedbackDto, UpdateFeedbackDto } from "./feedback.dto";
import { Feedback } from "./feedback.entity";

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name) private feedbackModel: Model<Feedback>,
  ) {}

  async createFeedback(
    userId: string,
    dto: CreateFeedbackDto,
  ): Promise<Feedback> {
    // 1) ensure user doesn't already have feedback
    const existing = await this.feedbackModel.findOne({ userId });
    if (existing) {
      throw new ConflictException(
        "User already has feedback. Please edit instead.",
      );
    }

    const newFeedback = new this.feedbackModel({
      userId,
      rating: dto.rating,
      review: dto.review,
    });
    return newFeedback.save();
  }

  async getMyFeedback(userId: string): Promise<Feedback> {
    const feedback = await this.feedbackModel.findOne({
      userId,
      isDeleted: false,
    });
    if (!feedback) {
      throw new NotFoundException("No feedback found for this user.");
    }
    return feedback;
  }

  async updateMyFeedback(
    userId: string,
    dto: UpdateFeedbackDto,
  ): Promise<Feedback> {
    const feedback = await this.feedbackModel.findOne({
      userId,
      isDeleted: false,
    });
    if (!feedback) {
      throw new NotFoundException("Feedback not found or already deleted.");
    }
    if (dto.rating !== undefined) {
      feedback.rating = dto.rating;
    }
    if (dto.review !== undefined) {
      feedback.review = dto.review;
    }
    return feedback.save();
  }

  async deleteMyFeedback(userId: string): Promise<Feedback> {
    const feedback = await this.feedbackModel.findOne({
      userId,
      isDeleted: false,
    });
    if (!feedback) {
      throw new NotFoundException("Feedback not found or already deleted.");
    }
    feedback.isDeleted = true;
    return feedback.save();
  }

  /**
   * Admin sets adminSelected = true/false on a feedback doc
   * but we limit total adminSelected to 15 max
   */
  async adminSelectFeedback(
    feedbackId: string,
    shouldSelect: boolean,
  ): Promise<Feedback> {
    // If we want to set it to true, we must ensure there's fewer than 15 selected
    if (shouldSelect) {
      const countSelected = await this.feedbackModel.countDocuments({
        adminSelected: true,
        isDeleted: false,
      });
      if (countSelected >= 15) {
        throw new BadRequestException(
          "Already 15 feedback items selected. Unselect one before selecting a new one.",
        );
      }
    }

    const feedback = await this.feedbackModel.findById(feedbackId);
    if (!feedback || feedback.isDeleted) {
      throw new NotFoundException("Feedback not found or is deleted");
    }

    feedback.adminSelected = shouldSelect;
    return feedback.save();
  }

  // Publicly available feedback
  async getSelectedFeedback(): Promise<Feedback[]> {
    // returns only adminSelected = true
    // you can limit to 15 if you want, or just rely on the admin to not select more than 15
    return this.feedbackModel
      .find({ adminSelected: true, isDeleted: false })
      .exec();
  }
}
