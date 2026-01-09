import { Request, Response } from "express";
import {
  getAdministratorById,
  putAdministratorByPassword,
  putAdministratorByName,
  putAdministratorByEmail,
  addAdministrator,
  getAdministratorByEmail,
  getAdministrators,
  deleteAdministrator,
} from "./service";
import {
  putAdministratorByPasswordBodySchema,
  putAdministratorByNameBodySchema,
  putAdministratorByEmailBodySchema,
  addAdministratorBodySchema,
} from "./validator";
import { hashPassword, comparePassword } from "@/shared/utils/password";
import { unauthorizedError } from "@/core/exceptions/unauthorizedError.exception";
import { AuthenticatedRequest } from "@/core/middlewares/auth.middleware";

const putAdministratorHandlerByPassword = async (
  req: Request,
  res: Response
) => {
  const { oldPassword, newPassword } =
    putAdministratorByPasswordBodySchema.parse(req.body);

  const userPayload = (req as AuthenticatedRequest).user;

  if (!userPayload) {
    throw unauthorizedError("User context missing");
  }

  const admin = await getAdministratorById(userPayload.administratorId);

  if (!admin) {
    throw unauthorizedError("User not found");
  }

  const isMatch = await comparePassword(oldPassword, admin.password);
  if (!isMatch) {
    throw unauthorizedError("Old password not match");
  }

  const hashedPassword = await hashPassword(newPassword);

  await putAdministratorByPassword(userPayload.administratorId, hashedPassword);

  res.status(200).json({
    status: "success",
    message: "Password updated successfuly",
  });
};

const putAdministratorHandlerByName = async (req: Request, res: Response) => {
  const { name } = putAdministratorByNameBodySchema.parse(req.body);

  const userPayload = (req as AuthenticatedRequest).user;

  if (!userPayload) {
    throw unauthorizedError("User context missing");
  }

  const admin = await getAdministratorById(userPayload.administratorId);

  if (!admin) {
    throw unauthorizedError("User not found");
  }

  await putAdministratorByName(userPayload.administratorId, name);

  res.status(200).json({
    status: "success",
    message: "Profile updated successfuly",
  });
};

const putAdministratorHandlerByEmail = async (req: Request, res: Response) => {
  const { newEmail, password } = putAdministratorByEmailBodySchema.parse(
    req.body
  );

  const userPayload = (req as AuthenticatedRequest).user;
  if (!userPayload) {
    throw unauthorizedError("User context missing");
  }

  const admin = await getAdministratorById(userPayload.administratorId);
  if (!admin) {
    throw unauthorizedError("User not found");
  }

  if (newEmail === admin.email) {
    return res.status(400).json({
      status: "fail",
      message: "New email cannot be the same as current email",
    });
  }

  const isPasswordMatch = await comparePassword(password, admin.password);
  if (!isPasswordMatch) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid password",
    });
  }

  const cekEmail = await getAdministratorByEmail(newEmail);
  if (cekEmail && cekEmail.id !== admin.id) {
    return res.status(409).json({
      status: "fail",
      message: "Email already in use",
    });
  }

  await putAdministratorByEmail(admin.id, newEmail);

  res.status(200).json({
    status: "success",
    message: "Email updated successfully",
  });
};

const addAdministratorHandler = async (req: Request, res: Response) => {
  const { name, email, password } = addAdministratorBodySchema.parse(req.body);

  const findEmail = await getAdministratorByEmail(email);
  if (findEmail) {
    return res.status(409).json({
      status: "fail",
      message: "Email already exist",
    });
  }

  const hashedPassword = await hashPassword(password);

  const admin = await addAdministrator({
    name,
    email,
    password: hashedPassword,
    role: "ADMIN",
  });

  res.status(201).json({
    status: "success",
    message: "Administrator created successfully",
    data: {
      administrator: admin,
    },
  });
};

const getAdministratorHandler = async (req: Request, res: Response) => {
  const result = await getAdministrators();

  if (!result) {
    throw unauthorizedError("Administrator not found");
  }

  res.status(200).json({
    status: "success",
    message: "Success getting administrators",
    data: {
      administrators: result,
    },
  });
};

const deleteAdministratorHandler = async (req: Request, res: Response) => {
  const { administratorId } = req.params;
  const userPayload = (req as AuthenticatedRequest).user;

  if (!userPayload) {
    throw unauthorizedError("User context missing");
  }

  const admin = await getAdministratorById(userPayload.administratorId);

  if (!admin) {
    throw unauthorizedError("User not found");
  }

  await deleteAdministrator(administratorId);

  res.status(200).json({
    status: "success",
    message: "Administrator deleted successfully",
  });
};

export {
  putAdministratorHandlerByPassword,
  putAdministratorHandlerByName,
  putAdministratorHandlerByEmail,
  addAdministratorHandler,
  getAdministratorHandler,
  deleteAdministratorHandler,
};
