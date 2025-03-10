// src/modules/feedback/feedback.entity.ts

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

@Schema({ timestamps: true })
export class Feedback extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  })
  userId: string;
  // unique: true ensures each user can only have one feedback doc

  @Prop({ required: true })
  userName: string;
  @Prop({ required: true })
  rating: number; // rating out of 5

  @Prop({ required: true })
  review: string; // textual feedback

  @Prop({ default: false })
  isDeleted: boolean; // if user has 'deleted' it

  @Prop({ default: false })
  adminSelected: boolean; // whether admin selected it to show on frontend
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
