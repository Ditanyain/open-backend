import { pool } from "@/config/db.config";

const createSession = async (
  administratorId: string,
  sessionId: string,
  refreshToken: string,
  userAgent?: string,
  ipAddress?: string
) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await pool.query(
    `INSERT INTO authentications (id, administrator_id, refresh_token, user_agent, ip_address, expired_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [sessionId, administratorId, refreshToken, userAgent, ipAddress, expiresAt]
  );

  return sessionId;
};

const verifySession = async (refreshToken: string) => {
  const result = await pool.query(
    `SELECT * FROM authentications 
     WHERE refresh_token = $1 AND expired_at > NOW()`,
    [refreshToken]
  );
  return result.rows[0];
};

const deleteSession = async (refreshToken: string) => {
  await pool.query(`DELETE FROM authentications WHERE refresh_token = $1`, [
    refreshToken,
  ]);
};

const getAllSessions = async (administratorId: string) => {
  const result = await pool.query(
    `
    SELECT 
      id,
      administrator_id,
      refresh_token,
      user_agent,
      ip_address,
      created_at,
      expired_at
    FROM authentications
    WHERE administrator_id = $1
      AND expired_at > NOW()
    ORDER BY created_at DESC
    `,
    [administratorId]
  );

  return result.rows;
};

const deleteAllSessionsExcept = async (
  administratorId: string,
  exceptSessionId: string
) => {
  await pool.query(
    `
    DELETE FROM authentications
    WHERE administrator_id = $1
      AND id <> $2
    `,
    [administratorId, exceptSessionId]
  );
};

export {
  createSession,
  verifySession,
  deleteSession,
  getAllSessions,
  deleteAllSessionsExcept,
};
