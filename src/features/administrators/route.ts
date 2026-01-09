import { Router } from "express";
import {
  putAdministratorHandlerByPassword,
  putAdministratorHandlerByName,
  putAdministratorHandlerByEmail,
  addAdministratorHandler,
  getAdministratorHandler,
  deleteAdministratorHandler,
} from "./controller";
import {
  authenticateToken,
  requireRole,
} from "@/core/middlewares/auth.middleware";
const router = Router();

router.post(
  "/",
  authenticateToken,
  requireRole(["SUPERUSER"]),
  addAdministratorHandler
);
router.get(
  "/",
  authenticateToken,
  requireRole(["SUPERUSER"]),
  getAdministratorHandler
);
router.delete(
  "/:administratorId",
  authenticateToken,
  requireRole(["SUPERUSER"]),
  deleteAdministratorHandler
);
router.put("/", authenticateToken, putAdministratorHandlerByName);
router.put("/password", authenticateToken, putAdministratorHandlerByPassword);
router.put("/email", authenticateToken, putAdministratorHandlerByEmail);

export default router;
