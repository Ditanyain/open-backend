import { pool } from "@/config/db.config";
import { notFoundError } from "@/core/exceptions/notFoundError.exception";
import type { SummaryRow, QuestionListRow, QuestionDetailRow } from "./type";

const getQuestionsSummary = async () => {
  const result = await pool.query<SummaryRow>(`
    SELECT
      (SELECT COUNT(*) FROM questions)::int AS "totalQuestions",
      (SELECT COUNT(DISTINCT tutorial_id) FROM questions)::int AS "totalTutorials"
  `);

  return result.rows[0];
};

const getAllQuestions = async (
  page: number,
  limit: number,
  tutorialId?: number
) => {
  const offset = (page - 1) * limit;
  const conditions: string[] = ["1=1"];
  const params: (string | number)[] = [];

  if (tutorialId) {
    params.push(tutorialId);
    conditions.push(`q.tutorial_id = $${params.length}`);
  }

  const whereClause = conditions.join(" AND ");

  const countQuery = `
    SELECT COUNT(*)::int AS total FROM questions q WHERE ${whereClause.replace(
      "q.",
      ""
    )}
  `;
  const countResult = await pool.query<{ total: number }>(countQuery, params);
  const totalItems = countResult.rows[0].total;
  const totalPages = Math.ceil(totalItems / limit);

  const query = `
    SELECT 
      q.id AS "questionId",
      q.tutorial_id AS "tutorialId",
      q.question,
      q.type,
      q.created_at AS "createdAt",
      (SELECT COUNT(*) FROM attempt_questions aq WHERE aq.question_id = q.id)::int AS "totalAttempt"
    FROM questions q
    WHERE ${whereClause}
    ORDER BY q.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const result = await pool.query<QuestionListRow>(query, [
    ...params,
    limit,
    offset,
  ]);

  return {
    meta: { page, limit, totalItems, totalPages },
    data: result.rows,
  };
};

const getQuestionDetails = async (questionId: string) => {
  const query = `
    SELECT 
      q.id AS "questionId",
      q.tutorial_id AS "tutorialId",
      q.question,
      q.type,
      q.created_at AS "createdAt",
      (SELECT COUNT(*) FROM attempt_questions aq WHERE aq.question_id = q.id)::int AS "totalAttempt",
      COALESCE(
        json_agg(
          json_build_object(
            'optionId', qo.id,
            'option', qo.option,
            'reason', qo.reason,
            'isCorrect', qo.is_correct
          )
        ) FILTER (WHERE qo.id IS NOT NULL), 
        '[]'::json
      ) AS options
    FROM questions q
    LEFT JOIN question_options qo ON qo.question_id = q.id
    WHERE q.id = $1
    GROUP BY q.id
  `;

  const result = await pool.query<QuestionDetailRow>(query, [questionId]);

  if (result.rows.length === 0) {
    throw notFoundError("Question not found");
  }

  return result.rows[0];
};

const deleteQuestion = async (questionId: string) => {
  const result = await pool.query(
    "DELETE FROM questions WHERE id = $1 RETURNING id",
    [questionId]
  );

  if (result.rowCount === 0) {
    throw notFoundError("Question not found");
  }

  return true;
};

const getQuizGenerations = async ({
  page = 1,
  limit = 10,
  tutorialId,
}: {
  page: number;
  limit: number;
  tutorialId?: number;
}) => {
  const offset = (page - 1) * limit;

  const queryParams: unknown[] = [];
  const whereClauses: string[] = [];

  if (tutorialId) {
    whereClauses.push(`tutorial_id = $${queryParams.length + 1}`);
    queryParams.push(tutorialId);
  }

  const whereString =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const dataParams = [...queryParams, limit, offset];

  const dataQuery = `
    SELECT id, tutorial_id, completed_batches, total_batches, status, lock_until, created_at, updated_at
    FROM quiz_generations
    ${whereString}
    ORDER BY created_at DESC
    LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM quiz_generations
    ${whereString}
  `;

  const [dataResult, countResult] = await Promise.all([
    pool.query(dataQuery, dataParams),
    pool.query(countQuery, queryParams),
  ]);

  const totalItems = parseInt(countResult.rows[0]?.total || "0");

  return {
    data: dataResult.rows,
    meta: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

export {
  getQuestionsSummary,
  getAllQuestions,
  getQuestionDetails,
  deleteQuestion,
  getQuizGenerations,
};
