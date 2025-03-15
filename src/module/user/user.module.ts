import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Feedback, FeedbackSchema } from "../feedback/feedback.entity";
import { Payment, PaymentSchema } from "../payments/payments.entity";
import {
  Subscription,
  SubscriptionSchema,
} from "../subscription/subscription.entity";
import {
  TranscriptionJob,
  TranscriptionJobSchema,
} from "../transcription-job/transcription-job.entity";
import { User, UserSchema } from "./user.entity";
import { UserService } from "./user.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: TranscriptionJob.name, schema: TranscriptionJobSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Feedback.name, schema: FeedbackSchema },
    ]),
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
