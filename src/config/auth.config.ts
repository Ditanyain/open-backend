export const ACCESS_TOKEN_KEY = process.env.ACCESS_TOKEN_KEY as string;
export const REFRESH_TOKEN_KEY = process.env.REFRESH_TOKEN_KEY as string;

if (!ACCESS_TOKEN_KEY || !REFRESH_TOKEN_KEY) {
  throw new Error("JWT environment variables are missing!");
}

export const ACCESS_TOKEN_EXPIRATION = "5m";
export const REFRESH_TOKEN_EXPIRATION = "5m";