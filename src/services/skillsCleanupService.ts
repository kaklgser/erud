/**
 * Skills Cleanup & Optimization Service
 * Removes irrelevant words, locations, and action verbs from skills section
 * Restructures skills to match JD requirements using centralized taxonomy
 */

import {
  SKILL_CATEGORIES,
  PROGRAMMING_LANGUAGES,
  FRONTEND_TECHNOLOGIES,
  BACKEND_TECHNOLOGIES,
  DATABASES,
  CLOUD_AND_DEVOPS,
  TOOLS_AND_PLATFORMS,
  TESTING_AND_QA,
  SOFT_SKILLS,
  categorizeSkill,
  formatSkillName,
  getCategoryOrder
} from '../constants/skillsTaxonomy';

// Words to remove from skills section (noise, locations, actions, irrelevant terms)
// NOTE: OOP, SDLC, Debugging are VALID IBM-critical skills - DO NOT include them here!
const NOISE_WORDS = new Set([
  // Action verbs (not skills)
  'improve', 'convert', 'participate', 'prepare', 'write', 'identify', 'leverage',
  'troubleshoot', 'utilizing', 'leveraging', 'using', 'working', 'implementing',
  'developing', 'building', 'creating', 'designing', 'managing',
  'handling', 'ensuring', 'maintaining', 'supporting',
  // Locations
  'gurugram', 'gurgaon', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'mumbai', 'pune', 'delhi', 'noida',
  // Languages (spoken)
  'english', 'hindi', 'spanish', 'french', 'german',
  // Generic/soft words
  'proficiency', 'internship', 'experience', 'production-grade',
  'secure', 'performance-focused', 'relevant', 'automotive',
  'peer', 'cdo', 'platform', 'devseops',
  'sprint', 'foundry', 'detail', 'domains',
  'ability', 'knowledge', 'understanding', 'familiarity', 'exposure',
  'good', 'strong', 'excellent', 'proficient', 'skilled', 'experienced',
  'basic', 'intermediate', 'advanced', 'expert', 'master', 'fluent',
  // Metrics/buzzwords
  'spotfire', 'csat', 'pms'
]);

// IBM-specific required skills to prioritize
const IBM_PRIORITY_SKILLS = [
  'java', 'core java', 'python', 'oop', 'object-oriented programming',
  'dsa', 'data structures', 'algorithms', 'microservices', 'rest',
  'grpc', 'spring boot', 'linux', 'git', 'docker', 'kubernetes',
  'ci/cd', 'concurrency', 'unit testing', 'junit', 'debugging',
  'api development', 'rest api', 'cloud', 'azure', 'aws',
  'design patterns', 'sdlc', 'code review', 'performance optimization'
];

interface SkillsAnalysis {
  original: string;
  cleaned: string;
  removed: string[];
  added: string[];
  categories: SkillsCategories;
  score: number;
}

// Updated to match ATS-friendly structure
interface SkillsCategories {
  programmingLanguages: string[];
  frontendTechnologies: string[];
  backendTechnologies: string[];
  databases: string[];
  cloudAndDevOps: string[];
  toolsAndPlatforms: string[];
  testingAndQA: string[];
  softSkills: string[];
  other: string[];
}

/**
 * Clean and optimize skills section
 */
export const cleanSkillsSection = (skillsText: string): SkillsAnalysis => {
  const original = skillsText;
  const removed: string[] = [];
  const added: string[] = [];

  // Split by common delimiters
  let skills = skillsText
    .split(/[,;:\n]/)
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length > 0);

  // Remove noise words and track what was removed
  const cleaned = skills.filter(skill => {
    const words = skill.split(/\s+/);
    const hasNoise = words.some(word => NOISE_WORDS.has(word));
    
    if (hasNoise) {
      removed.push(skill);
      return false;
    }
    return true;
  });

  // Categorize skills
  const categories = categorizeSkills(cleaned);

  // Add missing IBM-critical skills if not present
  const allSkills = [
    ...categories.programmingLanguages,
    ...categories.backendTechnologies,
    ...categories.frontendTechnologies,
    ...categories.databases,
    ...categories.toolsAndPlatforms,
    ...categories.cloudAndDevOps,
    ...categories.softSkills
  ];

  IBM_PRIORITY_SKILLS.forEach(skill => {
    const found = allSkills.some(s => s.includes(skill) || skill.includes(s));
    if (!found && shouldAddSkill(skill, skillsText)) {
      added.push(skill);
      // Add to appropriate category based on skill type
      const category = categorizeSkill(skill);
      if (category === SKILL_CATEGORIES.SOFT_SKILLS) {
        categories.softSkills.push(formatSkillName(skill));
      } else {
        categories.other.push(formatSkillName(skill));
      }
    }
  });

  // Calculate improvement score
  const score = calculateSkillsScore(categories, removed.length);

  return {
    original,
    cleaned: formatSkillsSection(categories),
    removed,
    added,
    categories,
    score
  };
};

