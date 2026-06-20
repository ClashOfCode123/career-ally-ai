import crypto from 'crypto';
import { parseResume } from '../services/resumeParserService.js';
import { fetchAndIngestJobs } from '../services/jobFetchService.js';
import JobMatch from '../models/JobMatch.js';
import GlobalJob from '../models/GlobalJob.js';

function generateCacheKey(apiParams) {
  const sortedParams = Object.keys(apiParams)
    .sort()
    .reduce((obj, key) => {
      obj[key] = String(apiParams[key]).toLowerCase().trim();
      return obj;
    }, {});

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(sortedParams))
    .digest('hex');
}

function normalizeSkill(skill) {
  return skill.toLowerCase().replace(/[\s\-\.]/g, '');
}

function calculateMatchScore(userSkills, jobTags) {
  if (!userSkills.length || !jobTags.length) return 0;
  
  const normalizedUserSkills = new Set(userSkills.map(normalizeSkill));
  const normalizedJobTags = [...new Set(jobTags.map(normalizeSkill))];
  
  const matchedSkills = normalizedJobTags.filter(tag => normalizedUserSkills.has(tag));
  const rawScore = (matchedSkills.length / normalizedJobTags.length) * 100;
  
  return Math.min(Math.round(rawScore), 100);
}

async function uploadAndMatch(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'NO_RESUME_UPLOADED' });
    }

    const { yoe, targetCompanies, jobType, country } = req.body;
    const userId = req.user._id;

    const querySignature = await parseResume(req.file.buffer, yoe, targetCompanies);
    
    const finalPreferredRole = jobType || querySignature.preferredRole || 'full-time';
    querySignature.preferredRole = finalPreferredRole;
    querySignature.country = country || 'us';

    const apiQueryString = `BroadSearch_${finalPreferredRole}`;
    const apiParams = {
      query: apiQueryString,
      page: '1',
      num_pages: '1',
      role: finalPreferredRole,
      targets: targetCompanies,
      country: querySignature.country
    };

    const currentCacheKey = generateCacheKey(apiParams);

    let rawJobs = await GlobalJob.find({ cacheKey: currentCacheKey });

    if (rawJobs.length === 0) {
      const liveJobs = await fetchAndIngestJobs(querySignature);
      
      const jobsToSave = liveJobs.map(job => {
        const uniqueId = job.job_id || job.applyUrl || Date.now().toString();
        return {
          ...job,
          cacheKey: currentCacheKey,
          jobHash: crypto.createHash('sha256').update(uniqueId).digest('hex')
        };
      });

      if (jobsToSave.length > 0) {
        try {
          await GlobalJob.insertMany(jobsToSave, { ordered: false });
        } catch (insertError) {
          if (insertError.code !== 11000) console.error('Bulk Insert Error:', insertError);
        }
      }
      
      rawJobs = jobsToSave;
    }

    const matchOperations = [];
    const finalPersonalizedJobs = [];

    for (const job of rawJobs) {
      const jobDocument = job._doc ? job._doc : job;

      if (querySignature.targetCompanies && querySignature.targetCompanies.length > 0) {
        const currentCompany = (jobDocument.company || '').toLowerCase().trim();
        const matchesCompany = querySignature.targetCompanies.some(target => 
          currentCompany.includes(target.toLowerCase().trim())
        );
        if (!matchesCompany) continue;
      }
      
      if (jobDocument.yoeRequired > querySignature.yoe + 1) {
        continue;
      }

      if (jobDocument.jobType !== finalPreferredRole) {
        continue;
      }

      const score = calculateMatchScore(querySignature.skills, jobDocument.tags);

      matchOperations.push({
        updateOne: {
          filter: { userId, jobId: jobDocument._id || jobDocument.jobHash },
          update: {
            $set: { matchScore: score, createdAt: new Date() }
          },
          upsert: true
        }
      });

      finalPersonalizedJobs.push({ ...jobDocument, matchScore: score });
    }

    if (matchOperations.length > 0) {
      await JobMatch.bulkWrite(matchOperations, { ordered: false });
    }

    finalPersonalizedJobs.sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      success: true,
      extractedProfile: querySignature,
      matches: finalPersonalizedJobs
    });

  } catch (error) {
    console.error('Job Matching Error:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
}

export { uploadAndMatch };