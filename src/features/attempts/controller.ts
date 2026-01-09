import { Request, Response } from "express";
import { notFoundError } from "@/core/exceptions/notFoundError.exception";

import {
  getAttemptById,
  getAttempts,
  submitAnswer,
  submitAttempt,
} from "./service";
import { getAttemptsQuerySchema, postAnswerBodySchema } from "./validator";

const getAttemptsHandler = async (req: Request, res: Response) => {
  const { tutorial_id, user_id } = getAttemptsQuerySchema.parse(req.query);

  const attempts = await getAttempts(user_id, tutorial_id);

  res.status(200).json({
    status: "success",
    message: "Attempts retrieved successfully",
    data: attempts,
  });
};

const getAttemptByIdHandler = async (req: Request, res: Response) => {
  const { attemptId } = req.params;

  const attempt = await getAttemptById(attemptId);

  if (!attempt) throw notFoundError("Attempt not found");

  res.status(200).json({
    status: "success",
    message: "Attempt retrieved successfully",
    data: attempt,
  });
};

const postAnswerHandler = async (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const { questionId, optionIds } = postAnswerBodySchema.parse(req.body);

  const question = await submitAnswer({
    attemptId,
    questionId,
    selectedOptionIds: optionIds,
  });

  res.status(200).json({
    status: "success",
    message: "Answer submitted successfully",
    data: {
      attemptId: attemptId,
      question,
    },
  });
};

const submitAttemptHandler = async (req: Request, res: Response) => {
  const { attemptId } = req.params;

  const result = await submitAttempt(attemptId);

  res.status(200).json({
    status: "success",
    message: "Attempt submitted successfully",
    data: result,
  });
};

export {
  getAttemptsHandler,
  getAttemptByIdHandler,
  postAnswerHandler,
  submitAttemptHandler,
};
