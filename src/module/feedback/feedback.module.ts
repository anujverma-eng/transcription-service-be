import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Feedback, FeedbackSchema } from "./feedback.entity";
import { FeedbackController } from "./feedback.controller";
import { FeedbackService } from "./feedback.service";
import { UserService } from "../user/user.service";
import { User, UserSchema } from "../user/user.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Feedback.name, schema: FeedbackSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService, UserService],
})
export class FeedbackModule {}