/**
 * Categorize skills using centralized taxonomy with cross-category deduplication
 */
const categorizeSkills = (skills: string[]): SkillsCategories => {
  const categories: SkillsCategories = {
    programmingLanguages: [],
    frontendTechnologies: [],
    backendTechnologies: [],
    databases: [],
    cloudAndDevOps: [],
    toolsAndPlatforms: [],
    testingAndQA: [],
    softSkills: [],
    other: []
  };

  // Track added skills to prevent cross-category duplicates
  const addedSkills = new Set<string>();

  skills.forEach(skill => {
    const lower = skill.toLowerCase();
    const category = categorizeSkill(lower);

    const formattedSkill = formatSkillName(skill);
    const formattedLower = formattedSkill.toLowerCase();

    // Skip if already added to another category
    if (addedSkills.has(formattedLower)) {
      return;
    }

    if (category === SKILL_CATEGORIES.PROGRAMMING_LANGUAGES) {
      categories.programmingLanguages.push(formattedSkill);
      addedSkills.add(formattedLower);
    } else if (category === SKILL_CATEGORIES.FRONTEND_TECHNOLOGIES) {
      categories.frontendTechnologies.push(formattedSkill);
      addedSkills.add(formattedLower);
    } else if (category === SKILL_CATEGORIES.BACKEND_TECHNOLOGIES) {
      categories.backendTechnologies.push(formattedSkill);
      addedSkills.add(formattedLower);
    } else if (category === SKILL_CATEGORIES.DATABASES) {
      categories.databases.push(formattedSkill);
      addedSkills.add(formattedLower);
    } else if (category === SKILL_CATEGORIES.CLOUD_AND_DEVOPS) {
      categories.cloudAndDevOps.push(formattedSkill);
      addedSkills.add(formattedLower);
    } else if (category === SKILL_CATEGORIES.TESTING_AND_QA) {
      categories.testingAndQA.push(formattedSkill);
      addedSkills.add(formattedLower);
    } else if (category === SKILL_CATEGORIES.TOOLS_AND_PLATFORMS) {
      categories.toolsAndPlatforms.push(formattedSkill);
      addedSkills.add(formattedLower);
    } else if (category === SKILL_CATEGORIES.SOFT_SKILLS) {
      categories.softSkills.push(formattedSkill);
      addedSkills.add(formattedLower);
    } else {
      categories.other.push(formattedSkill);
      addedSkills.add(formattedLower);
    }
  });

  // Additional deduplication pass (should not be needed, but adds safety)
  Object.keys(categories).forEach((key: string) => {
    categories[key as keyof SkillsCategories] = [...new Set(categories[key as keyof SkillsCategories])];
  });

  return categories;
};

/**
 * Determine if a skill should be added based on JD context
 */
const shouldAddSkill = (skill: string, context: string): boolean => {
  const contextLower = context.toLowerCase();
  
  // Check if skill is mentioned in context or related skills are present
  const relatedKeywords: Record<string, string[]> = {
    'dsa': ['algorithm', 'data structure', 'coding', 'problem solving'],
    'junit': ['unit test', 'testing', 'test'],
    'debugging': ['debug', 'troubleshoot', 'issue'],
    'design patterns': ['pattern', 'architecture', 'design'],
    'grpc': ['microservice', 'service', 'communication'],
    'concurrency': ['thread', 'concurrent', 'parallel', 'async']
  };

  if (relatedKeywords[skill]) {
    return relatedKeywords[skill].some(keyword => contextLower.includes(keyword));
  }

  return false;
};

/**
 * Format skills section with ATS-friendly category names
 */
