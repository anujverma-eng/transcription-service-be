import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { TranscriptionStatus } from "src/common/utils/enum/util.enum";
import { SubscriptionService } from "../subscription/subscription.service";
import {
  CreateTranscriptionJobDto,
  SearchJobsDto,
  UsageStats,
} from "./transcription-job.dto";
import { TranscriptionJob } from "./transcription-job.entity";
import { ResponseData } from "src/interceptors/response.interceptor";

@Injectable()
export class TranscriptionJobService {
  constructor(
    @InjectModel(TranscriptionJob.name)
    private readonly transcriptionJobModel: Model<TranscriptionJob>,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async createJob(data: CreateTranscriptionJobDto): Promise<TranscriptionJob> {
    try {
      const jobExists = await this.transcriptionJobModel.findOne({
        audioFileKey: data.audioFileKey,
      });
      if (jobExists) {
        throw new BadRequestException("Job already exists");
      }
      const newJob = await this.transcriptionJobModel.create(data);
      await this.subscriptionService.incrementDailyUsage(
        data.userId,
        data.usageMinutes,
      );
      return newJob;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getJob(jobId: string): Promise<TranscriptionJob> {
    const job = await this.transcriptionJobModel
      .findById(new Types.ObjectId(jobId))
      .lean();
    if (!job) {
      throw new Error("Transcription job not found");
    }
    return job;
  }

  async setStatus(jobId: string, status: TranscriptionStatus) {
    await this.getJob(jobId);
    return this.transcriptionJobModel
      .findByIdAndUpdate(new Types.ObjectId(jobId), { status })
      .lean();
  }

  async setCompleted(jobId: string, transcriptionText?: string) {
    await this.getJob(jobId);
    return this.transcriptionJobModel
      .findByIdAndUpdate(new Types.ObjectId(jobId), {
        status: TranscriptionStatus.COMPLETED,
        transcriptionText,
      })
      .lean();
  }

  async setDeducted(jobId: string, isDeducted: boolean) {
    await this.getJob(jobId);
    return this.transcriptionJobModel
      .findByIdAndUpdate(new Types.ObjectId(jobId), {
        isDeducted,
      })
      .lean();
  }

  async setFailed(jobId: string, error?: string) {
    await this.getJob(jobId);
    return this.transcriptionJobModel
      .findByIdAndUpdate(new Types.ObjectId(jobId), {
        status: TranscriptionStatus.FAILED,
        error: error || "",
      })
      .lean();
  }

  /**
   * Removes temporary artifacts associated with a job.
   */
  async cleanJobArtifacts(jobId: string): Promise<void> {
    await this.getJob(jobId);
    await this.transcriptionJobModel.findByIdAndUpdate(
      new Types.ObjectId(jobId),
      {
        $unset: { temporaryData: 1 },
      },
    );
  }

  /**
   * Retries a transcription job: increments usage (pre-deduction) and sets status to PENDING.
   */
  async retryJob(jobId: string): Promise<void> {
    await this.getJob(jobId);
    await this.setStatus(jobId, TranscriptionStatus.RETRYING);
  }

  async searchJobs(
    query: SearchJobsDto,
    userId: string,
  ): Promise<ResponseData> {
    const { page, limit, query: searchQuery } = query;
    const skip = (page - 1) * limit;

    const findQuery: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };
    if (searchQuery && searchQuery.trim() !== "") {
      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      findQuery.fileName = { $regex: escapedQuery, $options: "i" };
    }

    const jobs = await this.transcriptionJobModel
      .find(findQuery)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await this.transcriptionJobModel.countDocuments(findQuery);
    const totalPages = Math.ceil(total / limit);

    // const details =

    return {
      data: jobs,
      pagination: {
        total,
        page: +page,
        limit: +limit,
        totalPages,
      },
    };
  }

  async getUsageStats(userId: string): Promise<UsageStats[]> {
    return await this.transcriptionJobModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          // createdAt: {
          //   $gte: new Date(startDate),
          //   $lte: new Date(endDate), // Filter by date range if needed
          // },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalJobs: { $sum: 1 },
          completedJobs: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          failedJobs: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
          minutesDeducted: {
            $sum: {
              $cond: [{ $eq: ["$isDeducted", true] }, "$usageMinutes", 0],
            },
          },
          minutesRefunded: {
            $sum: {
              $cond: [{ $eq: ["$isDeducted", false] }, "$usageMinutes", 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } }, // Sort by date
      {
        $project: {
          _id: 0,
          date: "$_id",
          totalJobs: 1,
          completedJobs: 1,
          failedJobs: 1,
          minutesDeducted: 1,
          minutesRefunded: 1,
        },
      },
    ]);
  }
}
