// src/services/scoringService.ts
import { MatchScore, DetailedScore, ResumeData, ComprehensiveScore, ScoringMode, ExtractionMode, EnhancedComprehensiveScore, TIER_WEIGHTS } from '../types/resume';
import { enhancedScoringService, EnhancedScoringService } from './enhancedScoringService';
import { synonymExpansionService } from './synonymExpansionService';
import { edenAITextService } from './edenAITextService';

const ENABLE_SEMANTIC_MATCHING = true;
const USE_ENHANCED_SCORING = true; // Enable 220+ metrics scoring

// JD-Based Scoring Prompt - evaluates resume relative to specific JD
const buildJDBasedPrompt = (
  resumeText: string,
  jobDescription: string,
  jobTitle: string,
  filename: string | undefined,
  extractionMode: string,
  trimmed: boolean
): string => `You are an Applicant Tracking System (ATS) and senior technical recruiter.
Your task is to score how well a candidate's resume matches ONE SPECIFIC job description (JD).
You must evaluate EVERYTHING RELATIVE TO THIS JD, not to the general job market.

------------------------ INPUT: RESUME & JD ------------------------

RESUME (FULL TEXT):
${resumeText}

JOB DESCRIPTION (FULL TEXT):
${jobDescription}

JOB TITLE: ${jobTitle}
${filename ? `RESUME FILENAME: ${filename}` : ''}

SCORING MODE: JD_BASED
EXTRACTION MODE: ${extractionMode}
CONTENT_TRIMMED: ${trimmed}

------------------------ SCORING RULES (JD-BASED) ------------------------

You are scoring how well THIS resume matches THIS job.
Do NOT imagine other jobs or generic expectations. Only this JD matters.

1) Score from 0–100:
   - 0 = no meaningful match to JD
   - 50 = partially relevant but many gaps
   - 80+ = strong match
   - 90+ = excellent, interview very likely

2) Use this 8-metric rubric (weights sum to 100):

   a) jd_keywords_match (weight 25)
      - How well do resume keywords match critical terms in the JD?
      - Include exact and close semantic matches:
        - job-specific tools, libraries, frameworks
        - key responsibilities and outcomes
        - important domain terms (e.g. FinTech, e-commerce, healthcare)
      - A high score requires good coverage of the most important JD keywords.

   b) skills_alignment (weight 20)
      - How well do technical and soft skills align with JD requirements?
      - Look at the SKILLS section and skills implied in projects/experience.
      - High score = required skills clearly present and supported by evidence.

   c) experience_relevance (weight 20)
      - Are the work experiences directly relevant to this JD?
      - Consider:
        - seniority level vs JD (junior/mid/senior)
        - responsibilities and impact similar to JD expectations
        - industry/domain if specified in the JD.

   d) project_relevance (weight 10)
      - Are projects clearly aligned with JD tech stack and responsibilities?
      - High score when:
        - projects demonstrate the same stack / problem space as the JD
        - they show impact and problem-solving related to the JD.

   e) education_fit (weight 5)
      - Does education meet or exceed the JD's expectations?
      - Degree level, field of study, relevant coursework if mentioned.

   f) certifications_fit (weight 5)
      - Are certifications relevant to the JD (cloud, security, data, etc.)?
      - High score if certifications directly support JD requirements.

   g) ats_formatting (weight 10)
      - Is the resume ATS-friendly?
      - Check:
        - clear section headings (Experience, Education, Skills, Projects, etc.)
        - simple layout (no complex tables, no multi-column layout)
        - bullets readable in plain text
        - no excessive graphics or unusual characters.

   h) overall_quality (weight 5)
      - Writing clarity, professional tone, consistency, and conciseness.
      - Grammar and spelling should not distract.

3) Match Band and Interview Probability

Based on the overall 0–100 score:
- 90–100: "Excellent Match"       → interview_probability_range "90–100%"
- 80–89:  "Very Good Match"       → "80–89%"
- 70–79:  "Good Match"            → "60–79%"
- 60–69:  "Fair Match"            → "40–59%"
- 50–59:  "Below Average"         → "25–39%"
- 40–49:  "Poor Match"            → "10–24%"
- 30–39:  "Very Poor"             → "3–9%"
- 20–29:  "Inadequate"            → "1–2%"
- 0–19:   "Minimal Match"         → "0–0.5%"

4) Missing Keywords (JD-based)
- Identify 5–15 important JD keywords that are:
  - clearly required in the JD, AND
  - missing or very weak in the resume.
- These must be concrete terms (skills, tools, responsibilities), not vague advice.

5) Example Rewrites
- Provide 1 example rewrite for EXPERIENCE and 1 for PROJECTS:
  - "experience.original": a weak bullet from the resume text.
  - "experience.improved": a stronger JD-aligned version (with action verb + metric).
  - "experience.explanation": why it's better.
  Same for "projects".

6) Actions / Recommendations
- Provide 5–10 very concrete, JD-specific actions the candidate can take to improve their match.
- Each action must be practical and refer to JD requirements.

7) Confidence
- Confidence is how confident you are in the scoring:
  - "High" → Resume and JD are clear and detailed.
  - "Medium" → Some ambiguity or missing info.
  - "Low" → Very sparse resume or vague JD.

------------------------ OUTPUT FORMAT (STRICT JSON) ------------------------

Respond ONLY with valid JSON in this exact structure.
Do NOT include explanations outside JSON.
Do NOT include Markdown or backticks.

{
  "overall": 0-100,
  "match_band": "Excellent Match | Very Good Match | Good Match | Fair Match | Below Average | Poor Match | Very Poor | Inadequate | Minimal Match",
  "interview_probability_range": "string like 80-89%",
  "confidence": "High | Medium | Low",
  "rubric_version": "jd_ats_v2.0",
  "weighting_mode": "JD",
  "extraction_mode": "${extractionMode}",
  "trimmed": ${trimmed},
  "job_title": "${jobTitle}",
  "breakdown": [
    {
      "key": "jd_keywords_match",
      "name": "JD Keywords Match",
      "weight_pct": 25,
      "score": 0-25,
      "max_score": 25,
      "contribution": 0.0,
      "details": "Short explanation of how well JD keywords are covered."
    },
    {
      "key": "skills_alignment",
      "name": "Skills Alignment",
      "weight_pct": 20,
      "score": 0-20,
      "max_score": 20,
      "contribution": 0.0,
      "details": "Short explanation of skill alignment vs JD."
    },
    {
      "key": "experience_relevance",
      "name": "Experience Relevance",
      "weight_pct": 20,
      "score": 0-20,
      "max_score": 20,
      "contribution": 0.0,
      "details": "Short explanation of role & responsibilities fit vs JD."
    },
    {
      "key": "project_relevance",
      "name": "Project Relevance",
      "weight_pct": 10,
      "score": 0-10,
      "max_score": 10,
      "contribution": 0.0,
      "details": "Short explanation of project relevance to JD."
    },
    {
      "key": "education_fit",
      "name": "Education Fit",
      "weight_pct": 5,
      "score": 0-5,
      "max_score": 5,
      "contribution": 0.0,
      "details": "Short explanation of education vs JD."
    },
    {
      "key": "certifications_fit",
      "name": "Certifications Fit",
      "weight_pct": 5,
      "score": 0-5,
      "max_score": 5,
      "contribution": 0.0,
      "details": "Short explanation of certifications vs JD."
    },
    {
      "key": "ats_formatting",
      "name": "ATS Formatting",
      "weight_pct": 10,
      "score": 0-10,
      "max_score": 10,
      "contribution": 0.0,
      "details": "Short explanation of ATS-friendliness."
    },
    {
      "key": "overall_quality",
      "name": "Overall Quality",
      "weight_pct": 5,
      "score": 0-5,
      "max_score": 5,
      "contribution": 0.0,
      "details": "Short explanation of clarity and professionalism."
    }
  ],
  "missing_keywords": ["keyword1", "keyword2", "keyword3"],
  "actions": ["action1", "action2", "action3"],
  "example_rewrites": {
    "experience": {
      "original": "Original weak experience bullet from resume",
      "improved": "Improved, JD-aligned experience bullet with metrics",
      "explanation": "Why this rewrite is stronger and more JD-aligned."
    },
    "projects": {
      "original": "Original weak project bullet from resume",
      "improved": "Improved, JD-aligned project bullet with metrics",
      "explanation": "Why this rewrite is stronger and more JD-aligned."
    }
  },
  "notes": ["short note 1", "short note 2"],
  "analysis": "2–3 sentence summary of overall JD match.",
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "improvementAreas": ["area1", "area2", "area3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "cached": false
}`;

