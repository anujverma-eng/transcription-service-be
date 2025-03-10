export const JWT_ACCESS_EXPIRATION_TIME = "1m";
export const JWT_ISSUER = "transcription-auth";
export const JWT_REFRESH_EXPIRATION_TIME = "7d";

export const JWT_SIGN_IN_OPTIONS = {
  expiresIn: JWT_ACCESS_EXPIRATION_TIME,
  issuer: JWT_ISSUER,
};
