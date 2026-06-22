import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },

    message: {
      type: String,
      required: true
    },

    messageNumber: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

chatMessageSchema.index({ sessionId: 1, messageNumber: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;