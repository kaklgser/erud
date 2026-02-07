// src/services/projectMatchingEngine.ts
// Project Matching Engine - Matches resume projects against JD requirements

import { ResumeData, Project } from '../types/resume';
import { edenai } from './aiProxyService';

// JD Keywords interface
export interface JdKeywords {
  techSkills: string[];
  responsibilities: string[];
  domains: string[];
  tools: string[];
  rawKeywords: string[];
}

// Parsed project interface
export interface ParsedProject {
  name: string;
  description: string;
  techStack: string[];
}

// Project match result
export interface ProjectMatchResult {
  project: ParsedProject;
  baseScore: number;
  aiLabel?: 'high_match' | 'medium_match' | 'low_match';
  finalScore: number;
  matchPercentage: number;
  missingSkills: string[];
  matchedSkills: string[];
  recommendations: string[];
}

// Label multipliers for AI classification
const LABEL_MULTIPLIER: Record<string, number> = {
  'high_match': 1.0,
  'medium_match': 0.7,
  'low_match': 0.4,
};

// Hard-coded examples for custom classification training
const CLASSIFICATION_EXAMPLES: [string, string][] = [
  ['JD: Backend Developer with Node.js, Express, MongoDB. Project: E-commerce API - Built REST API with Node.js and Express for product management. Tech: Node.js, Express, MongoDB', 'high_match'],
  ['JD: Frontend React Developer. Project: Weather Dashboard - Created React dashboard with real-time weather data. Tech: React, TypeScript, Tailwind', 'high_match'],
  ['JD: Data Engineer with Python, SQL, Spark. Project: ETL Pipeline - Built data pipeline using Python and Apache Spark. Tech: Python, PySpark, SQL', 'high_match'],
  ['JD: Machine Learning Engineer with TensorFlow. Project: Blog CMS - Built content management system with PHP. Tech: PHP, MySQL, WordPress', 'low_match'],
  ['JD: iOS Developer with Swift. Project: Android Calculator - Simple calculator app for Android. Tech: Java, Android SDK', 'low_match'],
  ['JD: DevOps Engineer with Kubernetes. Project: Static Website - Personal portfolio using HTML/CSS. Tech: HTML, CSS, JavaScript', 'low_match'],
  ['JD: Full Stack Developer with React and Node.js. Project: Task Manager - Built task management app with Vue.js. Tech: Vue.js, Firebase', 'medium_match'],
  ['JD: Python Backend Developer. Project: Inventory System - Built inventory tracking with Java Spring. Tech: Java, Spring Boot, PostgreSQL', 'medium_match'],
];

/**
 * Extract keywords from Job Description
 */
export const extractJdKeywords = (jobDescription: string): JdKeywords => {
  const textLower = jobDescription.toLowerCase();
  
  // Technical skills patterns
  const techSkillPatterns = [
    // Languages
    /\b(javascript|typescript|python|java|c\+\+|c#|ruby|go|rust|php|swift|kotlin|scala|r)\b/gi,
    // Frontend
    /\b(react|angular|vue|svelte|next\.?js|nuxt|gatsby|html5?|css3?|sass|less|tailwind|bootstrap)\b/gi,
    // Backend
    /\b(node\.?js|express|django|flask|fastapi|spring|\.net|rails|laravel|nest\.?js)\b/gi,
    // Databases
    /\b(sql|mysql|postgresql|postgres|mongodb|redis|elasticsearch|dynamodb|oracle|sqlite|cassandra)\b/gi,
    // Cloud
    /\b(aws|azure|gcp|google cloud|heroku|vercel|netlify|digitalocean)\b/gi,
    // DevOps
    /\b(docker|kubernetes|k8s|jenkins|terraform|ansible|ci\/cd|github actions|gitlab)\b/gi,
    // AI/ML
    /\b(tensorflow|pytorch|keras|scikit-learn|pandas|numpy|machine learning|deep learning|nlp)\b/gi,
  ];

  const techSkills: Set<string> = new Set();
  for (const pattern of techSkillPatterns) {
    const matches = jobDescription.match(pattern);
    if (matches) {
      matches.forEach(m => techSkills.add(m.toLowerCase()));
    }
  }

  // Responsibility keywords
  const responsibilityPatterns = [
    /\b(develop|design|implement|build|create|architect|optimize|maintain|deploy|test|debug)\b/gi,
    /\b(lead|manage|coordinate|collaborate|mentor|review|analyze|integrate|automate)\b/gi,
  ];

  const responsibilities: Set<string> = new Set();
  for (const pattern of responsibilityPatterns) {
    const matches = jobDescription.match(pattern);
    if (matches) {
      matches.forEach(m => responsibilities.add(m.toLowerCase()));
    }
  }

  // Domain keywords
  const domainKeywords: Record<string, string[]> = {
    'fintech': ['fintech', 'banking', 'payment', 'financial', 'trading'],
    'healthcare': ['healthcare', 'medical', 'health', 'clinical'],
    'ecommerce': ['ecommerce', 'e-commerce', 'retail', 'shopping'],
    'ai_ml': ['machine learning', 'ai', 'deep learning', 'data science'],
    'cloud': ['cloud', 'infrastructure', 'devops', 'platform'],
    'gaming': ['gaming', 'game', 'entertainment'],
    'edtech': ['education', 'edtech', 'learning'],
  };

  const domains: Set<string> = new Set();
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        domains.add(domain);
      }
    }
  }

  // Tools
  const toolPatterns = /\b(git|jira|confluence|slack|figma|postman|swagger|grafana|prometheus|datadog)\b/gi;
  const tools: Set<string> = new Set();
  const toolMatches = jobDescription.match(toolPatterns);
  if (toolMatches) {
    toolMatches.forEach(m => tools.add(m.toLowerCase()));
  }

  // Combine all raw keywords
  const rawKeywords = [
    ...Array.from(techSkills),
    ...Array.from(responsibilities),
    ...Array.from(domains),
    ...Array.from(tools),
  ];

  return {
    techSkills: Array.from(techSkills),
    responsibilities: Array.from(responsibilities),
    domains: Array.from(domains),
    tools: Array.from(tools),
    rawKeywords,
  };
};

