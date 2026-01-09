import { z } from "zod";

export const getAttemptsQuerySchema = z.object({
  tutorial_id: z.coerce
    .number()
    .int("tutorial_id must be an integer")
    .positive("tutorial_id must be a positive number"),
  user_id: z.coerce
    .number()
    .int("user_id must be an integer")
    .positive("user_id must be a positive number"),
});

export const postAnswerBodySchema = z.object({
  questionId: z.string().min(1, "questionId is required"),
  optionIds: z
    .array(z.string())
    .min(1, "optionIds must contain at least 1 option"),
});

export type GetAttemptsQuery = z.infer<typeof getAttemptsQuerySchema>;
export type PostAnswerBody = z.infer<typeof postAnswerBodySchema>;
