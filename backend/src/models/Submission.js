import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },

    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      default: null,
    },

    isContestSubmission: {
      type: Boolean,
      default: false,
    },

    language: {
      type: String,
      enum: ["python", "cpp", "javascript"],
      required: true,
    },

    code: {
      type: String,
      required: true,
    },

    action: {
      type: String,
      enum: ["run", "submit"],
      default: "submit",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Accepted",
        "Wrong Answer",
        "Time Limit Exceeded",
        "Memory Limit Exceeded",
        "Compilation Error",
        "Runtime Error",
      ],
      default: "Pending",
    },

    executionTimeMs: {
      type: Number,
      default: null,
    },

    memoryUsedKb: {
      type: Number,
      default: null,
    },

    outputLogs: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const Submission =
  mongoose.models.Submission || mongoose.model("Submission", submissionSchema);