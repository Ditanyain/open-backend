import { Request, Response } from "express";
import {
  getQuestionsSummary,
  getAllQuestions,
  getQuestionDetails,
  deleteQuestion,
  getQuizGenerations,
} from "./service";
import {
  getQuestionsListSchema,
  getQuizGenerationsQuerySchema,
} from "./validator";

const getSummaryHandler = async (req: Request, res: Response) => {
  const summary = await getQuestionsSummary();
  res.status(200).json({
    status: "success",
    message: "Questions summary retrieved",
    data: summary,
  });
};

const getQuestionsHandler = async (req: Request, res: Response) => {
  const { page, limit, tutorial_id } = getQuestionsListSchema.parse(req.query);
  const result = await getAllQuestions(page, limit, tutorial_id);

  res.status(200).json({
    status: "success",
    message: "Questions list retrieved",
    data: result.data,
    meta: result.meta,
  });
};

const getDetailHandler = async (req: Request, res: Response) => {
  const { questionId } = req.params;
  const data = await getQuestionDetails(questionId);

  res.status(200).json({
    status: "success",
    message: "Question details retrieved",
    data,
  });
};

const deleteQuestionHandler = async (req: Request, res: Response) => {
  const { questionId } = req.params;
  await deleteQuestion(questionId);

  res.status(200).json({
    status: "success",
    message: "Question deleted successfully",
  });
};

const getQuizGenerationsHandler = async (req: Request, res: Response) => {
  const { page, limit, tutorial_id } = getQuizGenerationsQuerySchema.parse(
    req.query
  );

  const data = await getQuizGenerations({
    page,
    limit,
    tutorialId: tutorial_id,
  });

  res.status(200).json({
    status: "success",
    message: "Quiz generations retrieved successfully",
    ...data,
  });
};

export {
  getSummaryHandler,
  getQuestionsHandler,
  getDetailHandler,
  deleteQuestionHandler,
  getQuizGenerationsHandler,
};
