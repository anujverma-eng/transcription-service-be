import { Request } from "express";
import { Types } from "mongoose";
import { User } from "src/module/user/user.entity";

export interface AuthUser extends User {
  _id: Types.ObjectId;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthRequest extends Request {
  user: User;
}

export interface CookieRequest extends Request {
  cookies: {
    refreshToken?: string;
    accessToken?: string;
    [key: string]: string | undefined;
  };
}
