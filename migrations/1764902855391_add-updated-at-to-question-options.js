export const up = (pgm) => {
  pgm.addColumn("question_options", {
    updated_at: {
      type: "TIMESTAMP",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("question_options", "updated_at");
};
