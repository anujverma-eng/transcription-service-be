import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
    const jobExists = await this.transcriptionJobModel.findOne({
      audioFileKey: data.audioFileKey,
    });
    if (jobExists) {
      throw new BadRequestException("Job already exists");
    }
    const doc = new this.transcriptionJobModel(data);
    await this.subscriptionService.incrementDailyUsage(
      data.userId,
      data.usageMinutes,
    );
    return doc.save();
  }

  async getJob(jobId: string): Promise<TranscriptionJob> {
    const job = await this.transcriptionJobModel
      .findById(new Types.ObjectId(jobId))
      .lean();
    if (!job) {
      throw new NotFoundException("Transcription job not found");
    }
    return job;
  }

  async setStatus(jobId: string, status: TranscriptionStatus) {
    return this.transcriptionJobModel
      .findByIdAndUpdate(new Types.ObjectId(jobId), { status }, { new: true })
      .lean();
  }

  async setCompleted(jobId: string, transcriptionText?: string) {
    return this.transcriptionJobModel
      .findByIdAndUpdate(new Types.ObjectId(jobId), {
        status: TranscriptionStatus.COMPLETED,
        transcriptionText,
      })
      .lean();
  }

  async setFailed(jobId: string) {
    return this.transcriptionJobModel
      .findByIdAndUpdate(new Types.ObjectId(jobId), {
        status: TranscriptionStatus.FAILED,
      })
      .lean();
  }
}
