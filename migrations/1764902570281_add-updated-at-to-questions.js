export const up = (pgm) => {
  pgm.addColumn("questions", {
    updated_at: {
      type: "TIMESTAMP",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("questions", "updated_at");
};