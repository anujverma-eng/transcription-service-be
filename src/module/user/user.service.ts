import { BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcrypt";
import { Model, Types } from "mongoose";
import { ResponseData } from "src/interceptors/response.interceptor";
import { Subscription } from "../subscription/subscription.entity";
import { SearchWithPaginationDto } from "../transcription-job/transcription-job.dto";
import { TranscriptionJob } from "../transcription-job/transcription-job.entity";
import { CreateUserDto } from "./user.dto";
import { User } from "./user.entity";
import { Payment } from "../payments/payments.entity";
import { TranscriptionStatus } from "src/common/utils/enum/util.enum";
import { PaymentStatus } from "../payments/payments.entity";

interface JobStats {
  _id: null;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalMinutesUsed: number;
}

export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
    @InjectModel(TranscriptionJob.name)
    private transcriptionJobModel: Model<TranscriptionJob>,
    @InjectModel(Payment.name)
    private paymentModel: Model<Payment>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });

    if (existingUser) {
      // If user exists with Google account (has googleId but no password)
      if (existingUser.googleId && !existingUser.password) {
        // Update the existing Google user with password
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        existingUser.password = hashedPassword;
        return existingUser.save();
      }

      throw new BadRequestException("Email already in use.");
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return user;
  }

  async findByIdAndUpdate(id: string, update: any): Promise<User | null> {
    const userIdObject = new Types.ObjectId(id);
    return this.userModel.findByIdAndUpdate(userIdObject, update).lean().exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).lean().exec();
  }

  async findById(id: string): Promise<User | null> {
    const userIdObject = new Types.ObjectId(id);
    return this.userModel.findById(userIdObject).lean().exec();
  }

  async updateLastLogin(userId: Types.ObjectId | string) {
    const userIdObject = new Types.ObjectId(userId);
    await this.userModel.findByIdAndUpdate(userIdObject, {
      $set: { lastLogin: new Date() },
    });
  }

  async updatePassword(user: User, newPassword: string) {
    try {
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await this.userModel.findByIdAndUpdate(user._id, {
        $set: { password: passwordHash },
      });
    } catch (error) {
      console.log(error);
      throw new BadRequestException("Error updating password");
    }
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userModel.findOne({ googleId }).lean().exec();
  }

  async createGoogleUser(googleId: string, email: string, name?: string) {
    const user = new this.userModel({
      email,
      googleId,
      name: name || "",
      password: "",
    });
    return user.save();
  }

  async getUsers(query: SearchWithPaginationDto): Promise<ResponseData> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const findQuery: Record<string, any> = {};

    // Get base user data
    const users = await this.userModel
      .find(findQuery)
      .skip(skip)
      .limit(limit)
      .select("name email isActive isBlocked")
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Get total count for pagination
    const total = await this.userModel.countDocuments(findQuery);
    const totalPages = Math.ceil(total / limit);

    // Enhance users with additional data
    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        // Get active subscription
        const subscription = await this.subscriptionModel
          .findOne({
            userId: user._id,
            isActive: true,
          })
          .populate("planId", "name")
          .select("name totalLimit totalUsedMinutes startDate isPaid")
          .lean()
          .exec();

        // Get recent jobs (last 5)
        // const recentJobs = await this.transcriptionJobModel
        //   .find({ userId: user._id })
        //   .sort({ createdAt: -1 })
        //   .lean()
        //   .exec();

        const jobStats = await this.transcriptionJobModel.aggregate<JobStats>([
          { $match: { userId: user._id } },
          {
            $group: {
              _id: null,
              totalJobs: { $sum: 1 },
              completedJobs: {
                $sum: {
                  $cond: [
                    { $eq: ["$status", TranscriptionStatus.COMPLETED] },
                    1,
                    0,
                  ],
                },
              },
              failedJobs: {
                $sum: {
                  $cond: [
                    { $eq: ["$status", TranscriptionStatus.FAILED] },
                    1,
                    0,
                  ],
                },
              },
              totalMinutesUsed: { $sum: "$usageMinutes" },
            },
          },
        ]);

        // Get payment history
        const payments = await this.paymentModel
          .find({ userId: user._id })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
          .exec();

        return {
          ...user,
          subscription: subscription
            ? {
                ...subscription,
              }
            : null,
          usage: {
            ...jobStats[0],
            // recentJobs,
          },
          payments: {
            recent: payments,
            total: payments.reduce(
              (sum, payment) =>
                payment.status === PaymentStatus.PAID
                  ? sum + payment.amount
                  : sum,
              0,
            ),
          },
        };
      }),
    );

    return {
      data: enhancedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async blockUser(userId: string) {
    const userIdObject = new Types.ObjectId(userId);
    await this.userModel.findByIdAndUpdate(userIdObject, {
      $set: { isBlocked: true },
    });
  }
}
