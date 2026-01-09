import { nanoid } from "nanoid";
import bcrypt from "bcrypt";

export const up = async (pgm) => {
  pgm.createType("admin_role", ["ADMIN", "SUPERUSER"]);

  pgm.createTable("administrators", {
    id: {
      type: "VARCHAR(50)",
      primaryKey: true,
    },
    name: {
      type: "VARCHAR(255)",
      notNull: true,
    },
    email: {
      type: "VARCHAR(255)",
      notNull: true,
      unique: true,
    },
    password: {
      type: "VARCHAR(255)",
      notNull: true,
    },
    role: {
      type: "admin_role",
      notNull: true,
      default: "ADMIN",
    },
    created_at: {
      type: "TIMESTAMP",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    updated_at: {
      type: "TIMESTAMP",
      notNull: false,
    },
  });

  pgm.createIndex("administrators", "email");

  // CREATE DEFAULT SUPERUSER ACCOUNT
  const administratorId = `administrator-${nanoid(16)}`;
  const defaultEmail = "superuser@email.com";
  const defaultPassword = "SuperSecretP@ssw0rd";

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(defaultPassword, salt);

  pgm.sql(`
    INSERT INTO administrators (id, name, email, password, role)
    VALUES (
      '${administratorId}', 
      'Superuser', 
      '${defaultEmail}', 
      '${hashedPassword}', 
      'SUPERUSER'
    );
  `);
};

export const down = (pgm) => {
  pgm.dropIndex("administrators", "email");
  pgm.dropTable("administrators");
  pgm.dropType("admin_role");
};
