import ResumeProfile from '../models/ResumeProfile.js';
import ChatSession from '../models/ChatSession.js';
import ChatMessage from '../models/ChatMessage.js';
import JobMatch from '../models/JobMatch.js';
import {
  generateResumeChatReply,
  generateUpdatedConversationSummary
} from '../services/resumeChatService.js';

const RECENT_MESSAGES_LIMIT = 8;
const SUMMARY_TRIGGER_MESSAGES = 12;

async function getOrCreateChatSession(userId, resumeProfileId) {
  let session = await ChatSession.findOne({
    userId,
    resumeProfileId,
    isActive: true
  });

  if (!session) {
    session = await ChatSession.create({
      userId,
      resumeProfileId,
      title: 'Resume Chat',
      summary: '',
      totalMessages: 0,
      summarizedUntilMessageNumber: 0,
      isActive: true
    });
  }

  return session;
}

async function maybeSummarizeOldMessages(session) {
  const unsummarizedCount =
    session.totalMessages - session.summarizedUntilMessageNumber;

  if (unsummarizedCount < SUMMARY_TRIGGER_MESSAGES) {
    return session;
  }

  const summarizeUntilMessageNumber =
    session.totalMessages - RECENT_MESSAGES_LIMIT;

  if (summarizeUntilMessageNumber <= session.summarizedUntilMessageNumber) {
    return session;
  }

  const messagesToSummarize = await ChatMessage.find({
    sessionId: session._id,
    messageNumber: {
      $gt: session.summarizedUntilMessageNumber,
      $lte: summarizeUntilMessageNumber
    }
  })
    .sort({ messageNumber: 1 })
    .lean();

  if (messagesToSummarize.length === 0) {
    return session;
  }

  const updatedSummary = await generateUpdatedConversationSummary({
    existingSummary: session.summary,
    messagesToSummarize
  });

  session.summary = updatedSummary;
  session.summarizedUntilMessageNumber = summarizeUntilMessageNumber;

  await session.save();

  return session;
}

async function sendResumeChatMessage(req, res) {
  try {
    const userId = req.user._id;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'MESSAGE_REQUIRED' });
    }

    if (message.length > 3000) {
      return res.status(400).json({ error: 'MESSAGE_TOO_LONG' });
    }

    const resumeProfile = await ResumeProfile.findOne({ userId }).lean();

    if (!resumeProfile) {
      return res.status(400).json({
        error: 'RESUME_PROFILE_NOT_FOUND',
        message: 'Please upload a resume first before starting chat.'
      });
    }

    let session = await getOrCreateChatSession(userId, resumeProfile._id);

    const userMessageNumber = session.totalMessages + 1;

    const savedUserMessage = await ChatMessage.create({
      sessionId: session._id,
      userId,
      role: 'user',
      message: message.trim(),
      messageNumber: userMessageNumber
    });

    const recentMessages = await ChatMessage.find({
      sessionId: session._id,
      _id: { $ne: savedUserMessage._id },
      messageNumber: {
        $gt: session.summarizedUntilMessageNumber
      }
    })
      .sort({ messageNumber: -1 })
      .limit(RECENT_MESSAGES_LIMIT)
      .lean();

    recentMessages.reverse();

    const matchedJobs = await JobMatch.find({ userId })
      .sort({ matchScore: -1 })
      .limit(5)
      .populate('jobId')
      .lean();

    const assistantReply = await generateResumeChatReply({
      resumeProfile,
      conversationSummary: session.summary,
      recentMessages,
      matchedJobs,
      userMessage: message.trim()
    });

    const assistantMessageNumber = userMessageNumber + 1;

    await ChatMessage.create({
      sessionId: session._id,
      userId,
      role: 'assistant',
      message: assistantReply,
      messageNumber: assistantMessageNumber
    });

    session.totalMessages += 2;
    await session.save();

    session = await maybeSummarizeOldMessages(session);

    return res.status(200).json({
      success: true,
      sessionId: session._id,
      reply: assistantReply,
      summaryUpdated: session.summarizedUntilMessageNumber > 0
    });
  } catch (error) {
    console.error('Resume Chat Error:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
}

async function getResumeChatHistory(req, res) {
  try {
    const userId = req.user._id;

    const resumeProfile = await ResumeProfile.findOne({ userId }).lean();

    if (!resumeProfile) {
      return res.status(200).json({
        success: true,
        session: null,
        messages: []
      });
    }

    const session = await ChatSession.findOne({
      userId,
      resumeProfileId: resumeProfile._id,
      isActive: true
    }).lean();

    if (!session) {
      return res.status(200).json({
        success: true,
        session: null,
        messages: []
      });
    }

    const messages = await ChatMessage.find({
      sessionId: session._id
    })
      .sort({ messageNumber: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      session,
      messages
    });
  } catch (error) {
    console.error('Get Chat History Error:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
}

async function resetResumeChat(req, res) {
  try {
    const userId = req.user._id;

    await ChatSession.updateMany(
      { userId, isActive: true },
      { $set: { isActive: false } }
    );

    return res.status(200).json({
      success: true,
      message: 'Chat reset successfully.'
    });
  } catch (error) {
    console.error('Reset Chat Error:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
}

export {
  sendResumeChatMessage,
  getResumeChatHistory,
  resetResumeChat
};