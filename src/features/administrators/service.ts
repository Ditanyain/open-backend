import { nanoid } from "nanoid";
import { pool } from "@/config/db.config";

const addAdministrator = async ({
  name,
  email,
  password,
  role = "ADMIN",
}: {
  name: string;
  email: string;
  password: string;
  role: "SUPERUSER" | "ADMIN";
}) => {
  const administratorId = `administrator-${nanoid(16)}`;

  const result = await pool.query(
    `INSERT INTO administrators (id, name, email, password, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, created_at`,
    [administratorId, name, email, password, role]
  );

  const admin = result.rows[0];

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    createdAt: admin.created_at,
  };
};

const getAdministrators = async () => {
  const result = await pool.query(
    "SELECT id, name, email, role, created_at FROM administrators"
  );

  return result.rows.map(({ created_at, ...rest }) => ({
    ...rest,
    createdAt: created_at,
  }));
};

const getAdministratorByEmail = async (email: string) => {
  const result = await pool.query(
    `SELECT * FROM administrators WHERE email = $1`,
    [email]
  );

  return result.rows[0];
};

const getAdministratorById = async (id: string) => {
  const result = await pool.query(
    `SELECT * FROM administrators WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

const putAdministratorByPassword = async (
  administratorId: string,
  newHashedPassword: string
) => {
  await pool.query(
    `UPDATE administrators 
     SET password = $1
     WHERE id = $2`,
    [newHashedPassword, administratorId]
  );

  return true;
};

const putAdministratorByName = async (
  administratorId: string,
  newName: string
) => {
  await pool.query(
    `UPDATE administrators 
     SET name = $1
     WHERE id = $2`,
    [newName, administratorId]
  );

  return true;
};

const putAdministratorByEmail = async (
  administratorId: string,
  newEmail: string
) => {
  await pool.query(
    `UPDATE administrators 
     SET email = $1
     WHERE id = $2`,
    [newEmail, administratorId]
  );
  return true;
};

const deleteAdministrator = async (administratorId: string) => {
  await pool.query(`DELETE FROM administrators WHERE id = $1`, [
    administratorId,
  ]);

  return true;
};

export {
  addAdministrator,
  getAdministratorByEmail,
  getAdministratorById,
  getAdministrators,
  putAdministratorByPassword,
  putAdministratorByName,
  putAdministratorByEmail,
  deleteAdministrator,
};
