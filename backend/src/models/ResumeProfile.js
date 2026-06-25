import mongoose from 'mongoose';

const resumeProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },

    rawResumeText: {
      type: String,
      default: ''
    },

    skills: {
      type: [String],
      default: []
    },

    yoe: {
      type: Number,
      default: 0
    },

    batchYear: {
      type: Number,
      default: 0
    },

    preferredRole: {
      type: String,
      enum: ['intern', 'full-time'],
      default: 'full-time'
    },

    country: {
      type: String,
      default: 'us'
    },

    targetCompanies: {
      type: [String],
      default: []
    },

    careerSummary: {
      type: String,
      default: ''
    },

    strengths: {
      type: [String],
      default: []
    },

    weaknesses: {
      type: [String],
      default: []
    },

    suggestedRoles: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

const ResumeProfile = mongoose.model('ResumeProfile', resumeProfileSchema);

export default ResumeProfile;