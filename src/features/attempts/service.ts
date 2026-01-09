import { nanoid } from "nanoid";
import { pool } from "@/config/db.config";
import { clientError } from "@/core/exceptions/clientError.exception";
import { notFoundError } from "@/core/exceptions/notFoundError.exception";
import { mapToAttemptQuestion } from "./helper";
import type {
  AttemptQuestion,
  AttemptWithProgress,
  AttemptQueryRow,
  AttemptOptionRow,
} from "./type";

const getAttempts = async (userId: number, tutorialId: number) => {
  const result = await pool.query(
    `
    WITH attempt_question_summary AS (
      SELECT
        a.id AS attempt_id,
        a.tutorial_id,
        a.created_at,
        a.submitted_at,
        aq.id AS attempt_question_id,
        aq.question_id,
        COUNT(DISTINCT aqo.option_id) AS selected_options_count,
        COUNT(DISTINCT CASE WHEN qo.is_correct THEN aqo.option_id END) AS selected_correct_count,
        COUNT(DISTINCT CASE WHEN qo.is_correct = false THEN aqo.option_id END) AS selected_wrong_count
      FROM attempts a
      JOIN attempt_questions aq ON aq.attempt_id = a.id
      LEFT JOIN attempt_question_options aqo ON aqo.attempt_question_id = aq.id
      LEFT JOIN question_options qo ON qo.id = aqo.option_id
      WHERE a.user_id = $1
        AND a.tutorial_id = $2
      GROUP BY
        a.id,
        a.tutorial_id,
        a.created_at,
        a.submitted_at,
        aq.id,
        aq.question_id
    ),

    question_correct_option_counts AS (
      SELECT
        q.id AS question_id,
        COUNT(*) AS total_correct_options
      FROM questions q
      JOIN question_options qo ON qo.question_id = q.id
      WHERE qo.is_correct = true
      GROUP BY q.id
    ),

    attempt_question_with_flags AS (
      SELECT
        aqs.attempt_id,
        aqs.tutorial_id,
        aqs.created_at,
        aqs.submitted_at,
        aqs.attempt_question_id,
        aqs.selected_options_count,
        aqs.selected_correct_count,
        aqs.selected_wrong_count,
        qcc.total_correct_options,
        (aqs.selected_options_count > 0) AS is_answered,
        CASE
          WHEN aqs.selected_options_count > 0
           AND aqs.selected_correct_count = qcc.total_correct_options
           AND aqs.selected_wrong_count = 0
          THEN 1 ELSE 0
        END AS is_correct
      FROM attempt_question_summary aqs
      JOIN question_correct_option_counts qcc ON qcc.question_id = aqs.question_id
    )

    SELECT
      attempt_id,
      tutorial_id,
      created_at,
      submitted_at,
      COUNT(*) AS total_questions,
      SUM(CASE WHEN is_answered THEN 1 ELSE 0 END) AS answered_questions,
      SUM(is_correct) AS correct_answers
    FROM attempt_question_with_flags
    GROUP BY attempt_id, tutorial_id, created_at, submitted_at
    ORDER BY created_at DESC
    `,
    [userId, tutorialId]
  );

  return result.rows.map((row) => ({
    attemptId: row.attempt_id,
    tutorialId: row.tutorial_id,
    createdAt: row.created_at.toISOString(),
    submittedAt: row.submitted_at?.toISOString() || null,
    totalQuestions: Number(row.total_questions),
    answeredQuestions: Number(row.answered_questions),
    correctAnswers: Number(row.correct_answers || 0),
  }));
};

const getAttemptById = async (
  attemptId: string
): Promise<AttemptWithProgress | null> => {
  const result = await pool.query(
    `
    SELECT
      a.id AS attempt_id, a.user_id, a.tutorial_id, a.created_at, a.submitted_at,
      aq.id AS attempt_question_id, q.id AS question_id, q.question, q.type,
      json_agg(
        DISTINCT jsonb_build_object(
          'optionId', qo.id, 'option', qo.option, 'isCorrect', qo.is_correct, 'reason', qo.reason
        )
      ) AS options,
      COALESCE(
        json_agg(DISTINCT aqo.option_id) FILTER (WHERE aqo.option_id IS NOT NULL), '[]'::json
      ) AS selected_option_ids
    FROM attempts a
    JOIN attempt_questions aq ON aq.attempt_id = a.id
    JOIN questions q ON q.id = aq.question_id
    JOIN question_options qo ON qo.question_id = q.id
    LEFT JOIN attempt_question_options aqo ON aqo.attempt_question_id = aq.id
    WHERE a.id = $1
    GROUP BY a.id, a.user_id, a.tutorial_id, a.created_at, a.submitted_at, aq.id, q.id, q.question, q.type
    ORDER BY q.id
    `,
    [attemptId]
  );

  if (result.rows.length === 0) return null;

  const rows = result.rows as AttemptQueryRow[];

  const questions: AttemptQuestion[] = rows.map((row) => {
    const rawOptions = row.options as AttemptOptionRow[];
    const selectedOptionIds = Array.isArray(row.selected_option_ids)
      ? row.selected_option_ids
      : [];
    return mapToAttemptQuestion(row, rawOptions, selectedOptionIds);
  });

  const first = rows[0];
  return {
    attemptId: first.attempt_id,
    userId: first.user_id,
    tutorialId: first.tutorial_id,
    createdAt: first.created_at,
    submittedAt: first.submitted_at,
    totalQuestions: questions.length,
    answeredQuestions: questions.filter((q) => q.isAnswered).length,
    correctAnswers: questions.filter((q) => q.isAnswered && q.isCorrect).length,
    questions,
  };
};

