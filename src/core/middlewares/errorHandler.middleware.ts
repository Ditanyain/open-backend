import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "@/shared/types/error.type";

const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    "status" in error
  );
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "fail",
      message: "Validation error",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (isApiError(err)) {
    const statusCode = err.statusCode ?? 500;

    return res.status(statusCode).json({
      status: err.status,
      message: err.message,
      details: err.details || undefined,
    });
  }

  console.error("UNEXPECTED ERROR:", err);

  return res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
};
