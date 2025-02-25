import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { TranscriptionStatus } from "src/common/utils/enum/util.enum";
import { SubscriptionService } from "../subscription/subscription.service";
import { TranscriptionJob } from "./transcription-job.entity";
import { CreateTranscriptionJobDto } from "./upload-audio.dto";

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
}
