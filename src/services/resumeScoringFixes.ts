/**
 * Resume Scoring Fixes - Comprehensive fixes for Normal Mode scoring
 * 
 * Issues Fixed:
 * 1. Parser-to-Scorer Disconnection - Enhanced text parsing with validation
 * 2. Fresher Penalization - Candidate level detection without JD
 * 3. Keyword Matching - Semantic similarity with synonym expansion
 * 4. Education Undervaluation - Dynamic weight redistribution
 * 5. Confidence Labels - Score-quality based confidence
 */

// ============================================================================
// SKILL SYNONYMS - Comprehensive mapping for semantic matching
// ============================================================================

export const SKILL_SYNONYMS: Record<string, string[]> = {
  // API & Web Services
  'rest api': ['restful', 'rest apis', 'restful services', 'rest services', 'http api', 'web api', 'api development'],
  'restful': ['rest api', 'rest apis', 'restful services', 'rest services', 'http api'],
  'graphql': ['graph ql', 'graphql api', 'apollo graphql', 'graphql server'],
  'api': ['apis', 'web services', 'microservices', 'endpoints', 'rest', 'restful'],
  
  // JavaScript Ecosystem
  'node.js': ['nodejs', 'node', 'backend javascript', 'server-side javascript', 'express.js'],
  'react': ['reactjs', 'react.js', 'react js', 'frontend react', 'react framework'],
  'angular': ['angularjs', 'angular.js', 'angular 2+', 'angular framework'],
  'vue': ['vuejs', 'vue.js', 'vue 3', 'vue framework'],
  'javascript': ['js', 'ecmascript', 'es6', 'es2015', 'vanilla js', 'frontend javascript'],
  'typescript': ['ts', 'typed javascript', 'typescript language'],
  'next.js': ['nextjs', 'next', 'next framework', 'react ssr'],
  'express': ['expressjs', 'express.js', 'express framework', 'node express'],
  
  // Python Ecosystem
  'python': ['python3', 'python 3', 'py', 'python programming'],
  'django': ['django framework', 'django python', 'django web'],
  'flask': ['flask framework', 'flask python', 'flask api'],
  'fastapi': ['fast api', 'fastapi python'],
  'pandas': ['pandas python', 'data analysis python', 'dataframes'],
  'numpy': ['numpy python', 'numerical python', 'np'],

  // Databases
  'sql': ['mysql', 'postgresql', 'postgres', 'database queries', 'sql server', 'oracle sql', 'sqlite'],
  'mysql': ['my sql', 'mysql database', 'sql'],
  'postgresql': ['postgres', 'psql', 'postgre', 'pg'],
  'mongodb': ['mongo', 'mongo db', 'nosql mongodb', 'document database'],
  'redis': ['redis cache', 'redis db', 'in-memory database'],
  'elasticsearch': ['elastic search', 'elastic', 'es', 'elk stack'],
  
  // Cloud & DevOps
  'aws': ['amazon web services', 'amazon aws', 'aws cloud', 'ec2', 's3', 'lambda'],
  'azure': ['microsoft azure', 'azure cloud', 'azure services'],
  'gcp': ['google cloud', 'google cloud platform', 'gcloud'],
  'docker': ['containerization', 'docker containers', 'dockerfile', 'docker compose'],
  'kubernetes': ['k8s', 'container orchestration', 'kubectl', 'k8'],
  'ci/cd': ['cicd', 'continuous integration', 'continuous deployment', 'continuous delivery', 'devops pipeline'],
  'jenkins': ['jenkins ci', 'jenkins pipeline', 'jenkins automation'],
  'terraform': ['infrastructure as code', 'iac', 'terraform cloud'],
  
  // Data & Analytics
  'machine learning': ['ml', 'machine-learning', 'ml models', 'predictive modeling'],
  'deep learning': ['dl', 'neural networks', 'deep neural networks', 'dnn'],
  'data science': ['data analytics', 'data analysis', 'analytics', 'statistical analysis'],
  'tableau': ['tableau desktop', 'tableau server', 'data visualization'],
  'power bi': ['powerbi', 'power-bi', 'microsoft power bi', 'bi tools'],
  
  // Testing
  'unit testing': ['unit tests', 'test driven development', 'tdd', 'testing'],
  'jest': ['jest testing', 'javascript testing', 'react testing'],
  'pytest': ['python testing', 'py test', 'python unit tests'],
  'selenium': ['selenium webdriver', 'browser automation', 'web testing'],
  'cypress': ['cypress testing', 'e2e testing', 'end to end testing'],
  
  // Methodologies
  'agile': ['agile methodology', 'agile development', 'scrum', 'kanban', 'sprint'],
  'scrum': ['scrum methodology', 'scrum master', 'agile scrum', 'sprint planning'],
  
  // Version Control
  'git': ['github', 'gitlab', 'bitbucket', 'version control', 'source control'],
  'github': ['git hub', 'github actions', 'git'],
};

