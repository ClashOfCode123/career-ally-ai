import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    resumeProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResumeProfile',
      required: true,
      index: true
    },

    title: {
      type: String,
      default: 'Resume Chat'
    },

    summary: {
      type: String,
      default: ''
    },

    totalMessages: {
      type: Number,
      default: 0
    },

    summarizedUntilMessageNumber: {
      type: Number,
      default: 0
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

chatSessionSchema.index({ userId: 1, resumeProfileId: 1, isActive: 1 });

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;