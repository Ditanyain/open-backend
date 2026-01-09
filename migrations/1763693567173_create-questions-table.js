export const up = (pgm) => {
  pgm.createType("question_type", ["SINGLE", "MULTIPLE", "BOOLEAN"]);

  pgm.createTable("questions", {
    id: {
      type: "VARCHAR(50)",
      primaryKey: true,
    },
    tutorial_id: {
      type: "INTEGER",
      notNull: true,
    },
    question: {
      type: "VARCHAR(1024)",
      notNull: true,
    },
    type: {
      type: "question_type",
      notNull: true,
    },
    created_at: {
      type: "TIMESTAMP",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.createIndex("questions", "tutorial_id");
};

export const down = (pgm) => {
  pgm.dropTable("questions");
  pgm.dropType("question_type");
};
