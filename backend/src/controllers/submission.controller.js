import { Submission } from "../models/Submission.js";
import { publishSubmission } from "../queue/producer.js";

export const submitCode = async (req, res) => {
  try {
    const { problemId, language, code, action } = req.body;

    const submission = await Submission.create({
      userId: req.user._id,
      problemId,
      language,
      code,
      action: action || "submit",
      status: "Pending",
    });

    await publishSubmission(submission._id);

    res.status(201).json({
      message: "Submission queued",
      submissionId: submission._id,
    });
  } catch (error) {
    console.error("Submission error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getStatus = async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};