// src/modules/notification/notification.module.ts
import { BullModule } from "@nestjs/bull";
import { Global, Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { join } from "path";
import * as nodemailer from "nodemailer";
import { NotificationProcessor } from "./notification.processor";
import { NotificationService } from "./notification.service";

@Global()
@Module({
  imports: [
    // Register the "notifications" queue
    BullModule.registerQueue({
      name: "notifications",
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 2,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    }),
    // Set up MailerModule
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const transport = {
          host: config.get<string>("SMTP_HOST"),
          port: config.get<number>("SMTP_PORT"),
          secure: config.get<string>("SMTP_SECURE") === "true" ? true : false,
          auth: {
            user: config.get<string>("SMTP_USER"),
            pass: config.get<string>("SMTP_PASSWORD"),
          },
          tls: {
            rejectUnauthorized: false,
          },
        };

        // Verify SMTP connection
        const transporter = nodemailer.createTransport(transport);

        await new Promise((resolve, reject) => {
          transporter.verify((err, success) => {
            if (err) {
              console.log(transport);
              console.error("SMTP verify error =>", err);
              reject(err);
            } else {
              console.log(
                "*********** SMTP is ready to accept messages ***********",
              );
              resolve(success);
            }
          });
        });

        return {
          transport,
          defaults: {
            from:
              config.get<string>("DEFAULT_FROM_EMAIL") || "noreply@example.com",
          },
          template: {
            // dir: join(__dirname, "templates"),
            dir: "/Users/anuj/Documents/untitled folder/transcription-backend/src/module/notifications/templates",
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [NotificationService, NotificationProcessor],
  exports: [NotificationService],
})
export class NotificationModule {
  constructor() {
    console.log(__dirname);
    console.log(join(__dirname, "..", "src/module/notifications/templates"));
  }
}
