import { z } from "zod";

export const getQuestionsListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  tutorial_id: z.coerce.number().int().positive().optional(),
});

export const getQuizGenerationsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("page must be an integer")
    .min(1, "page must be at least 1")
    .default(1),

  limit: z.coerce
    .number()
    .int("limit must be an integer")
    .min(1, "limit must be at least 1")
    .max(100, "limit cannot exceed 100 items")
    .default(10),

  tutorial_id: z.coerce
    .number()
    .int("tutorial_id must be an integer")
    .positive("tutorial_id must be a positive number")
    .optional(),
});
