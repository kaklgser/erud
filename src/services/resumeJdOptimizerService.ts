/**
 * Resume JD Optimizer Service
 * Optimizes resume content against job description with keywords and ATS formatting
 * Uses EdenAI for AI-powered optimization (dynamic keyword extraction)
 */

import { ResumeData, UserType } from '../types/resume';
import { edenAITextService } from './edenAITextService';
import { jdKeywordExtractor, JDAnalysisResult, ExtractedKeyword } from './jdKeywordExtractor';

// User action required for 90%+ score
export interface UserActionRequired {
  category: 'keywords' | 'skills' | 'experience' | 'quantification' | 'grammar' | 'certifications' | 'projects';
  priority: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  currentScore: number;
  targetScore: number;
  suggestions: string[];
  canAutoFix: boolean;
}

export interface OptimizationResult {
  optimizedResume: ResumeData;
  jdAnalysis: JDAnalysisResult;
  keywordsAdded: string[];
  sectionsOptimized: string[];
  atsScore: number;
  userActionsRequired?: UserActionRequired[]; // NEW: Actions user needs to take for 90%+
}

/**
 * AI-powered keyword extraction from JD (dynamic, not static patterns)
 */
async function extractKeywordsWithAI(jobDescription: string, targetRole: string): Promise<JDAnalysisResult> {
  const prompt = `Analyze this job description and extract ALL technical keywords, skills, and requirements.

JOB DESCRIPTION:
"""
${jobDescription.slice(0, 6000)}
"""

TARGET ROLE: ${targetRole}

Return ONLY valid JSON with this structure:
{
  "jobTitle": "extracted job title",
  "topTechnicalSkills": ["skill1", "skill2", "skill3"],
  "frameworks": ["framework1", "framework2"],
  "databases": ["db1", "db2"],
  "cloudTools": ["tool1", "tool2"],
  "devopsTools": ["tool1", "tool2"],
  "testingTools": ["jest", "cypress", etc],
  "buildTools": ["webpack", "vite", etc],
  "stateManagement": ["redux", "mobx", etc],
  "cssTools": ["sass", "tailwind", etc],
  "criticalKeywords": ["must-have skills from JD"],
  "niceToHaveKeywords": ["nice-to-have skills from JD"],
  "seniority": "junior|mid|senior"
}

IMPORTANT: Extract ACTUAL keywords from the JD text. Include ALL technical terms mentioned.`;

  try {
    const result = await edenAITextService.generateTextWithRetry(prompt, {
      temperature: 0.2,
      maxTokens: 2000
    });
    
    const parsed = edenAITextService.parseJSONResponse<any>(result);
    
    // Convert to JDAnalysisResult format
    const allKeywords: ExtractedKeyword[] = [];
    
    // Add critical keywords
    (parsed.criticalKeywords || []).forEach((k: string) => {
      allKeywords.push({ keyword: k, category: 'technical_skill', importance: 'critical', context: [] });
    });
    
    // Add top technical skills as high importance
    (parsed.topTechnicalSkills || []).forEach((k: string) => {
      if (!allKeywords.find(kw => kw.keyword.toLowerCase() === k.toLowerCase())) {
        allKeywords.push({ keyword: k, category: 'technical_skill', importance: 'high', context: [] });
      }
    });
    
    // Add frameworks
    (parsed.frameworks || []).forEach((k: string) => {
      if (!allKeywords.find(kw => kw.keyword.toLowerCase() === k.toLowerCase())) {
        allKeywords.push({ keyword: k, category: 'framework', importance: 'high', context: [] });
      }
    });
    
    // Add state management, testing, build tools as medium importance
    [...(parsed.stateManagement || []), ...(parsed.testingTools || []), ...(parsed.buildTools || []), ...(parsed.cssTools || [])].forEach((k: string) => {
      if (!allKeywords.find(kw => kw.keyword.toLowerCase() === k.toLowerCase())) {
        allKeywords.push({ keyword: k, category: 'framework', importance: 'medium', context: [] });
      }
    });
    
    // Add nice-to-have as medium
    (parsed.niceToHaveKeywords || []).forEach((k: string) => {
      if (!allKeywords.find(kw => kw.keyword.toLowerCase() === k.toLowerCase())) {
        allKeywords.push({ keyword: k, category: 'tool', importance: 'medium', context: [] });
      }
    });
    
    return {
      jobTitle: parsed.jobTitle || targetRole,
      topTechnicalSkills: parsed.topTechnicalSkills || [],
      frameworks: parsed.frameworks || [],
      databases: parsed.databases || [],
      cloudTools: parsed.cloudTools || [],
      devopsTools: parsed.devopsTools || [],
      domainKeywords: [],
      architectureTerms: [],
      allKeywords,
      requiredSkillsCount: allKeywords.filter(k => k.importance === 'critical').length,
      seniority: parsed.seniority || 'mid'
    };
  } catch (error) {
    console.warn('AI keyword extraction failed, falling back to static extraction:', error);
    // Fallback to static extraction
    return jdKeywordExtractor.analyzeJobDescription(jobDescription);
  }
}

