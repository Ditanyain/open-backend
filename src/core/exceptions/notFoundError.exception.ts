import { ApiError } from "@/shared/types/error.type";

export function notFoundError(message: string, details?: unknown): ApiError {
  const error: ApiError = new Error(message);
  error.statusCode = 404;
  error.status = "fail";
  error.message = message;
  error.details = details;
  return error;
}
