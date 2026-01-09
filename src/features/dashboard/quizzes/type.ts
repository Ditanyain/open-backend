export type SummaryRow = {
  totalQuestions: number;
  totalTutorials: number;
};

export type QuestionListRow = {
  questionId: string;
  tutorialId: number;
  question: string;
  type: string;
  totalAttempt: number;
  createdAt: Date;
};

export type OptionJSON = {
  optionId: string;
  option: string;
  reason: string;
  isCorrect: boolean;
};

export type QuestionDetailRow = {
  questionId: string;
  tutorialId: number;
  question: string;
  type: string;
  createdAt: Date;
  totalAttempt: number;
  options: OptionJSON[];
};
