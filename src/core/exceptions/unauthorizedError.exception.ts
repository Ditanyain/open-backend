import { ApiError } from "@/shared/types/error.type";

export function unauthorizedError(
  message: string,
  details?: unknown
): ApiError {
  const error: ApiError = new Error(message);
  error.statusCode = 401;
  error.status = "fail";
  error.message = message;
  error.details = details;
  return error;
}
