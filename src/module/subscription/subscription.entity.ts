import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

@Schema()
export class Subscription extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Plan" })
  planId: string; // references Plan model

  @Prop({ default: 5 })
  dailyLimit: number; // Based on the plan

  @Prop({ default: 0 })
  dailyUsedMinutes: number;

  @Prop({ default: Date.now })
  startDate: Date;

  @Prop({ default: null })
  endDate: Date; // Based on the plan

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isPaid: boolean;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
