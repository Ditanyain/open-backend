import { nanoid } from "nanoid";
import { QuizSchema } from "./validator";
import type { Option, Question, Quiz } from "./validator";

const getQuestionCount = (material: string): number => {
  const wordCount = material.trim().split(/\s+/).length;

  if (wordCount <= 500) return 10;
  if (wordCount <= 750) return 15;
  return 20;
};

const BATCH_SIZE = 5;

const getBatchConfig = (material: string) => {
  const totalQuestions = getQuestionCount(material);
  const batchCount = Math.ceil(totalQuestions / BATCH_SIZE);

  return {
    totalQuestions,
    batchSize: BATCH_SIZE,
    batchCount,
    batches: Array.from({ length: batchCount }, (_, i) => {
      const start = i * BATCH_SIZE;
      const remaining = totalQuestions - start;
      return {
        batchNumber: i + 1,
        questionCount: Math.min(BATCH_SIZE, remaining),
      };
    }),
  };
};

const buildQuizPrompt = (
  material: string,
  questionCount: number,
  batchNumber: number,
  existingQuestions: string[] = []
) => {
  const systemPrompt = [
    "You are a quiz generator.",
    "Write explanations that reference the content naturally and conversationally.",
    "Match the language of MATERIAL for all texts (questions, options, explanations, and labels).",
    "Output ONLY valid JSON (no markdown, no extra text).",
  ].join(" ");

  const avoidDuplicatesInstruction =
    existingQuestions.length > 0
      ? `\n\nIMPORTANT - AVOID THESE QUESTIONS (already generated):\n${existingQuestions
          .map((q, i) => `${i + 1}. ${q}`)
          .join(
            "\n"
          )}\n\nYou MUST create COMPLETELY DIFFERENT questions that cover other aspects of the material.`
      : "";

  const userPrompt = [
    `TASK: Create EXACTLY ${questionCount} UNIQUE questions from MATERIAL (Batch ${batchNumber}).`,
    "Include these types:",
    "- single: 4 options, exactly 1 correct.",
    "- multiple: 4 options, 2-3 correct.",
    '- boolean: 2 options (localized; e.g., Indonesian: "Benar","Salah"; English: "True","False").',
    "",
    "JSON schema (strict):",
    `{
  "questions": [
    {
      "questionId": "q-<id>",
      "type": "single" | "multiple" | "boolean",
      "question": "<text>",
      "options": [
        {
          "optionId": "o-<id>",
          "option": "<text>",
          "isCorrect": true|false,
          "explanation": "<brief explanation referencing MATERIAL if possible>"
        }
      ]
    }
  ]
}`,
    "",
    "MATERIAL:",
    material,
    avoidDuplicatesInstruction,
    "",
    "RULES:",
    `- Produce EXACTLY ${questionCount} questions, no more, no less.`,
    "- Use the same language as MATERIAL.",
    "- Explanations must reference relevant facts or phrases from MATERIAL when possible.",
    "- Explanations should clarify why the answer is correct or incorrect using the material context.",
    "- No placeholders; ensure all content aligns with MATERIAL.",
    "- Create diverse questions covering DIFFERENT aspects and details of the material.",
    "- If this is a later batch, focus on topics NOT covered in previous batches.",
  ].join("\n");

  return { systemPrompt, userPrompt };
};

const normalizeQuizResponse = (
  rawResponse: string,
  expectedCount: number
): Quiz => {
  let cleaned = rawResponse.trim();

  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/```\n?/g, "");
  }

  const parsed = JSON.parse(cleaned);

  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error("Invalid response: questions array not found");
  }

  const actualCount = parsed.questions.length;

  if (actualCount > expectedCount) {
    console.warn(
      `LLM generated ${actualCount} questions, expected ${expectedCount}. Trimming excess.`
    );
    parsed.questions = parsed.questions.slice(0, expectedCount);
  }

  if (actualCount < expectedCount) {
    throw new Error(
      `LLM only generated ${actualCount} questions, expected ${expectedCount}. Retrying batch.`
    );
  }

  const withIds = {
    questions: parsed.questions.map((q: Question) => ({
      questionId: `question-${nanoid(16)}`,
      type: q.type,
      question: q.question,
      options: (q.options || []).map((o: Option) => ({
        optionId: `option-${nanoid(16)}`,
        option: o.option,
        explanation: o.explanation || "",
        isCorrect: o.isCorrect,
      })),
    })),
  };

  return QuizSchema.parse(withIds);
};

export { buildQuizPrompt, normalizeQuizResponse, getBatchConfig };
