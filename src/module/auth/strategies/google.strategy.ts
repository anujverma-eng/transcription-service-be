/* eslint-disable */
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { AuthService } from "../auth.service";
import { ConfigService } from "@nestjs/config";

interface GoogleProfile {
  id: string;
  emails?: Array<{ value: string; verified?: boolean }>;
  displayName?: string;
  provider: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>("GOOGLE_CLIENT_ID"),
      clientSecret: configService.get<string>("GOOGLE_CLIENT_SECRET"),
      callbackURL: configService.get<string>("GOOGLE_CALLBACK_URL"),
      scope: ["email", "profile"],
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      /**
       * profile will contain user info from Google:
       * profile.emails, profile.displayName, etc.
       */
      const { emails, id } = profile;

      if (!emails || emails.length === 0) {
        return done(
          new UnauthorizedException("No email found from Google"),
          null,
        );
      }

      // Use the "verified" status from Google if available
      // Typically profile.emails[0] has { value: string, verified: boolean }
      const primaryEmail = emails[0];
      if (!primaryEmail.verified) {
        return done(
          new UnauthorizedException("Google email not verified"),
          null,
        );
      }

      // The authService will find or create (link) a user in our DB
      const user = await this.authService.validateGoogleUser({
        googleId: id,
        email: primaryEmail.value,
        displayName: profile.displayName || null,
      });

      if (!user) {
        return done(
          new UnauthorizedException("Failed to link Google user"),
          null,
        );
      }

      // If everything is okay, pass the user to the next step
      return done(null, user);
    } catch (error) {
      console.log(error);
    }
  }
}
