export type SummaryRow = {
  totalAttempts: number;
  totalTodayAttempts: number;
  completedAttempts: number;
  completedAttemptsToday: number;
};

export type HistoryRow = {
  date: string;
  newAttempts: number;
  submittedAttempts: number;
};

export type AttemptListRow = {
  attemptId: string;
  userId: number;
  tutorialId: number;
  createdAt: Date;
  submittedAt: Date | null;
  totalQuestions: number;
  totalAnswered: number;
  correctAnswer: number;
};

export type OptionJSON = {
  optionId: string;
  option: string;
  reason: string;
  isCorrect: boolean;
  isSelected: boolean;
};

export type AttemptDetailQuestionRow = {
  questionId: string;
  question: string;
  type: string;
  isUserCorrect: boolean | null;
  options: OptionJSON[];
};

export type AttemptMetadataRow = {
  attemptId: string;
  userId: number;
  tutorialId: number;
  createdAt: Date;
  submittedAt: Date | null;
};
