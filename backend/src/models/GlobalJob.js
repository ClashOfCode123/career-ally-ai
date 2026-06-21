import mongoose from 'mongoose';

const globalJobSchema = new mongoose.Schema({
  jobHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  cacheKey: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true,
    index: true
  },
  applyUrl: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: 'Remote'
  },
  tags: {
    type: [String],
    default: [],
    index: true
  },
  yoeRequired: {
    type: Number,
    required: true,
    default: 0
  },
  jobType: {
    type: String,
    enum: ['intern', 'full-time'],
    default: 'full-time'
  },
  eligibilityBatch: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000
  }
});

const GlobalJob = mongoose.model('GlobalJob', globalJobSchema);
export default GlobalJob;