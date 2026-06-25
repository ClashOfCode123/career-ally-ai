import mongoose from 'mongoose';

const jobMatchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GlobalJob',
    required: true
  },
  matchScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000
  }
});

jobMatchSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const JobMatch = mongoose.model('JobMatch', jobMatchSchema);
export default JobMatch;