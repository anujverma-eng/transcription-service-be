import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { RefreshToken } from "./refresh-token.entity";
import { Model, Types } from "mongoose";

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshToken>,
  ) {}

  async createRefreshTokenInDb(
    userId: Types.ObjectId | string,
    token: string,
    deviceId?: string,
    userAgent?: string,
    ipAddress?: string,
    sessionId?: string,
  ): Promise<RefreshToken> {
    return this.refreshTokenModel.create({
      userId: new Types.ObjectId(userId),
      token,
      deviceId,
      userAgent,
      ipAddress,
      sessionId,
    });
  }

  async findRefreshTokenByToken(token: string): Promise<RefreshToken | null> {
    return this.refreshTokenModel.findOne({ token, isActive: true });
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenModel.deleteMany({ token });
  }

  async revokeAllRefreshTokensForUser(userId: Types.ObjectId | string) {
    await this.refreshTokenModel.deleteMany({ userId });
  }
}
