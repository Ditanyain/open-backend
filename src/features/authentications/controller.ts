import { Request, Response } from "express";
import { nanoid } from "nanoid";

import {
  deleteAuthenticationBodySchema,
  deleteOtherSessionsBodySchema,
  postAuthenticationBodySchema,
  putAuthenticationBodySchema,
} from "./validator";
import {
  createSession,
  deleteAllSessionsExcept,
  deleteSession,
  getAllSessions,
  verifySession,
} from "./service";

import {
  getAdministratorByEmail,
  getAdministratorById,
} from "@/features/administrators/service";
import { unauthorizedError } from "@/core/exceptions/unauthorizedError.exception";
import { comparePassword } from "@/shared/utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "@/shared/utils/jwt";
import { AuthenticatedRequest } from "@/core/middlewares/auth.middleware";
import { getIpLocation } from "@/shared/utils/ip";
import { parseUserAgent } from "@/shared/utils/userAgent";

const postAuthenticationHandler = async (req: Request, res: Response) => {
  const { email, password } = postAuthenticationBodySchema.parse(req.body);
  const userAgent = req.headers["user-agent"];
  const ipAddress =
    (req.headers["cf-connecting-ip"] as string | undefined) ??
    (req.headers["x-real-ip"] as string | undefined) ??
    (typeof req.headers["x-forwarded-for"] === "string"
      ? req.headers["x-forwarded-for"].split(",")[0].trim()
      : undefined) ??
    req.ip;

  const admin = await getAdministratorByEmail(email);
  if (!admin) {
    throw unauthorizedError("Email or password not match");
  }

  const isMatch = await comparePassword(password, admin.password);
  if (!isMatch) {
    throw unauthorizedError("Email or password not match");
  }

  const sessionId = `session-${nanoid(16)}`;

  const accessToken = generateAccessToken({
    administratorId: admin.id,
    sessionId: sessionId,
    role: admin.role,
  });
  const refreshToken = generateRefreshToken({
    administratorId: admin.id,
    sessionId: sessionId,
    role: admin.role,
  });

  await createSession(admin.id, sessionId, refreshToken, userAgent, ipAddress);

  res.status(200).json({
    status: "success",
    data: {
      accessToken,
      refreshToken,
    },
  });
};

const getAuthenticationHandler = async (req: Request, res: Response) => {
  const userPayload = (req as AuthenticatedRequest).user;

  if (!userPayload) {
    throw unauthorizedError("User context missing");
  }

  const admin = await getAdministratorById(userPayload.administratorId);

  if (!admin) {
    throw unauthorizedError("User not found");
  }

  res.status(200).json({
    status: "success",
    data: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      sessionId: userPayload.sessionId,
    },
  });
};

const putAtuhenticationHandler = async (req: Request, res: Response) => {
  const { refreshToken } = putAuthenticationBodySchema.parse(req.body);

  const decoded = verifyRefreshToken(refreshToken);

  if (!decoded) {
    throw unauthorizedError("Invalid or expired refresh token");
  }

  const session = await verifySession(refreshToken);

  if (!session) {
    throw unauthorizedError("Session not found or has been revoked");
  }

  const admin = await getAdministratorById(decoded.administratorId);

  if (!admin) {
    throw unauthorizedError("User context not found");
  }

  const newAccessToken = generateAccessToken({
    administratorId: admin.id,
    sessionId: decoded.sessionId,
    role: admin.role,
  });

  res.status(200).json({
    status: "success",
    data: {
      accessToken: newAccessToken,
    },
  });
};

const deleteAuthenticationHandler = async (req: Request, res: Response) => {
  const { refreshToken } = deleteAuthenticationBodySchema.parse(req.body);

  await deleteSession(refreshToken);

  res.status(200).json({
    status: "success",
    message: "Session deleted successfully",
  });
};

const getAllSessionsHandler = async (req: Request, res: Response) => {
  const userPayload = (req as AuthenticatedRequest).user;

  if (!userPayload) {
    throw unauthorizedError("User context missing");
  }

  const rows = await getAllSessions(userPayload.administratorId);

  const sessions = rows.map((row) => ({
    sessionId: row.id,
    userAgent: row.user_agent,
    ipAddress: row.ip_address,
    location: getIpLocation(row.ip_address),
    device: parseUserAgent(row.user_agent),
    createdAt: row.created_at,
  }));

  return res.status(200).json({
    status: "success",
    message: "Sessions retrieved successfully",
    data: {
      sessions,
    },
  });
};

const deleteOtherSessionsHandler = async (req: Request, res: Response) => {
  const userPayload = (req as AuthenticatedRequest).user;

  if (!userPayload) {
    throw unauthorizedError("User context missing");
  }

  const { password } = deleteOtherSessionsBodySchema.parse(req.body);

  const admin = await getAdministratorById(userPayload.administratorId);

  if (!admin) {
    throw unauthorizedError("User not found");
  }

  const isMatch = await comparePassword(password, admin.password);

  if (!isMatch) {
    throw unauthorizedError("Incorrect password");
  }

  await deleteAllSessionsExcept(
    userPayload.administratorId,
    userPayload.sessionId
  );

  return res.status(200).json({
    status: "success",
    message: "All other sessions have been revoked",
  });
};

export {
  getAuthenticationHandler,
  postAuthenticationHandler,
  putAtuhenticationHandler,
  deleteAuthenticationHandler,
  getAllSessionsHandler,
  deleteOtherSessionsHandler,
};
