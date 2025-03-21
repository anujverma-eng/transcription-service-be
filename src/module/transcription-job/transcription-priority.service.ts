import { Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TranscriptionPriorityService {
  private redisClient: Redis;

  constructor(private configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get("redis.host"),
      port: this.configService.get("redis.port"),
      tls: {
        servername: this.configService.get("redis.host"),
        rejectUnauthorized: false,
      },
    });

    this.redisClient.on("connect", () => {
      console.log("✅ TranscriptionPriority Redis client connected");
    });

    this.redisClient.on("error", (err) => {
      console.error("❌ TranscriptionPriority Redis connection error:", err);
    });
  }

  /**
   * Increments a global counter in Redis to produce a guaranteed unique submission index.
   */
  async getNextSubmissionIndex(): Promise<number> {
    const val = await this.redisClient.incr("globalSubmissionCounter");
    return val;
  }

  /**
   * For Bull v3 => smaller = higher priority
   * We'll do base=100 for paid, 300 for free, then add duration + index
   */
  computePriority(
    isPaid: boolean,
    durationMinutes: number,
    submissionIndex: number,
  ): number {
    const base = isPaid ? 100 : 300;
    return base + durationMinutes + submissionIndex;
  }
}
