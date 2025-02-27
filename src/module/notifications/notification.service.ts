// src/modules/notification/notification.service.ts

import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { NotificationPayload, NotificationType } from "./notification.dto";
import { callSafe } from "src/common/utils/common.util";

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue("notifications") private readonly notificationQueue: Queue,
  ) {}

  /**
   * Put an email job onto the queue
   */
  async sendEmail(payload: NotificationPayload) {
    await callSafe(() => this.notificationQueue.add("email", payload));
    this.logger.log(`Email queued for type=${payload.type}`);
  }

  /**
   * Example helper: send a critical system alert
   */
  async sendCriticalAlert(error: Error) {
    await this.sendEmail({
      type: NotificationType.SYSTEM_ALERT,
      to: ["admin1@example.com", "admin2@example.com"],
      subject: "🚨 Critical System Alert",
      error: JSON.stringify(error),
    } as NotificationPayload);
  }
}