const formatSkillsSection = (categories: SkillsCategories): string => {
  const sections: string[] = [];

  // Use ATS-friendly category names in correct order
  if (categories.programmingLanguages.length > 0) {
    sections.push(`${SKILL_CATEGORIES.PROGRAMMING_LANGUAGES}: ${categories.programmingLanguages.join(', ')}`);
  }

  if (categories.frontendTechnologies.length > 0) {
    sections.push(`${SKILL_CATEGORIES.FRONTEND_TECHNOLOGIES}: ${categories.frontendTechnologies.join(', ')}`);
  }

  if (categories.backendTechnologies.length > 0) {
    sections.push(`${SKILL_CATEGORIES.BACKEND_TECHNOLOGIES}: ${categories.backendTechnologies.join(', ')}`);
  }

  if (categories.databases.length > 0) {
    sections.push(`${SKILL_CATEGORIES.DATABASES}: ${categories.databases.join(', ')}`);
  }

  if (categories.cloudAndDevOps.length > 0) {
    sections.push(`${SKILL_CATEGORIES.CLOUD_AND_DEVOPS}: ${categories.cloudAndDevOps.join(', ')}`);
  }

  if (categories.testingAndQA.length > 0) {
    sections.push(`${SKILL_CATEGORIES.TESTING_AND_QA}: ${categories.testingAndQA.join(', ')}`);
  }

  if (categories.toolsAndPlatforms.length > 0) {
    sections.push(`${SKILL_CATEGORIES.TOOLS_AND_PLATFORMS}: ${categories.toolsAndPlatforms.join(', ')}`);
  }

  if (categories.softSkills.length > 0) {
    sections.push(`${SKILL_CATEGORIES.SOFT_SKILLS}: ${categories.softSkills.join(', ')}`);
  }

  if (categories.other.length > 0 && categories.other.length < 5) {
    sections.push(`Other: ${categories.other.join(', ')}`);
  }

  return sections.join('\n');
};

/**
 * Calculate skills section quality score using ATS-friendly categories
 */
const calculateSkillsScore = (categories: SkillsCategories, removedCount: number): number => {
  let score = 100;

  // Deduct for removed noise words
  score -= Math.min(removedCount * 2, 20);

  // Bonus for having soft skills
  if (categories.softSkills.length >= 5) {
    score += 10;
  }

  // Bonus for having multiple categories
  const filledCategories = Object.values(categories).filter(cat => cat.length > 0).length;
  if (filledCategories >= 5) {
    score += 10;
  }

  // Check for critical technical skills
  const criticalSkills = ['java', 'python', 'dsa', 'microservices', 'docker', 'kubernetes', 'ci/cd', 'react', 'node'];
  const hasCriticalSkills = criticalSkills.filter(skill =>
    Object.values(categories).some(cat =>
      cat.some((s: string) => s.toLowerCase().includes(skill))
    )
  ).length;

  score += Math.min(hasCriticalSkills * 3, 15);

  return Math.min(score, 100);
};

/**
 * Generate recommendations for skills improvement using ATS-friendly categories
 */
export const getSkillsRecommendations = (analysis: SkillsAnalysis, _jdText?: string): string[] => {
  const recommendations: string[] = [];

  if (analysis.removed.length > 5) {
    recommendations.push('✓ Removed ' + analysis.removed.length + ' irrelevant words - your skills section is now cleaner');
  }

  if (analysis.added.length > 0) {
    recommendations.push('✓ Added missing critical skills: ' + analysis.added.join(', '));
  }

  // Check for Soft Skills
  if (analysis.categories.softSkills.length < 5) {
    recommendations.push('⚠ Add more soft skills like Problem-solving, Communication, Teamwork, Leadership');
  }

  // Check for Programming Languages
  if (analysis.categories.programmingLanguages.length < 2) {
    recommendations.push('⚠ Add more programming languages (JavaScript, Python, Java, TypeScript)');
  }

  // Check for Testing & QA
  if (analysis.categories.testingAndQA.length === 0) {
    recommendations.push('⚠ Add Testing & QA skills (Unit Testing, Test Automation, Manual Testing)');
  }

  // Check for Tools & Platforms
  if (analysis.categories.toolsAndPlatforms.length < 3) {
    recommendations.push('⚠ Add more tools: Git, Linux, Postman, Jira are essential');
  }

  // Check for Cloud & DevOps
  if (analysis.categories.cloudAndDevOps.length === 0) {
    recommendations.push('⚠ Add Cloud & DevOps experience (AWS, Azure, GCP, Docker, Kubernetes)');
  }

  return recommendations;
};
