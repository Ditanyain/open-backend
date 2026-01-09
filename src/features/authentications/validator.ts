import { z } from "zod";

export const postAuthenticationBodySchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: "Email format not valid",
    }),
  password: z.string().min(1, "Password is required"),
});

export const putAuthenticationBodySchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const deleteAuthenticationBodySchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const deleteOtherSessionsBodySchema = z.object({
  password: z.string().min(1, "Password is required"),
});
