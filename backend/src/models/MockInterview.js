import mongoose from 'mongoose';

const mockInterviewSchema = new mongoose.Schema({
  // The exact UTC time they selected for the interview
  timeSlot: { 
    type: Date, 
    required: true 
  }, 
  // State machine: Is it looking for a peer, matched, or expired?
  status: { 
    type: String, 
    enum: ['waiting', 'matched', 'expired'], 
    default: 'waiting' 
  },
  // The person who requested the slot
  userA: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // The person who matched with them (populated later)
  userB: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  // The unique URL ID for the WebRTC room (generated on match)
  roomId: { 
    type: String 
  },
  videoUrl: { type: String },
}, { timestamps: true });

export default mongoose.model('MockInterview', mockInterviewSchema);