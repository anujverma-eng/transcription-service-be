import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Injectable,
  NotFoundException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { Types } from "mongoose";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { LocalAuthGuard } from "src/common/guards/local-auth.guard";
import { RoleGuard } from "src/common/guards/role.guard";
import { UserService } from "../user/user.service";
import { ResetPasswordDto, SignUpDto } from "./auth.dto";
import {
  AuthRequest,
  AuthTokens,
  AuthUser,
  CookieRequest,
} from "./auth.interface";
import { AuthService } from "./auth.service";
import { setAuthCookies } from "./auth.utilities";
import { PasswordResetService } from "./password-reset.service";

@Injectable()
@Controller("/api/v1/auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

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

    setAuthCookies(res, accessToken, refreshToken);

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

    setAuthCookies(res, accessToken, refreshToken);

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

  @Post("forgot-password")
  async forgotPassword(@Body() body: { email: string }) {
    const { email } = body;
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new NotFoundException("No user found with that email");
    }

    const resetToken = await this.passwordResetService.createToken(
      (user._id as Types.ObjectId).toString(),
      60,
    );

    const message =
      `[Mock Email] To: ${user.email}\nSubject: Password Reset\n` +
      `Here is your reset token: ${resetToken} (valid 1 hour)\n` +
      `Or link: http://localhost:3000/api/v1/auth/reset-password?token=${resetToken}`;

    return { message };
  }

  @Post("reset-password")
  async resetPassword(@Body() body: ResetPasswordDto, @Res() res: Response) {
    const { token, newPassword } = body;

    // 1) Look up the reset doc
    const resetDoc = await this.passwordResetService.findByToken(token);
    if (!resetDoc) {
      throw new BadRequestException("Invalid or unknown reset token");
    }
    if (resetDoc.used) {
      throw new BadRequestException("Reset token already used");
    }
    // Check expiry
    if (resetDoc.expiresAt < new Date()) {
      throw new BadRequestException("Reset token has expired");
    }

    // 2) Retrieve the user
    const user = await this.userService.findById(resetDoc.userId);
    if (!user) {
      throw new NotFoundException("User no longer exists");
    }

    // 3) Update password
    await this.userService.updatePassword(user, newPassword);

    // 4) Mark the token as used
    await this.passwordResetService.markUsed(token);

    // 5) Auto-login => single-device policy => revoke old refresh tokens
    // We'll call authService.login(...) to get new access & refresh tokens
    const { accessToken, refreshToken } = await this.authService.login(
      user as AuthUser,
      {
        deviceId: "reset-pw",
        userAgent: "reset-pw-flow",
        ipAddress: null,
      },
    );

    setAuthCookies(res, accessToken, refreshToken);

    return res.json({ message: "Password reset successful" });
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
