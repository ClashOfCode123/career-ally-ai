import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function formatMessages(messages) {
  if (!messages || messages.length === 0) return 'No recent messages.';

  return messages
    .map(msg => `${msg.role.toUpperCase()}: ${msg.message}`)
    .join('\n');
}

function formatMatchedJobs(matchedJobs) {
  if (!matchedJobs || matchedJobs.length === 0) {
    return 'No matched jobs available.';
  }

  return matchedJobs
    .map((item, index) => {
      const job = item.jobId || item;

      return `
${index + 1}. ${job.title || 'Unknown Role'}
Company: ${job.company || 'Unknown Company'}
Location: ${job.location || 'Unknown'}
Match Score: ${item.matchScore || 0}
Required YoE: ${job.yoeRequired || 0}
Tags: ${(job.tags || []).join(', ')}
Apply URL: ${job.applyUrl || 'N/A'}
`;
    })
    .join('\n');
}

async function generateResumeChatReply({
  resumeProfile,
  conversationSummary,
  recentMessages,
  matchedJobs,
  userMessage
}) {
  const prompt = `
You are a resume and job-matching career assistant.

Your job:
- Answer based only on the user's resume profile, matched jobs, previous summary, recent messages, and current question.
- Do not invent experience, skills, education, companies, or achievements.
- If the user lacks something, say it clearly.
- Be direct, practical, and specific.
- If asked to improve resume text, produce improved text.
- If asked about job suitability, compare skills and gaps.
- If asked about career direction, suggest realistic next steps.

Resume Profile:
Career Summary: ${resumeProfile.careerSummary || 'N/A'}
Skills: ${(resumeProfile.skills || []).join(', ')}
Years of Experience: ${resumeProfile.yoe || 0}
Batch Year: ${resumeProfile.batchYear || 0}
Preferred Role: ${resumeProfile.preferredRole || 'full-time'}
Country: ${resumeProfile.country || 'us'}
Target Companies: ${(resumeProfile.targetCompanies || []).join(', ') || 'N/A'}
Strengths: ${(resumeProfile.strengths || []).join(', ') || 'N/A'}
Weaknesses: ${(resumeProfile.weaknesses || []).join(', ') || 'N/A'}
Suggested Roles: ${(resumeProfile.suggestedRoles || []).join(', ') || 'N/A'}

Matched Jobs:
${formatMatchedJobs(matchedJobs)}

Previous Conversation Summary:
${conversationSummary || 'No previous summary yet.'}

Recent Messages:
${formatMessages(recentMessages)}

Current User Message:
${userMessage}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });

  return response.text || 'Sorry, I could not generate a response.';
}

async function generateUpdatedConversationSummary({
  existingSummary,
  messagesToSummarize
}) {
  const prompt = `
Update the conversation summary.

You must preserve:
- user's career goals
- resume issues discussed
- job preferences
- advice already given
- decisions made
- pending tasks
- important resume facts
- important job-matching facts

Keep it compact but useful for future chatbot memory.

Existing Summary:
${existingSummary || 'No previous summary.'}

New Messages To Add:
${formatMessages(messagesToSummarize)}

Return only the updated summary text.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });

  return response.text || existingSummary || '';
}

export {
  generateResumeChatReply,
  generateUpdatedConversationSummary
};