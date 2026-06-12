import mongoose from 'mongoose';

const mockInterviewSchema = new mongoose.Schema(
  {
    // The exact UTC time selected for the interview
    timeSlot: {
      type: Date,
      required: true,
    },

    // Interview lifecycle:
    // waiting   = looking for peer
    // matched   = peer found, room created
    // completed = matched interview time has passed
    // expired   = no peer found before scheduled time
    status: {
      type: String,
      enum: ['waiting', 'matched', 'completed', 'expired'],
      default: 'waiting',
    },

    // The person who requested the slot
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The person who matched with them
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Unique WebRTC/interview room ID
    roomId: {
      type: String,
    },

    videoUrl: {
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