// src/modules/transcription/transcription-error.entity.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class TranscriptionError extends Document {
  @Prop({ required: true })
  jobId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  errorMessage: string;

  @Prop()
  stackTrace?: string;

  @Prop({ type: Object })
  additionalData?: any;

  @Prop({ type: Boolean })
  unrecoverable?: boolean;

  @Prop({ type: Date })
  markedAt?: Date;
}

export const TranscriptionErrorSchema =
  SchemaFactory.createForClass(TranscriptionError);