/**
 * Main function to optimize resume against job description
 */
export const optimizeResumeAgainstJD = async (
  resumeData: ResumeData,
  jobDescription: string,
  targetRole: string,
  userType: UserType = 'experienced'
): Promise<OptimizationResult> => {
  // Step 1: Analyze JD and extract keywords using AI (dynamic extraction)
  const jdAnalysis = await extractKeywordsWithAI(jobDescription, targetRole);

  const keywordsAdded: string[] = [];
  const sectionsOptimized: string[] = [];

  // Step 2: Optimize work experience bullets
  let optimizedWorkExperience = resumeData.workExperience || [];
  if (optimizedWorkExperience.length > 0) {
    optimizedWorkExperience = await optimizeWorkExperience(
      optimizedWorkExperience,
      jdAnalysis,
      targetRole
    );
    sectionsOptimized.push('workExperience');
  }

  // Step 3: Optimize project bullets
  let optimizedProjects = resumeData.projects || [];
  if (optimizedProjects.length > 0) {
    optimizedProjects = await optimizeProjects(
      optimizedProjects,
      jdAnalysis,
      targetRole
    );
    sectionsOptimized.push('projects');
  }

  // Step 4: Enhance skills with JD keywords
  let optimizedSkills = resumeData.skills || [];
  const { skills: enhancedSkills, addedKeywords } = enhanceSkillsWithJDKeywords(
    optimizedSkills,
    jdAnalysis
  );
  optimizedSkills = enhancedSkills;
  keywordsAdded.push(...addedKeywords);
  if (addedKeywords.length > 0) {
    sectionsOptimized.push('skills');
  }

  // Step 5: Generate/optimize professional summary
  let optimizedSummary = resumeData.summary || resumeData.careerObjective || '';
  if (userType === 'experienced' || !optimizedSummary) {
    optimizedSummary = await generateOptimizedSummary(
      resumeData,
      jdAnalysis,
      targetRole,
      userType
    );
    sectionsOptimized.push('summary');
  }

  // Build optimized resume
  const optimizedResume: ResumeData = {
    ...resumeData,
    workExperience: optimizedWorkExperience,
    projects: optimizedProjects,
    skills: optimizedSkills,
    summary: userType === 'experienced' ? optimizedSummary : resumeData.summary,
    careerObjective: userType !== 'experienced' ? optimizedSummary : resumeData.careerObjective,
    targetRole: targetRole || resumeData.targetRole,
    origin: 'jd_optimized'
  };

  // Calculate ATS score
  const atsScore = calculateATSScore(optimizedResume, jdAnalysis);

  // Identify user actions required to reach 90%+ score
  const userActionsRequired = identifyUserActionsRequired(optimizedResume, jdAnalysis, atsScore);

  return {
    optimizedResume,
    jdAnalysis,
    keywordsAdded,
    sectionsOptimized,
    atsScore,
    userActionsRequired
  };
};


/**
 * Optimize work experience bullets with JD keywords and action verbs
 */
