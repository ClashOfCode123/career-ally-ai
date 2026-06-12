import MockInterview from '../models/MockInterview.js';
import { User } from '../models/User.js';

const FIVE_MINUTES = 5 * 60 * 1000;

let cleanupInterval = null;

export const runInterviewCleanup = async () => {
  try {
    const now = new Date();

    const expiredWaitingInterviews = await MockInterview.find({
      status: 'waiting',
      timeSlot: { $lt: now },
    })
      .select('_id userA timeSlot')
      .lean();

    if (expiredWaitingInterviews.length === 0) {
      return;
    }

    let deletedCount = 0;

    for (const interview of expiredWaitingInterviews) {
      const deletedInterview = await MockInterview.findOneAndDelete({
        _id: interview._id,
        status: 'waiting',
      });

      if (!deletedInterview) {
        continue;
      }

      deletedCount += 1;

      await User.findByIdAndUpdate(deletedInterview.userA, {
        $push: {
          notifications: {
            $each: [
              {
                type: 'peer_not_found',
                message:
                  'Peer not found for your scheduled interview. Please schedule a new session.',
                interviewTime: deletedInterview.timeSlot,
                read: false,
              },
            ],
            $slice: -50,
          },
        },
      });
    }

    console.log(
      `[INTERVIEW CLEANUP] Deleted ${deletedCount} expired waiting interview(s).`
    );
  } catch (error) {
    console.error('[INTERVIEW CLEANUP ERROR]:', error);
  }
};

export const startInterviewCleanupJob = () => {
  if (cleanupInterval) {
    return cleanupInterval;
  }

  console.log('🧹 Interview cleanup job started. Running every 5 minutes.');

  runInterviewCleanup();

  cleanupInterval = setInterval(() => {
    runInterviewCleanup();
  }, FIVE_MINUTES);

  return cleanupInterval;
};

export const stopInterviewCleanupJob = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('🛑 Interview cleanup job stopped.');
  }
};