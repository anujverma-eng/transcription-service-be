import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtPayload } from "../types/auth.types";
import { AuthService } from "../auth.service";

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  "jwt-access",
) {
  constructor(
    private authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>("JWT_SECRET"),
    });
  }

  async validate(payload: JwtPayload) {
    // payload => { userId: userId, role: 'user' or 'admin', iat, exp }
    const user = await this.authService.validateJwtPayload(payload);
    if (!user) {
      throw new UnauthorizedException("Invalid token or user not found");
    }
    return user;
  }
}
