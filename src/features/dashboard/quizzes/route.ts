import { Router } from "express";
import {
  getSummaryHandler,
  getQuestionsHandler,
  getDetailHandler,
  deleteQuestionHandler,
  getQuizGenerationsHandler,
} from "./controller";
import { authenticateToken } from "@/core/middlewares/auth.middleware";

const router = Router();

router.get("/summary", authenticateToken, getSummaryHandler);

router.get("/questions", authenticateToken, getQuestionsHandler);
router.get("/questions/:questionId", authenticateToken, getDetailHandler);
router.delete(
  "/questions/:questionId",
  authenticateToken,
  deleteQuestionHandler
);

router.get("/generations", authenticateToken, getQuizGenerationsHandler);

export default router;
