import { Job } from "bull";
import { Logger } from "@nestjs/common";

/**
 * Creates a logger wrapper for queue operations.
 * This provides standardized logging methods for a given context.
 */
export const QueueLogger = (context: string) => {
  const logger = new Logger(context);
  return {
    logProgress: (job: Job, message: string) => {
      logger.log(`[Job ${job.id}] ${message}`);
    },
    logError: (job: Job | null, error: Error) => {
      const jobId = job?.id ? `[Job ${job.id}] ` : "";
      logger.error(`${jobId}Error: ${error.message}`, error.stack);
    },
    logWarning: (job: Job, message: string) => {
      logger.warn(`[Job ${job.id}] ${message}`);
    },
    logSuccess: (job: Job, message: string) => {
      logger.log(`[Job ${job.id}] ${message}`);
    },
  };
};
