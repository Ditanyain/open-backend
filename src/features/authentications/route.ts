import { Router } from "express";
import {
  deleteAuthenticationHandler,
  deleteOtherSessionsHandler,
  getAllSessionsHandler,
  getAuthenticationHandler,
  postAuthenticationHandler,
  putAtuhenticationHandler,
} from "./controller";
import { authenticateToken } from "@/core/middlewares/auth.middleware";

const router = Router();

router.post("/", postAuthenticationHandler);
router.get("/", authenticateToken, getAuthenticationHandler);
router.put("/", putAtuhenticationHandler);
router.delete("/", deleteAuthenticationHandler);

router.get("/sessions", authenticateToken, getAllSessionsHandler);
router.delete("/sessions", authenticateToken, deleteOtherSessionsHandler);

export default router;
