import type { AttemptQuestion, AttemptOptionRow } from "./type";

interface QuestionRowInput {
  question_id: string;
  question: string;
  type: string;
}

export const mapToAttemptQuestion = (
  row: QuestionRowInput,
  rawOptions: AttemptOptionRow[],
  selectedOptionIds: string[]
): AttemptQuestion => {
  const isAnswered = selectedOptionIds.length > 0;

  const correctOptionIds = rawOptions
    .filter((o) => o.isCorrect)
    .map((o) => o.optionId)
    .sort();

  const selectedSorted = [...selectedOptionIds].sort();

  const isCorrect =
    isAnswered &&
    correctOptionIds.length > 0 &&
    correctOptionIds.length === selectedSorted.length &&
    correctOptionIds.every((id, idx) => id === selectedSorted[idx]);

  const options = rawOptions.map((o) => {
    const base = { optionId: o.optionId, option: o.option };
    if (!isAnswered) return base;

    return {
      ...base,
      isSelected: selectedOptionIds.includes(o.optionId),
      isCorrect: Boolean(o.isCorrect),
      reason: o.reason ?? "",
    };
  });

  const question: AttemptQuestion = {
    questionId: row.question_id,
    question: row.question,
    type: row.type.toUpperCase() as AttemptQuestion["type"],
    isAnswered,
    options,
  };

  if (isAnswered) {
    question.isCorrect = isCorrect;
  }

  return question;
};