async function optimizeWorkExperience(
  workExperience: ResumeData['workExperience'],
  jdAnalysis: JDAnalysisResult,
  targetRole: string
): Promise<ResumeData['workExperience']> {
  if (!workExperience || workExperience.length === 0) return [];

  const criticalKeywords = jdAnalysis.allKeywords
    .filter(k => k.importance === 'critical' || k.importance === 'high')
    .map(k => k.keyword)
    .slice(0, 10);

  const prompt = `You are an expert ATS resume optimizer. Optimize these work experience bullets to better match the job requirements.

TARGET ROLE: ${targetRole}

CRITICAL KEYWORDS TO INCLUDE (where relevant):
${criticalKeywords.join(', ')}

TOP TECHNICAL SKILLS FROM JD:
${jdAnalysis.topTechnicalSkills.join(', ')}

CURRENT WORK EXPERIENCE:
${JSON.stringify(workExperience, null, 2)}

OPTIMIZATION RULES:
1. Start each bullet with a STRONG action verb (Developed, Implemented, Architected, Optimized, Led, Designed, Built, Deployed, Automated, Integrated)
2. Include quantifiable metrics where possible (%, numbers, time saved, users impacted)
3. Naturally incorporate relevant keywords from the JD
4. Keep bullets concise (15-25 words each)
5. Focus on achievements and impact, not just responsibilities
6. Maintain truthfulness - only enhance existing content, don't fabricate
7. Ensure technical accuracy

Return ONLY valid JSON array with the same structure:
[
  {
    "role": "Job Title",
    "company": "Company Name",
    "location": "Location",
    "year": "Date Range",
    "bullets": ["Optimized bullet 1", "Optimized bullet 2", "Optimized bullet 3"]
  }
]`;

  try {
    const result = await edenAITextService.generateTextWithRetry(prompt, {
      temperature: 0.3,
      maxTokens: 3000
    });
    
    const optimized = edenAITextService.parseJSONResponse<ResumeData['workExperience']>(result);
    
    // Validate and merge with original data
    return workExperience.map((exp, index) => {
      const optimizedExp = optimized?.[index];
      if (optimizedExp && optimizedExp.bullets && optimizedExp.bullets.length > 0) {
        return {
          ...exp,
          bullets: optimizedExp.bullets
        };
      }
      return exp;
    });
  } catch (error) {
    console.error('Error optimizing work experience:', error);
    return workExperience; // Return original on error
  }
}

/**
 * Optimize project bullets with JD keywords
 */
async function optimizeProjects(
  projects: ResumeData['projects'],
  jdAnalysis: JDAnalysisResult,
  targetRole: string
): Promise<ResumeData['projects']> {
  if (!projects || projects.length === 0) return [];

  const relevantTech = [
    ...jdAnalysis.topTechnicalSkills,
    ...jdAnalysis.frameworks,
    ...jdAnalysis.cloudTools
  ].slice(0, 15);

  const prompt = `You are an expert ATS resume optimizer. Optimize these project bullets to better match the job requirements.

TARGET ROLE: ${targetRole}

RELEVANT TECHNOLOGIES FROM JD:
${relevantTech.join(', ')}

ARCHITECTURE/METHODOLOGY TERMS:
${jdAnalysis.architectureTerms.join(', ')}

CURRENT PROJECTS:
${JSON.stringify(projects, null, 2)}

OPTIMIZATION RULES:
1. Start each bullet with a STRONG action verb
2. Highlight technologies that match the JD
3. Include metrics where possible (performance improvements, scale, users)
4. Show problem-solving and technical depth
5. Keep bullets concise (15-25 words each)
6. Maintain truthfulness - enhance existing content only
7. Focus on technical implementation details relevant to the role

Return ONLY valid JSON array with the same structure:
[
  {
    "title": "Project Title",
    "bullets": ["Optimized bullet 1", "Optimized bullet 2", "Optimized bullet 3"]
  }
]`;

  try {
    const result = await edenAITextService.generateTextWithRetry(prompt, {
      temperature: 0.3,
      maxTokens: 2500
    });
    
    const optimized = edenAITextService.parseJSONResponse<ResumeData['projects']>(result);
    
    // Validate and merge with original data
    return projects.map((proj, index) => {
      const optimizedProj = optimized?.[index];
      if (optimizedProj && optimizedProj.bullets && optimizedProj.bullets.length > 0) {
        return {
          ...proj,
          bullets: optimizedProj.bullets
        };
      }
      return proj;
    });
  } catch (error) {
    console.error('Error optimizing projects:', error);
    return projects; // Return original on error
  }
}

