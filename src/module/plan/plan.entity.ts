// src/modules/plan/plan.entity.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Plan extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description?: string;

  // For daily usage limit e.g. 5, 200, etc
  @Prop({ default: 5 })
  dailyLimit: number;

  // e.g. price in INR (rupees)
  @Prop({ default: 0 })
  price: number;

  // "INR", "USD", etc.
  @Prop({ default: "INR" })
  currency: string;

  // Is plan currently available for purchase?
  @Prop({ default: true })
  isActive: boolean;

  // If plan is paid or free
  @Prop({ default: false })
  isPaid: boolean;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
