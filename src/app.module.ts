import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AppConfigModule } from "./common/config/config.module";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./module/auth/auth.module";
import { SubscriptionModule } from "./module/subscription/subscription.module";
import { S3Module } from "./module/s3/s3.module";
import { TranscriptionJobModule } from "./module/transcription-job/transcription-job.module";
// import { ScheduleModule } from "@nestjs/schedule";
import { UsageResetService } from "./tasks/usage-reset.service";

@Module({
  imports: [
    // ScheduleModule.forRoot(),
    AppConfigModule, //Global Config,
    DatabaseModule, //Database Module,
    AuthModule,
    S3Module,
    SubscriptionModule,
    TranscriptionJobModule,
  ],
  controllers: [AppController],
  providers: [AppService, UsageResetService],
})
export class AppModule {}
