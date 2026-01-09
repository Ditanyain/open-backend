export type QuestionType = "SINGLE" | "MULTIPLE" | "BOOLEAN";

export type QuestionId = string;
export type QuestionOptionId = string;
export type TutorialId = number;

export interface QuestionOption {
  optionId: QuestionOptionId;
  option: string;
  reason?: string;
  isCorrect?: boolean;
  isSelected?: boolean;
}

export interface Question {
  questionId: QuestionId;
  tutorialId: TutorialId;
  question: string;
  type: QuestionType;
  createdAt: Date | string;
}

export interface QuestionWithOptions<
  TOption extends QuestionOption = QuestionOption
> extends Question {
  options: TOption[];
}
