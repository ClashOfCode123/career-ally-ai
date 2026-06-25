import MockInterview from '../models/MockInterview.js';
import { User } from '../models/User.js';

const FIVE_MINUTES = 5 * 60 * 1000;
const COMPLETION_GRACE_HOURS = 2;

let cleanupInterval = null;

const notifyPeerNotFound = async (userId, timeSlot) => {
  await User.findByIdAndUpdate(userId, {
    $push: {
      notifications: {
        $each: [
          {
            type: 'peer_not_found',
            message:
              'Peer not found for your scheduled interview. Please schedule a new session.',
            interviewTime: timeSlot,
            read: false,
          },
        ],
        $slice: -50,
      },
    },
  });
};

const markExpiredWaitingMeetings = async () => {
  const now = new Date();

  const expiredWaitingInterviews = await MockInterview.find({
    status: 'waiting',
    timeSlot: { $lt: now },
  }).select('_id userA timeSlot');

  if (expiredWaitingInterviews.length === 0) {
    return 0;
  }

  let expiredCount = 0;

  for (const interview of expiredWaitingInterviews) {
    const updatedInterview = await MockInterview.findOneAndUpdate(
      {
        _id: interview._id,
        status: 'waiting',
      },
      {
        $set: {
          status: 'expired',
          expiredAt: now,
        },
      },
      { new: true }
    );

    if (!updatedInterview) continue;

    expiredCount += 1;

    await notifyPeerNotFound(
      updatedInterview.userA,
      updatedInterview.timeSlot
    );
  }

  return expiredCount;
};

const markCompletedMatchedMeetings = async () => {
  const completionCutoff = new Date(
    Date.now() - COMPLETION_GRACE_HOURS * 60 * 60 * 1000
  );

  const result = await MockInterview.updateMany(
    {
      status: 'matched',
      timeSlot: { $lt: completionCutoff },
    },
    {
      $set: {
        status: 'completed',
        completedAt: new Date(),
      },
    }
  );

  return result.modifiedCount || 0;
};

const clearDuplicateWaitingMeetings = async () => {
  const duplicateGroups = await MockInterview.aggregate([
    {
      $match: {
        status: 'waiting',
      },
    },
    {
      $sort: {
        createdAt: 1,
      },
    },
    {
      $group: {
        _id: {
          userA: '$userA',
          timeSlot: '$timeSlot',
        },
        ids: {
          $push: '$_id',
        },
        count: {
          $sum: 1,
        },
      },
    },
    {
      $match: {
        count: {
          $gt: 1,
        },
      },
    },
    {
      $project: {
        idsToDelete: {
          $slice: [
            '$ids',
            1,
            {
              $subtract: [
                {
                  $size: '$ids',
                },
                1,
              ],
            },
          ],
        },
      },
    },
  ]);

  const duplicateIds = duplicateGroups.flatMap((group) => group.idsToDelete);

  if (duplicateIds.length === 0) {
    return 0;
  }

  const result = await MockInterview.deleteMany({
    _id: {
      $in: duplicateIds,
    },
    status: 'waiting',
  });

  return result.deletedCount || 0;
};

export const runInterviewCleanup = async () => {
  try {
    const expiredWaitingCount = await markExpiredWaitingMeetings();
    const completedMatchedCount = await markCompletedMatchedMeetings();
    const duplicateDeletedCount = await clearDuplicateWaitingMeetings();

    if (expiredWaitingCount || completedMatchedCount || duplicateDeletedCount) {
      console.log(
        `[INTERVIEW CLEANUP] Waiting expired: ${expiredWaitingCount}, matched completed: ${completedMatchedCount}, duplicate waiting deleted: ${duplicateDeletedCount}`
      );
    }
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