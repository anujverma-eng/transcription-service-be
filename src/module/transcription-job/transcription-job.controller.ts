import { InjectQueue } from "@nestjs/bull";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Queue } from "bull";
import { RolesDecorator } from "src/common/decorators/role.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RoleGuard } from "src/common/guards/role.guard";
import { extractAudioDuration } from "src/common/utils/audio-metadata.util";
import { TranscriptionStatus, UserRole } from "src/common/utils/enum/util.enum";
import { AuthRequest, AuthUser } from "../auth/auth.interface";
import { S3Service } from "../s3/s3.service";
import { SubscriptionService } from "../subscription/subscription.service";
import {
  getS3Key,
  PresignRequestDto,
  QueueJobDto,
  SearchWithPaginationDto,
} from "./transcription-job.dto";
import { TranscriptionJobService } from "./transcription-job.service";
import { TranscriptionPriorityService } from "./transcription-priority.service";

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
      fileName: body.fileName,
      sourceLanguage: body.sourceLanguage,
      transcriptLanguage: body.transcriptLanguage,
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
    if (job.status === TranscriptionStatus.COMPLETED) {
      const audioLink = await this.s3Service.getPresignedGetUrl(
        job.audioFileKey,
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const transcriptionLink = job.transcriptionFileKey
        ? await this.s3Service.getPresignedGetUrl(job.transcriptionFileKey)
        : null;

      return {
        status: job.status,
        fileName: job.fileName,
        audioFileLink: audioLink,
        transcriptionFileLink:
          "https://s3.us-west-2.amazonaws.com/av.transcription.eng.dev.testing/sample3.txt?response-content-disposition=inline&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEBMaCXVzLXdlc3QtMiJIMEYCIQD2ORpbK3RxnlphmKP3u4UDqdaVjpkz0Gpf4j7QIlsccwIhAL5eCK%2FWZ93GP%2FggdgDBr7DSxlgFsg4ByJoZ0bCoUh%2BtKt4DCFsQABoMNjc3Mjc2MTA0MjgwIgzyoprPvjJlgA85PHEquwN7FN01yHLbpG%2BCsBp3lrkEHFSqWVIscRDV9T6O36pFW6MT6erNQASthEIlwmMgCaF0wxq4zEfwdv1tMnqPcxy%2BWLRj5GRDnUZaEvjuamZKZbT3YC%2F1H%2FxPSloDSMjrd4VbJazy4F07xAdRHPeCAelq5sazfMSNa6mS2OVuHhcwsn4y1LPVIZMoJqVGkN2ueBI2p8C2UZfk3AwPslsZ6v0svQrF9a4bW5rSQ6ic6xXz3pQ%2FIh8PdKlBb9nUl6YrfecZGLHfXymwB0dAL7xrP3PEDYw6SslPzBpqgDvn6%2F5U8qiPGt0WBzspGFw9YYImCHD9NmmSpQdI4eG2q8rWDCvEgluVsy5Q2P%2BssK8hNYH2Sg7axsZbRwFmYJw5f08Qyf94EpjDy3eJBjVbzPFBnpx9VanbZ6%2BptCu%2FxK8VcRDQNqvJNI1eaSD9VtGh%2Fwrvrjz%2B5LsX7uUaE1SHU%2BB6%2FGVG87yhlCDyAUgMeCYJgIVHPezLU9ZrG9U56eukPxpXV%2B1f6IixrJZeiAzHvxAq1Lz%2Fllk410%2FJ7I4nTZyNc4jvBmO9%2Ba8vIpsFIR%2BlYEiJsv0owhQS%2B7R03dYjlTDB5a%2B%2BBjrjAlWNXAtMMZOvXrMbN4%2BDdXx2pKRTia6HKSuEZnYo2U2GevxfyMf2STunAe6cjX3T5d1HFTeZpczCymKTm%2FnveGW8AdSEoERipXoDwGIzsM2akPe05KGWhLRkDlMMnpl0XqkpMGtTnfSmv5BfvF7cCqRpMzYpya4mS%2F86UXOMElzkuq6DAuffC4xtGmhoCUoIO9KHQOH1uQMRobQ%2F6NtX5asB%2FNY4AMru5sAAQwpJVhwr%2FXmsA0Yj4ACJn6i0HC7hMqkrAlZHFYDRJSK48mjcZOloRY7Dfg44YWNInLX9ObX8cDF0Uji%2BGA%2Fit7IvEBMe6gLrab8Rt%2FjuVROy2pPiEol3aHUSFOKOu%2FGjexLp8c8DG95rzybCjnybRkKxK0ZLXxk%2FBEimQMiWX7lNh60uI9AlpMvkIrxPrkzC9D8%2BDt%2FTTT2nlVkKLNBON8G2sDx%2FAI%2FSTHbA0Rt3R%2B5HOAQm4zVNBp8%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAZ3MGNGZMEEMN467K%2F20250308%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250308T102045Z&X-Amz-Expires=720&X-Amz-SignedHeaders=host&X-Amz-Signature=0b110fc2245b5fe98a676b84956ec7dcb8204280e66546846ce8a688aa934fab",
      };
    } else {
      return { status: job.status };
    }
  }

  @RolesDecorator(UserRole.USER, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get("/usage")
  async getCurrentUsage(@Req() req: AuthRequest) {
    const user = req.user as AuthUser;
    if (!user || !user._id) {
      throw new BadRequestException("User not found in request");
    }

    return this.subscriptionService.getCurrentUsage(user._id.toString());
  }

  @RolesDecorator(UserRole.USER, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get("/search")
  async searchJobs(
    @Req() req: AuthRequest,
    @Query() query: SearchWithPaginationDto,
  ) {
    const user = req.user as AuthUser;
    if (!user || !user._id) {
      throw new BadRequestException("User not found in request");
    }

    const jobs = await this.transcriptionService.searchJobs(
      query,
      user._id.toString(),
    );

    return jobs;
  }

  @RolesDecorator(UserRole.USER, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get("/usage/stats")
  async getUsageStats(@Req() req: AuthRequest) {
    const user = req.user as AuthUser;
    if (!user || !user._id) {
      throw new BadRequestException("User not found in request");
    }

    return this.transcriptionService.getUsageStats(user._id.toString());
  }
}
