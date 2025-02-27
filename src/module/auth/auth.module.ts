import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from "@nestjs/passport";
import { JWT_SIGN_IN_OPTIONS } from "src/common/constants/constants";
import { RefreshTokenModule } from "../refresh-token/refresh-token.module";
import { SubscriptionModule } from "../subscription/subscription.module";
import { UserModule } from "../user/user.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PasswordReset, PasswordResetSchema } from "./password-reset.entity";
import { PasswordResetService } from "./password-reset.service";
import { GoogleStrategy } from "./strategies/google.strategy";
import { JwtAccessStrategy } from "./strategies/jwt-access.strategy";
import { LocalStrategy } from "./strategies/local.strategy";
@Module({
  imports: [
    UserModule,
    RefreshTokenModule,
    SubscriptionModule,
    PassportModule,
    MongooseModule.forFeature([
      { name: PasswordReset.name, schema: PasswordResetSchema },
    ]),
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
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtAccessStrategy,
    PasswordResetService,
    GoogleStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
