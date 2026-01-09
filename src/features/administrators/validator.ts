import { z } from "zod";

export const putAdministratorByPasswordBodySchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(1, "New password is required"),
});

export const putAdministratorByNameBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const putAdministratorByEmailBodySchema = z.object({
  newEmail: z
    .string()
    .min(1, "Email is required")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "Email format not valid" }),
  password: z.string().min(1, "Password is required"),
});

export const addAdministratorBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "Email format not valid" }),
  password: z.string().min(1, "Password is required"),
});
