import { z } from "zod";

export const getQuestionsQuerySchema = z.object({
  tutorial_id: z.coerce
    .number()
    .int("tutorial_id must be an integer")
    .positive("tutorial_id must be a positive number"),
  user_id: z.coerce
    .number()
    .int("user_id must be an integer")
    .positive("user_id must be a positive number"),
});

const QuestionIdSchema = z
  .string()
  .regex(/^question-[a-zA-Z0-9_-]+$/, "Invalid questionId format");

const OptionIdSchema = z
  .string()
  .regex(/^option-[a-zA-Z0-9_-]+$/, "Invalid optionId format");

const OptionSchema = z.object({
  optionId: OptionIdSchema.optional(),
  option: z.string().min(1, "Option text is required"),
  explanation: z.string().optional().default(""),
  isCorrect: z.boolean(),
});

const QuestionSchema = z
  .object({
    questionId: QuestionIdSchema.optional(),
    type: z.enum(["single", "multiple", "boolean"]).optional(),
    question: z
      .string()
      .min(10, "Question text must be at least 10 characters long"),
    options: z.array(OptionSchema),
  })
  .superRefine((val, ctx) => {
    if (val.type === "boolean") {
      if (val.options.length !== 2) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Boolean question must have exactly 2 options",
        });
      }
    } else {
      if (val.options.length !== 4) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Single/Multiple question must have exactly 4 options",
        });
      }
    }

    const correct = val.options.filter((o) => o.isCorrect).length;

    if (val.type === "boolean") {
      if (correct !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Boolean question must have exactly 1 correct option",
        });
      }
    } else if (val.type === "single") {
      if (correct !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Single question must have exactly 1 correct option",
        });
      }
    } else if (val.type === "multiple") {
      if (correct < 2 || correct > 3) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Multiple question must have 2-3 correct options",
        });
      }
    } else {
      if (correct !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message:
            'When "type" is omitted, exactly 1 option must be correct (default: single).',
        });
      }
    }
  });

const QuizSchema = z.object({
  questions: z.array(QuestionSchema).min(1, "At least 1 question is required"),
});

export type Option = z.infer<typeof OptionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
export type GetQuestionsQuery = z.infer<typeof getQuestionsQuerySchema>;

export { OptionSchema, QuestionSchema, QuizSchema };
