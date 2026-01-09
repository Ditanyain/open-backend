import { nanoid } from "nanoid";
import { pool } from "@/config/db.config";
import { notFoundError } from "@/core/exceptions/notFoundError.exception";
import type { QuestionOption } from "@/shared/types/quiz.type";
import { sendMessage } from "@/shared/services/producer.service";

const addQuestion = async (
  id: string,
  tutorial_id: number,
  question: string,
  type: string
) => {
  const client = await pool.query(
    "INSERT INTO questions (id, tutorial_id, question, type) VALUES ($1, $2, $3, $4) RETURNING *",
    [id, tutorial_id, question, type]
  );

  return client.rows[0];
};

const addOption = async (
  id: string,
  question_id: string,
  option: string,
  reason: string,
  is_correct: boolean
) => {
  const client = await pool.query(
    "INSERT INTO question_options (id, question_id, option, reason, is_correct) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [id, question_id, option, reason, is_correct]
  );

  return client.rows[0];
};

const getQuestions = async (tutorialId: number, userId: number) => {
  const questions = await pool.query(
    `
    SELECT 
      q.id AS question_id,
      q.question,
      q.type,
      json_agg(
        json_build_object(
          'optionId', o.id,
          'option', o.option
        )
      ) AS question_options
    FROM questions q
    LEFT JOIN question_options o ON o.question_id = q.id
    WHERE q.tutorial_id = $1
    GROUP BY q.id
    ORDER BY RANDOM()
    LIMIT 3
  `,
    [tutorialId]
  );

  if (questions.rows.length === 0) {
    const message = { tutorialId };
    await sendMessage(JSON.stringify(message));
    throw notFoundError(
      "No questions available for this tutorial. Quiz generation has been requested."
    );
  }

  const attemptId = `attempt-${nanoid(16)}`;
  await pool.query(
    `INSERT INTO attempts (id, user_id, tutorial_id) VALUES ($1, $2, $3)`,
    [attemptId, userId, tutorialId]
  );

  for (const question of questions.rows) {
    const attemptQuestionId = `attempt-question-${nanoid(16)}`;
    await pool.query(
      `INSERT INTO attempt_questions (id, attempt_id, question_id) VALUES ($1, $2, $3)`,
      [attemptQuestionId, attemptId, question.question_id]
    );
  }

  return {
    attemptId,
    tutorialId,
    questions: questions.rows.map((question) => ({
      questionId: question.question_id,
      question: question.question,
      type: question.type,
      options: question.question_options.map((option: QuestionOption) => ({
        optionId: option.optionId,
        option: option.option,
      })),
    })),
  };
};

const isDuplicateQuestion = async (
  tutorialId: number,
  questionText: string
): Promise<boolean> => {
  const result = await pool.query(
    `
    SELECT COUNT(*) as count
    FROM questions
    WHERE tutorial_id = $1 AND question = $2
    `,
    [tutorialId, questionText]
  );

  return parseInt(result.rows[0].count) > 0;
};

const getExistingQuestions = async (tutorialId: number): Promise<string[]> => {
  const result = await pool.query(
    `
    SELECT question
    FROM questions
    WHERE tutorial_id = $1
    ORDER BY id
    `,
    [tutorialId]
  );

  return result.rows.map((row) => row.question);
};

const hasQuestionsForTutorial = async (tutorialId: number) => {
  const client = await pool.query(
    `
    SELECT EXISTS(
      SELECT 1
      FROM questions
      WHERE tutorial_id = $1
    ) AS has_questions
    `,
    [tutorialId]
  );

  return client.rows[0]?.has_questions as boolean;
};

export {
  addQuestion,
  addOption,
  getQuestions,
  hasQuestionsForTutorial,
  isDuplicateQuestion,
  getExistingQuestions,
};
