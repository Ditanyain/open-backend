import { Request, Response } from "express";
import { getTutorial } from "@/shared/services/lms.service";
import { getQuestions } from "./services/postgresql/quizzes.service";
import { getQuestionsQuerySchema } from "./validator";

const getQuestionsHandler = async (req: Request, res: Response) => {
  const { tutorial_id, user_id } = getQuestionsQuerySchema.parse(req.query);

  await getTutorial(tutorial_id);

  const data = await getQuestions(tutorial_id, user_id);

  res.status(200).json({
    status: "success",
    message: "Questions retrieved successfully",
    data,
  });
};

export { getQuestionsHandler };
