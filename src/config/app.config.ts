const appConfig = {
  host: process.env.HOST || "localhost",
  port: Number(process.env.PORT) || 5000,
  cors: {
    origin: (() => {
      const origins = process.env.CORS_ORIGIN?.split(",")
        .map((o) => o.trim())
        .filter(Boolean);
      if (!origins || origins.length === 0) return "*";
      return origins.length === 1 ? origins[0] : origins;
    })(),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: false,
  },
};

export { appConfig };
