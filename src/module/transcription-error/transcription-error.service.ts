// src/modules/transcription/transcription-error.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { TranscriptionError } from "./transcription-error.entity";

@Injectable()
export class TranscriptionErrorService {
  private readonly logger = new Logger(TranscriptionErrorService.name);

  constructor(
    @InjectModel(TranscriptionError.name)
    private readonly transcriptionErrorModel: Model<TranscriptionError>,
  ) {}

  async createError(
    details: Partial<TranscriptionError>,
  ): Promise<TranscriptionError> {
    try {
      const errorDoc = new this.transcriptionErrorModel(details);
      return await errorDoc.save();
    } catch (error) {
      this.logger.error("Error saving transcription error", error);
      throw error;
    }
  }

  async markAsUnrecoverable(jobId: string): Promise<TranscriptionError> {
    return this.transcriptionErrorModel.findOneAndUpdate(
      { jobId },
      { unrecoverable: true, markedAt: new Date() },
      { new: true },
    );
  }
}
