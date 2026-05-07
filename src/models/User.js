import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }, 
  totalSolved: { type: Number, default: 0 },
  solvedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }]
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);