/**
 * Normalize projects from ResumeData to ParsedProject format
 */
export const normalizeProjects = (resumeData: ResumeData): ParsedProject[] => {
  if (!resumeData.projects || resumeData.projects.length === 0) {
    return [];
  }

  return resumeData.projects.map(project => {
    // Extract tech stack from bullets
    const techStack = extractTechStackFromBullets(project.bullets);
    const description = project.bullets.join(' ');

    return {
      name: project.title,
      description,
      techStack,
    };
  });
};

/**
 * Extract tech stack from project bullets
 */
const extractTechStackFromBullets = (bullets: string[]): string[] => {
  const techStack: Set<string> = new Set();
  const combinedText = bullets.join(' ');
  
  // Look for "Tech Used:" or similar patterns
  const techUsedMatch = combinedText.match(/tech(?:nologies?)?\s*(?:used|stack)?[:\s]+([^.]+)/i);
  if (techUsedMatch) {
    const techs = techUsedMatch[1].split(/[,;|]+/).map(t => t.trim()).filter(t => t.length > 1);
    techs.forEach(t => techStack.add(t.toLowerCase()));
  }

  // Also extract common tech terms
  const techPatterns = /\b(react|angular|vue|node\.?js|express|python|java|typescript|javascript|mongodb|mysql|postgresql|aws|docker|kubernetes|redis|graphql|rest\s?api)\b/gi;
  const matches = combinedText.match(techPatterns);
  if (matches) {
    matches.forEach(m => techStack.add(m.toLowerCase()));
  }

  return Array.from(techStack);
};

/**
 * Calculate base rule-based score for a project
 */
const calculateBaseScore = (project: ParsedProject, jdKeywords: JdKeywords): number => {
  let score = 0;
  const projectText = `${project.name} ${project.description} ${project.techStack.join(' ')}`.toLowerCase();

  // Tech skills match (weight: 2)
  for (const skill of jdKeywords.techSkills) {
    if (projectText.includes(skill.toLowerCase())) {
      score += 2;
    }
  }

  // Responsibility match (weight: 1)
  for (const resp of jdKeywords.responsibilities) {
    if (projectText.includes(resp.toLowerCase())) {
      score += 1;
    }
  }

  // Domain match (weight: 3)
  for (const domain of jdKeywords.domains) {
    if (projectText.includes(domain.toLowerCase())) {
      score += 3;
    }
  }

  // Tools match (weight: 1)
  for (const tool of jdKeywords.tools) {
    if (projectText.includes(tool.toLowerCase())) {
      score += 1;
    }
  }

  return score;
};

/**
 * Get AI classification for projects using EdenAI
 */
