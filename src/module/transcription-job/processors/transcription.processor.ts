/* eslint-disable */
import {
  InjectQueue,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from "@nestjs/bull";
import { Job, Queue } from "bull";
import { SubscriptionService } from "../../subscription/subscription.service";
import { TranscriptionStatus } from "src/common/utils/enum/util.enum";
import { QueueLogger } from "src/common/utils/queue.utils";
import { TranscriptionJobService } from "../transcription-job.service";
import { TranscriptionErrorService } from "src/module/transcription-error/transcription-error.service";

@Processor("transcription")
export class TranscriptionProcessor {
  private readonly logger = QueueLogger(TranscriptionProcessor.name);
  private readonly ERROR_PROBABILITY = 0.5;

  constructor(
    private readonly transcriptionJobService: TranscriptionJobService,
    private readonly subscriptionService: SubscriptionService,
    private readonly transcriptionErrorService: TranscriptionErrorService,
    @InjectQueue("transcription") private readonly transcriptionQueue: Queue,
  ) {}

  @Process("transcription")
  async handleTranscription(job: Job) {
    try {
      console.log(`${job.data.audioFileKey} To Make an Attempt: [${job.attemptsMade}]`);
      const { jobId } = job.data;
      await this.transcriptionJobService.setStatus(
        jobId,
        TranscriptionStatus.PROCESSING,
      );
      await this.processJob(job);
      await this.transcriptionJobService.setCompleted(
        jobId,
        "Mock transcript content",
      );
    } catch (error) {
      throw error;
    }
  }

  private async processJob(job: Job) {
    return new Promise((resolve, reject) => {
      const processingInterval = setInterval(() => {
        if (Math.random() < this.ERROR_PROBABILITY) {
          // job.failedReason = "Simulated transcription error"
          // job.log(`${job.data.audioFileKey} Simulated transcription error: [${job.attemptsMade}]`)
          console.log(
            // "************************************************** ERROR ***************************************************",
          );
          reject(new Error("Simulated transcription error"));
        }
        // this.logger.logProgress(job, "Processing...");
      }, 2000); // 10 seconds

      const timeout = setTimeout(() => {
        clearInterval(processingInterval);
        resolve(true);
      }, 5000); // 120 seconds

      // process.on('SIGTERM', () => {
      //   clearInterval(processingInterval);
      //   clearTimeout(timeout);
      //   reject(new Error('Process terminated'));
      // });
    });
  }

  private async handleProcessingErrors(job: Job, error: Error) {
    const { jobId, userId } = job.data;

    await this.transcriptionJobService.setFailed(
      jobId,
      TranscriptionStatus.FAILED,
    );
    // console.log("job.failedReason(): ", job.failedReason);
    console.log(`${job.data.audioFileKey} Attempted: [${job.attemptsMade}]`);
    if(job.attemptsMade >= job.opts.attempts) {
      const { isDeducted, usageMinutes } = await this.transcriptionJobService.getJob(job.data.jobId)
      console.log("isDeducted ************************: ", isDeducted, " usageMinutes: ", usageMinutes);
      if (isDeducted && usageMinutes) {
        console.log(`************************************************** Last Attempt: ${job.attemptsMade} ***************************************************`);
        console.log(`${job.data.audioFileKey} Giving Back Minutes: [${usageMinutes}] for Attempt: [${job.attemptsMade}]`);
        await this.subscriptionService.decrementDailyUsage(userId, usageMinutes);
        await this.transcriptionJobService.setDeducted(jobId, false);
      }

      await this.transcriptionErrorService.createError({
        jobId: job.data.jobId,
        userId: job.data.userId,
        errorMessage: error.message,
        stackTrace: error.stack,
        additionalData: JSON.stringify(error),
        unrecoverable: true,
        markedAt: new Date(),
      });
    }
  }

  @OnQueueCompleted()
  async onCompleted(job: Job) {
    const { isDeducted, usageMinutes } = await this.transcriptionJobService.getJob(job.data.jobId)
    // this.logger.logSuccess(job, "Job completed successfully");
    if ( !isDeducted && usageMinutes) {
      // console.log("************************************************** INCREMENTING USAGE ***************************************************");
      console.log(`${job.data.audioFileKey} Adding Minutes: [${usageMinutes}] for Job: [${job.data.jobId}]`);
      // console.log("************************************************** INCREMENTING USAGE ***************************************************");
      await this.subscriptionService.incrementDailyUsage(
        job.data.userId,
        usageMinutes,
      );
    }
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    // this.logger.logError(job, error);
    await this.handleProcessingErrors(job, error);
  }
}
