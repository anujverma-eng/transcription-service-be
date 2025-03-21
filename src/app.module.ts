import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AppConfigModule } from "./common/config/config.module";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./module/auth/auth.module";
import { S3Module } from "./module/s3/s3.module";
import { SubscriptionModule } from "./module/subscription/subscription.module";
import { TranscriptionJobModule } from "./module/transcription-job/transcription-job.module";
// import { ScheduleModule } from "@nestjs/schedule";
import { BullModule } from "@nestjs/bull";
import { UsageResetService } from "./tasks/usage-reset.service";
import { PlanModule } from "./module/plan/plan.module";
import { PaymentsModule } from "./module/payments/payments.module";
import { NotificationModule } from "./module/notifications/notification.module";
import { FeedbackModule } from "./module/feedback/feedback.module";
import { AdminModule } from "./module/admin/admin.module";
import { ConfigService } from "@nestjs/config";
@Module({
  imports: [
    // ScheduleModule.forRoot(),
    AppConfigModule, //Global Config,
    DatabaseModule, //Database Module,
    AuthModule,
    S3Module,
    SubscriptionModule,
    TranscriptionJobModule,
    PlanModule,
    PaymentsModule,
    NotificationModule,
    FeedbackModule,
    AdminModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        console.log("Connecting to Redis for Bull at:", {
          host: configService.get<string>("redis.host"),
          port: configService.get<number>("redis.port"),
        });
        return {
          redis: {
            host: configService.get<string>("redis.host"),
            port: configService.get<number>("redis.port"),
            tls: {
              servername: configService.get<string>("redis.host"),
              rejectUnauthorized: false,
            },
          },
          onReady: () => {
            console.log("✅ Bull Redis connection established successfully");
          },
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, UsageResetService],
})
export class AppModule {}