// ============================================================================
// CANDIDATE LEVEL DETECTION - Works without JD
// ============================================================================

export type CandidateLevel = 'fresher' | 'junior' | 'mid' | 'senior';

export interface CandidateLevelResult {
  level: CandidateLevel;
  confidence: number;
  signals: string[];
  totalYearsExperience: number;
}

/**
 * Detect candidate level from resume content (without requiring JD)
 */
export function detectCandidateLevel(
  resumeText: string,
  resumeData?: { workExperience?: any[]; education?: any[]; projects?: any[]; certifications?: any[] }
): CandidateLevelResult {
  const signals: string[] = [];
  let totalYears = 0;
  
  const textLower = resumeText.toLowerCase();
  
  // 1. Check for explicit fresher indicators in text
  const fresherIndicators = [
    'fresher', 'fresh graduate', 'recent graduate', 'entry level', 'entry-level',
    'no experience', 'seeking first', 'looking for first', 'aspiring', 'beginner',
    'final year', 'graduating', 'new graduate', 'campus placement', 'internship only'
  ];
  
  const hasFresherIndicator = fresherIndicators.some(ind => textLower.includes(ind));
  if (hasFresherIndicator) {
    signals.push('Fresher indicator found in text');
  }
  
  // 2. Calculate total years from work experience
  if (resumeData?.workExperience && resumeData.workExperience.length > 0) {
    totalYears = calculateTotalExperience(resumeData.workExperience);
    signals.push(`${totalYears.toFixed(1)} years of experience detected`);
  } else {
    // Try to extract from text
    const yearPatterns = [
      /(\d+)\+?\s*years?\s*(?:of\s*)?experience/gi,
      /experience\s*:?\s*(\d+)\+?\s*years?/gi,
      /(\d+)\+?\s*years?\s*(?:in|of|working)/gi
    ];
    
    for (const pattern of yearPatterns) {
      const match = pattern.exec(textLower);
      if (match) {
        totalYears = Math.max(totalYears, parseInt(match[1]));
      }
    }
    
    if (totalYears === 0) {
      signals.push('No work experience section found');
    }
  }
  
  // 3. Check for internship-only experience
  const hasOnlyInternships = resumeData?.workExperience?.every(exp => 
    exp.role?.toLowerCase().includes('intern') || 
    exp.company?.toLowerCase().includes('intern')
  ) ?? false;
  
  if (hasOnlyInternships && resumeData?.workExperience?.length) {
    signals.push('Only internship experience found');
  }
  
  // 4. Check for strong project presence (fresher signal)
  const projectCount = resumeData?.projects?.length || 0;
  const hasStrongProjects = projectCount >= 3;
  if (hasStrongProjects && totalYears < 2) {
    signals.push('Strong project portfolio (fresher signal)');
  }
  
  // 5. Check for recent education
  const hasRecentEducation = checkRecentEducation(resumeData?.education, textLower);
  if (hasRecentEducation) {
    signals.push('Recent education detected');
  }
  
  // 6. Determine level based on signals
  let level: CandidateLevel;
  let confidence: number;
  
  if (hasFresherIndicator || (totalYears < 1 && (hasOnlyInternships || hasRecentEducation))) {
    level = 'fresher';
    confidence = hasFresherIndicator ? 95 : 85;
  } else if (totalYears < 2 || hasOnlyInternships) {
    level = 'fresher';
    confidence = 75;
  } else if (totalYears < 4) {
    level = 'junior';
    confidence = 80;
  } else if (totalYears < 8) {
    level = 'mid';
    confidence = 85;
  } else {
    level = 'senior';
    confidence = 90;
  }
  
  return { level, confidence, signals, totalYearsExperience: totalYears };
}

