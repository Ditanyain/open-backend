import jwt from "jsonwebtoken";

export interface UserPayload {
  administratorId: string;
  sessionId: string;
  role: "SUPERUSER" | "ADMIN";
  iat: number;
  exp: number;
}

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access_secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "refresh_secret";

const generateAccessToken = (payload: {
  administratorId: string;
  sessionId: string;
  role: "SUPERUSER" | "ADMIN";
}) => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: "5m",
  });
};

const generateRefreshToken = (payload: {
  administratorId: string;
  sessionId: string;
  role: "SUPERUSER" | "ADMIN";
}) => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

const verifyAccessToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as UserPayload;
  } catch {
    return null;
  }
};

const verifyRefreshToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as UserPayload;
  } catch {
    return null;
  }
};

export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
