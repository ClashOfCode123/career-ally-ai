import { redisClient } from "../config/redis.js";
import { Contest } from "../models/Contest.js";
import { Submission } from "../models/Submission.js";
import { User } from "../models/User.js";

const TERMINAL_STATUSES = [
  "Accepted",
  "Wrong Answer",
  "Time Limit Exceeded",
  "Memory Limit Exceeded",
  "Compilation Error",
  "Runtime Error",
];

export const contestLeaderboardKey = (contestId) =>
  `contest:${contestId}:leaderboard`;

const contestUserKey = (contestId, userId) =>
  `contest:${contestId}:user:${userId}`;

const contestCellKey = (contestId, userId, problemId) =>
  `contest:${contestId}:user:${userId}:problem:${problemId}`;

const getProblemId = (contestProblem) =>
  String(contestProblem.problem?._id || contestProblem.problem);

const getRankScore = (totalScore, totalPenalty) => {
  return totalScore * 1_000_000_000 - totalPenalty;
};

export const refreshUserContestStanding = async (contestId, userId) => {
  if (!redisClient.isOpen) return null;

  const contest = await Contest.findById(contestId).populate(
    "problems.problem",
    "title difficulty"
  );

  if (!contest) return null;

  const user = await User.findById(userId).select("username email");

  if (!user) return null;

  const problemCells = {};

  contest.problems.forEach((p) => {
    const problemId = getProblemId(p);

    problemCells[problemId] = {
      problemId,
      index: p.index,
      title: p.problem?.title || "",
      attempts: 0,
      solved: false,
      score: 0,
      penalty: 0,
      solvedAt: "",
    };
  });

  const submissions = await Submission.find({
    contestId,
    userId,
    action: "submit",
    status: { $in: TERMINAL_STATUSES },
    createdAt: {
      $gte: contest.startTime,
      $lte: contest.endTime,
    },
  }).sort({ createdAt: 1 });

  let totalScore = 0;
  let totalPenalty = 0;
  let solvedCount = 0;

  for (const submission of submissions) {
    const problemId = String(submission.problemId);
    const cell = problemCells[problemId];

    if (!cell || cell.solved) continue;

    cell.attempts += 1;

    if (submission.status === "Accepted") {
      const contestProblem = contest.problems.find(
        (p) => getProblemId(p) === problemId
      );

      const points = Number(contestProblem?.points || 100);

      const minutesFromStart = Math.max(
        0,
        Math.floor((submission.createdAt - contest.startTime) / 60000)
      );

      const wrongAttemptsBeforeAccepted = cell.attempts - 1;
      const penalty = minutesFromStart + wrongAttemptsBeforeAccepted * 20;

      cell.solved = true;
      cell.score = points;
      cell.penalty = penalty;
      cell.solvedAt = submission.createdAt.toISOString();

      totalScore += points;
      totalPenalty += penalty;
      solvedCount += 1;
    }
  }

  const rowKey = contestUserKey(contestId, userId);
  const zsetKey = contestLeaderboardKey(contestId);

  await redisClient.hSet(rowKey, {
    userId: String(user._id),
    username: user.username || "",
    email: user.email || "",
    totalScore: String(totalScore),
    totalPenalty: String(totalPenalty),
    solvedCount: String(solvedCount),
    updatedAt: new Date().toISOString(),
  });

  await redisClient.zAdd(zsetKey, [
    {
      score: getRankScore(totalScore, totalPenalty),
      value: String(user._id),
    },
  ]);

  for (const cell of Object.values(problemCells)) {
    await redisClient.hSet(contestCellKey(contestId, userId, cell.problemId), {
      problemId: cell.problemId,
      index: cell.index,
      title: cell.title,
      attempts: String(cell.attempts),
      solved: cell.solved ? "1" : "0",
      score: String(cell.score),
      penalty: String(cell.penalty),
      solvedAt: cell.solvedAt || "",
    });
  }

  return {
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
    },
    totalScore,
    totalPenalty,
    solvedCount,
    problems: problemCells,
  };
};

export const rebuildContestLeaderboard = async (contestId) => {
  if (!redisClient.isOpen) return [];

  const contest = await Contest.findById(contestId);

  if (!contest) return [];

  await redisClient.del(contestLeaderboardKey(contestId));

  const rows = [];

  for (const userId of contest.participants) {
    const row = await refreshUserContestStanding(contestId, userId);
    if (row) rows.push(row);
  }

  return rows;
};

export const getContestLeaderboardFromRedis = async (contest) => {
  if (!redisClient.isOpen) return [];

  const contestId = String(contest._id);
  const zsetKey = contestLeaderboardKey(contestId);

  const userIds = await redisClient.sendCommand([
    "ZREVRANGE",
    zsetKey,
    "0",
    "-1",
  ]);

  const leaderboard = [];

  for (const userId of userIds) {
    const row = await redisClient.hGetAll(contestUserKey(contestId, userId));

    if (!row || !row.userId) continue;

    const problems = {};

    for (const p of contest.problems) {
      const problemId = getProblemId(p);

      const cell = await redisClient.hGetAll(
        contestCellKey(contestId, userId, problemId)
      );

      problems[problemId] = {
        problemId,
        index: cell.index || p.index,
        title: cell.title || p.problem?.title || "",
        attempts: Number(cell.attempts || 0),
        solved: cell.solved === "1",
        score: Number(cell.score || 0),
        penalty: Number(cell.penalty || 0),
        solvedAt: cell.solvedAt || null,
      };
    }

    leaderboard.push({
      user: {
        _id: row.userId,
        username: row.username,
        email: row.email,
      },
      totalScore: Number(row.totalScore || 0),
      totalPenalty: Number(row.totalPenalty || 0),
      solvedCount: Number(row.solvedCount || 0),
      problems,
    });
  }

  return leaderboard;
};