/**
 * Calculate total years of experience from work history
 */
function calculateTotalExperience(workExperience: any[]): number {
  let totalMonths = 0;
  
  for (const exp of workExperience) {
    const year = exp.year || exp.duration || '';
    
    // Try to parse date ranges like "2020 - 2023" or "Jan 2020 - Present"
    const rangeMatch = year.match(/(\d{4})\s*[-–]\s*(\d{4}|present|current|now)/i);
    if (rangeMatch) {
      const startYear = parseInt(rangeMatch[1]);
      const endYear = rangeMatch[2].toLowerCase() === 'present' || 
                      rangeMatch[2].toLowerCase() === 'current' ||
                      rangeMatch[2].toLowerCase() === 'now'
        ? new Date().getFullYear()
        : parseInt(rangeMatch[2]);
      totalMonths += (endYear - startYear) * 12;
      continue;
    }
    
    // Try to parse duration like "2 years" or "6 months"
    const durationMatch = year.match(/(\d+)\s*(year|month)/i);
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      totalMonths += unit.startsWith('year') ? value * 12 : value;
    }
  }
  
  return totalMonths / 12;
}

/**
 * Check if education is recent (within last 2 years)
 */
function checkRecentEducation(education: any[] | undefined, textLower: string): boolean {
  const currentYear = new Date().getFullYear();
  
  if (education && education.length > 0) {
    for (const edu of education) {
      const year = edu.year || edu.graduationYear || '';
      const yearMatch = year.match(/(\d{4})/);
      if (yearMatch) {
        const gradYear = parseInt(yearMatch[1]);
        if (currentYear - gradYear <= 2) return true;
      }
    }
  }
  
  // Check text for recent graduation indicators
  const recentYears = [currentYear, currentYear - 1, currentYear - 2];
  for (const year of recentYears) {
    if (textLower.includes(`graduated ${year}`) || 
        textLower.includes(`class of ${year}`) ||
        textLower.includes(`batch ${year}`) ||
        textLower.includes(`${year} graduate`)) {
      return true;
    }
  }
  
  return false;
}

// ============================================================================
// DYNAMIC WEIGHT REDISTRIBUTION
// ============================================================================

export interface TierWeights {
  skills_keywords: number;
  experience: number;
  education: number;
  projects: number;
  certifications: number;
  basic_structure: number;
  content_structure: number;
  competitive: number;
  culture_fit: number;
  qualitative: number;
  red_flags: number;
}

/**
 * Get tier weights based on candidate level
 * Freshers get 0% experience weight, redistributed to skills/projects/education
 */
export function getWeightsForLevel(level: CandidateLevel): TierWeights {
  switch (level) {
    case 'fresher':
      return {
        skills_keywords: 35,    // +10% (from 25%)
        experience: 0,          // -25% (not required for freshers)
        education: 15,          // +9% (from 6%)
        projects: 20,           // +12% (from 8%)
        certifications: 8,      // +4% (from 4%)
        basic_structure: 8,     // same
        content_structure: 6,   // -4% (from 10%)
        competitive: 4,         // -2% (from 6%)
        culture_fit: 2,         // -2% (from 4%)
        qualitative: 2,         // -2% (from 4%)
        red_flags: 0,           // penalty-based, not weighted
      };
    
    case 'junior':
      return {
        skills_keywords: 30,
        experience: 15,
        education: 10,
        projects: 15,
        certifications: 6,
        basic_structure: 8,
        content_structure: 8,
        competitive: 4,
        culture_fit: 2,
        qualitative: 2,
        red_flags: 0,
      };
    
    case 'mid':
      return {
        skills_keywords: 25,
        experience: 25,
        education: 5,
        projects: 10,
        certifications: 5,
        basic_structure: 8,
        content_structure: 10,
        competitive: 6,
        culture_fit: 3,
        qualitative: 3,
        red_flags: 0,
      };
    
    case 'senior':
    default:
      return {
        skills_keywords: 25,
        experience: 30,
        education: 3,
        projects: 8,
        certifications: 4,
        basic_structure: 8,
        content_structure: 10,
        competitive: 6,
        culture_fit: 3,
        qualitative: 3,
        red_flags: 0,
      };
  }
}

// ============================================================================
// SEMANTIC KEYWORD MATCHING
// ============================================================================

