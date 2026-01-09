export type AttemptQuestionOptionBeforeAnswer = {
  optionId: string;
  option: string;
};

export type AttemptQuestionOptionWithFeedback = {
  optionId: string;
  option: string;
  isSelected: boolean;
  isCorrect: boolean;
  reason: string;
};

export type AttemptQuestion = {
  questionId: string;
  question: string;
  type: "SINGLE" | "MULTIPLE" | "BOOLEAN";
  isAnswered: boolean;
  isCorrect?: boolean;
  options: (
    | AttemptQuestionOptionBeforeAnswer
    | AttemptQuestionOptionWithFeedback
  )[];
};

export type AttemptWithProgress = {
  attemptId: string;
  userId: number;
  tutorialId: number;
  createdAt: Date;
  submittedAt: Date | null;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  questions: AttemptQuestion[];
};

export type AttemptOptionRow = {
  optionId: string;
  option: string;
  isCorrect: boolean;
  reason: string | null;
};

export type AttemptQueryRow = {
  attempt_id: string;
  user_id: number;
  tutorial_id: number;
  created_at: Date;
  submitted_at: Date | null;
  attempt_question_id: string;
  question_id: string;
  question: string;
  type: string;
  options: AttemptOptionRow[];
  selected_option_ids: string[] | null;
};
