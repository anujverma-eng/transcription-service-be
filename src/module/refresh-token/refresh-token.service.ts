import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { RefreshToken } from "./refresh-token.entity";
import { Model } from "mongoose";

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshToken>,
  ) {}

  async createToken(
    userId: string,
    token: string,
    deviceId?: string,
    userAgent?: string,
    ipAddress?: string,
    sessionId?: string,
  ): Promise<RefreshToken> {
    return this.refreshTokenModel.create({
      userId,
      token,
      deviceId,
      userAgent,
      ipAddress,
      sessionId,
    });
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.refreshTokenModel.findOne({ token, isActive: true });
  }

  async revokeToken(token: string): Promise<void> {
    await this.refreshTokenModel.updateOne(
      { token },
      { $set: { isActive: false } },
    );
  }

  async revokeAllTokensForUser(userId: string) {
    await this.refreshTokenModel.updateMany(
      { userId },
      { $set: { isActive: false } },
    );
  }
}
