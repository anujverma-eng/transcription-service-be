import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Injectable,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { LocalAuthGuard } from "src/common/guards/local-auth.guard";
import { RoleGuard } from "src/common/guards/role.guard";
import { User } from "../user/user.entity";
import { SignUpDto } from "./auth.dto";
import { AuthTokens, AuthUser } from "./auth.interface";
import { AuthService } from "./auth.service";

// Extend Express Request to include user property
interface AuthRequest extends Request {
  user: User;
}

@Injectable()
@Controller("/api/v1/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * SIGN UP + auto login
   */
  @Post("sign-up")
  async signUp(
    @Body() signUpDto: SignUpDto,
  ): Promise<{ message: string } & AuthTokens> {
    const tokens: AuthTokens = await this.authService.signUp(signUpDto);
    return {
      message: "User registered and logged in",
      ...tokens,
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: AuthRequest) {
    const user = req.user;
    const deviceId = "web-login";
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip;

    const tokens = await this.authService.login(user as AuthUser, {
      ipAddress,
      deviceId,
      userAgent,
    });
    return {
      message: "Login successful",
      ...tokens,
    };
  }

  /**
   * REFRESH
   * Client sends old refresh token, gets new access & refresh tokens
   */
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Body("refreshToken") refreshToken: string) {
    const newTokens = await this.authService.refreshTheTokens(refreshToken);
    return {
      message: "Tokens refreshed",
      ...newTokens,
    };
  }

  /**
   * LOGOUT
   * Revoke the refresh token so it can't be used again.
   * This endpoint requires a valid Access Token so we know which user is calling it,
   * or you can skip requiring access token if you trust the refresh token alone.
   */
  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: AuthRequest,
    @Body("refreshToken") refreshToken: string,
  ) {
    const user = req.user as AuthUser;
    const result = await this.authService.logout(refreshToken, user);
    return result;
  }

  /**
   * GET /profile
   * Return user info + subscription usage, plan details, etc.
   */
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get("profile")
  async getProfile(@Req() req: AuthRequest) {
    const user = req.user as AuthUser;
    const profile = await this.authService.getProfile(user);
    return {
      message: "User profile",
      profile,
    };
  }
}
