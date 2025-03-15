import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Feedback, FeedbackSchema } from "./feedback.entity";
import { FeedbackController } from "./feedback.controller";
import { FeedbackService } from "./feedback.service";
import { UserService } from "../user/user.service";
import { User, UserSchema } from "../user/user.entity";
import { Subscription } from "../subscription/subscription.entity";
import { SubscriptionSchema } from "../subscription/subscription.entity";
import { TranscriptionJobSchema } from "../transcription-job/transcription-job.entity";
import { TranscriptionJob } from "../transcription-job/transcription-job.entity";
import { PaymentSchema } from "../payments/payments.entity";
import { Payment } from "../payments/payments.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Feedback.name, schema: FeedbackSchema },
      { name: User.name, schema: UserSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: TranscriptionJob.name, schema: TranscriptionJobSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService, UserService],
})
export class FeedbackModule {}
