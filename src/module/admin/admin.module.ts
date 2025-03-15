import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Feedback, FeedbackSchema } from "../feedback/feedback.entity";
import { FeedbackService } from "../feedback/feedback.service";
import { Subscription } from "../subscription/subscription.entity";
import { TranscriptionJob } from "../transcription-job/transcription-job.entity";
import { User, UserSchema } from "../user/user.entity";
import { UserModule } from "../user/user.module";
import { UserService } from "../user/user.service";
import { AdminController } from "./admin.controller";
import { Payment } from "../payments/payments.entity";
import { SubscriptionSchema } from "../subscription/subscription.entity";
import { PaymentSchema } from "../payments/payments.entity";
import { TranscriptionJobSchema } from "../transcription-job/transcription-job.entity";

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Feedback.name, schema: FeedbackSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: TranscriptionJob.name, schema: TranscriptionJobSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [UserService, FeedbackService],
})
export class AdminModule {}
