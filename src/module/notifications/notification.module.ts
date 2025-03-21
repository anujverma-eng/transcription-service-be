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
    // Register Bull Queue for Notifications
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
      processors: [
        {
          name: "notifications",
          callback: () => {
            console.log("✅ Notifications Queue processor initialized");
          },
        },
      ],
    }),
    // Configure MailerModule for AWS SES
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const transport = {
          host: config.get<string>("SMTP_HOST"), // AWS SES SMTP Host
          port: config.get<number>("SMTP_PORT"), // 587 for TLS, 465 for SSL
          secure: config.get<string>("SMTP_SECURE") === "true", // true for port 465, false for 587
          auth: {
            user: config.get<string>("SMTP_USER"), // SES SMTP Username
            pass: config.get<string>("SMTP_PASSWORD"), // SES SMTP Password
          },
          tls: {
            rejectUnauthorized: false, // Allow TLS
          },
        };

        // Verify SES SMTP Connection
        const transporter = nodemailer.createTransport(transport);
        await new Promise((resolve, reject) => {
          transporter.verify((err, success) => {
            if (err) {
              console.error("AWS SES SMTP verify error =>", err);
              reject(err);
            } else {
              console.log(
                "*********** AWS SES SMTP is ready to accept messages ***********",
              );
              resolve(success);
            }
          });
        });

        return {
          transport,
          defaults: {
            from:
              config.get<string>("DEFAULT_FROM_EMAIL") ||
              "no-reply@audiolekh.com",
          },
          template: {
            dir: join(__dirname, "templates"),
            adapter: new HandlebarsAdapter(),
            options: { strict: true },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [NotificationService, NotificationProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}
