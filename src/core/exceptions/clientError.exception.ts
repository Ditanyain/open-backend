import { ApiError } from "@/shared/types/error.type";

export function clientError(message: string, details?: unknown): ApiError {
  const error: ApiError = new Error(message);
  error.statusCode = 400;
  error.status = "fail";
  error.message = message;
  error.details = details;
  return error;
}
