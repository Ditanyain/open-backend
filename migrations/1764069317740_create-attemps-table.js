export const up = (pgm) => {
  pgm.createTable("attempts", {
    id: {
      type: "VARCHAR(50)",
      primaryKey: true,
    },
    user_id: {
      type: "INTEGER",
      notNull: true,
    },
    tutorial_id: {
      type: "INTEGER",
      notNull: true,
    },
    created_at: {
      type: "TIMESTAMP",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    submitted_at: {
      type: "TIMESTAMP",
      notNull: false,
    },
  });

  pgm.createIndex("attempts", "user_id");
  pgm.createIndex("attempts", "tutorial_id");

  pgm.createTable("attempt_questions", {
    id: {
      type: "VARCHAR(50)",
      primaryKey: true,
    },
    attempt_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "attempts(id)",
      onDelete: "CASCADE",
    },
    question_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "questions(id)",
      onDelete: "CASCADE",
    },
  });

  pgm.addConstraint("attempt_questions", "uq_attempt_question_unique", {
    unique: ["attempt_id", "question_id"],
  });

  pgm.createTable("attempt_question_options", {
    id: {
      type: "VARCHAR(50)",
      primaryKey: true,
    },
    attempt_question_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "attempt_questions(id)",
      onDelete: "CASCADE",
    },
    option_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "question_options(id)",
      onDelete: "CASCADE",
    },
  });

  pgm.addConstraint(
    "attempt_question_options",
    "uq_attempt_question_option_unique",
    {
      unique: ["attempt_question_id", "option_id"],
    }
  );
};

export const down = (pgm) => {
  pgm.dropTable("attempt_question_options");
  pgm.dropTable("attempt_questions");
  pgm.dropTable("attempts");
};