// General ATS Scoring Prompt - evaluates resume against industry standards
const buildGeneralPrompt = (
  resumeText: string,
  filename: string | undefined,
  extractionMode: string,
  trimmed: boolean
): string => `You are an ATS and senior resume reviewer.
Your task is to evaluate the overall quality and ATS compatibility of a resume WITHOUT any specific job description.

RESUME (FULL TEXT):
${resumeText}

${filename ? `RESUME FILENAME: ${filename}` : ''}

SCORING MODE: GENERAL
EXTRACTION MODE: ${extractionMode}
CONTENT_TRIMMED: ${trimmed}

------------------------ SCORING RULES (GENERAL) ------------------------

Evaluate this resume against industry best practices and ATS compatibility standards.

1) Score from 0–100:
   - 0 = very poor resume quality
   - 50 = average, needs improvement
   - 80+ = strong, well-formatted resume
   - 90+ = excellent, professional quality

2) Use this 8-metric rubric (weights sum to 100):

   a) keywords_coverage (weight 25)
      - Does the resume contain relevant industry keywords?
      - Are technical skills, tools, and technologies clearly listed?

   b) skills_presentation (weight 20)
      - Are skills well-organized and categorized?
      - Is there a good mix of technical and soft skills?

   c) experience_quality (weight 20)
      - Are work experiences well-described with achievements?
      - Do bullets use action verbs and quantify impact?

   d) project_quality (weight 10)
      - Are projects clearly described with technologies used?
      - Do they demonstrate problem-solving and impact?

   e) education_completeness (weight 5)
      - Is education section complete with degree, school, year?

   f) certifications_relevance (weight 5)
      - Are certifications listed and relevant to the field?

   g) ats_formatting (weight 10)
      - Is the resume ATS-friendly?
      - Clear section headings, simple layout, no tables/graphics.

   h) overall_quality (weight 5)
      - Writing clarity, professional tone, grammar, spelling.

3) Quality Band
- 90–100: "Excellent Quality"
- 80–89:  "Very Good Quality"
- 70–79:  "Good Quality"
- 60–69:  "Fair Quality"
- 50–59:  "Below Average"
- 0–49:   "Needs Improvement"

4) Recommendations
- Provide 5–10 actionable recommendations to improve the resume.

5) Example Rewrites
- Provide 1 example rewrite for EXPERIENCE and 1 for PROJECTS.

------------------------ OUTPUT FORMAT (STRICT JSON) ------------------------

Respond ONLY with valid JSON:

{
  "overall": 0-100,
  "match_band": "Excellent Quality | Very Good Quality | Good Quality | Fair Quality | Below Average | Needs Improvement",
  "interview_probability_range": "N/A",
  "confidence": "High | Medium | Low",
  "rubric_version": "general_ats_v2.0",
  "weighting_mode": "GENERAL",
  "extraction_mode": "${extractionMode}",
  "trimmed": ${trimmed},
  "job_title": "N/A",
  "breakdown": [
    {
      "key": "keywords_coverage",
      "name": "Keywords Coverage",
      "weight_pct": 25,
      "score": 0-25,
      "max_score": 25,
      "contribution": 0.0,
      "details": "Explanation of keyword coverage."
    },
    {
      "key": "skills_presentation",
      "name": "Skills Presentation",
      "weight_pct": 20,
      "score": 0-20,
      "max_score": 20,
      "contribution": 0.0,
      "details": "Explanation of skills presentation."
    },
    {
      "key": "experience_quality",
      "name": "Experience Quality",
      "weight_pct": 20,
      "score": 0-20,
      "max_score": 20,
      "contribution": 0.0,
      "details": "Explanation of experience quality."
    },
    {
      "key": "word_variety",
      "name": "Word Variety",
      "weight_pct": 10,
      "score": 0-10,
      "max_score": 10,
      "contribution": 0.0,
      "details": "Checks for repeated words across resume bullets to ensure vocabulary variety."
    },
    {
      "key": "education_completeness",
      "name": "Education Completeness",
      "weight_pct": 5,
      "score": 0-5,
      "max_score": 5,
      "contribution": 0.0,
      "details": "Explanation of education completeness."
    },
    {
      "key": "certifications_relevance",
      "name": "Certifications Relevance",
      "weight_pct": 5,
      "score": 0-5,
      "max_score": 5,
      "contribution": 0.0,
      "details": "Explanation of certifications."
    },
    {
      "key": "ats_formatting",
      "name": "ATS Formatting",
      "weight_pct": 10,
      "score": 0-10,
      "max_score": 10,
      "contribution": 0.0,
      "details": "Explanation of ATS formatting."
    },
    {
      "key": "overall_quality",
      "name": "Overall Quality",
      "weight_pct": 5,
      "score": 0-5,
      "max_score": 5,
      "contribution": 0.0,
      "details": "Explanation of overall quality."
    }
  ],
  "missing_keywords": [],
  "actions": ["action1", "action2", "action3"],
  "example_rewrites": {
    "experience": {
      "original": "Original weak experience bullet",
      "improved": "Improved experience bullet with metrics",
      "explanation": "Why this rewrite is stronger."
    },
    "projects": {
      "original": "Original weak project bullet",
      "improved": "Improved project bullet with metrics",
      "explanation": "Why this rewrite is stronger."
    }
  },
  "notes": ["note1", "note2"],
  "analysis": "2–3 sentence summary of overall quality.",
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "improvementAreas": ["area1", "area2", "area3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "cached": false
}`;

