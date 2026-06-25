import { Submission } from '../models/Submission.js';
import { publishSubmission } from '../producer.js';

export const submitCode = async (req, res) => {
  try {
    const { userId, problemId, language, code, action } = req.body;

    const submission = await Submission.create({
      userId,
      problemId,
      language,
      code,
      action: action || 'submit'
    });

    await publishSubmission(submission._id);

    res.status(201).json({ submissionId: submission._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStatus = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }
    res.status(200).json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};