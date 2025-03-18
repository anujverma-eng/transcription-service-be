import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomBytes } from "crypto";
import { Model, Types } from "mongoose";
import { PasswordReset } from "./password-reset.entity";
import { NotificationService } from "../notifications/notification.service";
import { NotificationType } from "../notifications/notification.dto";
import { UserService } from "../user/user.service";

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectModel(PasswordReset.name) private resetModel: Model<PasswordReset>,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
  ) {}

  async createToken(
    userId: string | Types.ObjectId,
    expiresInMinutes = 60,
  ): Promise<string> {
    // Generate random token
    const token = randomBytes(20).toString("hex");
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60_000);

    const existingReset = await this.resetModel
      .findOne({ userId })
      .lean()
      .exec();
    if (existingReset && existingReset.expiresAt > new Date()) {
      return existingReset.token;
    }

    await this.resetModel.create({
      userId,
      token,
      expiresAt,
      used: false,
    });

    const user = await this.userService.findById(userId as string);

    await this.notificationService.sendEmail({
      type: NotificationType.PASSWORD_RESET,
      to: user.email,
      username: user.name,
      subject: "Password Reset",
      resetLink: `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`,
      expirationTime: expiresAt.toISOString(),
    });

    return token;
  }

  async findByToken(token: string): Promise<PasswordReset | null> {
    return this.resetModel.findOne({ token }).lean().exec();
  }

  async markUsed(token: string) {
    // await this.resetModel.updateOne({ token }, { $set: { used: true } }).exec();
    await this.resetModel.deleteOne({ token }).lean().exec();
  }
}
