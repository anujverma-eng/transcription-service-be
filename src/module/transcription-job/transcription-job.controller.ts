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

@Controller("api/v1/transcription")
export class TranscriptionController {
  constructor(
    private readonly transcriptionService: TranscriptionJobService,
    private readonly subscriptionService: SubscriptionService,
    private readonly s3Service: S3Service,
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
    const user = req.user as AuthUser;
    if (!user || !user._id) {
      throw new BadRequestException("User not found in request");
    }

    const { audioFileKey, duration } = body;

    // Possibly do a final check or "reserve usage"
    await this.subscriptionService.canTranscribe(user._id.toString(), duration);

    const durationInfo = extractAudioDuration(duration);

    const newJob = await this.transcriptionService.createJob({
      userId: user._id.toString(),
      audioFileKey,
      status: TranscriptionStatus.QUEUED,
      durationInSeconds: durationInfo.durationSeconds,
      durationText: durationInfo.durationText,
      usageMinutes: durationInfo.usageMinutes,
    });
    return {
      message: "Transcription job created",
      newJob,
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
    if (job.status === TranscriptionStatus.QUEUED) {
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
