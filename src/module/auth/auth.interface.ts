import { Types } from "mongoose";
import { User } from "src/module/user/user.entity";

export interface AuthUser extends User {
  _id: Types.ObjectId;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
