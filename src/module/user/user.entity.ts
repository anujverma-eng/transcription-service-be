import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { UserRole } from "src/common/utils/enum/util.enum";

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  organization?: string;

  @Prop({ required: false })
  phoneNumber?: string;

  @Prop({ default: UserRole.USER, enum: UserRole })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop({ default: null })
  googleId?: string; // for future Google OAuth

  @Prop()
  lastLogin?: Date;

  // createdAt, updatedAt are auto-managed by { timestamps: true }
}

export const UserSchema = SchemaFactory.createForClass(User);
