// src/modules/notification/dto/notification.dto.ts

import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsNumber,
} from "class-validator";

export enum NotificationType {
  TRANSCRIPTION_COMPLETED = "TRANSCRIPTION_COMPLETED",
  TRANSCRIPTION_FAILED = "TRANSCRIPTION_FAILED",
  USER_REGISTRATION = "USER_REGISTRATION",
  PASSWORD_RESET = "PASSWORD_RESET",
  PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
  PAYMENT_FAILURE = "PAYMENT_FAILURE",
  SUBSCRIPTION_UPDATED = "SUBSCRIPTION_UPDATED",
  SYSTEM_ALERT = "SYSTEM_ALERT",
}

/**
 * Base fields for all notifications
 */
export class BaseNotificationDto {
  type: NotificationType;
  to: string | string[];
  subject: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Transcription event payload
 */
export class TranscriptionNotificationDto extends BaseNotificationDto {
  // e.g. "audio123.wav"
  fileName: string;

  // if there's an error or if it's completed
  @IsOptional()
  error?: string;

  @IsOptional()
  downloadUrl?: string;
}

/**
 * User registration event
 */
export class UserRegistrationDto extends BaseNotificationDto {
  username: string;
  @IsOptional()
  verificationLink?: string;
}

/**
 * Payment event
 */
export class PaymentNotificationDto extends BaseNotificationDto {
  @IsNumber()
  amount: number;

  currency: string;

  @IsOptional()
  invoiceId?: string;

  planName: string;
}

/**
 * Password reset event
 */
export class PasswordResetDto extends BaseNotificationDto {
  resetLink: string;
  expirationTime: string;
}

/**
 * Union type for all possible notification payloads
 */
export type NotificationPayload =
  | TranscriptionNotificationDto
  | UserRegistrationDto
  | PasswordResetDto
  | PaymentNotificationDto;

export class SendNotificationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  downloadUrl: string;

  @IsString()
  @IsNotEmpty()
  jobId: string;
}
