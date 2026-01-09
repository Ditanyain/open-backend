import { Router } from "express";
import {
  getAttemptsHandler,
  getAttemptByIdHandler,
  postAnswerHandler,
  submitAttemptHandler,
} from "./controller";

const router = Router();

router.get("/", getAttemptsHandler);
router.get("/:attemptId", getAttemptByIdHandler);
router.post("/:attemptId/answers", postAnswerHandler);
router.post("/:attemptId/submit", submitAttemptHandler);

export default router;
