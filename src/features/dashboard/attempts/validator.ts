import { z } from "zod";

export const getAttemptsHistorySchema = z.object({
  days: z.coerce
    .number()
    .refine((val) => [7, 14, 30].includes(val), {
      message: "Days must be 7, 14, or 30",
    })
    .default(7),
});

export const getAttemptsListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  tutorial_id: z.coerce.number().int().positive().optional(),
  user_id: z.coerce.number().int().positive().optional(),
  status: z.enum(["all", "submitted", "unsubmitted"]).default("all"),
});

export type GetAttemptsHistoryQuery = z.infer<typeof getAttemptsHistorySchema>;
export type GetAttemptsListQuery = z.infer<typeof getAttemptsListSchema>;
