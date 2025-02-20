import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { UserRole } from "src/common/utils/enum/util.enum";

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  organization?: string;

  @Prop()
  phoneNumber?: string;

  @Prop({ default: UserRole.USER, enum: UserRole })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  googleId?: string; // for future Google OAuth

  @Prop()
  lastLogin?: Date;

  // createdAt, updatedAt are auto-managed by { timestamps: true }
}

export const UserSchema = SchemaFactory.createForClass(User);
