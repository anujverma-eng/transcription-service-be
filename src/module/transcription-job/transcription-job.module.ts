import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { S3Service } from "../s3/s3.service";
import {
  Subscription,
  SubscriptionSchema,
} from "../subscription/subscription.entity";
import { SubscriptionModule } from "../subscription/subscription.module";
import { TranscriptionErrorModule } from "../transcription-error/transcription-error.module";
import { TranscriptionProcessor } from "./processors/transcription.processor";
import { TranscriptionController } from "./transcription-job.controller";
import {
  TranscriptionJob,
  TranscriptionJobSchema,
} from "./transcription-job.entity";
import { TranscriptionJobService } from "./transcription-job.service";
import { TranscriptionPriorityService } from "./transcription-priority.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TranscriptionJob.name, schema: TranscriptionJobSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    BullModule.registerQueue({
      name: "transcription",
      // settings: {
      //   stalledInterval: 0,
      //   maxStalledCount: 0,
      // },
      defaultJobOptions: {
        removeOnComplete: false,
        removeOnFail: false,
        attempts: 2,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    }),
    SubscriptionModule,
    TranscriptionErrorModule,
  ],
  controllers: [TranscriptionController],
  providers: [
    TranscriptionJobService,
    S3Service,
    TranscriptionPriorityService,
    TranscriptionProcessor,
  ],
})
export class TranscriptionJobModule {}
