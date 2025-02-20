import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

@Schema({ timestamps: true })
export class RefreshToken extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: "User" })
  userId: string; // reference to the user

  @Prop({ required: true })
  token: string; // the refresh JWT (or hashed version)

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  deviceId?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  sessionId?: string;
}
export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
