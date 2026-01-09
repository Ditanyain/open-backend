export const up = (pgm) => {
  pgm.createTable("authentications", {
    id: {
      type: "VARCHAR(50)",
      primaryKey: true,
    },
    administrator_id: {
      type: "VARCHAR(50)",
      notNull: true,
      references: '"administrators"',
      onDelete: "CASCADE",
    },
    refresh_token: {
      type: "TEXT",
      notNull: true,
    },
    user_agent: {
      type: "TEXT",
      notNull: false,
    },
    ip_address: {
      type: "VARCHAR(45)",
      notNull: false,
    },
    created_at: {
      type: "TIMESTAMP",
      default: pgm.func("NOW()"),
    },
    expired_at: {
      type: "TIMESTAMP",
    },
  });

  pgm.createIndex("authentications", "administrator_id");
};

export const down = (pgm) => {
  pgm.dropTable("authentications");
};
