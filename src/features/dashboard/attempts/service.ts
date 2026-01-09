import { pool } from "@/config/db.config";
import { notFoundError } from "@/core/exceptions/notFoundError.exception";
import type {
  SummaryRow,
  HistoryRow,
  AttemptListRow,
  AttemptDetailQuestionRow,
  AttemptMetadataRow,
} from "./type";

const getAttemptsSummary = async () => {
  const result = await pool.query<SummaryRow>(`
    SELECT
      COUNT(id)::int AS "totalAttempts",
      COUNT(id) FILTER (WHERE created_at::date = CURRENT_DATE)::int AS "totalTodayAttempts",
      COUNT(id) FILTER (WHERE submitted_at IS NOT NULL)::int AS "completedAttempts",
      COUNT(id) FILTER (WHERE submitted_at IS NOT NULL AND submitted_at::date = CURRENT_DATE)::int AS "completedAttemptsToday"
    FROM attempts
  `);

  return result.rows[0];
};

const getAttemptsHistory = async (days: number) => {
  const query = `
    WITH date_series AS (
      SELECT generate_series(
        CURRENT_DATE - ($1 || ' days')::interval,
        CURRENT_DATE,
        '1 day'::interval
      )::date AS day
    )
    SELECT
      to_char(ds.day, 'YYYY-MM-DD') AS date,
      COUNT(a.created_at) FILTER (WHERE a.created_at IS NOT NULL)::int AS "newAttempts",
      COUNT(a.submitted_at) FILTER (WHERE a.submitted_at IS NOT NULL)::int AS "submittedAttempts"
    FROM date_series ds
    LEFT JOIN attempts a ON a.created_at::date = ds.day
    GROUP BY ds.day
    ORDER BY ds.day ASC;
  `;

  const result = await pool.query<HistoryRow>(query, [days - 1]);
  return result.rows;
};

const getAttemptsList = async (
  page: number,
  limit: number,
  tutorialId?: number,
  userId?: number,
  status: "all" | "submitted" | "unsubmitted" = "all"
) => {
  const offset = (page - 1) * limit;
  const conditions: string[] = ["1=1"];

  const params: (string | number)[] = [];

  if (tutorialId) {
    params.push(tutorialId);
    conditions.push(`a.tutorial_id = $${params.length}`);
  }

  if (userId) {
    params.push(userId);
    conditions.push(`a.user_id = $${params.length}`);
  }

  if (status === "submitted") {
    conditions.push(`a.submitted_at IS NOT NULL`);
  } else if (status === "unsubmitted") {
    conditions.push(`a.submitted_at IS NULL`);
  }

  const whereClause = conditions.join(" AND ");

  const countResult = await pool.query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM attempts a WHERE ${whereClause.replace(
      "a.",
      ""
    )}`,
    params
  );
  const totalItems = countResult.rows[0].total;
  const totalPages = Math.ceil(totalItems / limit);

  const query = `
    SELECT
      a.id AS "attemptId",
      a.user_id AS "userId",
      a.tutorial_id AS "tutorialId",
      a.created_at AS "createdAt",
      a.submitted_at AS "submittedAt",
      (SELECT COUNT(*) FROM attempt_questions aq WHERE aq.attempt_id = a.id)::int AS "totalQuestions",
      (
        SELECT COUNT(DISTINCT aqo.attempt_question_id)
        FROM attempt_questions aq
        JOIN attempt_question_options aqo ON aqo.attempt_question_id = aq.id
        WHERE aq.attempt_id = a.id
      )::int AS "totalAnswered",
      (
        SELECT COUNT(DISTINCT aq.id)
        FROM attempt_questions aq
        JOIN attempt_question_options aqo ON aqo.attempt_question_id = aq.id
        JOIN question_options qo ON qo.id = aqo.option_id
        WHERE aq.attempt_id = a.id AND qo.is_correct = TRUE
      )::int AS "correctAnswer"
    FROM attempts a
    WHERE ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const result = await pool.query<AttemptListRow>(query, [
    ...params,
    limit,
    offset,
  ]);

  return {
    data: result.rows,
    meta: { page, limit, totalItems, totalPages },
  };
};

const getAttemptDetails = async (attemptId: string) => {
  const attemptResult = await pool.query<AttemptMetadataRow>(
    `SELECT 
      id AS "attemptId", user_id AS "userId", tutorial_id AS "tutorialId", 
      created_at AS "createdAt", submitted_at AS "submittedAt"
     FROM attempts WHERE id = $1`,
    [attemptId]
  );

  if (attemptResult.rows.length === 0) throw notFoundError("Attempt not found");
  const attempt = attemptResult.rows[0];

  const detailsQuery = `
    SELECT
      q.id AS "questionId",
      q.question,
      q.type,
      json_agg(
        json_build_object(
          'optionId', qo.id,
          'option', qo.option,
          'reason', qo.reason,
          'isCorrect', qo.is_correct,
          'isSelected', (aqo.option_id IS NOT NULL)
        ) ORDER BY qo.id
      ) AS options
    FROM attempt_questions aq
    JOIN questions q ON q.id = aq.question_id
    JOIN question_options qo ON qo.question_id = q.id
    LEFT JOIN attempt_question_options aqo 
      ON aqo.attempt_question_id = aq.id AND aqo.option_id = qo.id
    WHERE aq.attempt_id = $1
    GROUP BY q.id
    ORDER BY q.id;
  `;

  const detailsResult = await pool.query<AttemptDetailQuestionRow>(
    detailsQuery,
    [attemptId]
  );
  const questions = detailsResult.rows;
  const totalQuestions = questions.length;

  const totalAnswered = questions.filter((q) =>
    q.options.some((opt) => opt.isSelected)
  ).length;

  const correctAnswer = questions.filter((q) => {
    const selected = q.options.filter((o) => o.isSelected);
    const correct = q.options.filter((o) => o.isCorrect);

    return (
      selected.length > 0 &&
      selected.length === correct.length &&
      selected.every((s) => s.isCorrect)
    );
  }).length;

  return {
    ...attempt,
    summary: {
      totalQuestions,
      totalAnswered,
      correctAnswer,
    },
    questions,
  };
};

export {
  getAttemptsSummary,
  getAttemptsHistory,
  getAttemptsList,
  getAttemptDetails,
};
