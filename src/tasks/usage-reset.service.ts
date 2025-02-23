// src/tasks/usage-reset.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { SubscriptionService } from "../module/subscription/subscription.service";

@Injectable()
export class UsageResetService {
  private readonly logger = new Logger(UsageResetService.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  // This cron expression runs every day at midnight.
  // Adjust the timeZone to match your desired region (e.g., 'Asia/Kolkata').
  //CronExpression.EVERY_DAY_AT_MIDNIGHT
  /**
   * The expression "0 * 14 * * *" means:
   * Second: 0
   * Minute: Every minute (*)
   * Hour: 14 (i.e. 2 PM)
   * Day of Month, Month, Day of Week: Every day
   */
  @Cron("0 50 * * * *", { timeZone: "Asia/Kolkata" })
  async resetFreeUserUsage() {
    console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log(CronExpression.EVERY_DAY_AT_MIDNIGHT);

    try {
      this.logger.log("Resetting daily usage for free plan users");
      await this.subscriptionService.resetDailyUsageForFreeUsers();
      this.logger.log("Daily usage reset successfully");
    } catch (error) {
      this.logger.error("Error resetting daily usage", error);
    }
  }
}
