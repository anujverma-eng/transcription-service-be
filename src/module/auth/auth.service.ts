import { Injectable } from "@nestjs/common";
import { compare } from "bcrypt";
import { UserService } from "../user/user.service";
import { LoginDto } from "./auth.dto";
import { User } from "../user/user.entity";
import { JwtPayload } from "./types/auth.types";

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

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
}
