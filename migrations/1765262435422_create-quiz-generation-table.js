export const up = (pgm) => {
  pgm.createType("quiz_generation_status", ["PROCESSING", "DONE"]);

  pgm.createTable("quiz_generations", {
    id: {
      type: "VARCHAR(50)",
      primaryKey: true,
    },
    tutorial_id: {
      type: "integer",
      notNull: true,
    },
    completed_batches: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    total_batches: {
      type: "integer",
      notNull: true,
    },
    status: {
      type: "quiz_generation_status",
      notNull: true,
      default: "PROCESSING",
    },
    lock_until: {
      type: "timestamp",
      notNull: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.addIndex("quiz_generations", ["tutorial_id", "status", "lock_until"], {
    name: "idx_quiz_generations_lock_lookup",
  });

  pgm.addIndex("quiz_generations", ["tutorial_id", "created_at"], {
    name: "idx_quiz_generations_tutorial_created_at",
  });
};

export const down = (pgm) => {
  pgm.dropIndex("quiz_generations", ["tutorial_id", "created_at"], {
    name: "idx_quiz_generations_tutorial_created_at",
  });
  pgm.dropIndex("quiz_generations", ["tutorial_id", "status", "lock_until"], {
    name: "idx_quiz_generations_lock_lookup",
  });

  pgm.dropTable("quiz_generations");
  pgm.dropType("quiz_generation_status");
};
