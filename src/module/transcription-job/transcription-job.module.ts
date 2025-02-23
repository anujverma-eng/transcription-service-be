import { Module } from "@nestjs/common";
import { TranscriptionJobService } from "./transcription-job.service";
import { MongooseModule } from "@nestjs/mongoose";
import {
  TranscriptionJob,
  TranscriptionJobSchema,
} from "./transcription-job.entity";
import { TranscriptionController } from "./transcription-job.controller";
import { SubscriptionService } from "../subscription/subscription.service";
import { S3Service } from "../s3/s3.service";
import {
  Subscription,
  SubscriptionSchema,
} from "../subscription/subscription.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TranscriptionJob.name, schema: TranscriptionJobSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
  ],
  controllers: [TranscriptionController],
  providers: [TranscriptionJobService, SubscriptionService, S3Service],
})
export class TranscriptionJobModule {}
