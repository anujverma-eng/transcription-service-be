export interface JwtPayload {
  userId: string; // This should be the MongoDB _id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
