import { Router } from "express";
import {
  getAttemptsSummaryHandler,
  getAttemptsHistoryHandler,
  getAttemptsListHandler,
  getAttemptDetailsHandler,
} from "./controller";
import { authenticateToken } from "@/core/middlewares/auth.middleware";

const router = Router();

router.get("/summary", authenticateToken, getAttemptsSummaryHandler);
router.get("/history", authenticateToken, getAttemptsHistoryHandler);

router.get("/", authenticateToken, getAttemptsListHandler);
router.get("/:attemptId", authenticateToken, getAttemptDetailsHandler);

export default router;
