import { Request } from "express";

interface CookieRequest extends Request {
  cookies: {
    accessToken?: string;
    [key: string]: string | undefined;
  };
}

export function cookieExtractor(req: CookieRequest): string | null {
  if (req?.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
}
