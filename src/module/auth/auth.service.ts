import { Injectable, UnauthorizedException } from "@nestjs/common";
import { compare } from "bcrypt";
import { UserService } from "../user/user.service";
import { LoginDto, SignUpDto } from "./auth.dto";
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
import { AuthTokens, AuthUser } from "./auth.interface";
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
    const user = await this.userService.findById(payload.userId);
    if (!user || !user.isActive) return null;
    return user;
  }

  /**
   * Sign Up new user + auto-login (return tokens).
   */
  async signUp(signUpDto: SignUpDto): Promise<AuthTokens> {
    const user = await this.userService.createUser(signUpDto as CreateUserDto);
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
  ): Promise<AuthTokens> {
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
   * Refresh tokens: rotate the refresh token and provide a new access & refresh.
   * Single-device policy: We revoke the old token doc and create a new one.
   *  - Verifies that refresh token is valid JWT and not expired.
   *  - Finds that token in the RefreshToken collection (it must be active).
   *  - Revokes/deactivates it (rotation).
   *  - Issues a new access token (short-lived) and a new refresh token (longer-lived).
   *  - Stores the new refresh token in the DB, so the user stays logged in.
   */
  async refreshTheTokens(oldRefreshToken: string) {
    // 1) Verify the old refresh token’s signature & expiry
    try {
      await this.jwtService.verify(oldRefreshToken);
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token", {
        cause: error,
      });
    }

    // 2) Check the RefreshToken DB for a matching active token
    const tokenDoc =
      await this.refreshTokenService.findRefreshTokenByToken(oldRefreshToken);
    if (!tokenDoc) {
      throw new UnauthorizedException("Refresh token not found or revoked");
    }

    // 3) Fetch the user
    const user = await this.userService.findById(tokenDoc.userId);
    if (!user || user.isBlocked) {
      // revoke token doc or set isActive=false
      await this.refreshTokenService.revokeRefreshToken(oldRefreshToken);
      throw new UnauthorizedException("User not found or blocked");
    }

    // 4) Generate new tokens
    const tokens = await this.login(user as AuthUser);
    return tokens;
  }

  /**
   * Logout: revoke the user’s current refresh token so it can’t be used again.
   */
  async logout(refreshToken: string, user: AuthUser) {
    // The user might pass the refresh token from local storage
    // or from an Authorization header, etc.
    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token provided");
    }
    const tokenDoc =
      await this.refreshTokenService.findRefreshTokenByToken(refreshToken);

    if (!tokenDoc || tokenDoc.userId.toString() !== user._id.toString()) {
      throw new UnauthorizedException("Token does not match user");
    }

    await this.refreshTokenService.revokeRefreshToken(refreshToken);

    return { message: "Logout successful" };
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
