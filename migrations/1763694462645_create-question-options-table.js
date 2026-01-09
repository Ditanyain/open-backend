export const up = (pgm) => {
  pgm.createTable("question_options", {
    id: {
      type: "VARCHAR(50)",
      primaryKey: true,
    },
    question_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: "questions(id)",
      onDelete: "CASCADE",
    },
    option: {
      type: "VARCHAR(1024)",
      notNull: true,
    },
    reason: {
      type: "VARCHAR(2048)",
      notNull: true,
    },
    is_correct: {
      type: "BOOLEAN",
      notNull: true,
    },
  });
};

export const down = (pgm) => {
  pgm.dropTable("question_options");
};
