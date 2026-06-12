import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['peer_not_found', 'peer_matched', 'system'],
      default: 'system',
    },
    message: {
      type: String,
      required: true,
    },
    interviewTime: {
      type: Date,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    totalSolved: { type: Number, default: 0 },

    solvedProblems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
      },
    ],

    notifications: {
      type: [notificationSchema],
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);