/**
 * Match keywords with semantic similarity (synonym expansion)
 */
export function matchKeywordsWithSynonyms(
  jdKeywords: string[],
  resumeText: string
): { matchRate: number; matches: string[]; missingWithSuggestions: { keyword: string; suggestions: string[] }[] } {
  const resumeLower = resumeText.toLowerCase();
  const matches: string[] = [];
  const missingWithSuggestions: { keyword: string; suggestions: string[] }[] = [];
  
  for (const keyword of jdKeywords) {
    const keywordLower = keyword.toLowerCase();
    
    // 1. Check exact match
    if (resumeLower.includes(keywordLower)) {
      matches.push(keyword);
      continue;
    }
    
    // 2. Check synonym matches
    const synonyms = SKILL_SYNONYMS[keywordLower] || [];
    const allVariants = [keywordLower, ...synonyms];
    
    let found = false;
    for (const variant of allVariants) {
      if (resumeLower.includes(variant.toLowerCase())) {
        matches.push(keyword);
        found = true;
        break;
      }
    }
    
    if (!found) {
      // 3. Check partial matches (e.g., "react" in "reactjs")
      const partialMatch = allVariants.some(variant => {
        const normalized = variant.replace(/[^a-z0-9]/g, '');
        return resumeLower.replace(/[^a-z0-9]/g, '').includes(normalized);
      });
      
      if (partialMatch) {
        matches.push(keyword);
      } else {
        missingWithSuggestions.push({ keyword, suggestions: synonyms.slice(0, 3) });
      }
    }
  }
  
  const matchRate = jdKeywords.length > 0 
    ? Math.round((matches.length / jdKeywords.length) * 100) 
    : 100;
  
  return { matchRate, matches, missingWithSuggestions };
}

// ============================================================================
// ENHANCED RESUME PARSER
// ============================================================================

