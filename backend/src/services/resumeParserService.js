import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function cleanStringArray(value) {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value
        .map(item => String(item).toLowerCase().trim())
        .filter(Boolean)
    )
  ];
}

async function parseResume(fileBuffer, userYoE, userCompanies) {
  try {
    if (!fileBuffer) {
      throw new Error('FILE_BUFFER_MISSING');
    }

    const prompt = `
Analyze the attached resume PDF.

Extract only truthful information from the resume.
Do not invent skills, companies, projects, education, or experience.

Return:
- technical skills only, no soft skills
- years of experience as a number
- graduation batch year as number, return 0 if missing
- preferred role as either "intern" or "full-time"
- raw resume text in clean plain text
- short career summary
- strengths
- weaknesses or missing areas
- suggested job roles

If something is unclear, use a safe default.
`;

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
            skills: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            },
            yoe: {
              type: 'NUMBER'
            },
            batchYear: {
              type: 'NUMBER'
            },
            preferredRole: {
              type: 'STRING'
            },
            rawResumeText: {
              type: 'STRING'
            },
            careerSummary: {
              type: 'STRING'
            },
            strengths: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            },
            weaknesses: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            },
            suggestedRoles: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            }
          },
          required: [
            'skills',
            'yoe',
            'batchYear',
            'preferredRole',
            'rawResumeText',
            'careerSummary',
            'strengths',
            'weaknesses',
            'suggestedRoles'
          ]
        }
      }
    });

    const result = JSON.parse(response.text);

    const sanitizedCompanies = Array.isArray(userCompanies)
      ? userCompanies.map(c => String(c).toLowerCase().trim())
      : typeof userCompanies === 'string'
        ? userCompanies.split(',').map(c => c.toLowerCase().trim())
        : [];

    return {
      skills: cleanStringArray(result.skills),
      yoe: Math.max(0, Math.floor(Number(result.yoe || userYoE)) || 0),
      batchYear: Number(result.batchYear) || 0,
      preferredRole: ['intern', 'full-time'].includes(result.preferredRole)
        ? result.preferredRole
        : 'full-time',
      targetCompanies: sanitizedCompanies.filter(Boolean),
      rawResumeText: String(result.rawResumeText || ''),
      careerSummary: String(result.careerSummary || ''),
      strengths: cleanStringArray(result.strengths),
      weaknesses: cleanStringArray(result.weaknesses),
      suggestedRoles: cleanStringArray(result.suggestedRoles)
    };
  } catch (error) {
    throw error;
  }
}

export { parseResume };