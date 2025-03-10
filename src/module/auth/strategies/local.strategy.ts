import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";
import { User } from "src/module/user/user.entity";

@Injectable()
export class LocalStrategy extends PassportStrategy(
  Strategy,
  "local-strategy",
) {
  constructor(private authService: AuthService) {
    super({ usernameField: "email" });
  }

  async validate(email: string, password: string): Promise<User> {
    const user = await this.authService.validateUser({ email, password });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return user;
  }
}
