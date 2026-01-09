import { nanoid } from "nanoid";
import { pool } from "@/config/db.config";

const LEASE_SECONDS = 120;

const acquireQuizGenerationLock = async (tutorialId: number) => {
  const id = `generate-${nanoid(16)}`;

  const result = await pool.query(
    `
    WITH active AS (
      SELECT 1
      FROM quiz_generations
      WHERE tutorial_id = $1
        AND status = 'PROCESSING'::quiz_generation_status
        AND lock_until > NOW()
      LIMIT 1
    )
    INSERT INTO quiz_generations (
      id, tutorial_id, completed_batches, total_batches, status, lock_until, created_at, updated_at
    )
    SELECT
      $2, $1, 0, 0, 'PROCESSING'::quiz_generation_status,
      NOW() + ($3 || ' seconds')::interval,
      NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM active)
    RETURNING id, tutorial_id, lock_until
    `,
    [tutorialId, id, LEASE_SECONDS]
  );

  return result.rows[0] ?? null;
};

const refreshLease = async (generationId: string) => {
  await pool.query(
    `
    UPDATE quiz_generations
    SET lock_until = NOW() + ($2 || ' seconds')::interval,
        updated_at = NOW()
    WHERE id = $1
      AND status = 'PROCESSING'::quiz_generation_status
    `,
    [generationId, LEASE_SECONDS]
  );
};

const markBatchProgress = async (
  generationId: string,
  completedBatch: number,
  totalBatches: number
) => {
  await pool.query(
    `
    UPDATE quiz_generations
    SET completed_batches = $2,
        total_batches = $3,
        lock_until = NOW() + ($4 || ' seconds')::interval,
        updated_at = NOW()
    WHERE id = $1
      AND status = 'PROCESSING'::quiz_generation_status
    `,
    [generationId, completedBatch, totalBatches, LEASE_SECONDS]
  );
};

const markQuizGenerationDone = async (generationId: string) => {
  await pool.query(
    `
    UPDATE quiz_generations
    SET status = 'DONE'::quiz_generation_status,
        lock_until = NOW(), -- release cepat
        updated_at = NOW()
    WHERE id = $1
      AND status = 'PROCESSING'::quiz_generation_status
    `,
    [generationId]
  );
};

const getBatchProgress = async (tutorialId: number) => {
  const result = await pool.query(
    `
    SELECT completed_batches, total_batches, status
    FROM quiz_generations
    WHERE tutorial_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [tutorialId]
  );

  return result.rows[0] || null;
};

export {
  acquireQuizGenerationLock,
  refreshLease,
  markQuizGenerationDone,
  markBatchProgress,
  getBatchProgress,
};
