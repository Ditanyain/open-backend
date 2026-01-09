import { Router } from "express";
import { getQuestionsHandler } from "./controller";

const router = Router();

router.get("/", getQuestionsHandler);

export default router;