/**
 * Enhance skills section with missing JD keywords
 */
function enhanceSkillsWithJDKeywords(
  skills: ResumeData['skills'],
  jdAnalysis: JDAnalysisResult
): { skills: ResumeData['skills']; addedKeywords: string[] } {
  if (!skills) return { skills: [], addedKeywords: [] };

  const addedKeywords: string[] = [];
  const existingSkillsLower = new Set(
    skills.flatMap(cat => (cat.list || []).map(s => s.toLowerCase()))
  );

  // Find missing critical/high/medium importance keywords
  const missingKeywords = jdAnalysis.allKeywords
    .filter(k => k.importance === 'critical' || k.importance === 'high' || k.importance === 'medium')
    .filter(k => !existingSkillsLower.has(k.keyword.toLowerCase()))
    .map(k => k.keyword);

  if (missingKeywords.length === 0) {
    return { skills, addedKeywords };
  }

  // Categorize missing keywords
  const categorizedMissing: Record<string, string[]> = {
    'Programming Languages': [],
    'Frameworks & Libraries': [],
    'Databases': [],
    'Cloud & DevOps': [],
    'Tools & Technologies': []
  };

  for (const keyword of missingKeywords) {
    const category = jdAnalysis.allKeywords.find(k => k.keyword === keyword)?.category;
    
    if (category === 'technical_skill') {
      categorizedMissing['Programming Languages'].push(keyword);
    } else if (category === 'framework') {
      categorizedMissing['Frameworks & Libraries'].push(keyword);
    } else if (category === 'tool') {
      if (keyword.toLowerCase().includes('aws') || 
          keyword.toLowerCase().includes('azure') || 
          keyword.toLowerCase().includes('docker') ||
          keyword.toLowerCase().includes('kubernetes')) {
        categorizedMissing['Cloud & DevOps'].push(keyword);
      } else {
        categorizedMissing['Tools & Technologies'].push(keyword);
      }
    } else {
      categorizedMissing['Tools & Technologies'].push(keyword);
    }
  }

  // Add missing keywords to existing categories or create new ones
  const enhancedSkills = [...skills];

  for (const [categoryName, keywords] of Object.entries(categorizedMissing)) {
    if (keywords.length === 0) continue;

    // Find existing category with similar name
    const existingCategoryIndex = enhancedSkills.findIndex(cat => 
      cat.category.toLowerCase().includes(categoryName.toLowerCase().split(' ')[0]) ||
      categoryName.toLowerCase().includes(cat.category.toLowerCase().split(' ')[0])
    );

    if (existingCategoryIndex !== -1) {
      // Add to existing category
      const existingList = enhancedSkills[existingCategoryIndex].list || [];
      const newKeywords = keywords.filter(k => 
        !existingList.some(s => s.toLowerCase() === k.toLowerCase())
      );
      enhancedSkills[existingCategoryIndex] = {
        ...enhancedSkills[existingCategoryIndex],
        list: [...existingList, ...newKeywords.slice(0, 3)]
      };
      addedKeywords.push(...newKeywords.slice(0, 3));
    } else if (keywords.length >= 2) {
      // Create new category if we have enough keywords
      const newKeywords = keywords.slice(0, 5);
      enhancedSkills.push({
        category: categoryName,
        list: newKeywords,
        count: newKeywords.length
      });
      addedKeywords.push(...newKeywords);
    }
  }

  return { skills: enhancedSkills, addedKeywords };
}


/**
 * Generate optimized professional summary aligned with JD
 */
