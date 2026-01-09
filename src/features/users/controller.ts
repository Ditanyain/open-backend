import { Request, Response } from "express";
import { getUserPreferences } from "./services";
import { getUserPreferencesParamsSchema } from "./validator";

const getUserPreferencesHandler = async (req: Request, res: Response) => {
  const { id } = getUserPreferencesParamsSchema.parse(req.params);

  const preferences = await getUserPreferences(id);

  res.status(200).json({
    status: "success",
    message: "User preferences fetched successfully",
    data: preferences,
  });
};

export { getUserPreferencesHandler };
