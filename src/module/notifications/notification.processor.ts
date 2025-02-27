// src/modules/notification/notification.processor.ts
/* eslint-disable */

import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { Logger } from "@nestjs/common";
import {
  NotificationPayload,
  NotificationType,
  PaymentNotificationDto,
  TranscriptionNotificationDto,
  UserRegistrationDto,
} from "./notification.dto";
import { ISendMailOptions, MailerService } from "@nestjs-modules/mailer";

@Processor("notifications")
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly mailerService: MailerService) {}

  @Process("email")
  async handleEmail(job: Job<NotificationPayload>) {
    try {
      const data = job.data;
      this.logger.log(`Processing email job: ${data.type}`);

      // figure out which template to use, plus context
      const { template, context } = this.getTemplateAndContext(data);

      console.log(template, context);

      // use nestjs-modules/mailer
      await this.mailerService.sendMail({
        to: data.to,
        subject: data.subject,
        template, // the .hbs file name
        context, // variables for the template
        // from, bcc, cc also if needed
      } as ISendMailOptions);

      this.logger.log(`Email sent successfully (type=${data.type})`);
    } catch (error) {
      this.logger.error(
        `Failed to send email jobId=${job.id}: ${error.message}`,
      );
      throw error; // Let Bull handle re-try
    }
  }

  /**
   * Based on NotificationType, pick a .hbs template file and context
   */
  private getTemplateAndContext(data: NotificationPayload): {
    template: string;
    context: any;
  } {
    switch (data.type) {
      case NotificationType.TRANSCRIPTION_COMPLETED:
        return {
          template: "transcription-completed",
          context: {
            fileName: (data as TranscriptionNotificationDto).fileName,
            downloadUrl: (data as TranscriptionNotificationDto).downloadUrl,
          },
        };
      case NotificationType.TRANSCRIPTION_FAILED:
        return {
          template: "transcription-failed",
          context: {
            fileName: (data as TranscriptionNotificationDto).fileName,
            error: (data as TranscriptionNotificationDto).error,
          },
        };
      case NotificationType.USER_REGISTRATION:
        return {
          template: "user-registration",
          context: {
            username: (data as UserRegistrationDto).username,
            verificationLink: (data as UserRegistrationDto)?.verificationLink,
          },
        };
      case NotificationType.PASSWORD_RESET:
        return {
          template: "password-reset",
          context: {
            resetLink: (data as any).resetLink,
            expirationTime: (data as any).expirationTime,
          },
        };
      case NotificationType.PAYMENT_FAILURE:
      case NotificationType.PAYMENT_SUCCESS:
        return {
          template: "payment-success",
          context: {
            planName: (data as PaymentNotificationDto).planName,
            amount: (data as PaymentNotificationDto).amount,
            currency: (data as PaymentNotificationDto).currency,
            invoiceId: (data as PaymentNotificationDto).invoiceId,
          },
        };
      case NotificationType.SYSTEM_ALERT:
        return {
          template: "system-alert",
          context: {
            message: "A critical error occurred. Check logs.",
            // you can pass more details
          },
        };
      default:
        throw new Error(`Unsupported Notification Type: ${data.type}`);
    }
  }
}
