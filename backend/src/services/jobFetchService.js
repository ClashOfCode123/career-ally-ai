import axios from 'axios';
import crypto from 'crypto';
import GlobalJob from '../models/GlobalJob.js';

async function fetchAndIngestJobs(querySignature) {
  try {
    const { skills, preferredRole, country, targetCompanies } = querySignature;
    const targetJobType = preferredRole || 'full-time';

    const roleKeyword = preferredRole === 'intern' ? 'Intern' : '';
    
    let searchQuery = '';
    if (targetCompanies && targetCompanies.length > 0) {
      const mainCompany = targetCompanies[0].trim();
      searchQuery = `Software Engineer ${roleKeyword} at ${mainCompany}`.trim();
    } else {
      const topSkills = skills && skills.length > 0 ? skills.slice(0, 2).join(' ') : 'Software';
      searchQuery = `${topSkills} Engineer ${roleKeyword}`.trim();
    }

    console.log(`🚀 Sending Targeted Query to JSearch [${country || 'us'}]: "${searchQuery}"`);

    const employmentType = preferredRole === 'intern' ? 'INTERN' : 'FULLTIME';

    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: {
        query: searchQuery,
        num_pages: '1',
        date_posted: 'month',
        employment_types: employmentType,
        country: country || 'us'
      },
      headers: {
        'X-RapidAPI-Key': process.env.JSEARCH_API_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });

    const jobsData = response.data?.data || [];
    console.log(`✅ JSearch returned ${jobsData.length} live jobs`);

    if (jobsData.length === 0) {
      return [];
    }

    const operations = jobsData.map(job => {
      const cleanCompany = (job.employer_name || 'unknown').toLowerCase().trim();
      const cleanTitle = (job.job_title || 'unknown').toLowerCase().trim();
      const cleanLocation = (job.job_city || 'remote').toLowerCase().trim();

      const jobHash = crypto
        .createHash('sha256')
        .update(`${cleanCompany}_${cleanTitle}_${cleanLocation}_${targetJobType}`)
        .digest('hex');

      let tags = [];
      if (job.job_required_skills) {
        tags = job.job_required_skills.map(skill => skill.toLowerCase().trim());
      } else if (skills) {
        tags = skills.filter(skill => 
          (job.job_description || '').toLowerCase().includes(skill.toLowerCase())
        );
      }

      let yoeRequired = 0;
      if (preferredRole !== 'intern' && job.job_required_experience?.required_experience_in_months) {
        yoeRequired = Math.floor(job.job_required_experience.required_experience_in_months / 12);
      }

      return {
        updateOne: {
          filter: { jobHash },
          update: {
            $setOnInsert: {
              jobHash,
              title: job.job_title || 'Software Engineer',
              company: job.employer_name || 'Unknown Company',
              applyUrl: job.job_apply_link || job.employer_website || '',
              location: job.job_city && job.job_country ? `${job.job_city}, ${job.job_country}` : 'Remote',
              tags: [...new Set(tags)],
              yoeRequired,
              jobType: targetJobType,
              createdAt: new Date()
            }
          },
          upsert: true
        }
      };
    });

    if (operations.length > 0) {
      await GlobalJob.bulkWrite(operations, { ordered: false });
      console.log(`💾 Saved ${operations.length} new jobs to MongoDB`);
    }

    return jobsData.map(job => ({
        title: job.job_title || 'Software Engineer',
        company: job.employer_name || 'Unknown Company',
        applyUrl: job.job_apply_link || job.employer_website || '',
        location: job.job_city && job.job_country ? `${job.job_city}, ${job.job_country}` : 'Remote',
        tags: job.job_required_skills || [],
        jobType: targetJobType,
        yoeRequired: job.job_required_experience?.required_experience_in_months ? Math.floor(job.job_required_experience.required_experience_in_months / 12) : 0,
        job_id: job.job_id
    }));
    
  } catch (error) {
    console.error('❌ JSearch Fetch Error:', error.message);
    throw error;
  }
}

export { fetchAndIngestJobs };