// Cache for storing scoring results
const scoreCache = new Map<string, { result: ComprehensiveScore; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper: Convert TierScores to breakdown format for UI compatibility
import { TierScores, CriticalMetrics, MetricScore } from '../types/resume';

// Helper: Safe round that handles NaN values
const safeRound = (value: number, fallback: number = 0): number => {
  if (isNaN(value) || !isFinite(value)) return fallback;
  return Math.round(value);
};

/**
 * FIXED: Convert tier scores to breakdown format using ACTUAL weights from tier scores
 * This ensures the breakdown matches the real score calculation including fresher adjustments
 */
const convertTierScoresToBreakdown = (tierScores: TierScores, _criticalMetrics: CriticalMetrics): MetricScore[] => {
  const breakdown: MetricScore[] = [];

  // FIXED: Use actual weights from tier scores (handles fresher/experienced differences)
  
  // Skills & Keywords (dynamic weight based on role type)
  const skillsWeight = tierScores.skills_keywords.weight || 25;
  breakdown.push({
    key: 'skills_keywords',
    name: 'Skills & Keywords',
    weight_pct: skillsWeight,
    score: safeRound((tierScores.skills_keywords.percentage * skillsWeight) / 100), // FIXED: Use actual percentage and weight
    max_score: skillsWeight,
    contribution: isNaN(tierScores.skills_keywords.weighted_contribution) ? 0 : tierScores.skills_keywords.weighted_contribution,
    details: tierScores.skills_keywords.top_issues[0] || 'Good skills coverage'
  });

  // Experience (dynamic weight - 0 for freshers, 25 for experienced)
  const experienceWeight = tierScores.experience.weight || 25;
  const experienceDetails = experienceWeight === 0 
    ? 'Not required for this job role (Fresher)' 
    : (tierScores.experience.top_issues[0] || 'Good experience section');
  
  breakdown.push({
    key: 'experience',
    name: 'Experience & Achievements',
    weight_pct: experienceWeight,
    score: safeRound((tierScores.experience.percentage * experienceWeight) / 100), // FIXED: Use actual percentage and weight
    max_score: experienceWeight,
    contribution: isNaN(tierScores.experience.weighted_contribution) ? 0 : tierScores.experience.weighted_contribution,
    details: experienceDetails
  });

  // Content Structure (dynamic weight)
  const contentWeight = tierScores.content_structure.weight || 10;
  breakdown.push({
    key: 'content_structure',
    name: 'Content Structure',
    weight_pct: contentWeight,
    score: safeRound((tierScores.content_structure.percentage * contentWeight) / 100),
    max_score: contentWeight,
    contribution: isNaN(tierScores.content_structure.weighted_contribution) ? 0 : tierScores.content_structure.weighted_contribution,
    details: tierScores.content_structure.top_issues[0] || 'Good content structure'
  });

  // Basic Structure (dynamic weight)
  const basicWeight = tierScores.basic_structure.weight || 8;
  breakdown.push({
    key: 'basic_structure',
    name: 'Formatting & Structure',
    weight_pct: basicWeight,
    score: safeRound((tierScores.basic_structure.percentage * basicWeight) / 100),
    max_score: basicWeight,
    contribution: isNaN(tierScores.basic_structure.weighted_contribution) ? 0 : tierScores.basic_structure.weighted_contribution,
    details: tierScores.basic_structure.top_issues[0] || 'Good formatting'
  });

  // Education (dynamic weight)
  const educationWeight = tierScores.education.weight || 6;
  breakdown.push({
    key: 'education',
    name: 'Education',
    weight_pct: educationWeight,
    score: safeRound((tierScores.education.percentage * educationWeight) / 100),
    max_score: educationWeight,
    contribution: isNaN(tierScores.education.weighted_contribution) ? 0 : tierScores.education.weighted_contribution,
    details: tierScores.education.top_issues[0] || 'Good education section'
  });

  // Certifications (dynamic weight)
  const certWeight = tierScores.certifications.weight || 4;
  breakdown.push({
    key: 'certifications',
    name: 'Certifications',
    weight_pct: certWeight,
    score: safeRound((tierScores.certifications.percentage * certWeight) / 100),
    max_score: certWeight,
    contribution: isNaN(tierScores.certifications.weighted_contribution) ? 0 : tierScores.certifications.weighted_contribution,
    details: tierScores.certifications.top_issues[0] || 'Add relevant certifications'
  });

  // Projects (dynamic weight)
  const projectsWeight = tierScores.projects.weight || 8;
  breakdown.push({
    key: 'projects',
    name: 'Projects',
    weight_pct: projectsWeight,
    score: safeRound((tierScores.projects.percentage * projectsWeight) / 100),
    max_score: projectsWeight,
    contribution: isNaN(tierScores.projects.weighted_contribution) ? 0 : tierScores.projects.weighted_contribution,
    details: tierScores.projects.top_issues[0] || 'Good projects'
  });

  // Competitive (dynamic weight)
  const competitiveWeight = tierScores.competitive.weight || 6;
  breakdown.push({
    key: 'competitive',
    name: 'Competitive Edge',
    weight_pct: competitiveWeight,
    score: safeRound((tierScores.competitive.percentage * competitiveWeight) / 100),
    max_score: competitiveWeight,
    contribution: isNaN(tierScores.competitive.weighted_contribution) ? 0 : tierScores.competitive.weighted_contribution,
    details: tierScores.competitive.top_issues[0] || 'Competitive profile'
  });

  // Culture Fit (dynamic weight)
  const cultureWeight = tierScores.culture_fit.weight || 4;
  breakdown.push({
    key: 'culture_fit',
    name: 'Culture Fit',
    weight_pct: cultureWeight,
    score: safeRound((tierScores.culture_fit.percentage * cultureWeight) / 100),
    max_score: cultureWeight,
    contribution: isNaN(tierScores.culture_fit.weighted_contribution) ? 0 : tierScores.culture_fit.weighted_contribution,
    details: tierScores.culture_fit.top_issues[0] || 'Good culture fit signals'
  });

  // Qualitative (dynamic weight)
  const qualitativeWeight = tierScores.qualitative.weight || 4;
  breakdown.push({
    key: 'qualitative',
    name: 'Writing Quality',
    weight_pct: qualitativeWeight,
    score: safeRound((tierScores.qualitative.percentage * qualitativeWeight) / 100),
    max_score: qualitativeWeight,
    contribution: isNaN(tierScores.qualitative.weighted_contribution) ? 0 : tierScores.qualitative.weighted_contribution,
    details: tierScores.qualitative.top_issues[0] || 'Good writing quality'
  });

  // Note: Red Flags are penalty-based, not weighted, so not included in breakdown

  return breakdown;
};

// Helper: Parse resume text to structured ResumeData
// ENHANCED: Now extracts skills from text for better scoring accuracy
const parseResumeTextToData = (resumeText: string, targetRole?: string): ResumeData => {
  // Basic parsing - extract what we can from text
  const lines = resumeText.split('\n').filter(l => l.trim());
  const textLower = resumeText.toLowerCase();
  
  // Try to extract name (usually first non-empty line)
  const name = lines[0]?.trim() || '';
  
  // Try to extract email
  const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
  const email = emailMatch ? emailMatch[0] : '';
  
  // Try to extract phone
  const phoneMatch = resumeText.match(/[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/);
  const phone = phoneMatch ? phoneMatch[0] : '';
  
  // Try to extract LinkedIn
  const linkedinMatch = resumeText.match(/linkedin\.com\/in\/[\w-]+/i);
  const linkedin = linkedinMatch ? `https://${linkedinMatch[0]}` : '';
  
  // Try to extract GitHub
  const githubMatch = resumeText.match(/github\.com\/[\w-]+/i);
  const github = githubMatch ? `https://${githubMatch[0]}` : '';

  // ENHANCED: Extract summary/career objective from text
  let summary = '';
  let careerObjective = '';
  
  // Look for CAREER OBJECTIVE or SUMMARY section
  const summaryPatterns = [
    /\b(?:CAREER\s*OBJECTIVE|PROFESSIONAL\s*SUMMARY|SUMMARY|PROFILE|ABOUT\s*ME|OBJECTIVE)\b[\s\S]*?(?=\b(?:SKILLS|EDUCATION|WORK\s*EXPERIENCE|EXPERIENCE|PROJECTS?|CERTIFICATIONS?)\b|$)/i,
  ];
  
  for (const pattern of summaryPatterns) {
    const summaryMatch = resumeText.match(pattern);
    if (summaryMatch) {
      // Extract the content after the header
      const summaryContent = summaryMatch[0]
        .replace(/^(?:CAREER\s*OBJECTIVE|PROFESSIONAL\s*SUMMARY|SUMMARY|PROFILE|ABOUT\s*ME|OBJECTIVE)\s*/i, '')
        .trim();
      
      if (summaryContent.length > 50) {
        summary = summaryContent;
        careerObjective = summaryContent;
        break;
      }
    }
  }

  // Extract work experience bullets (lines starting with bullet points or dashes)
  const bulletPattern = /^[\s]*[-•*]\s*(.+)/gm;
  const bullets: string[] = [];
  let match;
  while ((match = bulletPattern.exec(resumeText)) !== null) {
    bullets.push(match[1].trim());
  }

  // Create basic work experience from bullets
  const workExperience = bullets.length > 0 ? [{
    role: targetRole || 'Professional',
    company: 'Company',
    year: 'Present',
    bullets: bullets.slice(0, 10)
  }] : [];

  // ENHANCED: Extract skills from text
  // Technical skills to look for
  const techSkillsList = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala',
    'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring', 'spring boot', '.net', 'rails',
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra', 'oracle', 'sql', 'firebase', 'supabase',
    'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'devops',
    'git', 'jira', 'agile', 'scrum', 'rest', 'graphql', 'api', 'microservices', 'serverless',
    'machine learning', 'ai', 'tensorflow', 'pytorch', 'data science', 'nlp',
    'html', 'css', 'sass', 'tailwind', 'bootstrap', 'webpack', 'vite',
    'linux', 'unix', 'bash', 'powershell', 'nginx', 'apache'
  ];
  
  const toolsList = [
    'figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'xd',
    'tableau', 'power bi', 'excel', 'looker',
    'slack', 'trello', 'asana', 'notion', 'confluence',
    'postman', 'swagger', 'insomnia',
    'jest', 'mocha', 'cypress', 'selenium', 'junit', 'pytest'
  ];

  // Extract found skills
  const foundTechSkills: string[] = [];
  const foundTools: string[] = [];
  
  techSkillsList.forEach(skill => {
    if (textLower.includes(skill.toLowerCase())) {
      // Capitalize first letter for display
      const displaySkill = skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (!foundTechSkills.includes(displaySkill)) {
        foundTechSkills.push(displaySkill);
      }
    }
  });
  
  toolsList.forEach(tool => {
    if (textLower.includes(tool.toLowerCase())) {
      const displayTool = tool.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (!foundTools.includes(displayTool)) {
        foundTools.push(displayTool);
      }
    }
  });

  // Build skills array
  const skills: { category: string; count: number; list: string[] }[] = [];
  
  if (foundTechSkills.length > 0) {
    skills.push({
      category: 'Technical Skills',
      count: foundTechSkills.length,
      list: foundTechSkills
    });
  }
  
  if (foundTools.length > 0) {
    skills.push({
      category: 'Tools & Technologies',
      count: foundTools.length,
      list: foundTools
    });
  }

  // ENHANCED: Extract projects from text
  // Look for PROJECTS section and extract project titles and bullets
  const projects: { title: string; bullets: string[]; githubUrl?: string }[] = [];
  
  // Find PROJECTS section in resume text
  const projectsSectionMatch = resumeText.match(/\bPROJECTS?\b[\s\S]*?(?=\b(?:EDUCATION|CERTIFICATIONS?|SKILLS|WORK\s*EXPERIENCE|EXPERIENCE|ACHIEVEMENTS?|REFERENCES?)\b|$)/i);
  
  if (projectsSectionMatch) {
    const projectsSection = projectsSectionMatch[0];
    const projectLines = projectsSection.split('\n').filter(l => l.trim());
    
    let currentProject: { title: string; bullets: string[] } | null = null;
    
    for (let i = 0; i < projectLines.length; i++) {
      const line = projectLines[i].trim();
      
      // Skip the "PROJECTS" header itself
      if (/^PROJECTS?$/i.test(line)) continue;
      
      // Check if this is a project title (not a bullet point, not empty, not too long)
      const isBullet = /^[-•*]\s/.test(line) || /^\d+\.\s/.test(line);
      const isTitle = !isBullet && line.length > 3 && line.length < 100 && !line.includes(':') && !/^\s/.test(projectLines[i]);
      
      if (isTitle) {
        // Save previous project if exists
        if (currentProject && currentProject.bullets.length > 0) {
          projects.push(currentProject);
        }
        // Start new project
        currentProject = { title: line, bullets: [] };
      } else if (isBullet && currentProject) {
        // Add bullet to current project
        const bulletText = line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        if (bulletText.length > 10) {
          currentProject.bullets.push(bulletText);
        }
      }
    }
    
    // Don't forget the last project
    if (currentProject && currentProject.bullets.length > 0) {
      projects.push(currentProject);
    }
  }
  
  // Fallback: If no projects found via section parsing, try to find project-like patterns
  if (projects.length === 0) {
    // Look for common project title patterns
    const projectTitlePatterns = [
      /(?:^|\n)([A-Z][A-Za-z\s]+(?:System|App|Application|Platform|Tool|Dashboard|Website|Portal|API|Service|Engine|Manager|Tracker|Analyzer))\s*\n/gi,
      /(?:^|\n)([A-Z][A-Za-z\s]+(?:Management|Analytics|Automation|Integration|Processing))\s*\n/gi,
    ];
    
    projectTitlePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(resumeText)) !== null && projects.length < 5) {
        const title = match[1].trim();
        if (title.length > 5 && title.length < 60) {
          // Find bullets after this title
          const afterTitle = resumeText.substring(match.index + match[0].length);
          const bulletMatches = afterTitle.match(/^[\s]*[-•*]\s*(.+)/gm);
          const projectBullets = (bulletMatches || [])
            .slice(0, 5)
            .map(b => b.replace(/^[\s]*[-•*]\s*/, '').trim())
            .filter(b => b.length > 10);
          
          if (projectBullets.length > 0) {
            projects.push({ title, bullets: projectBullets });
          }
        }
      }
    });
  }

  // ENHANCED: Extract education from text
  const education: { degree: string; school: string; year: string; cgpa?: string }[] = [];
  
  // Find EDUCATION section
  const educationSectionMatch = resumeText.match(/\bEDUCATION\b[\s\S]*?(?=\b(?:PROJECTS?|CERTIFICATIONS?|SKILLS|WORK\s*EXPERIENCE|EXPERIENCE|ACHIEVEMENTS?|REFERENCES?)\b|$)/i);
  
  if (educationSectionMatch) {
    const educationSection = educationSectionMatch[0];
    
    // Look for degree patterns
    const degreePatterns = [
      /(?:Bachelor|Master|B\.?S\.?|M\.?S\.?|B\.?E\.?|M\.?E\.?|B\.?Tech|M\.?Tech|MBA|PhD|Doctorate)[^,\n]*(?:in|of)?[^,\n]*/gi,
    ];
    
    degreePatterns.forEach(pattern => {
      const matches = educationSection.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const degree = match.trim();
          // Try to find school name (usually on next line or after comma)
          const schoolMatch = educationSection.match(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s,]*([A-Z][A-Za-z\\s]+(?:University|College|Institute|School|Academy))', 'i'));
          const school = schoolMatch ? schoolMatch[1].trim() : '';
          
          // Try to find year
          const yearMatch = educationSection.match(/\b(20\d{2}[-–]\d{2,4}|20\d{2}|19\d{2})\b/);
          const year = yearMatch ? yearMatch[0] : '';
          
          // Try to find CGPA/GPA
          const cgpaMatch = educationSection.match(/(?:CGPA|GPA)[:\s]*(\d+\.?\d*)/i);
          const cgpa = cgpaMatch ? cgpaMatch[1] : undefined;
          
          if (degree.length > 5) {
            education.push({ degree, school, year, cgpa });
          }
        });
      }
    });
  }
  
  // Fallback: Simple education extraction if no structured data found
  if (education.length === 0) {
    const simpleDegreeMatch = textLower.match(/\b(bachelor|master|b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?|b\.?s\.?|m\.?s\.?|mba|phd)[^,\n]*/i);
    if (simpleDegreeMatch) {
      education.push({
        degree: simpleDegreeMatch[0].trim(),
        school: '',
        year: ''
      });
    }
  }

  // ENHANCED: Extract certifications from text
  const certifications: string[] = [];
  
  // Find CERTIFICATIONS section
  const certSectionMatch = resumeText.match(/\bCERTIFICATIONS?\b[\s\S]*?(?=\b(?:PROJECTS?|EDUCATION|SKILLS|WORK\s*EXPERIENCE|EXPERIENCE|ACHIEVEMENTS?|REFERENCES?)\b|$)/i);
  
  if (certSectionMatch) {
    const certSection = certSectionMatch[0];
    const certLines = certSection.split('\n').filter(l => l.trim() && !/^CERTIFICATIONS?$/i.test(l.trim()));
    
    certLines.forEach(line => {
      const cleanLine = line.replace(/^[-•*]\s*/, '').trim();
      if (cleanLine.length > 5 && cleanLine.length < 150) {
        certifications.push(cleanLine);
      }
    });
  }
  
  // Also look for common certification patterns in full text
  const certPatterns = [
    /\b(AWS\s+Certified[^,\n]*)/gi,
    /\b(Azure\s+Certified[^,\n]*)/gi,
    /\b(Google\s+Cloud\s+Certified[^,\n]*)/gi,
    /\b(PMP|CISSP|CISM|CEH|CompTIA[^,\n]*)/gi,
    /\b(Scrum\s+Master|CSM|PSM[^,\n]*)/gi,
  ];
  
  certPatterns.forEach(pattern => {
    const matches = resumeText.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cert = match.trim();
        if (!certifications.some(c => c.toLowerCase().includes(cert.toLowerCase()))) {
          certifications.push(cert);
        }
      });
    }
  });

  return {
    name,
    email,
    phone,
    linkedin,
    github,
    targetRole,
    summary,
    careerObjective,
    workExperience,
    education,
    projects,
    skills,
    certifications
  };
};

