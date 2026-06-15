import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, 
  description: { type: String, required: true }, 
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  timeLimitMs: { type: Number, default: 2000 }, 
  memoryLimitKb: { type: Number, default: 256000 }, 
  starterCode: {
    cpp: { type: String, default: "" },
    javascript: { type: String, default: "" },
    python: { type: String, default: "" }
  },
  testCases: [{
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: true } 
  }],
  visibility: {
  type: String,
  enum: ["public", "contest", "private"],
  default: "public",
}
}, { timestamps: true });

export const Problem = mongoose.models.Problem || mongoose.model('Problem', problemSchema);