const getAIClassification = async (
  projects: ParsedProject[],
  _jdSummary: string
): Promise<Map<string, 'high_match' | 'medium_match' | 'low_match'>> => {
  const results = new Map<string, 'high_match' | 'medium_match' | 'low_match'>();

  if (projects.length === 0) {
    return results;
  }

  // AI classification is handled by the scoring system
  // Return empty map to use base scoring only
  return results;
};

/**
 * Find missing skills for a project
 */
const findMissingSkills = (project: ParsedProject, jdKeywords: JdKeywords): string[] => {
  const projectTechLower = project.techStack.map(t => t.toLowerCase());
  const projectTextLower = `${project.name} ${project.description}`.toLowerCase();
  
  return jdKeywords.techSkills.filter(skill => {
    const skillLower = skill.toLowerCase();
    return !projectTechLower.includes(skillLower) && !projectTextLower.includes(skillLower);
  });
};

/**
 * Find matched skills for a project
 */
const findMatchedSkills = (project: ParsedProject, jdKeywords: JdKeywords): string[] => {
  const projectTechLower = project.techStack.map(t => t.toLowerCase());
  const projectTextLower = `${project.name} ${project.description}`.toLowerCase();
  
  return jdKeywords.techSkills.filter(skill => {
    const skillLower = skill.toLowerCase();
    return projectTechLower.includes(skillLower) || projectTextLower.includes(skillLower);
  });
};

/**
 * Generate recommendations for improving a project
 */
const generateRecommendations = (
  project: ParsedProject,
  missingSkills: string[],
  matchPercentage: number
): string[] => {
  const recommendations: string[] = [];

  if (matchPercentage < 50) {
    recommendations.push(`Consider adding ${missingSkills.slice(0, 3).join(', ')} to strengthen JD alignment`);
  }

  if (project.techStack.length < 3) {
    recommendations.push('Add more technologies to the Tech Used section');
  }

  if (project.description.length < 100) {
    recommendations.push('Expand project description with quantifiable achievements');
  }

  if (missingSkills.length > 5) {
    recommendations.push('This project may not be the best fit for this JD - consider highlighting other projects');
  }

  return recommendations;
};

/**
 * Main function: Match projects against JD
 */
export const matchProjectsToJd = async (
  resumeData: ResumeData,
  jobDescription: string,
  jdSummary?: string
): Promise<ProjectMatchResult[]> => {
  // Extract JD keywords
  const jdKeywords = extractJdKeywords(jobDescription);
  
  // Normalize projects
  const projects = normalizeProjects(resumeData);
  
  if (projects.length === 0) {
    return [];
  }

  // Calculate base scores
  const baseScores = new Map<string, number>();
  let maxBaseScore = 0;
  
  for (const project of projects) {
    const score = calculateBaseScore(project, jdKeywords);
    baseScores.set(project.name, score);
    maxBaseScore = Math.max(maxBaseScore, score);
  }

  // Get AI classifications (optional enhancement)
  const aiLabels = await getAIClassification(projects, jdSummary || jobDescription.slice(0, 500));

  // Build results
  const results: ProjectMatchResult[] = [];
  
  for (const project of projects) {
    const baseScore = baseScores.get(project.name) || 0;
    const aiLabel = aiLabels.get(project.name);
    const multiplier = aiLabel ? LABEL_MULTIPLIER[aiLabel] : 0.7; // Default to medium if no AI
    const finalScore = baseScore * multiplier;
    
    // Calculate percentage (normalize against max possible score)
    const maxPossibleScore = (jdKeywords.techSkills.length * 2) + 
                            (jdKeywords.responsibilities.length * 1) + 
                            (jdKeywords.domains.length * 3) + 
                            (jdKeywords.tools.length * 1);
    const matchPercentage = maxPossibleScore > 0 
      ? Math.min(100, Math.round((finalScore / maxPossibleScore) * 100 * 2)) // Scale up for better UX
      : 0;

    const missingSkills = findMissingSkills(project, jdKeywords);
    const matchedSkills = findMatchedSkills(project, jdKeywords);
    const recommendations = generateRecommendations(project, missingSkills, matchPercentage);

    results.push({
      project,
      baseScore,
      aiLabel,
      finalScore,
      matchPercentage,
      missingSkills,
      matchedSkills,
      recommendations,
    });
  }

  // Sort by final score descending
  results.sort((a, b) => b.finalScore - a.finalScore);

  return results;
};

export const projectMatchingEngine = {
  extractJdKeywords,
  normalizeProjects,
  matchProjectsToJd,
};

export default projectMatchingEngine;
