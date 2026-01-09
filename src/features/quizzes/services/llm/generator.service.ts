import { client, llmConfig } from "@/config/llm.config";
import {
  buildQuizPrompt,
  normalizeQuizResponse,
} from "@/features/quizzes/helper";

const generateQuizBatch = async (
  material: string,
  questionCount: number,
  batchNumber: number,
  existingQuestions: string[] = []
) => {
  const { systemPrompt, userPrompt } = buildQuizPrompt(
    material,
    questionCount,
    batchNumber,
    existingQuestions
  );

  const completion = await client.chat.completions.create({
    model: llmConfig.model,
    temperature: llmConfig.temperature,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const rawResponse = completion.choices[0].message?.content ?? "";

  return normalizeQuizResponse(rawResponse, questionCount);
};

export { generateQuizBatch };
