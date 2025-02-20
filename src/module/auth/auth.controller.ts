import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Injectable,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { LocalAuthGuard } from "src/common/guards/local-auth.guard";
import { RoleGuard } from "src/common/guards/role.guard";
import { SignUpDto } from "./auth.dto";
import {
  AuthRequest,
  AuthTokens,
  AuthUser,
  CookieRequest,
} from "./auth.interface";
import { AuthService } from "./auth.service";

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
  async login(@Req() req: AuthRequest, @Res() res: Response) {
    const user = req.user;
    const deviceId = "web-login";
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip;

    const { accessToken, refreshToken } = await this.authService.login(
      user as AuthUser,
      {
        ipAddress,
        deviceId,
        userAgent,
      },
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60_000, // 15 min
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      maxAge: 7 * 24 * 60_000 * 60, // 7 days
    });

    // Important: Send the response
    return res.json({ message: "Login successful" });
  }

  /**
   * REFRESH
   * Client sends old refresh token, gets new access & refresh tokens
   */
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: CookieRequest, @Res() res: Response) {
    const oldRefreshToken: string = req.cookies["refreshToken"];
    if (!oldRefreshToken) {
      throw new UnauthorizedException("No refresh token found in cookies");
    }
    const { accessToken, refreshToken } =
      await this.authService.refreshTheTokens(oldRefreshToken);
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict", // or 'lax' / 'none'
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60_000, // 15 min
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      maxAge: 7 * 24 * 60_000 * 60, // 7 days
    });
    return res.json({ message: "Refresh successful" });
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
  async logout(@Req() req: CookieRequest, @Res() res: Response) {
    const user = req.user as AuthUser;

    // If you need to identify which refresh token to revoke:
    const refreshToken = req.cookies["refreshToken"];
    if (refreshToken) {
      await this.authService.logout(refreshToken, user);
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.json({ message: "Logout Successfully" });
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
