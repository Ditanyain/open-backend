import { Request, Response, NextFunction } from "express";
import { unauthorizedError } from "../exceptions/unauthorizedError.exception";
import { forbiddenError } from "../exceptions/forbiddenError.exception";
import { verifyAccessToken, UserPayload } from "@/shared/utils/jwt";

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    throw unauthorizedError("Access denied. Authentication token is missing.");
  }

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    throw forbiddenError("Invalid or expired authentication token.");
  }

  (req as AuthenticatedRequest).user = decoded;

  next();
};

export const requireRole = (allowedRoles: ("SUPERUSER" | "ADMIN")[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      throw unauthorizedError(
        "User context is missing. Please authenticate first."
      );
    }

    if (!allowedRoles.includes(user.role)) {
      throw forbiddenError(
        "Access denied. You do not have permission to access this resource."
      );
    }

    next();
  };
};
