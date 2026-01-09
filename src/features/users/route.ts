import { Router } from "express";
import { getUserPreferencesHandler } from "./controller";

const router = Router();

router.get("/:id/preferences", getUserPreferencesHandler);

export default router;
