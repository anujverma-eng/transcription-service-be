import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

@Schema()
export class Subscription extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Plan" })
  planId: string; // references Plan model

  @Prop({ default: 0 })
  dailyUsedMinutes: number;

  @Prop({ default: Date.now })
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
