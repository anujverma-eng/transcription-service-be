import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  InternalServerErrorException,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { RolesDecorator } from "src/common/decorators/role.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RoleGuard } from "src/common/guards/role.guard";
import { extractAudioDuration } from "src/common/utils/audio-metadata.util";
import { TranscriptionStatus, UserRole } from "src/common/utils/enum/util.enum";
import { AuthRequest, AuthUser } from "../auth/auth.interface";
import { S3Service } from "../s3/s3.service";
import { SubscriptionService } from "../subscription/subscription.service";
import { TranscriptionJobService } from "./transcription-job.service";
import { getS3Key, PresignRequestDto, QueueJobDto } from "./upload-audio.dto";
import { TranscriptionPriorityService } from "./transcription-priority.service";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";

@Controller("api/v1/transcription")
export class TranscriptionController {
  constructor(
    private readonly transcriptionService: TranscriptionJobService,
    private readonly subscriptionService: SubscriptionService,
    private readonly s3Service: S3Service,
    private readonly priorityService: TranscriptionPriorityService,
    @InjectQueue("transcription") private readonly transcriptionQueue: Queue,
  ) {}

  @RolesDecorator(UserRole.USER, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Post("presign")
  async uploadAudio(@Req() req: AuthRequest, @Body() body: PresignRequestDto) {
    const user = req.user as AuthUser;
    if (!user || !user._id) {
      throw new BadRequestException("User not found in request");
    }

    if (!body.mimeType.startsWith("audio/")) {
      throw new BadRequestException("Only audio files are accepted");
    }

    const { fileName, duration, mimeType } = body;

    const durationInfo = extractAudioDuration(duration);

    // Check if the user can transcribe based on subscription limits
    await this.subscriptionService.canTranscribe(
      user._id.toString(),
      durationInfo.durationSeconds,
    );

    const key = getS3Key(user._id.toString(), fileName, mimeType);

    try {
      // 3) Ask S3Service for a presigned PUT URL
      const presignedUrl = await this.s3Service.getPresignedPutUrl(
        key,
        mimeType,
      );

      return {
        presignedUrl,
        s3Key: key,
      };
    } catch (error) {
      console.error("Error generating presign url", error);
      throw new InternalServerErrorException(
        "Could not generate pre-signed URL",
      );
    }
  }

  @RolesDecorator(UserRole.USER, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Post("queue-job")
  async queueJob(@Req() req: AuthRequest, @Body() body: QueueJobDto) {
    // console.log(body.audioFileKey);
    // return {
    //   message: "transcription job created",
    //   newJob: body,
    //   priority: 0,
    //   submissionIndex: 0,
    //   jobId: "",
    // };
    const user = req.user as AuthUser;
    if (!user || !user._id) {
      throw new BadRequestException("User not found in request");
    }

    const { audioFileKey, duration } = body;

    // Possibly do a final check or "reserve usage"
    const subscription = await this.subscriptionService.canTranscribe(
      user._id.toString(),
      duration,
    );

    const isPaid = subscription?.isPaid === true;

    const durationInfo = extractAudioDuration(duration);

    // 3) create job => pre-deduct usage
    const newJob = await this.transcriptionService.createJob({
      userId: user._id.toString(),
      audioFileKey,
      status: TranscriptionStatus.QUEUED,
      durationInSeconds: durationInfo.durationSeconds,
      durationText: durationInfo.durationText,
      usageMinutes: durationInfo.usageMinutes,
    });

    // 4) compute priority => get global submission index from Redis
    const submissionIndex = await this.priorityService.getNextSubmissionIndex();
    const priority = this.priorityService.computePriority(
      isPaid,
      duration,
      submissionIndex,
    );

    // 5) add to transcription queue
    await this.transcriptionQueue.add(
      "transcription",
      {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        jobId: newJob._id.toString(),
        userId: user._id.toString(),
        ...newJob.toObject(),
      },
      {
        jobId: newJob.audioFileKey,
        priority,
        delay: 1000,
      },
    );

    return {
      message: "transcription job created",
      newJob,
      priority,
      submissionIndex,
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      jobId: newJob._id.toString(),
    };
  }

  @RolesDecorator(UserRole.USER, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get("job/:jobId")
  async getJob(@Req() req: AuthRequest, @Param("jobId") jobId: string) {
    const user = req.user as AuthUser;
    if (!user || !user._id) {
      throw new BadRequestException("User not found in request");
    }

    const job = await this.transcriptionService.getJob(jobId);

    if (job.userId.toString() !== user._id.toString()) {
      throw new BadRequestException("This job does not belong to you.");
    }
    if (job.status != TranscriptionStatus.COMPLETED) {
      const audioLink = await this.s3Service.getPresignedGetUrl(
        job.audioFileKey,
      );
      return {
        status: job.status,
        audioFileLink: audioLink,
      };
    } else {
      return { status: job.status };
    }
  }
}