const submitAnswer = async ({
  attemptId,
  questionId,
  selectedOptionIds,
}: {
  attemptId: string;
  questionId: string;
  selectedOptionIds: string[];
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const aqResult = await client.query(
      `SELECT id FROM attempt_questions WHERE attempt_id = $1 AND question_id = $2 FOR UPDATE`,
      [attemptId, questionId]
    );

    if (aqResult.rows.length === 0)
      throw clientError("Attempt question not found");
    const attemptQuestionId = aqResult.rows[0].id;

    const existingCheck = await client.query(
      `SELECT 1 FROM attempt_question_options WHERE attempt_question_id = $1 LIMIT 1`,
      [attemptQuestionId]
    );

    if ((existingCheck.rowCount ?? 0) > 0) {
      throw clientError("This question has already been answered");
    }

    if (selectedOptionIds.length > 0) {
      const validOptions = await client.query(
        `SELECT id FROM question_options WHERE question_id = $1 AND id = ANY($2::text[])`,
        [questionId, selectedOptionIds]
      );
      if (validOptions.rowCount !== selectedOptionIds.length) {
        throw clientError("Invalid options provided for this question");
      }

      const optionIds = selectedOptionIds;
      const aqOptionIds = selectedOptionIds.map(
        () => `attempt-option-${nanoid(16)}`
      );

      await client.query(
        `
        INSERT INTO attempt_question_options (id, attempt_question_id, option_id)
        SELECT unnest($1::text[]), $2, unnest($3::text[])
        `,
        [aqOptionIds, attemptQuestionId, optionIds]
      );
    }

    await client.query("COMMIT");

    const qResult = await pool.query(
      `
      SELECT
        q.id AS question_id, q.question, q.type,
        json_agg(DISTINCT jsonb_build_object(
          'optionId', qo.id, 'option', qo.option, 'isCorrect', qo.is_correct, 'reason', qo.reason
        )) AS options,
        COALESCE(json_agg(DISTINCT aqo.option_id) FILTER (WHERE aqo.option_id IS NOT NULL), '[]'::json) AS selected_option_ids
      FROM attempt_questions aq
      JOIN questions q ON q.id = aq.question_id
      JOIN question_options qo ON qo.question_id = q.id
      LEFT JOIN attempt_question_options aqo ON aqo.attempt_question_id = aq.id
      WHERE aq.id = $1
      GROUP BY q.id
      `,
      [attemptQuestionId]
    );

    const row = qResult.rows[0];
    return mapToAttemptQuestion(
      row,
      row.options,
      row.selected_option_ids || []
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const submitAttempt = async (attemptId: string) => {
  const unanswered = await pool.query(
    `
    SELECT 1 
    FROM attempt_questions aq
    LEFT JOIN attempt_question_options aqo ON aqo.attempt_question_id = aq.id
    WHERE aq.attempt_id = $1 AND aqo.option_id IS NULL
    LIMIT 1
    `,
    [attemptId]
  );

  if ((unanswered.rowCount ?? 0) > 0) {
    throw clientError("All questions must be answered before submit attempt");
  }

  const result = await pool.query(
    `
    UPDATE attempts
    SET submitted_at = NOW()
    WHERE id = $1 AND submitted_at IS NULL
    RETURNING id, tutorial_id, user_id, submitted_at
    `,
    [attemptId]
  );

  if (result.rowCount === 0) {
    throw notFoundError("Attempt not found or already submitted");
  }

  const row = result.rows[0];

  return {
    attemptId: row.id,
    userId: row.user_id,
    tutorialId: row.tutorial_id,
    submittedAt: row.submitted_at.toISOString(),
  };
};

export { getAttempts, getAttemptById, submitAnswer, submitAttempt };