async function generateOptimizedSummary(
  resumeData: ResumeData,
  jdAnalysis: JDAnalysisResult,
  targetRole: string,
  userType: UserType
): Promise<string> {
  const yearsExperience = estimateYearsExperience(resumeData.workExperience || []);
  const topSkills = resumeData.skills?.flatMap(cat => cat.list || []).slice(0, 10) || [];
  
  const prompt = `Generate a professional ${userType === 'experienced' ? 'summary' : 'career objective'} for a resume targeting this role.

TARGET ROLE: ${targetRole}
JOB TITLE FROM JD: ${jdAnalysis.jobTitle}
SENIORITY LEVEL: ${jdAnalysis.seniority}

CANDIDATE PROFILE:
- Years of Experience: ${yearsExperience}
- User Type: ${userType}
- Current Skills: ${topSkills.join(', ')}
- Work Experience: ${resumeData.workExperience?.map(w => w.role).join(', ') || 'N/A'}

KEY REQUIREMENTS FROM JD:
- Top Technical Skills: ${jdAnalysis.topTechnicalSkills.slice(0, 5).join(', ')}
- Frameworks: ${jdAnalysis.frameworks.slice(0, 3).join(', ')}
- Domain Keywords: ${jdAnalysis.domainKeywords.slice(0, 3).join(', ')}

RULES:
1. Write 2-3 sentences (50-80 words)
2. Include the target role/job title
3. Mention 3-4 key technical skills from the JD
4. Highlight years of experience (if experienced)
5. Show alignment with the role requirements
6. Use professional, confident tone
7. NO generic phrases like "seeking opportunities" or "passionate about"
8. Start with a strong statement about expertise

Return ONLY the summary text, no JSON or formatting.`;

  try {
    const result = await edenAITextService.generateTextWithRetry(prompt, {
      temperature: 0.4,
      maxTokens: 500
    });
    
    // Clean up the response
    return result
      .replace(/^["']|["']$/g, '')
      .replace(/^(Summary|Career Objective|Professional Summary):\s*/i, '')
      .trim();
  } catch (error) {
    console.error('Error generating summary:', error);
    // Return a basic summary on error
    return userType === 'experienced'
      ? `Experienced ${targetRole} with expertise in ${topSkills.slice(0, 3).join(', ')}. Proven track record of delivering high-quality solutions and driving technical excellence.`
      : `Motivated ${targetRole} seeking to leverage skills in ${topSkills.slice(0, 3).join(', ')} to contribute to innovative projects and grow professionally.`;
  }
}

/**
 * Estimate years of experience from work history
 */
function estimateYearsExperience(workExperience: ResumeData['workExperience']): number {
  if (!workExperience || workExperience.length === 0) return 0;

  let totalYears = 0;
  const currentYear = new Date().getFullYear();

  for (const exp of workExperience) {
    if (!exp.year) continue;
    
    // Parse year ranges like "2020 - 2023", "Jan 2020 - Present", etc.
    const yearMatch = exp.year.match(/(\d{4})\s*[-–]\s*(\d{4}|present|current)/i);
    if (yearMatch) {
      const startYear = parseInt(yearMatch[1]);
      const endYear = yearMatch[2].toLowerCase() === 'present' || yearMatch[2].toLowerCase() === 'current'
        ? currentYear
        : parseInt(yearMatch[2]);
      totalYears += Math.max(0, endYear - startYear);
    }
  }

  return totalYears || workExperience.length; // Fallback to number of jobs
}

/**
 * Calculate ATS score based on keyword coverage and formatting
 */
function calculateATSScore(
  resumeData: ResumeData,
  jdAnalysis: JDAnalysisResult
): number {
  let score = 0;
  const resumeText = JSON.stringify(resumeData).toLowerCase();

  // Keyword coverage (40 points)
  const criticalKeywords = jdAnalysis.allKeywords.filter(k => k.importance === 'critical');
  const highKeywords = jdAnalysis.allKeywords.filter(k => k.importance === 'high');
  
  const criticalMatches = criticalKeywords.filter(k => 
    resumeText.includes(k.keyword.toLowerCase())
  ).length;
  const highMatches = highKeywords.filter(k => 
    resumeText.includes(k.keyword.toLowerCase())
  ).length;

  if (criticalKeywords.length > 0) {
    score += (criticalMatches / criticalKeywords.length) * 25;
  } else {
    score += 15;
  }
  
  if (highKeywords.length > 0) {
    score += (highMatches / highKeywords.length) * 15;
  } else {
    score += 10;
  }

  // Section completeness (30 points)
  if (resumeData.summary || resumeData.careerObjective) score += 5;
  if (resumeData.skills && resumeData.skills.length > 0) score += 5;
  if (resumeData.workExperience && resumeData.workExperience.length > 0) score += 8;
  if (resumeData.projects && resumeData.projects.length > 0) score += 5;
  if (resumeData.education && resumeData.education.length > 0) score += 4;
  if (resumeData.certifications && resumeData.certifications.length > 0) score += 3;

  // Contact info (10 points)
  if (resumeData.email) score += 3;
  if (resumeData.phone) score += 3;
  if (resumeData.linkedin) score += 2;
  if (resumeData.github) score += 2;

  // Bullet quality (20 points)
  const allBullets = [
    ...(resumeData.workExperience?.flatMap(w => w.bullets || []) || []),
    ...(resumeData.projects?.flatMap(p => p.bullets || []) || [])
  ];
  
  if (allBullets.length > 0) {
    const actionVerbPattern = /^(developed|implemented|designed|built|created|led|managed|optimized|improved|increased|reduced|automated|integrated|deployed|architected|engineered)/i;
    const bulletsWithActionVerbs = allBullets.filter(b => actionVerbPattern.test(b.trim())).length;
    const metricPattern = /\d+%|\d+\s*(users|customers|requests|transactions|records|hours|days|weeks|months)/i;
    const bulletsWithMetrics = allBullets.filter(b => metricPattern.test(b)).length;
    
    score += (bulletsWithActionVerbs / allBullets.length) * 10;
    score += (bulletsWithMetrics / allBullets.length) * 10;
  } else {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Identify user actions required to reach 90%+ ATS score
 * These are things that cannot be auto-fixed without user input
 */
function identifyUserActionsRequired(
  resumeData: ResumeData,
  jdAnalysis: JDAnalysisResult,
  currentScore: number
): UserActionRequired[] {
  const actions: UserActionRequired[] = [];
  const TARGET_SCORE = 90;

  if (currentScore >= TARGET_SCORE) {
    return actions; // Already at 90%+, no actions needed
  }

  const resumeText = JSON.stringify(resumeData).toLowerCase();
  const existingSkills = resumeData.skills?.flatMap(s => s.list.map(sk => sk.toLowerCase())) || [];

  // 1. Check for missing critical keywords
  const criticalKeywords = jdAnalysis.allKeywords.filter(k => k.importance === 'critical');
  const missingCritical = criticalKeywords.filter(k => 
    !resumeText.includes(k.keyword.toLowerCase()) && 
    !existingSkills.includes(k.keyword.toLowerCase())
  );

  if (missingCritical.length > 0) {
    actions.push({
      category: 'keywords',
      priority: 'critical',
      title: '⚠️ Missing Critical JD Keywords',
      description: `These keywords are CRITICAL in the job description but missing from your resume. Add them if you have experience.`,
      currentScore: Math.round((1 - missingCritical.length / Math.max(criticalKeywords.length, 1)) * 100),
      targetScore: 90,
      suggestions: missingCritical.slice(0, 8).map(k => `Add "${k.keyword}" to your skills or experience`),
      canAutoFix: false,
    });
  }

  // 2. Check for missing high-importance keywords
  const highKeywords = jdAnalysis.allKeywords.filter(k => k.importance === 'high');
  const missingHigh = highKeywords.filter(k => 
    !resumeText.includes(k.keyword.toLowerCase()) && 
    !existingSkills.includes(k.keyword.toLowerCase())
  );

  if (missingHigh.length > 3) {
    actions.push({
      category: 'skills',
      priority: 'high',
      title: '📋 Missing Important Technical Skills',
      description: `These skills are frequently mentioned in the JD. Add them if you have experience.`,
      currentScore: Math.round((1 - missingHigh.length / Math.max(highKeywords.length, 1)) * 100),
      targetScore: 90,
      suggestions: missingHigh.slice(0, 6).map(k => `Add "${k.keyword}" to Technical Skills`),
      canAutoFix: false,
    });
  }

  // 3. Check for quantified achievements
  const allBullets = [
    ...(resumeData.workExperience?.flatMap(w => w.bullets || []) || []),
    ...(resumeData.projects?.flatMap(p => p.bullets || []) || [])
  ];
  const metricPattern = /\d+%|\$\d+|\d+\s*(users?|customers?|clients?|projects?|team|people|million|k\b|hours?|days?|weeks?)/i;
  const bulletsWithMetrics = allBullets.filter(b => metricPattern.test(b)).length;
  const metricPercentage = allBullets.length > 0 ? (bulletsWithMetrics / allBullets.length) * 100 : 0;

  if (metricPercentage < 50) {
    const unquantifiedBullets = allBullets.filter(b => !metricPattern.test(b)).slice(0, 5);
    actions.push({
      category: 'quantification',
      priority: 'high',
      title: '📊 Add Metrics to Your Achievements',
      description: `Only ${Math.round(metricPercentage)}% of your bullets have quantified results. ATS systems favor metrics.`,
      currentScore: Math.round(metricPercentage),
      targetScore: 90,
      suggestions: [
        'Add percentages: "Improved performance by X%"',
        'Add user counts: "Served X users/customers"',
        'Add team sizes: "Led team of X developers"',
        'Add dollar amounts: "Saved $X in costs"',
        ...unquantifiedBullets.slice(0, 3).map(b => `Quantify: "${b.substring(0, 40)}..."`),
      ],
      canAutoFix: false,
    });
  }

  // 4. Check for action verbs
  const actionVerbPattern = /^(developed|implemented|designed|built|created|led|managed|optimized|improved|increased|reduced|automated|integrated|deployed|architected|engineered|delivered|executed|established|launched|spearheaded)/i;
  const bulletsWithActionVerbs = allBullets.filter(b => actionVerbPattern.test(b.trim())).length;
  const actionVerbPercentage = allBullets.length > 0 ? (bulletsWithActionVerbs / allBullets.length) * 100 : 0;

  if (actionVerbPercentage < 70) {
    const weakBullets = allBullets.filter(b => !actionVerbPattern.test(b.trim())).slice(0, 5);
    actions.push({
      category: 'experience',
      priority: 'medium',
      title: '💪 Strengthen Your Action Verbs',
      description: `${Math.round(100 - actionVerbPercentage)}% of bullets don't start with strong action verbs.`,
      currentScore: Math.round(actionVerbPercentage),
      targetScore: 90,
      suggestions: [
        'Start bullets with: Developed, Implemented, Architected, Optimized, Led',
        'Avoid: Worked on, Helped with, Responsible for, Assisted',
        ...weakBullets.slice(0, 3).map(b => `Rewrite: "${b.substring(0, 40)}..."`),
      ],
      canAutoFix: false,
    });
  }

  // 5. Check for certifications mentioned in JD
  const certPatterns = [
    /aws certified|azure certified|gcp certified/gi,
    /pmp|scrum master|csm|psm/gi,
    /cissp|cism|ceh|security\+/gi,
    /ccna|ccnp|ccie/gi,
  ];
  
  const jdText = JSON.stringify(jdAnalysis).toLowerCase();
  const jdCerts: string[] = [];
  certPatterns.forEach(pattern => {
    const matches = jdText.match(pattern) || [];
    jdCerts.push(...matches);
  });

  const resumeCerts = resumeData.certifications?.map(c => 
    typeof c === 'string' ? c.toLowerCase() : c.title.toLowerCase()
  ) || [];

  const missingCerts = [...new Set(jdCerts)].filter(cert => 
    !resumeCerts.some(rc => rc.includes(cert.toLowerCase()))
  );

  if (missingCerts.length > 0) {
    actions.push({
      category: 'certifications',
      priority: 'medium',
      title: '🏆 Consider Adding Certifications',
      description: `These certifications are mentioned in the JD. Add them if you have them.`,
      currentScore: resumeCerts.length > 0 ? 70 : 30,
      targetScore: 90,
      suggestions: missingCerts.map(cert => `Add "${cert}" certification if you have it`),
      canAutoFix: false,
    });
  }

  // 6. Check for projects alignment
  const projectCount = resumeData.projects?.length || 0;
  if (projectCount < 2) {
    actions.push({
      category: 'projects',
      priority: 'medium',
      title: '🚀 Add More Relevant Projects',
      description: `You have ${projectCount} project(s). Adding 2-3 relevant projects improves ATS scores.`,
      currentScore: projectCount * 30,
      targetScore: 90,
      suggestions: [
        'Add projects that use technologies from the JD',
        'Include personal projects, open-source contributions, or side projects',
        'Focus on projects that demonstrate skills required for the role',
      ],
      canAutoFix: false,
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2 };
  return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

export const resumeJdOptimizerService = {
  optimizeResumeAgainstJD,
  calculateATSScore
};