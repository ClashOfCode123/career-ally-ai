import express from "express";
import { submitCode, getStatus } from "../controllers/submission.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, submitCode);
router.get("/:id", protect, getStatus);

export default router;