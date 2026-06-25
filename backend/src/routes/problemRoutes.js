import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { Problem } from '../models/Problem.js';
import { Submission } from '../models/Submission.js';

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const query =
      req.user.role === "admin"
        ? {}
        : {
            $or: [
              { visibility: "public" },
              { visibility: { $exists: false } },
            ],
          };

    const problems = await Problem.find(query);

    const solvedSubmissions = await Submission.find({
      userId: req.user._id,
      status: "Accepted",
      action: "submit",
    });

    const solvedProblemIds = new Set(
      solvedSubmissions.map((s) => s.problemId.toString())
    );

    const isAdminUser = req.user.role === "admin";

    const problemsWithStatus = problems.map((problem) => {
      const obj = problem.toObject();

      obj.solved = solvedProblemIds.has(problem._id.toString());

      if (!isAdminUser) {
        obj.testCases = obj.testCases?.filter((tc) => !tc.isHidden) || [];
      }

      return obj;
    });

    res.status(200).json(problemsWithStatus);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch problems" });
  }
});

router.get("/:id", protect, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    const visibility = problem.visibility || "public";

    if (req.user.role !== "admin" && visibility !== "public") {
      return res.status(403).json({
        error: "This problem is not available for practice.",
      });
    }

    const obj = problem.toObject();

    if (req.user.role !== "admin") {
      obj.testCases = obj.testCases?.filter((tc) => !tc.isHidden) || [];
    }

    res.status(200).json(obj);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const problem = await Problem.create(req.body);
    res.status(201).json(problem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    res.status(200).json(problem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    res.status(200).json({ message: "Problem deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;