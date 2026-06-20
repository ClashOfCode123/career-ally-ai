import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function parseResume(fileBuffer, userYoE, userCompanies) {
  try {
    if (!fileBuffer) {
      throw new Error('FILE_BUFFER_MISSING');
    }

    const prompt = `Analyze the attached resume PDF and extract technical skills (no soft skills), years of experience (number), graduation batch year (number), and preferred role ('intern' or 'full-time'). If batch year is missing, return 0. If role is unclear, default to 'full-time'.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            data: fileBuffer.toString('base64'),
            mimeType: 'application/pdf'
          }
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            skills: { type: 'ARRAY', items: { type: 'STRING' } },
            yoe: { type: 'NUMBER' },
            batchYear: { type: 'NUMBER' },
            preferredRole: { type: 'STRING' }
          },
          required: ['skills', 'yoe', 'batchYear', 'preferredRole']
        }
      }
    });

    const result = JSON.parse(response.text);

    const sanitizedSkills = Array.isArray(result.skills)
      ? [...new Set(result.skills.map(s => s.toLowerCase().trim()))]
      : [];

    const sanitizedCompanies = Array.isArray(userCompanies)
      ? userCompanies.map(c => c.toLowerCase().trim())
      : typeof userCompanies === 'string'
        ? userCompanies.split(',').map(c => c.toLowerCase().trim())
        : [];

    return {
      skills: sanitizedSkills,
      yoe: Math.max(0, Math.floor(Number(result.yoe || userYoE)) || 0),
      batchYear: Number(result.batchYear) || 0,
      preferredRole: ['intern', 'full-time'].includes(result.preferredRole) ? result.preferredRole : 'full-time',
      targetCompanies: sanitizedCompanies.filter(Boolean)
    };
  } catch (error) {
    throw error;
  }
}

export { parseResume };