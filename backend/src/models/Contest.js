import mongoose from "mongoose";

const contestProblemSchema = new mongoose.Schema(
  {
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    index: {
      type: String,
      required: true, // A, B, C
    },
    points: {
      type: Number,
      default: 100,
    },
  },
  { _id: false }
);

const contestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    problems: {
      type: [contestProblemSchema],
      default: [],
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Contest =
  mongoose.models.Contest || mongoose.model("Contest", contestSchema);