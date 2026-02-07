/**
 * JD-Based Resume Optimizer Service
 * 
 * Comprehensive resume optimization with:
 * - Semantic embedding-based matching (cosine similarity > 0.70)
 * - Metric preservation (> 90% retention)
 * - Keyword density control (< 3% per term, < 8% total)
 * - ATS simulation with parser preview
 * - Multi-layer validation pipeline
 * - Role-specific and seniority-based rewriting
 * 
 * Target: 85+ final score on weighted scoring system
 */

import { ResumeData } from '../types/resume';
import { semanticMatchingService } from './semanticMatchingService';
import { OptimizerValidationService, ValidationResult } from './optimizerValidation';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface JDAnalysis {
  requirements: JDRequirement[];
  keywords: KeywordWithContext[];
  roleType: RoleType;
  seniorityLevel: SeniorityLevel;
  hardSkills: string[];
  softSkills: string[];
  certifications: string[];
  educationRequirements: string[];
  projectTypes: string[];
}

export interface JDRequirement {
  text: string;
  category: 'skill' | 'experience' | 'education' | 'certification' | 'soft_skill';
  priority: 'critical' | 'important' | 'nice_to_have';
  keywords: string[];
}

export interface KeywordWithContext {
  keyword: string;
  context: string[];
  frequency: number;
  category: string;
}

export type RoleType = 'Backend' | 'Frontend' | 'Full Stack' | 'DevOps' | 'ML/AI' | 'Data Engineer' | 'Mobile' | 'General';
export type SeniorityLevel = 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal';

export interface BulletMatch {
  jdRequirement: JDRequirement;
  resumeBullet: string;
  bulletIndex: number;
  section: string;
  similarityScore: number;
  matchType: 'relevant' | 'partial' | 'none';
}

export interface MetricExtraction {
  original: string;
  metrics: ExtractedMetric[];
  hasQuantification: boolean;
}

export interface ExtractedMetric {
  value: string;
  type: 'percentage' | 'number' | 'currency' | 'timeframe' | 'scale';
  context: string;
}

export interface BulletValidation {
  passed: boolean;
  checks: ValidationCheck[];
  failureReasons: string[];
  retryCount: number;
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  score: number;
  threshold: number;
  message: string;
}

export interface RewrittenBullet {
  original: string;
  rewritten: string;
  validation: BulletValidation;
  metricsPreserved: boolean;
  keywordDensity: number;
  semanticSimilarity: number;
}

export interface ATSSimulationResult {
  parsedSuccessfully: boolean;
  failures: string[];
  extractedFields: {
    email: boolean;
    phone: boolean;
    name: boolean;
    sections: string[];
    skills: string[];
    dates: string[];
  };
  recommendations: string[];
  score: number;
}

export interface OptimizationResult {
  optimizedResume: ResumeData;
  originalResume: ResumeData;
  jdAnalysis: JDAnalysis;
  bulletMatches: BulletMatch[];
  rewrittenBullets: RewrittenBullet[];
  atsSimulation: ATSSimulationResult;
  validationReport: ValidationReport;
  warningReport: WarningReport;
  scoringBreakdown: ScoringBreakdown;
  finalScore: number;
  processingTime: number;
  // NEW: Authenticity validation to prevent over-optimization
  authenticityValidation?: ValidationResult;
}

export interface ValidationReport {
  totalBullets: number;
  passedBullets: number;
  failedBullets: number;
  retriedBullets: number;
  bulletResults: BulletValidationResult[];
}

export interface BulletValidationResult {
  bulletIndex: number;
  section: string;
  original: string;
  rewritten: string;
  passed: boolean;
  checks: ValidationCheck[];
}

export interface WarningReport {
  missingSections: string[];
  requiredAdditions: string[];
  suggestedImprovements: string[];
  synthesizedProjects: SynthesizedProject[];
}

export interface SynthesizedProject {
  title: string;
  description: string;
  technologies: string[];
  isSuggested: boolean;
}

