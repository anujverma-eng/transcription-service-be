import { Response } from "express";

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "none",
    // sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60_000, // 15 min
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "none",
    // sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60_000 * 60, // 7 days
  });
};
