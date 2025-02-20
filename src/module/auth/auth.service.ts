import { Injectable } from "@nestjs/common";
import { compare } from "bcrypt";
import { UserService } from "../user/user.service";
import { LoginDto } from "./auth.dto";
import { User } from "../user/user.entity";
import { JwtPayload } from "./types/auth.types";
import { CreateUserDto } from "../user/user.dto";
import { RefreshTokenService } from "../refresh-token/refresh-token.service";
import { Types } from "mongoose";
import { JwtService } from "@nestjs/jwt";
import { SubscriptionService } from "../subscription/subscription.service";
import {
  JWT_REFRESH_EXPIRATION_TIME,
  JWT_SIGN_IN_OPTIONS,
} from "src/common/constants/constants";
import { AuthUser } from "./auth.interface";
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private refreshTokenService: RefreshTokenService,
    private subscriptionService: SubscriptionService,
    private jwtService: JwtService,
  ) {}

  /**
   * Validate user via email/password (LocalStrategy).
   */
  async validateUser(loginDto: LoginDto): Promise<User> {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) return null;
    if (!user.isActive) return null;
    const isMatch = await compare(loginDto.password, user.password);
    return isMatch ? user : null;
  }

  /**
   * Validate JWT payload (JwtAccessStrategy).
   * We check if user still exists & is active.
   */
  async validateJwtPayload(payload: JwtPayload): Promise<User | null> {
    if (!payload.email) return null;
    const user = await this.userService.findById(payload.email);
    if (!user || !user.isActive) return null;
    return user;
  }

  /**
   * Sign Up new user + auto-login (return tokens).
   */
  async signUp(createUserDto: CreateUserDto): Promise<any> {
    const user = await this.userService.createUser(createUserDto);
    return await this.login(user as AuthUser);
  }

  /**
   * Single-Device Login => Revoke old tokens for user, create new refresh token doc.
   */
  async login(
    user: AuthUser,
    metaData?: {
      ipAddress?: string;
      deviceId?: string;
      userAgent?: string;
      sessionId?: string;
    },
  ) {
    // 1) Revoke existing refresh tokens for single-device policy
    await this.refreshTokenService.revokeAllRefreshTokensForUser(
      new Types.ObjectId(user._id),
    );

    // 2) Generate Access Token
    const tokenPayload: JwtPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(tokenPayload, JWT_SIGN_IN_OPTIONS);

    // 3) Generate Refresh Token
    const refreshToken = this.jwtService.sign(tokenPayload, {
      ...JWT_SIGN_IN_OPTIONS,
      expiresIn: JWT_REFRESH_EXPIRATION_TIME,
    });

    // 4) Store refresh token in DB
    await this.refreshTokenService.createRefreshTokenInDb(
      user._id,
      refreshToken,
      metaData?.deviceId,
      metaData?.userAgent,
      metaData?.ipAddress,
      metaData?.sessionId,
    );

    // 5) Update lastLogin
    await this.userService.updateLastLogin(user._id);
    return { accessToken, refreshToken };
  }

  /**
   * For the /profile endpoint: fetch user, subscription, plan usage, etc.
   */
  async getProfile(user: AuthUser) {
    const subscription = await this.subscriptionService.getActiveSubscription(
      new Types.ObjectId(user._id),
    );
    // In real code, you'd also fetch the Plan doc to get plan name, daily limit, etc.
    // For example:
    // const plan = subscription ? await planService.findById(subscription.planId) : null;

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      organization: user.organization,
      phoneNumber: user.phoneNumber,
      role: user.role,
      lastLogin: user.lastLogin,
      subscription: subscription
        ? {
            planId: subscription.planId,
            dailyUsedMinutes: subscription.dailyUsedMinutes,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
          }
        : null,
    };
  }
}