export interface ParsedResumeResult {
  data: ParsedResumeData;
  confidence: number;
  warnings: string[];
  parsingQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface ParsedResumeData {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  summary: string;
  skills: { category: string; list: string[] }[];
  workExperience: { role: string; company: string; year: string; bullets: string[] }[];
  projects: { title: string; bullets: string[] }[];
  education: { degree: string; school: string; year: string }[];
  certifications: string[];
}

/**
 * Enhanced resume parser with validation and confidence tracking
 */
export function parseResumeText(resumeText: string): ParsedResumeResult {
  const warnings: string[] = [];
  let confidence = 100;
  
  // Validate input
  if (!resumeText || resumeText.trim().length < 100) {
    return {
      data: createEmptyResumeData(),
      confidence: 0,
      warnings: ['Resume text too short or empty'],
      parsingQuality: 'poor'
    };
  }
  
  const textLower = resumeText.toLowerCase();
  
  // Extract contact info
  const name = extractName(resumeText);
  const email = extractEmail(resumeText);
  const phone = extractPhone(resumeText);
  const linkedin = extractLinkedIn(resumeText);
  const github = extractGitHub(resumeText);
  
  if (!name) { warnings.push('Could not extract name'); confidence -= 5; }
  if (!email) { warnings.push('Could not extract email'); confidence -= 5; }
  
  // Extract skills
  const skills = extractSkills(resumeText, textLower);
  if (skills.length === 0) { warnings.push('No skills detected'); confidence -= 15; }
  
  // Extract work experience
  const workExperience = extractWorkExperience(resumeText);
  if (workExperience.length === 0) { warnings.push('No work experience detected'); confidence -= 10; }
  
  // Extract projects
  const projects = extractProjects(resumeText);
  if (projects.length === 0) { warnings.push('No projects detected'); confidence -= 10; }
  
  // Extract education
  const education = extractEducation(resumeText);
  if (education.length === 0) { warnings.push('No education detected'); confidence -= 10; }
  
  // Extract certifications
  const certifications = extractCertifications(resumeText);
  
  // Extract summary
  const summary = extractSummary(resumeText);
  
  // Determine parsing quality
  let parsingQuality: 'excellent' | 'good' | 'fair' | 'poor';
  if (confidence >= 85) parsingQuality = 'excellent';
  else if (confidence >= 70) parsingQuality = 'good';
  else if (confidence >= 50) parsingQuality = 'fair';
  else parsingQuality = 'poor';
  
  return {
    data: {
      name,
      email,
      phone,
      linkedin,
      github,
      summary,
      skills,
      workExperience,
      projects,
      education,
      certifications
    },
    confidence: Math.max(0, confidence),
    warnings,
    parsingQuality
  };
}

// ============================================================================
// EXTRACTION HELPERS
// ============================================================================

function createEmptyResumeData(): ParsedResumeData {
  return {
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    summary: '',
    skills: [],
    workExperience: [],
    projects: [],
    education: [],
    certifications: []
  };
}

function extractName(text: string): string {
  const lines = text.split('\n').filter(l => l.trim());
  // First non-empty line is usually the name
  const firstLine = lines[0]?.trim() || '';
  // Validate it looks like a name (2-4 words, no special chars)
  if (/^[A-Za-z\s]{2,50}$/.test(firstLine) && firstLine.split(/\s+/).length <= 4) {
    return firstLine;
  }
  return '';
}

function extractEmail(text: string): string {
  const match = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  return match ? match[0] : '';
}

function extractPhone(text: string): string {
  const match = text.match(/[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/);
  return match ? match[0] : '';
}

function extractLinkedIn(text: string): string {
  const match = text.match(/linkedin\.com\/in\/[\w-]+/i);
  return match ? `https://${match[0]}` : '';
}

function extractGitHub(text: string): string {
  const match = text.match(/github\.com\/[\w-]+/i);
  return match ? `https://${match[0]}` : '';
}

function extractSummary(text: string): string {
  const patterns = [
    /(?:CAREER\s*OBJECTIVE|PROFESSIONAL\s*SUMMARY|SUMMARY|PROFILE|ABOUT\s*ME|OBJECTIVE)\s*[:\n]?\s*([\s\S]{50,500}?)(?=\n\s*(?:SKILLS|EDUCATION|EXPERIENCE|PROJECTS|WORK|EMPLOYMENT)|\n\n)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '';
}

function extractSkills(text: string, textLower: string): { category: string; list: string[] }[] {
  const skills: { category: string; list: string[] }[] = [];
  
  // Technical skills to look for
  const techSkills = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php',
    'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring',
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins',
    'git', 'jira', 'agile', 'scrum', 'rest', 'graphql', 'api',
    'html', 'css', 'sass', 'tailwind', 'bootstrap',
    'machine learning', 'tensorflow', 'pytorch', 'pandas', 'numpy',
    'tableau', 'power bi', 'excel', 'sql'
  ];
  
  const foundTech: string[] = [];
  techSkills.forEach(skill => {
    if (textLower.includes(skill.toLowerCase())) {
      foundTech.push(skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  });
  
  if (foundTech.length > 0) {
    skills.push({ category: 'Technical Skills', list: [...new Set(foundTech)] });
  }
  
  // Tools
  const tools = ['figma', 'sketch', 'postman', 'swagger', 'jest', 'cypress', 'selenium'];
  const foundTools: string[] = [];
  tools.forEach(tool => {
    if (textLower.includes(tool)) {
      foundTools.push(tool.charAt(0).toUpperCase() + tool.slice(1));
    }
  });
  
  if (foundTools.length > 0) {
    skills.push({ category: 'Tools', list: foundTools });
  }
  
  return skills;
}

function extractWorkExperience(text: string): { role: string; company: string; year: string; bullets: string[] }[] {
  const experiences: { role: string; company: string; year: string; bullets: string[] }[] = [];
  
  // Find EXPERIENCE section
  const expMatch = text.match(/(?:WORK\s*)?EXPERIENCE\s*[:\n]?([\s\S]*?)(?=\n\s*(?:EDUCATION|PROJECTS|SKILLS|CERTIFICATIONS|ACHIEVEMENTS)|\n\n\n|$)/i);
  
  if (!expMatch) return experiences;
  
  const expSection = expMatch[1];
  const lines = expSection.split('\n').filter(l => l.trim());
  
  let currentExp: { role: string; company: string; year: string; bullets: string[] } | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check if this is a role/company line (contains year pattern)
    const yearMatch = trimmed.match(/(\d{4}\s*[-–]\s*(?:\d{4}|present|current))/i);
    
    if (yearMatch && !trimmed.startsWith('-') && !trimmed.startsWith('•')) {
      // Save previous experience
      if (currentExp && currentExp.bullets.length > 0) {
        experiences.push(currentExp);
      }
      
      // Start new experience
      const year = yearMatch[1];
      const beforeYear = trimmed.substring(0, trimmed.indexOf(yearMatch[1])).trim();
      
      // Try to split role and company
      const parts = beforeYear.split(/\s*[|@,]\s*/);
      const role = parts[0] || 'Professional';
      const company = parts[1] || '';
      
      currentExp = { role, company, year, bullets: [] };
    } else if ((trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) && currentExp) {
      // This is a bullet point
      const bullet = trimmed.replace(/^[-•*]\s*/, '').trim();
      if (bullet.length > 10) {
        currentExp.bullets.push(bullet);
      }
    }
  }
  
  // Don't forget the last experience
  if (currentExp && currentExp.bullets.length > 0) {
    experiences.push(currentExp);
  }
  
  return experiences;
}

function extractProjects(text: string): { title: string; bullets: string[] }[] {
  const projects: { title: string; bullets: string[] }[] = [];
  
  // Find PROJECTS section
  const projMatch = text.match(/PROJECTS?\s*[:\n]?([\s\S]*?)(?=\n\s*(?:EDUCATION|EXPERIENCE|SKILLS|CERTIFICATIONS|ACHIEVEMENTS|WORK)|\n\n\n|$)/i);
  
  if (!projMatch) return projects;
  
  const projSection = projMatch[1];
  const lines = projSection.split('\n').filter(l => l.trim());
  
  let currentProj: { title: string; bullets: string[] } | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) continue;
    
    // Check if this is a project title (not a bullet, not too long)
    const isBullet = /^[-•*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed);
    const isTitle = !isBullet && trimmed.length > 3 && trimmed.length < 100;
    
    if (isTitle && !trimmed.toLowerCase().startsWith('project')) {
      // Save previous project
      if (currentProj && currentProj.bullets.length > 0) {
        projects.push(currentProj);
      }
      
      currentProj = { title: trimmed, bullets: [] };
    } else if (isBullet && currentProj) {
      const bullet = trimmed.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
      if (bullet.length > 10) {
        currentProj.bullets.push(bullet);
      }
    }
  }
  
  // Don't forget the last project
  if (currentProj && currentProj.bullets.length > 0) {
    projects.push(currentProj);
  }
  
  return projects;
}

function extractEducation(text: string): { degree: string; school: string; year: string }[] {
  const education: { degree: string; school: string; year: string }[] = [];
  
  // Find EDUCATION section
  const eduMatch = text.match(/EDUCATION\s*[:\n]?([\s\S]*?)(?=\n\s*(?:PROJECTS|EXPERIENCE|SKILLS|CERTIFICATIONS|ACHIEVEMENTS|WORK)|\n\n\n|$)/i);
  
  if (!eduMatch) return education;
  
  const eduSection = eduMatch[1];
  
  // Look for degree patterns
  const degreePatterns = [
    /(?:Bachelor|Master|B\.?S\.?|M\.?S\.?|B\.?E\.?|M\.?E\.?|B\.?Tech|M\.?Tech|MBA|PhD|Doctorate)[^,\n]*/gi
  ];
  
  for (const pattern of degreePatterns) {
    const matches = eduSection.match(pattern);
    if (matches) {
      for (const match of matches) {
        const degree = match.trim();
        
        // Try to find year
        const yearMatch = eduSection.match(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]{0,100}(\\d{4})', 'i'));
        const year = yearMatch ? yearMatch[1] : '';
        
        // Try to find school (usually on same or next line)
        const schoolMatch = eduSection.match(/(?:University|College|Institute|School)[^,\n]*/i);
        const school = schoolMatch ? schoolMatch[0].trim() : '';
        
        education.push({ degree, school, year });
      }
    }
  }
  
  return education;
}

function extractCertifications(text: string): string[] {
  const certifications: string[] = [];
  
  // Find CERTIFICATIONS section
  const certMatch = text.match(/CERTIFICATIONS?\s*[:\n]?([\s\S]*?)(?=\n\s*(?:PROJECTS|EXPERIENCE|SKILLS|EDUCATION|ACHIEVEMENTS|WORK)|\n\n\n|$)/i);
  
  if (!certMatch) return certifications;
  
  const certSection = certMatch[1];
  const lines = certSection.split('\n').filter(l => l.trim());
  
  for (const line of lines) {
    const trimmed = line.trim().replace(/^[-•*]\s*/, '');
    if (trimmed.length > 5 && trimmed.length < 150) {
      certifications.push(trimmed);
    }
  }
  
  return certifications;
}

// ============================================================================
// CONFIDENCE CALCULATION
// ============================================================================

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

/**
 * Calculate confidence based on score quality AND data completeness
 */
export function calculateConfidence(
  score: number,
  parsingQuality: 'excellent' | 'good' | 'fair' | 'poor',
  hasJD: boolean
): ConfidenceLevel {
  // Convert parsing quality to numeric
  const qualityScore = {
    'excellent': 100,
    'good': 75,
    'fair': 50,
    'poor': 25
  }[parsingQuality];
  
  // JD presence boosts confidence
  const jdBonus = hasJD ? 10 : 0;
  
  // Combined score
  const combinedScore = (score * 0.4) + (qualityScore * 0.5) + jdBonus;
  
  // Thresholds
  if (combinedScore >= 70 && score >= 70) return 'High';
  if (combinedScore >= 50 && score >= 55) return 'Medium';
  return 'Low';
}

// ============================================================================
// ACTIONABLE RECOMMENDATIONS
// ============================================================================

export interface ActionableRecommendation {
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  example?: string;
  impact: string;
}

/**
 * Generate actionable recommendations based on tier scores
 */
export function generateActionableRecommendations(
  tierScores: Record<string, { percentage: number; top_issues: string[] }>,
  candidateLevel: CandidateLevel,
  missingKeywords: string[]
): ActionableRecommendation[] {
  const recommendations: ActionableRecommendation[] = [];
  
  // Skills recommendations
  if (tierScores.skills_keywords?.percentage < 70) {
    recommendations.push({
      category: 'Skills',
      priority: 'critical',
      action: 'Add missing technical skills to your Skills section',
      example: missingKeywords.slice(0, 3).join(', '),
      impact: 'Could improve score by 10-15 points'
    });
  }
  
  // Experience recommendations (only for non-freshers)
  if (candidateLevel !== 'fresher' && tierScores.experience?.percentage < 60) {
    recommendations.push({
      category: 'Experience',
      priority: 'high',
      action: 'Add quantified achievements to your experience bullets',
      example: 'Developed REST API serving 10K+ daily requests, reducing response time by 40%',
      impact: 'Could improve score by 8-12 points'
    });
  }
  
  // Projects recommendations (especially for freshers)
  if (tierScores.projects?.percentage < 60) {
    const priority = candidateLevel === 'fresher' ? 'critical' : 'high';
    recommendations.push({
      category: 'Projects',
      priority,
      action: 'Add 2-3 projects with measurable outcomes and tech stack details',
      example: 'Built e-commerce platform using React, Node.js, MongoDB handling 500+ products',
      impact: candidateLevel === 'fresher' ? 'Could improve score by 15-20 points' : 'Could improve score by 5-10 points'
    });
  }
  
  // Education recommendations (for freshers)
  if (candidateLevel === 'fresher' && tierScores.education?.percentage < 70) {
    recommendations.push({
      category: 'Education',
      priority: 'high',
      action: 'Include relevant coursework, GPA (if good), and academic achievements',
      example: 'B.Tech in Computer Science, GPA: 8.5/10, Relevant: Data Structures, DBMS, Web Development',
      impact: 'Could improve score by 5-10 points'
    });
  }
  
  // Certifications
  if (tierScores.certifications?.percentage < 50) {
    recommendations.push({
      category: 'Certifications',
      priority: 'medium',
      action: 'Add relevant certifications (AWS, Google, Microsoft, etc.)',
      example: 'AWS Certified Developer, Google Cloud Professional',
      impact: 'Could improve score by 3-5 points'
    });
  }
  
  // Formatting
  if (tierScores.basic_structure?.percentage < 70) {
    recommendations.push({
      category: 'Formatting',
      priority: 'medium',
      action: 'Improve resume formatting with clear section headers and consistent bullet points',
      impact: 'Could improve score by 3-5 points'
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  SKILL_SYNONYMS,
  detectCandidateLevel,
  getWeightsForLevel,
  matchKeywordsWithSynonyms,
  parseResumeText,
  calculateConfidence,
  generateActionableRecommendations
};
