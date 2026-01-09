import { z } from "zod";

export const getUserPreferencesParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("User ID must be an integer")
    .positive("User ID must be a positive number"),
});

export type GetUserPreferencesParams = z.infer<
  typeof getUserPreferencesParamsSchema
>;
