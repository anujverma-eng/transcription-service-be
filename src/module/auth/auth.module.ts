import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UserModule } from "../user/user.module";
import { RefreshTokenModule } from "../refresh-token/refresh-token.module";
import { SubscriptionModule } from "../subscription/subscription.module";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { LocalStrategy } from "./strategies/local.strategy";
import { JwtAccessStrategy } from "./strategies/jwt-access.strategy";
import { JWT_SIGN_IN_OPTIONS } from "src/common/constants/constants";

@Module({
  imports: [
    UserModule,
    RefreshTokenModule,
    SubscriptionModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        global: true,
        signOptions: JWT_SIGN_IN_OPTIONS,
        secret: configService.get("JWT_SECRET"),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtAccessStrategy],
  exports: [AuthService],
})
export class AuthModule {}
