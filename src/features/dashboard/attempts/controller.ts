import { Request, Response } from "express";
import {
  getAttemptsSummary,
  getAttemptsHistory,
  getAttemptsList,
  getAttemptDetails,
} from "./service";
import { getAttemptsHistorySchema, getAttemptsListSchema } from "./validator";

const getAttemptsSummaryHandler = async (req: Request, res: Response) => {
  const summary = await getAttemptsSummary();

  res.status(200).json({
    status: "success",
    message: "Attempts summary retrieved successfully",
    data: summary,
  });
};

const getAttemptsHistoryHandler = async (req: Request, res: Response) => {
  const { days } = getAttemptsHistorySchema.parse(req.query);

  const history = await getAttemptsHistory(days);

  res.status(200).json({
    status: "success",
    message: "Attempts history retrieved successfully",
    data: history,
  });
};

const getAttemptsListHandler = async (req: Request, res: Response) => {
  const { page, limit, tutorial_id, user_id, status } =
    getAttemptsListSchema.parse(req.query);

  const result = await getAttemptsList(
    page,
    limit,
    tutorial_id,
    user_id,
    status
  );

  res.status(200).json({
    status: "success",
    message: "Attempts list retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
};

const getAttemptDetailsHandler = async (req: Request, res: Response) => {
  const { attemptId } = req.params;

  const detail = await getAttemptDetails(attemptId);

  res.status(200).json({
    status: "success",
    message: "Attempt details retrieved successfully",
    data: detail,
  });
};

export {
  getAttemptsSummaryHandler,
  getAttemptsHistoryHandler,
  getAttemptsListHandler,
  getAttemptDetailsHandler,
};
