import mongoose from 'mongoose';

const mockInterviewSchema = new mongoose.Schema(
  {
    timeSlot: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'matched', 'completed', 'expired'],
      default: 'waiting',
    },
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    roomId: {
      type: String,
    },
    completedAt: {
      type: Date,
    },
    expiredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model('MockInterview', mockInterviewSchema);