export interface ApiError extends Error {
  statusCode?: number;
  status?: string;
  details?: unknown;
  response?: {
    status?: number;
    data?: { message?: string };
  };
}
