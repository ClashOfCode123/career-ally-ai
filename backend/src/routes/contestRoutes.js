import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { Contest } from "../models/Contest.js";
import { Problem } from "../models/Problem.js";
import { Submission } from "../models/Submission.js";
import {
  rebuildContestLeaderboard,
  getContestLeaderboardFromRedis,
  refreshUserContestStanding,
} from "../services/contestLeaderboardService.js";

const router = express.Router();

const getContestStatus = (contest) => {
  const now = new Date();

  if (now < contest.startTime) return "upcoming";
  if (now > contest.endTime) return "ended";

  return "running";
};

const stripHiddenTests = (problem) => {
  const obj = problem.toObject ? problem.toObject() : problem;

  obj.testCases = obj.testCases?.filter((tc) => !tc.isHidden) || [];

  return obj;
};

router.post("/", protect, admin, async (req, res) => {
  try {
    const { title, description, startTime, endTime, problems, isPublic } =
      req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({
        error: "title, startTime and endTime are required",
      });
    }

    if (!Array.isArray(problems) || problems.length === 0) {
      return res.status(400).json({
        error: "At least one problem is required",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid contest time" });
    }

    if (end <= start) {
      return res.status(400).json({
        error: "endTime must be after startTime",
      });
    }

    const normalizedProblems = problems.map((item, index) => ({
      problem: item.problem || item.problemId || item,
      index: item.index || String.fromCharCode(65 + index),
      points: Number(item.points || 100),
    }));

    const problemIds = normalizedProblems.map((p) => p.problem);
    const existingProblemCount = await Problem.countDocuments({
      _id: { $in: problemIds },
    });

    if (existingProblemCount !== new Set(problemIds.map(String)).size) {
      return res.status(400).json({
        error: "One or more problem IDs are invalid",
      });
    }

    const contest = await Contest.create({
      title,
      description,
      startTime: start,
      endTime: end,
      problems: normalizedProblems,
      isPublic: isPublic !== false,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Contest created successfully",
      contest,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const contests = await Contest.find({})
      .populate("problems.problem", "title difficulty slug")
      .sort({ startTime: -1 });

    const data = contests.map((contest) => {
      const status = getContestStatus(contest);
      const obj = contest.toObject();

      if (req.user.role !== "admin" && status === "upcoming") {
        obj.problems = obj.problems.map((p) => ({
          index: p.index,
          points: p.points,
          problem: {
            _id: p.index,
            title: `Problem ${p.index}`,
            difficulty: "Hidden",
          },
        }));
      }

      return {
        ...obj,
        status,
        participantCount: contest.participants.length,
        joined: contest.participants.some(
          (id) => id.toString() === req.user._id.toString()
        ),
      };
    });

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:contestId/join", protect, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId);

    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    const status = getContestStatus(contest);

    if (status === "ended") {
      return res.status(400).json({ error: "Contest has already ended" });
    }

    const alreadyJoined = contest.participants.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (alreadyJoined) {
      return res.status(200).json({ message: "Already joined this contest" });
    }

    contest.participants.push(req.user._id);
    await contest.save();
    
    await refreshUserContestStanding(contest._id, req.user._id);

    res.status(200).json({ message: "Contest joined successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:contestId", protect, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId)
      .populate("problems.problem")
      .populate("participants", "username email");

    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    const status = getContestStatus(contest);

    const joined = contest.participants.some(
      (user) => user._id.toString() === req.user._id.toString()
    );

    const obj = contest.toObject();

    obj.status = status;
    obj.joined = joined;

    if (status === "upcoming" && req.user.role !== "admin") {
  obj.problems = obj.problems.map((p) => ({
    index: p.index,
    points: p.points,
    problem: {
      _id: p.index,
      title: `Problem ${p.index}`,
      difficulty: "Hidden",
    },
  }));
} else {
      obj.problems = obj.problems.map((p) => ({
        ...p,
        problem: stripHiddenTests(p.problem),
      }));
    }

    res.status(200).json(obj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:contestId/problems/:problemId", protect, async (req, res) => {
  try {
    const { contestId, problemId } = req.params;

    const contest = await Contest.findById(contestId);

    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    const status = getContestStatus(contest);

    if (status === "upcoming") {
      return res.status(403).json({
        error: "Contest has not started yet",
      });
    }

    const joined = contest.participants.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (!joined) {
      return res.status(403).json({
        error: "Join the contest first",
      });
    }

    const isProblemInContest = contest.problems.some(
      (p) => p.problem.toString() === problemId
    );

    if (!isProblemInContest) {
      return res.status(403).json({
        error: "Problem does not belong to this contest",
      });
    }

    const problem = await Problem.findById(problemId);

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    res.status(200).json(stripHiddenTests(problem));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:contestId/leaderboard", protect, async (req, res) => {
  try {
    const { contestId } = req.params;

    const contest = await Contest.findById(contestId)
      .populate("participants", "username email")
      .populate("problems.problem", "title difficulty");

    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    let leaderboard = await getContestLeaderboardFromRedis(contest);

    if (leaderboard.length < contest.participants.length) {
      await rebuildContestLeaderboard(contest._id);
      leaderboard = await getContestLeaderboardFromRedis(contest);
    }

    res.status(200).json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;