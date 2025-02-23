import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { TranscriptionStatus } from "src/common/utils/enum/util.enum";

@Schema({ timestamps: true })
export class TranscriptionJob extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  userId: string;

  @Prop({ required: true })
  audioFileKey: string;

  @Prop({ default: null })
  transcriptionFileKey?: string;

  @Prop()
  transcriptionText?: string;

  @Prop({ default: TranscriptionStatus.QUEUED })
  status: TranscriptionStatus;

  @Prop({ required: true })
  durationInSeconds: number;

  @Prop({ required: true })
  durationText: string;

  @Prop({ required: true })
  usageMinutes: number;

  @Prop({ default: null })
  error?: string;
}

export const TranscriptionJobSchema =
  SchemaFactory.createForClass(TranscriptionJob);
