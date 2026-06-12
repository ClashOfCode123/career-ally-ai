import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { Problem } from '../models/Problem.js';
import { Submission } from '../models/Submission.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const problems = await Problem.find({});
    const solvedSubmissions = await Submission.find({ 
      userId: req.user._id, 
      status: 'Accepted' 
    });
    
    const solvedProblemIds = new Set(solvedSubmissions.map(s => s.problemId.toString()));

    const problemsWithStatus = problems.map(problem => ({
      ...problem.toObject(),
      solved: solvedProblemIds.has(problem._id.toString())
    }));

    res.status(200).json(problemsWithStatus);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch problems" });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    res.status(200).json(problem);
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