export interface ScoringBreakdown {
  semanticAlignment: { score: number; weight: number; validated: boolean };
  skillToolMatch: { score: number; weight: number; validated: boolean };
  metricsPreservation: { score: number; weight: number; validated: boolean };
  actionVerbStrength: { score: number; weight: number; validated: boolean };
  atsReadability: { score: number; weight: number; validated: boolean };
  keywordDensity: { score: number; weight: number; validated: boolean };
  totalScore: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ROLE_ACTION_VERBS: Record<RoleType, Record<SeniorityLevel, string[]>> = {
  'Backend': {
    'Junior': ['Contributed', 'Assisted', 'Built', 'Learned', 'Supported', 'Developed', 'Implemented'],
    'Mid': ['Developed', 'Implemented', 'Optimized', 'Collaborated', 'Delivered', 'Designed', 'Integrated'],
    'Senior': ['Architected', 'Spearheaded', 'Led', 'Designed', 'Established', 'Mentored', 'Scaled'],
    'Lead': ['Architected', 'Spearheaded', 'Led', 'Directed', 'Pioneered', 'Transformed', 'Orchestrated'],
    'Principal': ['Pioneered', 'Transformed', 'Established', 'Revolutionized', 'Championed', 'Defined']
  },
  'Frontend': {
    'Junior': ['Contributed', 'Assisted', 'Built', 'Created', 'Supported', 'Developed'],
    'Mid': ['Developed', 'Implemented', 'Enhanced', 'Collaborated', 'Delivered', 'Designed'],
    'Senior': ['Architected', 'Led', 'Designed', 'Established', 'Mentored', 'Optimized'],
    'Lead': ['Architected', 'Spearheaded', 'Led', 'Directed', 'Pioneered', 'Transformed'],
    'Principal': ['Pioneered', 'Transformed', 'Established', 'Revolutionized', 'Championed']
  },
  'Full Stack': {
    'Junior': ['Contributed', 'Assisted', 'Built', 'Learned', 'Supported', 'Developed'],
    'Mid': ['Developed', 'Implemented', 'Optimized', 'Collaborated', 'Delivered', 'Integrated'],
    'Senior': ['Architected', 'Spearheaded', 'Led', 'Designed', 'Established', 'Scaled'],
    'Lead': ['Architected', 'Spearheaded', 'Led', 'Directed', 'Pioneered', 'Orchestrated'],
    'Principal': ['Pioneered', 'Transformed', 'Established', 'Revolutionized', 'Defined']
  },
  'DevOps': {
    'Junior': ['Contributed', 'Assisted', 'Configured', 'Monitored', 'Supported', 'Deployed'],
    'Mid': ['Implemented', 'Automated', 'Optimized', 'Collaborated', 'Deployed', 'Configured'],
    'Senior': ['Architected', 'Led', 'Designed', 'Established', 'Scaled', 'Transformed'],
    'Lead': ['Architected', 'Spearheaded', 'Led', 'Directed', 'Pioneered', 'Orchestrated'],
    'Principal': ['Pioneered', 'Transformed', 'Established', 'Revolutionized', 'Defined']
  },
  'ML/AI': {
    'Junior': ['Contributed', 'Assisted', 'Built', 'Trained', 'Supported', 'Analyzed'],
    'Mid': ['Developed', 'Implemented', 'Trained', 'Optimized', 'Evaluated', 'Deployed'],
    'Senior': ['Architected', 'Led', 'Designed', 'Researched', 'Pioneered', 'Published'],
    'Lead': ['Architected', 'Spearheaded', 'Led', 'Directed', 'Pioneered', 'Innovated'],
    'Principal': ['Pioneered', 'Transformed', 'Established', 'Revolutionized', 'Published']
  },
  'Data Engineer': {
    'Junior': ['Contributed', 'Assisted', 'Built', 'Processed', 'Supported', 'Developed'],
    'Mid': ['Developed', 'Implemented', 'Optimized', 'Designed', 'Delivered', 'Integrated'],
    'Senior': ['Architected', 'Led', 'Designed', 'Established', 'Scaled', 'Transformed'],
    'Lead': ['Architected', 'Spearheaded', 'Led', 'Directed', 'Pioneered', 'Orchestrated'],
    'Principal': ['Pioneered', 'Transformed', 'Established', 'Revolutionized', 'Defined']
  },
  'Mobile': {
    'Junior': ['Contributed', 'Assisted', 'Built', 'Created', 'Supported', 'Developed'],
    'Mid': ['Developed', 'Implemented', 'Enhanced', 'Collaborated', 'Delivered', 'Designed'],
    'Senior': ['Architected', 'Led', 'Designed', 'Established', 'Mentored', 'Optimized'],
    'Lead': ['Architected', 'Spearheaded', 'Led', 'Directed', 'Pioneered', 'Transformed'],
    'Principal': ['Pioneered', 'Transformed', 'Established', 'Revolutionized', 'Championed']
  },
  'General': {
    'Junior': ['Contributed', 'Assisted', 'Built', 'Learned', 'Supported', 'Developed'],
    'Mid': ['Developed', 'Implemented', 'Optimized', 'Collaborated', 'Delivered', 'Designed'],
    'Senior': ['Architected', 'Spearheaded', 'Led', 'Designed', 'Established', 'Mentored'],
    'Lead': ['Architected', 'Spearheaded', 'Led', 'Directed', 'Pioneered', 'Orchestrated'],
    'Principal': ['Pioneered', 'Transformed', 'Established', 'Revolutionized', 'Defined']
  }
};

const ROLE_EMPHASIS: Record<RoleType, string[]> = {
  'Backend': ['APIs', 'databases', 'architecture', 'scalability', 'microservices', 'performance', 'security'],
  'Frontend': ['UI', 'UX', 'frameworks', 'performance', 'accessibility', 'responsiveness', 'design systems'],
  'Full Stack': ['end-to-end', 'full lifecycle', 'integration', 'architecture', 'deployment', 'scalability'],
  'DevOps': ['CI/CD', 'infrastructure', 'automation', 'monitoring', 'cloud', 'reliability', 'deployment'],
  'ML/AI': ['models', 'datasets', 'training', 'deployment', 'accuracy', 'research', 'algorithms'],
  'Data Engineer': ['pipelines', 'ETL', 'data warehousing', 'big data', 'streaming', 'data quality'],
  'Mobile': ['iOS', 'Android', 'cross-platform', 'performance', 'UX', 'offline', 'push notifications'],
  'General': ['development', 'collaboration', 'delivery', 'quality', 'efficiency', 'innovation']
};

const SOFT_SKILLS_LIST = [
  'leadership', 'communication', 'collaboration', 'teamwork', 'problem-solving',
  'critical thinking', 'time management', 'adaptability', 'creativity', 'mentoring',
  'stakeholder management', 'cross-functional', 'agile', 'scrum', 'project management'
];

// Validation thresholds
const SEMANTIC_SIMILARITY_THRESHOLD = 0.70;
const METRICS_PRESERVATION_THRESHOLD = 0.90;
// const KEYWORD_DENSITY_MAX_PER_TERM = 0.03; // Reserved for per-term validation
const KEYWORD_DENSITY_MAX_TOTAL = 0.08;
const MAX_RETRY_ATTEMPTS = 3;
// const TARGET_FINAL_SCORE = 85; // Target score for optimization

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class JDBasedResumeOptimizer {
  
  /**
   * Main optimization entry point
   */
  static async optimize(
    resumeData: ResumeData,
    jobDescription: string,
    _targetRole?: string
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    console.log('🚀 Starting JD-Based Resume Optimization...');
    
    // Step 1: Analyze Job Description
    const jdAnalysis = this.analyzeJobDescription(jobDescription);
    console.log(`📋 JD Analysis: ${jdAnalysis.roleType} | ${jdAnalysis.seniorityLevel} | ${jdAnalysis.requirements.length} requirements`);
    
    // Step 2: Create semantic similarity matrix
    const bulletMatches = this.createSimilarityMatrix(resumeData, jdAnalysis);
    console.log(`🔗 Bullet Matches: ${bulletMatches.filter(m => m.matchType === 'relevant').length} relevant, ${bulletMatches.filter(m => m.matchType === 'partial').length} partial`);
    
    // Step 3: Extract and preserve metrics
    const metricsMap = this.extractAllMetrics(resumeData);
    console.log(`📊 Metrics Extracted: ${metricsMap.size} bullets with metrics`);
    
    // Step 4: Rewrite bullets with validation
    const rewrittenBullets = await this.rewriteAllBullets(
      resumeData,
      jdAnalysis,
      bulletMatches,
      metricsMap
    );
    console.log(`✏️ Bullets Rewritten: ${rewrittenBullets.filter(b => b.validation.passed).length}/${rewrittenBullets.length} passed validation`);
    
    // Step 5: Apply rewrites to resume
    const optimizedResume = this.applyRewrites(resumeData, rewrittenBullets, jdAnalysis);
    
    // Step 6: Check for missing sections and synthesize if needed
    const warningReport = this.generateWarningReport(optimizedResume, jdAnalysis);
    
    // Step 7: Run ATS simulation
    const atsSimulation = this.runATSSimulation(optimizedResume);
    console.log(`🤖 ATS Simulation: ${atsSimulation.parsedSuccessfully ? 'PASSED' : 'FAILED'} (${atsSimulation.score}%)`);
    
    // Step 8: Generate validation report
    const validationReport = this.generateValidationReport(rewrittenBullets);
    
    // Step 9: Calculate final scoring breakdown
    const scoringBreakdown = this.calculateScoringBreakdown(
      rewrittenBullets,
      atsSimulation,
      jdAnalysis,
      optimizedResume
    );
    
    // Step 10: NEW - Authenticity Validation (prevents over-optimization)
    const authenticityValidation = OptimizerValidationService.validate({
      original: resumeData,
      optimized: optimizedResume,
    });
    
    console.log(`🔒 Authenticity Validation: ${authenticityValidation.isValid ? 'PASSED' : 'FAILED'} (${authenticityValidation.score}%)`);
    
    if (!authenticityValidation.isValid) {
      console.warn('⚠️ Authenticity Issues:', authenticityValidation.issues.map(i => i.message));
    }
    
    // Adjust final score based on authenticity
    let adjustedFinalScore = scoringBreakdown.totalScore;
    if (!authenticityValidation.isValid) {
      // Penalize over-optimized resumes
      const penalty = Math.min(15, authenticityValidation.issues.filter(i => i.type === 'critical').length * 5);
      adjustedFinalScore = Math.max(0, adjustedFinalScore - penalty);
      console.log(`📉 Score adjusted for authenticity issues: ${scoringBreakdown.totalScore} → ${adjustedFinalScore}`);
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Optimization Complete: ${adjustedFinalScore}% in ${processingTime}ms`);
    
    return {
      optimizedResume,
      originalResume: resumeData,
      jdAnalysis,
      bulletMatches,
      rewrittenBullets,
      atsSimulation,
      validationReport,
      warningReport,
      scoringBreakdown: {
        ...scoringBreakdown,
        totalScore: adjustedFinalScore,
      },
      finalScore: adjustedFinalScore,
      processingTime,
      authenticityValidation,
    };
  }


  // ============================================================================
  // JOB DESCRIPTION ANALYSIS
  // ============================================================================

  /**
   * Parse and analyze job description
   */
  private static analyzeJobDescription(jobDescription: string): JDAnalysis {
    const jdLower = jobDescription.toLowerCase();
    
    // Classify role type
    const roleType = this.classifyRoleType(jdLower);
    
    // Classify seniority level
    const seniorityLevel = this.classifySeniorityLevel(jdLower);
    
    // Extract requirements with context
    const requirements = this.extractRequirements(jobDescription);
    
    // Extract keywords with context
    const keywords = this.extractKeywordsWithContext(jobDescription);
    
    // Extract hard skills
    const hardSkills = this.extractHardSkills(jdLower);
    
    // Extract soft skills
    const softSkills = this.extractSoftSkills(jdLower);
    
    // Extract certification requirements
    const certifications = this.extractCertificationRequirements(jdLower);
    
    // Extract education requirements
    const educationRequirements = this.extractEducationRequirements(jdLower);
    
    // Extract project types
    const projectTypes = this.extractProjectTypes(jdLower);
    
    return {
      requirements,
      keywords,
      roleType,
      seniorityLevel,
      hardSkills,
      softSkills,
      certifications,
      educationRequirements,
      projectTypes
    };
  }

  /**
   * Classify role type from JD
   */
  private static classifyRoleType(jdLower: string): RoleType {
    const rolePatterns: [RegExp, RoleType][] = [
      [/\b(backend|server.?side|api|microservices?|database|sql|nosql)\b/i, 'Backend'],
      [/\b(frontend|front.?end|ui|ux|react|angular|vue|css|html)\b/i, 'Frontend'],
      [/\b(full.?stack|fullstack|end.?to.?end)\b/i, 'Full Stack'],
      [/\b(devops|sre|site reliability|infrastructure|ci.?cd|kubernetes|docker|terraform)\b/i, 'DevOps'],
      [/\b(machine learning|ml|ai|artificial intelligence|deep learning|nlp|computer vision)\b/i, 'ML/AI'],
      [/\b(data engineer|etl|data pipeline|data warehouse|spark|hadoop|airflow)\b/i, 'Data Engineer'],
      [/\b(mobile|ios|android|react native|flutter|swift|kotlin)\b/i, 'Mobile']
    ];
    
    for (const [pattern, role] of rolePatterns) {
      if (pattern.test(jdLower)) {
        return role;
      }
    }
    
    return 'General';
  }

  /**
   * Classify seniority level from JD
   */
  private static classifySeniorityLevel(jdLower: string): SeniorityLevel {
    // Check for explicit seniority mentions
    if (/\b(principal|staff|distinguished|fellow)\b/i.test(jdLower)) return 'Principal';
    if (/\b(lead|tech lead|team lead|engineering lead|architect)\b/i.test(jdLower)) return 'Lead';
    if (/\b(senior|sr\.?|experienced)\b/i.test(jdLower)) return 'Senior';
    if (/\b(junior|jr\.?|entry.?level|graduate|fresher|intern)\b/i.test(jdLower)) return 'Junior';
    
    // Check years of experience
    const yearsMatch = jdLower.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i);
    if (yearsMatch) {
      const years = parseInt(yearsMatch[1]);
      if (years >= 8) return 'Lead';
      if (years >= 5) return 'Senior';
      if (years >= 2) return 'Mid';
      return 'Junior';
    }
    
    return 'Mid'; // Default to mid-level
  }

  /**
   * Extract requirements from JD
   */
  private static extractRequirements(jobDescription: string): JDRequirement[] {
    const requirements: JDRequirement[] = [];
    const sentences = jobDescription.split(/[.!?\n]+/).filter(s => s.trim().length > 10);
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      
      // Determine category
      let category: JDRequirement['category'] = 'skill';
      if (/\b(degree|bachelor|master|phd|education|university|college)\b/i.test(trimmed)) {
        category = 'education';
      } else if (/\b(certif|aws certified|google certified|azure certified)\b/i.test(trimmed)) {
        category = 'certification';
      } else if (/\b(years?|experience|worked|built|developed)\b/i.test(trimmed)) {
        category = 'experience';
      } else if (/\b(communication|teamwork|leadership|collaboration|interpersonal)\b/i.test(trimmed)) {
        category = 'soft_skill';
      }
      
      // Determine priority
      let priority: JDRequirement['priority'] = 'important';
      if (/\b(must|required|essential|mandatory|critical)\b/i.test(trimmed)) {
        priority = 'critical';
      } else if (/\b(preferred|nice to have|bonus|plus|ideally)\b/i.test(trimmed)) {
        priority = 'nice_to_have';
      }
      
      // Extract keywords from requirement
      const keywords = this.extractKeywordsFromText(trimmed);
      
      if (keywords.length > 0) {
        requirements.push({
          text: trimmed,
          category,
          priority,
          keywords
        });
      }
    }
    
    return requirements;
  }

  /**
   * Extract keywords with context
   */
  private static extractKeywordsWithContext(jobDescription: string): KeywordWithContext[] {
    const keywordMap = new Map<string, KeywordWithContext>();
    const sentences = jobDescription.split(/[.!?\n]+/);
    
    // Technical keywords pattern
    const techPattern = /\b(javascript|typescript|python|java|c\+\+|c#|go|rust|ruby|php|swift|kotlin|scala|react|angular|vue|node\.?js|express|django|flask|fastapi|spring|\.net|rails|laravel|aws|azure|gcp|docker|kubernetes|terraform|jenkins|git|sql|mysql|postgresql|mongodb|redis|elasticsearch|graphql|rest|microservices|ci\/cd|agile|scrum|machine learning|deep learning|tensorflow|pytorch|pandas|numpy|spark|hadoop|kafka)\b/gi;
    
    for (const sentence of sentences) {
      const matches = sentence.match(techPattern) || [];
      for (const match of matches) {
        const keyword = match.toLowerCase();
        
        if (keywordMap.has(keyword)) {
          const existing = keywordMap.get(keyword)!;
          existing.frequency++;
          if (!existing.context.includes(sentence.trim())) {
            existing.context.push(sentence.trim());
          }
        } else {
          keywordMap.set(keyword, {
            keyword,
            context: [sentence.trim()],
            frequency: 1,
            category: this.categorizeKeyword(keyword)
          });
        }
      }
    }
    
    return Array.from(keywordMap.values()).sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Categorize a keyword
   */
  private static categorizeKeyword(keyword: string): string {
    const categories: Record<string, string[]> = {
      'Programming Language': ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala'],
      'Frontend Framework': ['react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt'],
      'Backend Framework': ['node.js', 'express', 'django', 'flask', 'fastapi', 'spring', '.net', 'rails', 'laravel'],
      'Cloud Platform': ['aws', 'azure', 'gcp', 'google cloud'],
      'DevOps Tool': ['docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'git'],
      'Database': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb'],
      'Data/ML': ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'spark', 'hadoop', 'kafka']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.includes(keyword.toLowerCase())) {
        return category;
      }
    }
    
    return 'Technical';
  }

  /**
   * Extract hard skills from JD
   */
  private static extractHardSkills(jdLower: string): string[] {
    const techPattern = /\b(javascript|typescript|python|java|c\+\+|c#|go|rust|ruby|php|swift|kotlin|scala|react|angular|vue|node\.?js|express|django|flask|fastapi|spring|\.net|rails|laravel|aws|azure|gcp|docker|kubernetes|terraform|jenkins|git|sql|mysql|postgresql|mongodb|redis|elasticsearch|graphql|rest|microservices|ci\/cd|machine learning|deep learning|tensorflow|pytorch|pandas|numpy|spark|hadoop|kafka|html|css|sass|tailwind|webpack|vite|jest|cypress|selenium|linux|nginx|apache)\b/gi;
    
    const matches = jdLower.match(techPattern) || [];
    return [...new Set(matches.map(m => m.toLowerCase()))];
  }

  /**
   * Extract soft skills from JD
   */
  private static extractSoftSkills(jdLower: string): string[] {
    const found: string[] = [];
    
    for (const skill of SOFT_SKILLS_LIST) {
      if (jdLower.includes(skill.toLowerCase())) {
        found.push(skill);
      }
    }
    
    return found;
  }

  /**
   * Extract certification requirements
   */
  private static extractCertificationRequirements(jdLower: string): string[] {
    const certPatterns = [
      /aws\s+certified\s+[\w\s]+/gi,
      /google\s+cloud\s+certified\s+[\w\s]+/gi,
      /azure\s+[\w\s]+certified/gi,
      /pmp\s+certification/gi,
      /scrum\s+master/gi,
      /cissp/gi,
      /cka|ckad/gi
    ];
    
    const certs: string[] = [];
    for (const pattern of certPatterns) {
      const matches = jdLower.match(pattern) || [];
      certs.push(...matches);
    }
    
    return [...new Set(certs)];
  }

  /**
   * Extract education requirements
   */
  private static extractEducationRequirements(jdLower: string): string[] {
    const eduPatterns = [
      /bachelor'?s?\s+(?:degree\s+)?(?:in\s+)?[\w\s]+/gi,
      /master'?s?\s+(?:degree\s+)?(?:in\s+)?[\w\s]+/gi,
      /phd\s+(?:in\s+)?[\w\s]+/gi,
      /b\.?s\.?\s+(?:in\s+)?[\w\s]+/gi,
      /m\.?s\.?\s+(?:in\s+)?[\w\s]+/gi
    ];
    
    const edu: string[] = [];
    for (const pattern of eduPatterns) {
      const matches = jdLower.match(pattern) || [];
      edu.push(...matches.map(m => m.trim()));
    }
    
    return [...new Set(edu)];
  }

  /**
   * Extract project types from JD
   */
  private static extractProjectTypes(jdLower: string): string[] {
    const projectPatterns = [
      /\b(e-?commerce|ecommerce)\b/gi,
      /\b(saas|software as a service)\b/gi,
      /\b(fintech|financial)\b/gi,
      /\b(healthcare|health tech)\b/gi,
      /\b(real-?time|realtime)\b/gi,
      /\b(distributed systems?)\b/gi,
      /\b(data pipeline|etl)\b/gi,
      /\b(recommendation system|recommender)\b/gi,
      /\b(chat|messaging)\b/gi,
      /\b(analytics|dashboard)\b/gi
    ];
    
    const types: string[] = [];
    for (const pattern of projectPatterns) {
      if (pattern.test(jdLower)) {
        const match = jdLower.match(pattern);
        if (match) types.push(match[0]);
      }
    }
    
    return [...new Set(types)];
  }

  /**
   * Extract keywords from text
   */
  private static extractKeywordsFromText(text: string): string[] {
    const techPattern = /\b(javascript|typescript|python|java|c\+\+|c#|go|rust|ruby|php|swift|kotlin|scala|react|angular|vue|node\.?js|express|django|flask|fastapi|spring|\.net|rails|laravel|aws|azure|gcp|docker|kubernetes|terraform|jenkins|git|sql|mysql|postgresql|mongodb|redis|elasticsearch|graphql|rest|microservices|ci\/cd|agile|scrum|machine learning|deep learning|tensorflow|pytorch|pandas|numpy|spark|hadoop|kafka)\b/gi;
    
    const matches = text.match(techPattern) || [];
    return [...new Set(matches.map(m => m.toLowerCase()))];
  }


  // ============================================================================
  // SEMANTIC SIMILARITY MATRIX
  // ============================================================================

  /**
   * Create similarity matrix between JD requirements and resume bullets
   */
  private static createSimilarityMatrix(
    resumeData: ResumeData,
    jdAnalysis: JDAnalysis
  ): BulletMatch[] {
    const matches: BulletMatch[] = [];
    
    // Collect all resume bullets with section info
    const allBullets: { bullet: string; index: number; section: string }[] = [];
    
    // Work experience bullets
    resumeData.workExperience?.forEach((exp, expIdx) => {
      exp.bullets?.forEach((bullet, bulletIdx) => {
        allBullets.push({
          bullet,
          index: expIdx * 100 + bulletIdx,
          section: 'experience'
        });
      });
    });
    
    // Project bullets
    resumeData.projects?.forEach((proj, projIdx) => {
      proj.bullets?.forEach((bullet, bulletIdx) => {
        allBullets.push({
          bullet,
          index: projIdx * 100 + bulletIdx,
          section: 'projects'
        });
      });
    });
    
    // For each JD requirement, find best matching resume bullet
    for (const requirement of jdAnalysis.requirements) {
      let bestMatch: BulletMatch | null = null;
      let bestScore = 0;
      
      for (const bulletInfo of allBullets) {
        const similarity = this.calculateSemanticSimilarity(
          requirement.text,
          bulletInfo.bullet
        );
        
        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = {
            jdRequirement: requirement,
            resumeBullet: bulletInfo.bullet,
            bulletIndex: bulletInfo.index,
            section: bulletInfo.section,
            similarityScore: similarity,
            matchType: similarity >= SEMANTIC_SIMILARITY_THRESHOLD ? 'relevant' :
                       similarity >= 0.50 ? 'partial' : 'none'
          };
        }
      }
      
      if (bestMatch) {
        matches.push(bestMatch);
      }
    }
    
    return matches;
  }

  /**
   * Calculate semantic similarity between two texts
   * Uses lexical + synonym-based matching (can be enhanced with embeddings)
   */
  private static calculateSemanticSimilarity(text1: string, text2: string): number {
    const t1Lower = text1.toLowerCase();
    const t2Lower = text2.toLowerCase();
    
    // Use semantic matching service
    const similarityResult = semanticMatchingService.calculateSimilarity(t1Lower, t2Lower);
    
    // Also check for keyword overlap
    const keywords1 = this.extractKeywordsFromText(t1Lower);
    const keywords2 = this.extractKeywordsFromText(t2Lower);
    
    if (keywords1.length === 0 || keywords2.length === 0) {
      return similarityResult.score;
    }
    
    // Calculate keyword overlap
    const intersection = keywords1.filter(k => keywords2.includes(k));
    const union = [...new Set([...keywords1, ...keywords2])];
    const keywordSimilarity = intersection.length / union.length;
    
    // Combine semantic and keyword similarity
    return Math.max(similarityResult.score, keywordSimilarity * 0.9);
  }

  // ============================================================================
  // METRICS EXTRACTION & PRESERVATION
  // ============================================================================

  /**
   * Extract all metrics from resume
   */
  private static extractAllMetrics(resumeData: ResumeData): Map<string, MetricExtraction> {
    const metricsMap = new Map<string, MetricExtraction>();
    
    // Extract from work experience
    resumeData.workExperience?.forEach(exp => {
      exp.bullets?.forEach(bullet => {
        const extraction = this.extractMetricsFromBullet(bullet);
        if (extraction.hasQuantification) {
          metricsMap.set(bullet, extraction);
        }
      });
    });
    
    // Extract from projects
    resumeData.projects?.forEach(proj => {
      proj.bullets?.forEach(bullet => {
        const extraction = this.extractMetricsFromBullet(bullet);
        if (extraction.hasQuantification) {
          metricsMap.set(bullet, extraction);
        }
      });
    });
    
    return metricsMap;
  }

  /**
   * Extract metrics from a single bullet
   */
  private static extractMetricsFromBullet(bullet: string): MetricExtraction {
    const metrics: ExtractedMetric[] = [];
    
    // Percentage patterns
    const percentageMatches = bullet.match(/(\d+(?:\.\d+)?)\s*%/g) || [];
    percentageMatches.forEach(match => {
      metrics.push({
        value: match,
        type: 'percentage',
        context: this.getMetricContext(bullet, match)
      });
    });
    
    // Currency patterns
    const currencyMatches = bullet.match(/\$\s*\d+(?:,\d{3})*(?:\.\d+)?(?:\s*[KMB])?|\d+(?:,\d{3})*(?:\.\d+)?\s*(?:dollars?|USD|INR|EUR)/gi) || [];
    currencyMatches.forEach(match => {
      metrics.push({
        value: match,
        type: 'currency',
        context: this.getMetricContext(bullet, match)
      });
    });
    
    // Scale indicators (K, M, B)
    const scaleMatches = bullet.match(/\d+(?:\.\d+)?\s*[KMB]\b|\d+(?:,\d{3})+/gi) || [];
    scaleMatches.forEach(match => {
      if (!currencyMatches.some(c => c.includes(match))) {
        metrics.push({
          value: match,
          type: 'scale',
          context: this.getMetricContext(bullet, match)
        });
      }
    });
    
    // Timeframe patterns
    const timeMatches = bullet.match(/\d+\s*(?:days?|weeks?|months?|years?|hours?|minutes?)/gi) || [];
    timeMatches.forEach(match => {
      metrics.push({
        value: match,
        type: 'timeframe',
        context: this.getMetricContext(bullet, match)
      });
    });
    
    // General numbers with context
    const numberMatches = bullet.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:users?|customers?|clients?|requests?|transactions?|records?|items?|orders?|queries?|calls?|visits?|sessions?|downloads?|installs?|subscribers?|members?|employees?|teams?|projects?|features?|endpoints?|apis?|services?|servers?|instances?|containers?|pods?|nodes?|clusters?|databases?|tables?|rows?|columns?|files?|documents?|pages?|views?|clicks?|conversions?|leads?|sales?|revenue|tickets?|issues?|bugs?|tests?|cases?|scenarios?|deployments?|releases?|sprints?|iterations?)/gi) || [];
    numberMatches.forEach(match => {
      metrics.push({
        value: match,
        type: 'number',
        context: this.getMetricContext(bullet, match)
      });
    });
    
    return {
      original: bullet,
      metrics,
      hasQuantification: metrics.length > 0
    };
  }

  /**
   * Get context around a metric
   */
  private static getMetricContext(bullet: string, metric: string): string {
    const index = bullet.indexOf(metric);
    if (index === -1) return '';
    
    const start = Math.max(0, index - 20);
    const end = Math.min(bullet.length, index + metric.length + 20);
    
    return bullet.substring(start, end).trim();
  }

  /**
   * Validate metrics preservation
   */
  private static validateMetricsPreservation(
    _original: string,
    rewritten: string,
    originalMetrics: MetricExtraction
  ): { preserved: boolean; preservationRate: number; missingMetrics: string[] } {
    if (!originalMetrics.hasQuantification) {
      return { preserved: true, preservationRate: 1.0, missingMetrics: [] };
    }
    
    const missingMetrics: string[] = [];
    let preservedCount = 0;
    
    for (const metric of originalMetrics.metrics) {
      // Check if metric value exists in rewritten text
      const metricValue = metric.value.replace(/[^\d.%$KMB]/gi, '');
      if (rewritten.includes(metricValue) || rewritten.includes(metric.value)) {
        preservedCount++;
      } else {
        missingMetrics.push(metric.value);
      }
    }
    
    const preservationRate = originalMetrics.metrics.length > 0 
      ? preservedCount / originalMetrics.metrics.length 
      : 1.0;
    
    return {
      preserved: preservationRate >= METRICS_PRESERVATION_THRESHOLD,
      preservationRate,
      missingMetrics
    };
  }


  // ============================================================================
  // BULLET REWRITING WITH VALIDATION
  // ============================================================================

  /**
   * Rewrite all bullets with validation pipeline
   */
  private static async rewriteAllBullets(
    resumeData: ResumeData,
    jdAnalysis: JDAnalysis,
    bulletMatches: BulletMatch[],
    metricsMap: Map<string, MetricExtraction>
  ): Promise<RewrittenBullet[]> {
    const rewrittenBullets: RewrittenBullet[] = [];
    
    // Rewrite work experience bullets
    for (const exp of resumeData.workExperience || []) {
      for (let i = 0; i < (exp.bullets?.length || 0); i++) {
        const original = exp.bullets![i];
        const metrics = metricsMap.get(original);
        const match = bulletMatches.find(m => m.resumeBullet === original);
        
        const rewritten = await this.rewriteBulletWithValidation(
          original,
          jdAnalysis,
          metrics,
          match,
          'experience'
        );
        
        rewrittenBullets.push(rewritten);
      }
    }
    
    // Rewrite project bullets
    for (const proj of resumeData.projects || []) {
      for (let i = 0; i < (proj.bullets?.length || 0); i++) {
        const original = proj.bullets![i];
        const metrics = metricsMap.get(original);
        const match = bulletMatches.find(m => m.resumeBullet === original);
        
        const rewritten = await this.rewriteBulletWithValidation(
          original,
          jdAnalysis,
          metrics,
          match,
          'projects'
        );
        
        rewrittenBullets.push(rewritten);
      }
    }
    
    return rewrittenBullets;
  }

  /**
   * Rewrite a single bullet with validation and retry logic
   */
  private static async rewriteBulletWithValidation(
    original: string,
    jdAnalysis: JDAnalysis,
    metrics: MetricExtraction | undefined,
    match: BulletMatch | undefined,
    section: string
  ): Promise<RewrittenBullet> {
    let retryCount = 0;
    let bestRewrite = original;
    let bestValidation: BulletValidation = {
      passed: false,
      checks: [],
      failureReasons: [],
      retryCount: 0
    };
    
    while (retryCount < MAX_RETRY_ATTEMPTS) {
      // Generate rewrite
      const rewritten = this.generateBulletRewrite(
        original,
        jdAnalysis,
        metrics,
        match,
        section,
        retryCount > 0 ? bestValidation.failureReasons : []
      );
      
      // Validate rewrite
      const validation = this.validateBullet(
        original,
        rewritten,
        jdAnalysis,
        metrics
      );
      
      validation.retryCount = retryCount;
      
      if (validation.passed) {
        return {
          original,
          rewritten,
          validation,
          metricsPreserved: metrics ? this.validateMetricsPreservation(original, rewritten, metrics).preserved : true,
          keywordDensity: this.calculateKeywordDensity(rewritten, jdAnalysis.keywords.map(k => k.keyword)),
          semanticSimilarity: this.calculateSemanticSimilarity(original, rewritten)
        };
      }
      
      // Keep best attempt
      if (validation.checks.filter(c => c.passed).length > bestValidation.checks.filter(c => c.passed).length) {
        bestRewrite = rewritten;
        bestValidation = validation;
      }
      
      retryCount++;
    }
    
    // Return best attempt or original with warning
    return {
      original,
      rewritten: bestRewrite,
      validation: bestValidation,
      metricsPreserved: metrics ? this.validateMetricsPreservation(original, bestRewrite, metrics).preserved : true,
      keywordDensity: this.calculateKeywordDensity(bestRewrite, jdAnalysis.keywords.map(k => k.keyword)),
      semanticSimilarity: this.calculateSemanticSimilarity(original, bestRewrite)
    };
  }

  /**
   * Generate bullet rewrite
   */
  private static generateBulletRewrite(
    original: string,
    jdAnalysis: JDAnalysis,
    metrics: MetricExtraction | undefined,
    match: BulletMatch | undefined,
    _section: string,
    previousFailures: string[]
  ): string {
    // Get appropriate action verbs
    const actionVerbs = ROLE_ACTION_VERBS[jdAnalysis.roleType][jdAnalysis.seniorityLevel];
    
    // Get role emphasis keywords
    const roleEmphasis = ROLE_EMPHASIS[jdAnalysis.roleType];
    
    // Extract relevant JD keywords to integrate
    const relevantKeywords = match 
      ? match.jdRequirement.keywords.slice(0, 3)
      : jdAnalysis.keywords.slice(0, 3).map(k => k.keyword);
    
    // Start with original bullet
    let rewritten = original;
    
    // Step 1: Replace weak verbs with strong action verbs
    rewritten = this.replaceWeakVerbs(rewritten, actionVerbs);
    
    // Step 2: Ensure metrics are preserved and prominent
    if (metrics && metrics.hasQuantification) {
      rewritten = this.ensureMetricsProminent(rewritten, metrics);
    }
    
    // Step 3: Integrate JD keywords naturally (if not already present)
    rewritten = this.integrateKeywordsNaturally(rewritten, relevantKeywords, previousFailures);
    
    // Step 4: Apply STAR format structure
    rewritten = this.applySTARFormat(rewritten, roleEmphasis);
    
    // Step 5: Ensure proper length (9-10 words)
    rewritten = this.ensureProperLength(rewritten);
    
    return rewritten;
  }

  /**
   * Replace weak verbs with strong action verbs
   */
  private static replaceWeakVerbs(bullet: string, actionVerbs: string[]): string {
    const weakVerbs: Record<string, string> = {
      'worked': actionVerbs[0] || 'Developed',
      'helped': actionVerbs[1] || 'Enabled',
      'assisted': actionVerbs[2] || 'Supported',
      'did': actionVerbs[0] || 'Executed',
      'made': actionVerbs[0] || 'Created',
      'got': actionVerbs[0] || 'Achieved',
      'used': 'Leveraged',
      'was responsible': actionVerbs[0] || 'Managed',
      'responsible for': actionVerbs[0] || 'Owned',
      'involved in': 'Contributed to',
      'participated': 'Engaged in',
      'handled': actionVerbs[0] || 'Managed',
      'dealt with': 'Resolved',
      'took care of': 'Administered'
    };
    
    let result = bullet;
    
    // Check if bullet starts with a weak verb
    const firstWord = bullet.split(/\s+/)[0].toLowerCase();
    if (weakVerbs[firstWord]) {
      result = bullet.replace(new RegExp(`^${firstWord}`, 'i'), weakVerbs[firstWord]);
    }
    
    // Replace other weak verbs
    for (const [weak, strong] of Object.entries(weakVerbs)) {
      const pattern = new RegExp(`\\b${weak}\\b`, 'gi');
      result = result.replace(pattern, strong);
    }
    
    // Ensure first letter is capitalized
    result = result.charAt(0).toUpperCase() + result.slice(1);
    
    return result;
  }

  /**
   * Ensure metrics are prominent in the bullet
   */
  private static ensureMetricsProminent(bullet: string, metrics: MetricExtraction): string {
    // If metrics are already at the start, keep as is
    const firstMetric = metrics.metrics[0];
    if (firstMetric && bullet.indexOf(firstMetric.value) < 30) {
      return bullet;
    }
    
    // Try to move metrics to a more prominent position
    // This is a simplified version - in production, use AI for better restructuring
    return bullet;
  }

  /**
   * Integrate JD keywords naturally
   */
  private static integrateKeywordsNaturally(
    bullet: string,
    keywords: string[],
    previousFailures: string[]
  ): string {
    const bulletLower = bullet.toLowerCase();
    let result = bullet;
    
    // Check which keywords are already present
    const missingKeywords = keywords.filter(k => !bulletLower.includes(k.toLowerCase()));
    
    // If keyword stuffing was a previous failure, be more conservative
    const wasStuffing = previousFailures.some(f => f.includes('stuffing'));
    if (wasStuffing) {
      return result; // Don't add more keywords
    }
    
    // Add at most 1 missing keyword naturally
    if (missingKeywords.length > 0 && !wasStuffing) {
      const keyword = missingKeywords[0];
      
      // Try to add keyword in a natural position
      // This is simplified - in production, use AI for better integration
      if (result.includes('using') && !result.toLowerCase().includes(keyword.toLowerCase())) {
        result = result.replace(/using\s+/i, `using ${keyword} and `);
      } else if (result.includes('with') && !result.toLowerCase().includes(keyword.toLowerCase())) {
        result = result.replace(/with\s+/i, `with ${keyword} and `);
      }
    }
    
    return result;
  }

  /**
   * Apply STAR format structure
   */
  private static applySTARFormat(bullet: string, _roleEmphasis: string[]): string {
    // STAR: Situation, Task, Action, Result
    // Ensure bullet has action verb at start and result/impact
    
    // Check if bullet has a result indicator
    const hasResult = /\b(resulting|achieving|improving|reducing|increasing|saving|generating|delivering)\b/i.test(bullet);
    
    if (!hasResult && bullet.length < 100) {
      // Add a generic result phrase if missing
      // In production, this would be more sophisticated
    }
    
    return bullet;
  }

  /**
   * Ensure proper bullet length
   */
  private static ensureProperLength(bullet: string): string {
    const words = bullet.split(/\s+/);
    
    if (words.length > 30) {
      // Truncate to ~25 words
      return words.slice(0, 25).join(' ') + '...';
    }
    
    return bullet;
  }

  /**
   * Calculate keyword density
   */
  private static calculateKeywordDensity(text: string, keywords: string[]): number {
    const words = text.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    
    if (totalWords === 0) return 0;
    
    let totalKeywordCount = 0;
    
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      const count = words.filter(w => w.includes(keywordLower)).length;
      totalKeywordCount += count;
    }
    
    return totalKeywordCount / totalWords;
  }

  /**
   * Validate a rewritten bullet
   */
  private static validateBullet(
    original: string,
    rewritten: string,
    jdAnalysis: JDAnalysis,
    metrics: MetricExtraction | undefined
  ): BulletValidation {
    const checks: ValidationCheck[] = [];
    const failureReasons: string[] = [];
    
    // Check 1: Semantic similarity (>= 0.70)
    const semanticSimilarity = this.calculateSemanticSimilarity(original, rewritten);
    const semanticCheck: ValidationCheck = {
      name: 'Semantic Similarity',
      passed: semanticSimilarity >= SEMANTIC_SIMILARITY_THRESHOLD,
      score: semanticSimilarity,
      threshold: SEMANTIC_SIMILARITY_THRESHOLD,
      message: semanticSimilarity >= SEMANTIC_SIMILARITY_THRESHOLD 
        ? `Semantic similarity: ${(semanticSimilarity * 100).toFixed(1)}%`
        : `Semantic drift detected: ${(semanticSimilarity * 100).toFixed(1)}% < ${SEMANTIC_SIMILARITY_THRESHOLD * 100}%`
    };
    checks.push(semanticCheck);
    if (!semanticCheck.passed) failureReasons.push('Semantic drift');
    
    // Check 2: Metrics preservation (>= 90%)
    if (metrics && metrics.hasQuantification) {
      const metricsValidation = this.validateMetricsPreservation(original, rewritten, metrics);
      const metricsCheck: ValidationCheck = {
        name: 'Metrics Preservation',
        passed: metricsValidation.preserved,
        score: metricsValidation.preservationRate,
        threshold: METRICS_PRESERVATION_THRESHOLD,
        message: metricsValidation.preserved
          ? `Metrics preserved: ${(metricsValidation.preservationRate * 100).toFixed(1)}%`
          : `Metrics lost: ${metricsValidation.missingMetrics.join(', ')}`
      };
      checks.push(metricsCheck);
      if (!metricsCheck.passed) failureReasons.push('Metrics lost');
    }
    
    // Check 3: Keyword density (< 3% per term, < 8% total)
    const keywords = jdAnalysis.keywords.map(k => k.keyword);
    const totalDensity = this.calculateKeywordDensity(rewritten, keywords);
    const densityCheck: ValidationCheck = {
      name: 'Keyword Density',
      passed: totalDensity < KEYWORD_DENSITY_MAX_TOTAL,
      score: totalDensity,
      threshold: KEYWORD_DENSITY_MAX_TOTAL,
      message: totalDensity < KEYWORD_DENSITY_MAX_TOTAL
        ? `Keyword density: ${(totalDensity * 100).toFixed(1)}%`
        : `Keyword stuffing detected: ${(totalDensity * 100).toFixed(1)}% > ${KEYWORD_DENSITY_MAX_TOTAL * 100}%`
    };
    checks.push(densityCheck);
    if (!densityCheck.passed) failureReasons.push('Keyword stuffing detected');
    
    // Check 4: Action verb presence
    const actionVerbs = ROLE_ACTION_VERBS[jdAnalysis.roleType][jdAnalysis.seniorityLevel];
    const firstWord = rewritten.split(/\s+/)[0];
    const hasStrongVerb = actionVerbs.some(v => 
      firstWord.toLowerCase() === v.toLowerCase() ||
      rewritten.toLowerCase().startsWith(v.toLowerCase())
    );
    const verbCheck: ValidationCheck = {
      name: 'Action Verb',
      passed: hasStrongVerb,
      score: hasStrongVerb ? 1 : 0,
      threshold: 1,
      message: hasStrongVerb
        ? `Strong action verb: ${firstWord}`
        : `Weak action verb: ${firstWord}`
    };
    checks.push(verbCheck);
    if (!verbCheck.passed) failureReasons.push('Weak action verb');
    
    // Check 5: No hallucination (all skills in rewritten exist in original or JD)
    const hallucinations = this.detectHallucinations(original, rewritten, jdAnalysis);
    const hallucinationCheck: ValidationCheck = {
      name: 'No Hallucination',
      passed: hallucinations.length === 0,
      score: hallucinations.length === 0 ? 1 : 0,
      threshold: 1,
      message: hallucinations.length === 0
        ? 'No hallucinated skills detected'
        : `Hallucinated skills: ${hallucinations.join(', ')}`
    };
    checks.push(hallucinationCheck);
    if (!hallucinationCheck.passed) failureReasons.push('Hallucinated skill detected');
    
    // Check 6: Natural language flow (readability)
    const readabilityScore = this.calculateReadability(rewritten);
    const readabilityCheck: ValidationCheck = {
      name: 'Readability',
      passed: readabilityScore >= 60,
      score: readabilityScore,
      threshold: 60,
      message: readabilityScore >= 60
        ? `Readability score: ${readabilityScore}`
        : `Awkward phrasing: readability ${readabilityScore} < 60`
    };
    checks.push(readabilityCheck);
    if (!readabilityCheck.passed) failureReasons.push('Awkward phrasing');
    
    return {
      passed: failureReasons.length === 0,
      checks,
      failureReasons,
      retryCount: 0
    };
  }

  /**
   * Detect hallucinated skills/technologies
   */
  private static detectHallucinations(
    original: string,
    rewritten: string,
    jdAnalysis: JDAnalysis
  ): string[] {
    const hallucinations: string[] = [];
    
    // Extract tech keywords from rewritten
    const rewrittenKeywords = this.extractKeywordsFromText(rewritten);
    const originalKeywords = this.extractKeywordsFromText(original);
    const jdKeywords = jdAnalysis.hardSkills;
    
    // Check each keyword in rewritten
    for (const keyword of rewrittenKeywords) {
      const inOriginal = originalKeywords.includes(keyword);
      const inJD = jdKeywords.includes(keyword);
      
      if (!inOriginal && !inJD) {
        hallucinations.push(keyword);
      }
    }
    
    return hallucinations;
  }

  /**
   * Calculate readability score (simplified Flesch-Kincaid)
   */
  private static calculateReadability(text: string): number {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);
    
    if (words.length === 0 || sentences.length === 0) return 50;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    // Simplified Flesch Reading Ease
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Count syllables in a word (simplified)
   */
  private static countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }


  // ============================================================================
  // APPLY REWRITES & GENERATE REPORTS
  // ============================================================================

  /**
   * Apply rewrites to resume
   */
  private static applyRewrites(
    resumeData: ResumeData,
    rewrittenBullets: RewrittenBullet[],
    jdAnalysis: JDAnalysis
  ): ResumeData {
    const optimized: ResumeData = JSON.parse(JSON.stringify(resumeData));
    
    let bulletIndex = 0;
    
    // Apply to work experience
    for (const exp of optimized.workExperience || []) {
      for (let i = 0; i < (exp.bullets?.length || 0); i++) {
        if (bulletIndex < rewrittenBullets.length) {
          const rewrite = rewrittenBullets[bulletIndex];
          if (rewrite.validation.passed || rewrite.semanticSimilarity >= 0.5) {
            exp.bullets![i] = rewrite.rewritten;
          }
          bulletIndex++;
        }
      }
    }
    
    // Apply to projects
    for (const proj of optimized.projects || []) {
      for (let i = 0; i < (proj.bullets?.length || 0); i++) {
        if (bulletIndex < rewrittenBullets.length) {
          const rewrite = rewrittenBullets[bulletIndex];
          if (rewrite.validation.passed || rewrite.semanticSimilarity >= 0.5) {
            proj.bullets![i] = rewrite.rewritten;
          }
          bulletIndex++;
        }
      }
    }
    
    // Enhance skills section with JD keywords
    optimized.skills = this.enhanceSkillsSection(optimized.skills || [], jdAnalysis);
    
    // Enhance summary if present
    if (optimized.summary) {
      optimized.summary = this.enhanceSummary(optimized.summary, jdAnalysis);
    }
    
    return optimized;
  }

  /**
   * Enhance skills section with JD keywords
   */
  private static enhanceSkillsSection(
    skills: Array<{ category: string; count: number; list: string[] }>,
    jdAnalysis: JDAnalysis
  ): Array<{ category: string; count: number; list: string[] }> {
    const enhanced = [...skills];
    
    // Get all existing skills
    const existingSkills = new Set(
      skills.flatMap(s => s.list.map(skill => skill.toLowerCase()))
    );
    
    // Add missing hard skills from JD
    const missingHardSkills = jdAnalysis.hardSkills.filter(
      skill => !existingSkills.has(skill.toLowerCase())
    );
    
    if (missingHardSkills.length > 0) {
      // Find or create Technical Skills category
      let techCategory = enhanced.find(s => 
        s.category.toLowerCase().includes('technical') ||
        s.category.toLowerCase().includes('programming')
      );
      
      if (!techCategory) {
        techCategory = { category: 'Technical Skills', count: 0, list: [] };
        enhanced.push(techCategory);
      }
      
      // Add missing skills (limit to top 5)
      const toAdd = missingHardSkills.slice(0, 5);
      techCategory.list.push(...toAdd);
      techCategory.count = techCategory.list.length;
    }
    
    // Add missing soft skills from JD
    const missingSoftSkills = jdAnalysis.softSkills.filter(
      skill => !existingSkills.has(skill.toLowerCase())
    );
    
    if (missingSoftSkills.length > 0) {
      let softCategory = enhanced.find(s => 
        s.category.toLowerCase().includes('soft') ||
        s.category.toLowerCase().includes('interpersonal')
      );
      
      if (!softCategory) {
        softCategory = { category: 'Soft Skills', count: 0, list: [] };
        enhanced.push(softCategory);
      }
      
      const toAdd = missingSoftSkills.slice(0, 3);
      softCategory.list.push(...toAdd);
      softCategory.count = softCategory.list.length;
    }
    
    return enhanced;
  }

  /**
   * Enhance summary with JD alignment
   */
  private static enhanceSummary(summary: string, jdAnalysis: JDAnalysis): string {
    // Add role-specific keywords if not present
    const summaryLower = summary.toLowerCase();
    const roleKeywords = ROLE_EMPHASIS[jdAnalysis.roleType];
    
    // Check if summary mentions the role type
    const hasRoleType = roleKeywords.some(k => summaryLower.includes(k.toLowerCase()));
    
    if (!hasRoleType && roleKeywords.length > 0) {
      // Add role context to summary
      const roleContext = roleKeywords.slice(0, 2).join(' and ');
      if (summary.endsWith('.')) {
        return `${summary} Experienced in ${roleContext}.`;
      }
    }
    
    return summary;
  }

  /**
   * Generate warning report
   */
  private static generateWarningReport(
    resume: ResumeData,
    jdAnalysis: JDAnalysis
  ): WarningReport {
    const missingSections: string[] = [];
    const requiredAdditions: string[] = [];
    const suggestedImprovements: string[] = [];
    const synthesizedProjects: SynthesizedProject[] = [];
    
    // Check for missing sections
    if (!resume.education || resume.education.length === 0) {
      missingSections.push('Education');
      if (jdAnalysis.educationRequirements.length > 0) {
        requiredAdditions.push(`JD requires: ${jdAnalysis.educationRequirements[0]}`);
      }
    }
    
    if (!resume.skills || resume.skills.length === 0) {
      missingSections.push('Skills');
    }
    
    if (!resume.workExperience || resume.workExperience.length === 0) {
      missingSections.push('Work Experience');
    }
    
    // Check for missing certifications
    if (jdAnalysis.certifications.length > 0) {
      const hasCerts = resume.certifications && resume.certifications.length > 0;
      if (!hasCerts) {
        requiredAdditions.push(`JD requires certifications: ${jdAnalysis.certifications.join(', ')}`);
      }
    }
    
    // Check for missing soft skills
    const existingSkills = new Set(
      (resume.skills || []).flatMap(s => s.list.map(skill => skill.toLowerCase()))
    );
    const missingSoftSkills = jdAnalysis.softSkills.filter(
      skill => !existingSkills.has(skill.toLowerCase())
    );
    if (missingSoftSkills.length > 0) {
      suggestedImprovements.push(`Add soft skills: ${missingSoftSkills.join(', ')}`);
    }
    
    // Check for missing project types
    if (jdAnalysis.projectTypes.length > 0) {
      const hasMatchingProject = (resume.projects || []).some(proj => {
        const projText = `${proj.title} ${proj.bullets?.join(' ')}`.toLowerCase();
        return jdAnalysis.projectTypes.some(type => projText.includes(type.toLowerCase()));
      });
      
      if (!hasMatchingProject) {
        // Synthesize a project suggestion
        const projectType = jdAnalysis.projectTypes[0];
        const techStack = jdAnalysis.hardSkills.slice(0, 4);
        
        synthesizedProjects.push({
          title: `${projectType.charAt(0).toUpperCase() + projectType.slice(1)} Application`,
          description: `Developed ${projectType} solution using ${techStack.join(', ')}`,
          technologies: techStack,
          isSuggested: true
        });
        
        suggestedImprovements.push(`Consider adding a ${projectType} project to match JD requirements`);
      }
    }
    
    return {
      missingSections,
      requiredAdditions,
      suggestedImprovements,
      synthesizedProjects
    };
  }

  /**
   * Run ATS simulation
   */
  private static runATSSimulation(resume: ResumeData): ATSSimulationResult {
    const failures: string[] = [];
    const recommendations: string[] = [];
    
    // Check contact info
    const hasEmail = !!resume.email && resume.email.includes('@');
    const hasPhone = !!resume.phone && resume.phone.length >= 10;
    const hasName = !!resume.name && resume.name.length > 2;
    
    if (!hasEmail) {
      failures.push('Email not extracted');
      recommendations.push('Ensure email is clearly visible at the top of resume');
    }
    if (!hasPhone) {
      failures.push('Phone not extracted');
      recommendations.push('Include phone number in standard format');
    }
    if (!hasName) {
      failures.push('Name not extracted');
      recommendations.push('Ensure name is prominently displayed');
    }
    
    // Check section headers
    const sections: string[] = [];
    if (resume.workExperience && resume.workExperience.length > 0) sections.push('Experience');
    if (resume.education && resume.education.length > 0) sections.push('Education');
    if (resume.skills && resume.skills.length > 0) sections.push('Skills');
    if (resume.projects && resume.projects.length > 0) sections.push('Projects');
    if (resume.certifications && resume.certifications.length > 0) sections.push('Certifications');
    
    if (sections.length < 3) {
      failures.push('Missing standard sections');
      recommendations.push('Include Experience, Education, and Skills sections');
    }
    
    // Check dates
    const dates: string[] = [];
    resume.workExperience?.forEach(exp => {
      if (exp.year) dates.push(exp.year);
    });
    resume.education?.forEach(edu => {
      if (edu.year) dates.push(edu.year);
    });
    
    if (dates.length === 0) {
      failures.push('No dates parsed');
      recommendations.push('Include dates for all experience and education entries');
    }
    
    // Check skills extraction
    const skills = (resume.skills || []).flatMap(s => s.list);
    if (skills.length === 0) {
      failures.push('No skills extracted');
      recommendations.push('List skills in a dedicated Skills section');
    }
    
    // Calculate score
    const totalChecks = 6;
    const passedChecks = totalChecks - failures.length;
    const score = Math.round((passedChecks / totalChecks) * 100);
    
    return {
      parsedSuccessfully: failures.length === 0,
      failures,
      extractedFields: {
        email: hasEmail,
        phone: hasPhone,
        name: hasName,
        sections,
        skills,
        dates
      },
      recommendations,
      score
    };
  }

  /**
   * Generate validation report
   */
  private static generateValidationReport(rewrittenBullets: RewrittenBullet[]): ValidationReport {
    const bulletResults: BulletValidationResult[] = rewrittenBullets.map((bullet, index) => ({
      bulletIndex: index,
      section: index < (rewrittenBullets.length / 2) ? 'experience' : 'projects',
      original: bullet.original,
      rewritten: bullet.rewritten,
      passed: bullet.validation.passed,
      checks: bullet.validation.checks
    }));
    
    return {
      totalBullets: rewrittenBullets.length,
      passedBullets: rewrittenBullets.filter(b => b.validation.passed).length,
      failedBullets: rewrittenBullets.filter(b => !b.validation.passed).length,
      retriedBullets: rewrittenBullets.filter(b => b.validation.retryCount > 0).length,
      bulletResults
    };
  }

  /**
   * Calculate final scoring breakdown
   */
  private static calculateScoringBreakdown(
    rewrittenBullets: RewrittenBullet[],
    atsSimulation: ATSSimulationResult,
    jdAnalysis: JDAnalysis,
    resume: ResumeData
  ): ScoringBreakdown {
    // Semantic Alignment (35%)
    const avgSemantic = rewrittenBullets.length > 0
      ? rewrittenBullets.reduce((sum, b) => sum + b.semanticSimilarity, 0) / rewrittenBullets.length
      : 0;
    const semanticScore = avgSemantic * 100;
    const semanticValidated = avgSemantic >= SEMANTIC_SIMILARITY_THRESHOLD;
    
    // Skill & Tool Match (25%)
    const existingSkills = new Set(
      (resume.skills || []).flatMap(s => s.list.map(skill => skill.toLowerCase()))
    );
    const matchedSkills = jdAnalysis.hardSkills.filter(skill => 
      existingSkills.has(skill.toLowerCase())
    );
    const skillMatchScore = jdAnalysis.hardSkills.length > 0
      ? (matchedSkills.length / jdAnalysis.hardSkills.length) * 100
      : 50;
    
    // Metrics Preservation (15%)
    const metricsPreserved = rewrittenBullets.filter(b => b.metricsPreserved).length;
    const metricsScore = rewrittenBullets.length > 0
      ? (metricsPreserved / rewrittenBullets.length) * 100
      : 100;
    
    // Action Verb Strength (10%)
    const strongVerbCount = rewrittenBullets.filter(b => {
      const verbCheck = b.validation.checks.find(c => c.name === 'Action Verb');
      return verbCheck?.passed;
    }).length;
    const verbScore = rewrittenBullets.length > 0
      ? (strongVerbCount / rewrittenBullets.length) * 100
      : 50;
    
    // ATS Readability (10%)
    const atsScore = atsSimulation.score;
    
    // Keyword Density (5%)
    const avgDensity = rewrittenBullets.length > 0
      ? rewrittenBullets.reduce((sum, b) => sum + b.keywordDensity, 0) / rewrittenBullets.length
      : 0;
    const densityScore = avgDensity < KEYWORD_DENSITY_MAX_TOTAL ? 100 : 50;
    
    // Calculate weighted total
    const totalScore = Math.round(
      (semanticScore * 0.35) +
      (skillMatchScore * 0.25) +
      (metricsScore * 0.15) +
      (verbScore * 0.10) +
      (atsScore * 0.10) +
      (densityScore * 0.05)
    );
    
    return {
      semanticAlignment: { score: Math.round(semanticScore), weight: 35, validated: semanticValidated },
      skillToolMatch: { score: Math.round(skillMatchScore), weight: 25, validated: skillMatchScore >= 70 },
      metricsPreservation: { score: Math.round(metricsScore), weight: 15, validated: metricsScore >= 90 },
      actionVerbStrength: { score: Math.round(verbScore), weight: 10, validated: verbScore >= 80 },
      atsReadability: { score: Math.round(atsScore), weight: 10, validated: atsSimulation.parsedSuccessfully },
      keywordDensity: { score: Math.round(densityScore), weight: 5, validated: avgDensity < KEYWORD_DENSITY_MAX_TOTAL },
      totalScore
    };
  }
}

// Export singleton instance
export const jdBasedResumeOptimizer = JDBasedResumeOptimizer;