// Generate cache key from resume and job description
const generateCacheKey = async (resumeText: string, jobDescription?: string, jobTitle?: string): Promise<string> => {
  const encoder = new TextEncoder();
  const resumeData = encoder.encode(resumeText);
  const jdData = encoder.encode(jobDescription || '');
  const titleData = encoder.encode(jobTitle || '');
  
  const resumeHash = await crypto.subtle.digest('SHA-256', resumeData);
  const jdHash = await crypto.subtle.digest('SHA-256', jdData);
  const titleHash = await crypto.subtle.digest('SHA-256', titleData); // Corrected variable name
  
  const resumeHashArray = Array.from(new Uint8Array(resumeHash));
  const jdHashArray = Array.from(new Uint8Array(jdHash));
  const titleHashArray = Array.from(new Uint8Array(titleHash));
  
  const resumeHashHex = resumeHashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const jdHashHex = jdHashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const titleHashHex = titleHashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${resumeHashHex}_${jdHashHex}_${titleHashHex}`;
};

// New comprehensive scoring function - NOW USES 220+ METRICS
export const getComprehensiveScore = async (
  resumeText: string,
  jobDescription?: string,
  jobTitle?: string,
  scoringMode: ScoringMode = 'general',
  extractionMode: ExtractionMode = 'TEXT',
  trimmed: boolean = false,
  filename?: string,
  origin?: string, // Optional origin to apply score floor for optimized resumes
  userType?: 'fresher' | 'experienced' | 'student' // User type for proper evaluation
): Promise<ComprehensiveScore> => {
  // Check cache first
  const cacheKey = await generateCacheKey(resumeText, jobDescription, jobTitle);
  const cached = scoreCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return {
      ...cached.result,
      cached: true,
      cache_expires_at: new Date(cached.timestamp + CACHE_DURATION).toISOString()
    };
  }

  // USE ENHANCED 220+ METRICS SCORING
  if (USE_ENHANCED_SCORING) {
    try {
      // Parse resume text to extract structured data for better analysis
      let resumeData: ResumeData | undefined;
      try {
        // Try to parse resume text into structured format
        resumeData = parseResumeTextToData(resumeText, jobTitle);
      } catch (parseError) {
        // Could not parse resume to structured data, using text-only analysis
      }

      const enhancedResult = await EnhancedScoringService.calculateScore({
        resumeText,
        resumeData,
        jobDescription,
        extractionMode,
        filename,
        userType,
      });

      // Convert EnhancedComprehensiveScore to ComprehensiveScore format for UI compatibility
      const comprehensiveResult: ComprehensiveScore = {
        overall: enhancedResult.overall,
        match_band: enhancedResult.match_band,
        interview_probability_range: enhancedResult.interview_probability_range,
        confidence: enhancedResult.confidence,
        rubric_version: enhancedResult.rubric_version,
        weighting_mode: scoringMode === 'jd_based' ? 'JD' : 'GENERAL',
        extraction_mode: extractionMode,
        trimmed,
        job_title: jobTitle,
        // Convert tier scores to breakdown format for UI
        breakdown: convertTierScoresToBreakdown(enhancedResult.tier_scores, enhancedResult.critical_metrics),
        missing_keywords: enhancedResult.missing_keywords,
        actions: enhancedResult.actions,
        example_rewrites: enhancedResult.example_rewrites,
        notes: enhancedResult.notes,
        analysis: enhancedResult.analysis,
        keyStrengths: enhancedResult.keyStrengths,
        improvementAreas: enhancedResult.improvementAreas,
        recommendations: enhancedResult.recommendations,
      };

      // Cache the floored result
      scoreCache.set(cacheKey, {
        result: comprehensiveResult,
        timestamp: Date.now()
      });

      return comprehensiveResult;
    } catch (enhancedError) {
      console.error('Enhanced scoring failed, falling back to basic scoring:', enhancedError);
    }
  }

  // FALLBACK: Use basic AI-based scoring if enhanced fails
  const prompt = scoringMode === 'jd_based' 
    ? buildJDBasedPrompt(resumeText, jobDescription!, jobTitle!, filename, extractionMode, trimmed)
    : buildGeneralPrompt(resumeText, filename, extractionMode, trimmed);

  try {
    const result = await edenAITextService.generateTextWithRetry(prompt, {
      temperature: 0.3,
      maxTokens: 4000
    });

    if (!result) {
      throw new Error('No response content from EdenAI');
    }

    let parsedResult = edenAITextService.parseJSONResponse<ComprehensiveScore>(result);

    // Post-process breakdown to ensure name field is always present
    const keyToNameMap: Record<string, string> = {
      'jd_keywords_match': 'JD Keywords Match',
      'skills_alignment': 'Skills Alignment',
      'experience_relevance': 'Experience Relevance',
      'project_relevance': 'Project Relevance',
      'education_fit': 'Education Fit',
      'certifications_fit': 'Certifications Fit',
      'ats_formatting': 'ATS Formatting',
      'overall_quality': 'Overall Quality',
      'keywords_coverage': 'Keywords Coverage',
      'skills_presentation': 'Skills Presentation',
      'experience_quality': 'Experience Quality',
      'projects_quality': 'Projects Quality',
      'education_presentation': 'Education Presentation',
      'certifications_presentation': 'Certifications Presentation',
      'contact_info': 'Contact Info',
      'formatting_quality': 'Formatting Quality'
    };
    
    if (parsedResult.breakdown && Array.isArray(parsedResult.breakdown)) {
      parsedResult.breakdown = parsedResult.breakdown.map(metric => ({
        ...metric,
        name: metric.name || keyToNameMap[metric.key] || metric.key?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown Metric'
      }));
    }

    // Post-process confidence based on overall score
    if (parsedResult.overall >= 80) {
      parsedResult.confidence = 'High';
    } else if (parsedResult.overall >= 60) {
      parsedResult.confidence = 'Medium';
    } else {
      parsedResult.confidence = 'Low';
    }

    // Apply score floor for optimized resumes (jd_optimized or guided)
    if (origin === 'jd_optimized' || origin === 'guided') {
      const originalScore = parsedResult.overall;
      parsedResult.overall = Math.max(parsedResult.overall, 90);
      if (parsedResult.overall !== originalScore) {
        if (parsedResult.overall >= 90) {
          parsedResult.match_band = 'Excellent Match';
          parsedResult.interview_probability_range = '90-100%';
        }
      }
    }

    scoreCache.set(cacheKey, {
      result: parsedResult,
      timestamp: Date.now()
    });

    return parsedResult;
  } catch (error) {
    console.error('Error calling EdenAI for comprehensive scoring:', error);
  }

  console.error('Failed to get comprehensive score. Returning default error score.');
  return {
    overall: 0,
    match_band: "Minimal Match",
    interview_probability_range: "0%",
    confidence: "Low",
    rubric_version: "ats_v1.1-weights142",
    weighting_mode: scoringMode === 'jd_based' ? 'JD' : 'GENERAL',
    extraction_mode: extractionMode,
    trimmed: trimmed,
    job_title: jobTitle || "N/A",
    breakdown: [],
    missing_keywords: [],
    actions: ["Failed to get score. Please try again later."],
    example_rewrites: {
      experience: { original: "", improved: "", explanation: "" },
      projects: { original: "", improved: "", explanation: "" }
    },
    notes: ["AI response could not be parsed or API call failed repeatedly."],
    analysis: "Could not generate a comprehensive score due to repeated errors. Please ensure your input is valid and try again.",
    keyStrengths: [],
    improvementAreas: [],
    recommendations: ["Please try analyzing your resume again.", "If the issue persists, contact support."]
  };
};

export const applyScoreFloor = (score: number, resumeData: ResumeData): number => {
  if (resumeData.origin === 'guided' || resumeData.origin === 'jd_optimized') {
    return Math.max(score, 90);
  }
  return score;
};

export const getMatchScore = async (resumeText: string, jobDescription: string): Promise<MatchScore> => {
  const prompt = `You are an expert ATS (Applicant Tracking System) and HR professional. Analyze the match between the provided resume and job description.

RESUME CONTENT:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

ANALYSIS REQUIREMENTS:
1. Calculate a match score from 0-100 based on:
    - Skills alignment (40% weight)
    - Experience relevance (30% weight)
    - Education/qualifications match (15% weight)
    - Keywords presence (15% weight)
    

2. Identify key strengths that align with the job
3. Identify specific areas for improvement
4. Provide actionable analysis

CRITICAL INSTRUCTIONS:
- Be objective and specific in your analysis
- Consider both technical and soft skills
- Look for industry-specific keywords and requirements
- Evaluate experience level appropriateness
- Consider ATS compatibility factors

Respond ONLY with valid JSON in this exact structure:

{
  "score": 0-100,
  "analysis": "2-3 sentence summary of overall match quality and main factors affecting the score",
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "improvementAreas": ["area1", "area2", "area3"]
}`;

  try {
    const result = await edenAITextService.generateTextWithRetry(prompt, {
      temperature: 0.3,
      maxTokens: 2000
    });

    return edenAITextService.parseJSONResponse<MatchScore>(result);
  } catch (error) {
    console.error('Error calling EdenAI for scoring:', error);
    throw new Error('Failed to calculate match score. Please try again.');
  }
};

export const getDetailedResumeScore = async (resumeData: ResumeData, jobDescription: string, setLoading: (loading: boolean) => void): Promise<DetailedScore> => {
  const prompt = `You are an expert resume evaluator and ATS specialist. Analyze this resume comprehensively using the following scoring criteria:

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

JOB DESCRIPTION:
${jobDescription}

SCORING CRITERIA (Total: 100 points, calculated from weighted sum of categories):

1. ATS Compatibility (15 points max):
    - 15 points: No tables, columns, or unusual fonts; Proper file structure (PDF or DOCX, not image); Bullet formatting is plain and consistent.
    - **Detailed checks:** Consistency in font sizes, bold/italic usage, date formats, spacing, and section alignment. Use of simple, ATS-friendly fonts (e.g., Arial, Times New Roman, Calibri). Checks for a single-column layout and avoidance of tables, images, or excessive graphical elements. Ensuring proper section headings (e.g., WORK EXPERIENCE, EDUCATION, SKILLS) for accurate parsing by ATS only words to give easy understand way.
    - 0-14 points: Deductions for each deviation from ATS best practices.

2. Keyword & Skill Match (20 points max):
    - 20 points: Excellent alignment of technical & soft skills from JD; All tools, technologies, and certifications are present and relevant; Strong use of role-specific verbs.
    - **Detailed checks:** Highlighting presence and absence of critical keywords and skills directly from the job description or industry standards. Recommending adding both hard and soft skills as explicitly required by the target job. Evaluate if the resume sufficiently demonstrates proficiency in listed skills only words to give easy understand way.
    - 0-19 points: Deductions based on missing keywords, irrelevant skills, or weak verb usage.

3. Project & Work Relevance (15 points max):
    - 15 points: All projects and work experience are highly aligned with JD; Quantified impact (e.g., "reduced time by 30%") is consistently present.
    - **Detailed checks:** Whether bullet points are accomplishment-oriented (focus on impact and results) instead of merely listing responsibilities. Consistent quantification of achievements with numbers, percentages, or metrics. Verification that experiences are in reverse chronological order and clearly dated only words to give easy understand way.
    - 0-14 points: Deductions for irrelevant projects/experience or lack of quantifiable achievements.

4. Structure & Flow (10 points max):
    - 10 points: Logical section order (Summary > Skills > Experience > Projects > Education/Certifications); No missing key sections; Excellent use of whitespace and consistent margins.
    - **Detailed checks:** Ensuring resumes are the proper length (e.g., 1 page for <10 years' experience, 2 pages for 10+). Highlighting the absence or misuse of photos, personal information (beyond contact), or outdated/unnecessary sections like "Objective" (unless for students/freshers), or "References available upon request." Analyzing each resume section (Work Experience, Education, Projects, Additional Info like Certifications, Languages) for completeness, clarity, and conciseness. Checking proper formatting of education details (degrees, school names, graduation year, GPA/CGPA if included), skills lists, languages, and professional memberships only words to give easy understand way.
    - 0-9 points: Deductions for illogical order, missing critical sections, or poor formatting.

5. Critical Fixes & Red Flags (10 points max):
    - 10 points: All essential contact info (email, LinkedIn, phone) is present and correctly formatted; No overused or repeated words; Consistent use of strong action verbs and no passive language; No grammatical errors or spelling issues.
    - **Detailed checks:** Flagging use of personal pronouns (e.g., "I", "my") which should be omitted. Discouraging vague adverbs (e.g., "very," "really"), buzzwords (e.g., "synergy," "paradigm shift"), and ambiguous language. Thoroughly checking for spelling, grammar, or typographical errors throughout the resume only words to give easy understand way .
    - 0-9 points: Deductions for each red flag identified.

6. **Impact Score (0-10 points):**
    - **Criteria:** Strong Action Verbs, Quantified Accomplishments, Achievement-Oriented Content, Measurable Results.
    - **Detailed checks:** How well does each bullet point demonstrate impact and value? Are strong action verbs used consistently to start accomplishments? Are results quantified with numbers, percentages, or other metrics wherever possible? Does the content clearly show *what* was achieved and *what was the outcome* only words to give easy understand way?
    - 0-10 points: Score based on the degree to which accomplishments are impactful and quantified.

7. **Brevity Score (0-10 points):**
    - **Criteria:** Conciseness, Word Economy, Avoiding Redundancy, Direct Language.
    - **Detailed checks:** Is there any unnecessary filler? Can sentences be shortened without losing meaning? Are there repeated phrases or information? Is the language direct and to the point, avoiding verbose explanations only words to give easy understand way?
    - 0-10 points: Score based on the resume's conciseness and efficiency of language.

8. **Style Score (0-10 points):**
    - **Criteria:** Professional Tone, Consistency in Formatting, Clarity of Language, Overall Polish.
    - **Detailed checks:** Does the resume maintain a professional and confident tone? Is formatting (e.g., bolding, bullet styles, capitalization) consistent throughout? Is the language clear, precise, and free of jargon (unless industry-standard)? Does the resume look polished and well-edited only words to give easy understand way ?
    - 0-10 points: Score based on the overall professional presentation and writing style.

9. **Skills Score (0-10 points):**
    - **Criteria:** Relevance to JD, Proficiency Indicated, Variety (Technical/Soft), Placement.
    - **Detailed checks:** How directly relevant are the listed skills to the job description? Is there any indication of proficiency level (e.g., "proficient in", "expert in")? Is there a good balance between technical and soft skills (if applicable to the role)? Are skills placed logically and easy to find only words to give easy understand way?
    - 0-10 points: Score based on the quality, relevance, and presentation of the skills section.



ANALYSIS REQUIREMENTS:
- Calculate exact scores for each category.
- Provide detailed breakdown and reasoning for each category's score within the 'details' field. This field MUST contain specific, actionable feedback relevant to the checks outlined for each category.
- Identify specific actionable recommendations for overall improvement in the 'recommendations' array, especially for scores below 70% in any *individual category* (not just totalScore). These recommendations should be concrete and directly related to the issues found.
- Assign a letter grade (A+ 95-100, A 90-94, B+ 85-89, B 80-84, C+ 75-79, C 70-74, D 60-69, F <60).

-section order summary education and work experience and  project and skill certifications any not this flow -10 points per section unders and miss section -20 if any section miss 

Respond ONLY with valid JSON in this exact structure:

{
  "totalScore": 0,
  "analysis": "2-3 sentence summary of overall match quality and main factors affecting the score",
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "improvementAreas": ["area1", "area2", "area3"],
  "breakdown": {
    "atsCompatibility": {
      "score": 0,
      "maxScore": 14,
      "details": "Concise explanation (max 10 words) of ATS compatibility scoring based on consistency in font sizes, date formats, single-column layout, avoidance of tables/images, and proper section headings. Example: 'Resume uses two different font sizes (11pt and 12pt) and a two-column layout which might confuse ATS.'",
      "noTablesColumnsFonts": true,
      "properFileStructure": true,
      "consistentBulletFormatting": true
    },
    "keywordSkillMatch": {
      "score": 0,
      "maxScore": 18,
      "details": "Concise explanation (max 10 words) of keyword and skill match scoring, highlighting missing keywords from JD and relevance of listed skills. Example: 'Missing keywords like 'React Native' and 'AWS' from the job description. Consider integrating these skills into your projects or work experience.'",
      "technicalSoftSkillsAligned": true,
      "toolsTechCertsPresent": true,
      "roleSpecificVerbsUsed": true
    },
    "projectWorkRelevance": {
      "score": 0,
      "maxScore": 14,
      "details": "Concise explanation (max 10 words) of project and work relevance, focusing on accomplishment-oriented bullets and quantified impact. Example: 'Several bullet points describe responsibilities rather than achievements. Rewrite 'Responsible for managing social media' to 'Increased social media engagement by 25% through strategic content planning.'",
      "projectsAlignedWithJD": true,
      "quantifiedImpact": true
    },
    "structureFlow": {
      "score": 0,
      "maxScore": 9,
      "details": "Concise explanation (max 10 words) of structure and flow, including resume length, presence of unnecessary sections, and section completeness. Example: 'Resume is 3 pages long; condense relevant experience to fit within 2 pages as per industry standard for your experience level. Consider removing the 'References' section.'",
      "logicalSectionOrder": true,
      "noMissingSections": true,
      "goodWhitespaceMargins": true
    },
    "criticalFixesRedFlags": {
      "score": 0,
      "maxScore": 9,
      "details": "Concise explanation (max 10 words) of critical fixes and red flags, such as pronouns, buzzwords, and grammar. Example: 'Avoid using personal pronouns like 'I' and 'my'. Correct the spelling error in 'managment' to 'management'.' ",
      "hasContactInfo": true,
      "noOverusedWords": true,
      "usesActionVerbs": true,
      "noGrammarSpellingErrors": true
    },
    "impactScore": {
      "score": 0,
      "maxScore": 9,
      "details": "Concise explanation (max 10 words) of impact score, focusing on strong action verbs, quantified accomplishments, and achievement-oriented content. Example: 'Many bullet points lack quantifiable results. For instance, instead of 'Managed a team', state 'Managed a team of 5 engineers, leading to a 15% increase in project delivery speed.'",
      "strongActionVerbs": true,
      "quantifiedAccomplishments": true,
      "achievementOrientedContent": true,
      "measurableResults": true
    },
    "brevityScore": {
      "score": 0,
      "maxScore": 9,
      "details": "Concise explanation (max 10 words) of brevity score, focusing on conciseness, word economy, and avoiding redundancy. Example: 'The resume contains redundant phrases such as 'responsible for' and 'duties included'. Streamline sentences for greater impact.'",
      "conciseness": true,
      "wordEconomy": true,
      "avoidingRedundancy": true,
      "directLanguage": true
    },
    "styleScore": {
      "score": 0,
      "maxScore": 9,
      "details": "Concise explanation (max 10 words) of style score, focusing on professional tone, formatting consistency, and clarity of language. Example: 'Inconsistent use of bolding for job titles and company names. Maintain a consistent formatting style throughout the document.'",
      "consistencyInFormatting": true,
      "clarityOfLanguage": true,
      "overallPolish": true
    },
    "skillsScore": {
      "score": 0,
      "maxScore": 9,
      "details": "Concise explanation (max 10 words) of skills score, focusing on relevance to JD, proficiency indication, and variety. Example: 'Skills section lists many generic tools. Prioritize skills directly mentioned in the job description and consider adding a proficiency level for key technical skills.'",
      "relevanceToJD": true,
      "proficiencyIndicated": true,
      "varietyTechnicalSoft": true,
      "placement": true
    }
  },
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "grade": "A+"
}`;

  try {
    setLoading(true);
    const result = await edenAITextService.generateTextWithRetry(prompt, {
      temperature: 0.3,
      maxTokens: 4000
    });

    return edenAITextService.parseJSONResponse<DetailedScore>(result);
  } catch (error) {
    console.error('Error calling EdenAI for detailed scoring:', error);
    throw new Error('Failed to calculate detailed resume score. Please try again.');
  } finally {
    setLoading(false);
  }
};

export const reconstructResumeText = (resumeData: any): string => {
  const sections = [];

  sections.push(`Name: ${resumeData.name}`);
  if (resumeData.phone) sections.push(`Phone: ${resumeData.phone}`);
  if (resumeData.email) sections.push(`Email: ${resumeData.email}`);
  if (resumeData.linkedin) sections.push(`LinkedIn: ${resumeData.linkedin}`);
  if (resumeData.github) sections.push(`GitHub: ${resumeData.github}`);

  if (resumeData.summary) {
    sections.push(`\nPROFESSIONAL SUMMARY:\n${resumeData.summary}`);
  }

  if (resumeData.workExperience && resumeData.workExperience.length > 0) {
    sections.push('\nWORK EXPERIENCE:');
    resumeData.workExperience.forEach((job: any) => {
      sections.push(`${job.role} at ${job.company} (${job.year})`);
      if (job.bullets) {
        job.bullets.forEach((bullet: string) => sections.push(`• ${bullet}`));
      }
    });
  }

  if (resumeData.education && resumeData.education.length > 0) {
    sections.push('\nEDUCATION:');
    resumeData.education.forEach((edu: any) => {
      sections.push(`${edu.degree} from ${edu.school} (${edu.year})`);
    });
  }

  if (resumeData.projects && resumeData.projects.length > 0) {
    sections.push('\nPROJECTS:');
    resumeData.projects.forEach((project: any) => {
      sections.push(`${project.title}`);
      if (project.bullets) {
        project.bullets.forEach((bullet: string) => sections.push(`• ${bullet}`));
      }
    });
  }

  if (resumeData.skills && resumeData.skills.length > 0) {
    sections.push('\nSKILLS:');
    resumeData.skills.forEach((skill: any) => {
      sections.push(`${skill.category}: ${skill.list ? skill.list.join(', ') : ''}`);
    });
  }

  if (resumeData.certifications && resumeData.certifications.length > 0) {
    sections.push('\nCERTIFICATIONS:');
    resumeData.certifications.forEach((cert: any) => {
      // Handle both string and object certification formats
      const certText = typeof cert === 'string' ? cert : (cert.title || cert.name || '');
      if (certText) sections.push(`• ${certText}`);
    });
  }

  if (resumeData.achievements && resumeData.achievements.length > 0) {
    sections.push('\nACHIEVEMENTS:');
    resumeData.achievements.forEach((achievement: string) => sections.push(`• ${achievement}`));
  }

  if (resumeData.extraCurricularActivities && resumeData.extraCurricularActivities.length > 0) {
    sections.push('\nEXTRA-CURRICULAR ACTIVITIES:');
    resumeData.extraCurricularActivities.forEach((activity: string) => sections.push(`• ${activity}`));
  }

  if (resumeData.languagesKnown && resumeData.languagesKnown.length > 0) {
    sections.push('\nLANGUAGES KNOWN:');
    sections.push(resumeData.languagesKnown.join(', '));
  }

  if (resumeData.personalDetails) {
    sections.push(`\nPERSONAL DETAILS:\n${resumeData.personalDetails}`);
  }

  return sections.join('\n');
};

export const generateBeforeScore = (resumeText: string): MatchScore => {
  // FIXED: Calculate actual score based on resume content instead of random
  // This ensures poor resumes get low scores
  const wordCount = resumeText.trim().split(/\s+/).length;
  const hasSkills = /skills|technical|programming|software/i.test(resumeText);
  const hasExperience = /experience|work|employment|job/i.test(resumeText);
  const hasEducation = /education|degree|university|college/i.test(resumeText);
  const hasBullets = (resumeText.match(/[•\-\*]\s/g) || []).length;
  
  // Calculate base score from content quality
  let baseScore = 20; // Start low
  
  if (wordCount >= 300) baseScore += 15;
  else if (wordCount >= 150) baseScore += 10;
  else if (wordCount >= 50) baseScore += 5;
  
  if (hasSkills) baseScore += 10;
  if (hasExperience) baseScore += 10;
  if (hasEducation) baseScore += 5;
  if (hasBullets >= 5) baseScore += 10;
  else if (hasBullets >= 2) baseScore += 5;
  
  // Cap at 65 for "before" optimization score
  baseScore = Math.min(65, Math.max(15, baseScore));

  return {
    score: baseScore,
    analysis: `The resume shows basic qualifications but lacks optimization for ATS systems and keyword alignment. Several key areas need improvement to increase competitiveness.`,
    keyStrengths: [
      "Relevant educational background",
      "Some technical skills mentioned",
      "Basic work experience listed"
    ],
    improvementAreas: [],
  };
};

// MODIFIED: Added async keyword to the function declaration
export const generateAfterScore = async (
  resumeData: ResumeData,
  jobDescription: string
): Promise<MatchScore> => {
  // Reuse the detailed scoring logic. A no-op function satisfies the
  // loading callback expected by getDetailedResumeScore.
  const detailed = await getDetailedResumeScore(resumeData, jobDescription, () => {});

  let finalScore = detailed.totalScore;
  let improvementAreas = [...detailed.improvementAreas];

  // Apply score floor based on origin
  finalScore = applyScoreFloor(finalScore, resumeData);

  // Only apply major gaps logic if not a "guided" or "jd_optimized" resume,
  // as those are already floored to 90+.
  if (resumeData.origin !== 'guided' && resumeData.origin !== 'jd_optimized') {
    const majorMissing = Object.entries(detailed.breakdown)
      .filter(([, value]) => value.score < value.maxScore * 0.5)
      .map(([key]) => `Major gaps in ${key}`);
    improvementAreas = [...improvementAreas, ...majorMissing];
  }

  return {
    score: finalScore,
    analysis: detailed.analysis,
    keyStrengths: detailed.keyStrengths,
    improvementAreas,
  };
};