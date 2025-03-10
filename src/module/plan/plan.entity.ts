// src/modules/plan/plan.entity.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Plan extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ default: 5 })
  totalLimit: number;

  @Prop({ default: 0 })
  price: number;

  @Prop({ default: "INR" })
  currency: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isPaid: boolean;

  @Prop({ unique: true, sparse: true })
  slug?: string;

  @Prop({ default: 1 })
  sortOrder?: number;

  @Prop({ type: [String], default: [] })
  features?: string[];
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
