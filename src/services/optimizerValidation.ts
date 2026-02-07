/**
 * Optimizer Validation Service
 * 
 * Addresses the following issues from validation report:
 * 1. Over-optimization / Content Inflation
 * 2. Skill Bloat / Keyword Stuffing
 * 3. Score Inflation Loop
 * 4. Hallucinated content (metrics not in original)
 * 
 * Key Features:
 * - Content authenticity validation
 * - Metric preservation verification
 * - Keyword density control
 * - Cross-tool score consistency
 */

import { ResumeData } from '../types/resume';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100 validation score
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
  metrics: ValidationMetrics;
}

export interface ValidationIssue {
  type: 'critical' | 'high' | 'medium' | 'low';
  category: 'authenticity' | 'inflation' | 'keyword_stuffing' | 'metric_fabrication' | 'skill_bloat';
  message: string;
  location?: string;
  suggestion: string;
}

export interface ValidationWarning {
  type: 'caution' | 'info';
  message: string;
}

export interface ValidationMetrics {
  authenticityScore: number;
  metricPreservationRate: number;
  keywordDensity: number;
  skillInflationRate: number;
  contentChangeRate: number;
}

export interface ContentComparison {
  original: ResumeData;
  optimized: ResumeData;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Thresholds for validation
const THRESHOLDS = {
  // Authenticity
  MAX_CONTENT_CHANGE_RATE: 0.40, // Max 40% content change
  MIN_METRIC_PRESERVATION: 0.90, // Must preserve 90% of original metrics
  
  // Keyword stuffing
  MAX_KEYWORD_DENSITY_PER_TERM: 0.03, // Max 3% per keyword
  MAX_TOTAL_KEYWORD_DENSITY: 0.08, // Max 8% total
  
  // Skill inflation
  MAX_SKILL_INCREASE_RATIO: 1.5, // Max 50% more skills than original
  MAX_NEW_SKILLS_COUNT: 10, // Max 10 new skills added
  
  // Metric fabrication
  SUSPICIOUS_METRIC_PATTERNS: [
    /\d{2,3}%\s*(improvement|increase|reduction|growth)/i,
    /\$\d+[KMB]?\s*(revenue|savings|cost)/i,
    /\d+x\s*(faster|improvement|growth)/i,
    /\d+\+?\s*years?\s*experience/i,
  ],
};

// Common fabricated metric patterns
const FABRICATED_METRIC_INDICATORS = [
  '99.9%', '100%', '10x', '50x', '100x',
  '$1M', '$10M', '$100M',
  '1000+', '10000+', '100000+',
];

// ============================================================================
// MAIN VALIDATION SERVICE
// ============================================================================

export class OptimizerValidationService {
  
  /**
   * Validate optimized resume against original
   */
  static validate(comparison: ContentComparison): ValidationResult {
    const { original, optimized } = comparison;
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    
    // 1. Check authenticity (content preservation)
    const authenticityResult = this.validateAuthenticity(original, optimized);
    issues.push(...authenticityResult.issues);
    warnings.push(...authenticityResult.warnings);
    
    // 2. Check metric preservation
    const metricResult = this.validateMetricPreservation(original, optimized);
    issues.push(...metricResult.issues);
    warnings.push(...metricResult.warnings);
    
    // 3. Check for keyword stuffing
    const keywordResult = this.validateKeywordDensity(optimized);
    issues.push(...keywordResult.issues);
    warnings.push(...keywordResult.warnings);
    
    // 4. Check for skill bloat
    const skillResult = this.validateSkillInflation(original, optimized);
    issues.push(...skillResult.issues);
    warnings.push(...skillResult.warnings);
    
    // 5. Check for fabricated metrics
    const fabricationResult = this.validateMetricFabrication(original, optimized);
    issues.push(...fabricationResult.issues);
    warnings.push(...fabricationResult.warnings);
    
    // Calculate overall validation score
    const metrics: ValidationMetrics = {
      authenticityScore: authenticityResult.score,
      metricPreservationRate: metricResult.score,
      keywordDensity: keywordResult.density,
      skillInflationRate: skillResult.inflationRate,
      contentChangeRate: authenticityResult.changeRate,
    };
    
    const validationScore = this.calculateValidationScore(metrics, issues);
    const isValid = validationScore >= 70 && !issues.some(i => i.type === 'critical');
    
    return {
      isValid,
      score: validationScore,
      issues,
      warnings,
      metrics,
    };
  }
  
  // ============================================================================
  // AUTHENTICITY VALIDATION
  // ============================================================================
  
  private static validateAuthenticity(
    original: ResumeData,
    optimized: ResumeData
  ): { issues: ValidationIssue[]; warnings: ValidationWarning[]; score: number; changeRate: number } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Calculate content change rate
    const originalBullets = this.extractAllBullets(original);
    const optimizedBullets = this.extractAllBullets(optimized);
    
    let preservedCount = 0;
    let totalOriginal = originalBullets.length;
    
    for (const originalBullet of originalBullets) {
      // Check if original content is preserved (allowing for minor rewrites)
      const isPreserved = optimizedBullets.some(optBullet => 
        this.calculateSimilarity(originalBullet, optBullet) >= 0.5
      );
      if (isPreserved) preservedCount++;
    }
    
    const preservationRate = totalOriginal > 0 ? preservedCount / totalOriginal : 1;
    const changeRate = 1 - preservationRate;
    
    if (changeRate > THRESHOLDS.MAX_CONTENT_CHANGE_RATE) {
      issues.push({
        type: 'high',
        category: 'authenticity',
        message: `Content change rate (${Math.round(changeRate * 100)}%) exceeds safe threshold`,
        suggestion: 'Reduce content modifications to preserve authenticity',
      });
    } else if (changeRate > THRESHOLDS.MAX_CONTENT_CHANGE_RATE * 0.75) {
      warnings.push({
        type: 'caution',
        message: `Content change rate (${Math.round(changeRate * 100)}%) is approaching threshold`,
      });
    }
    
    // Check for completely new sections
    const originalSections = this.getSectionNames(original);
    const optimizedSections = this.getSectionNames(optimized);
    const newSections = optimizedSections.filter(s => !originalSections.includes(s));
    
    if (newSections.length > 0) {
      warnings.push({
        type: 'info',
        message: `New sections added: ${newSections.join(', ')}`,
      });
    }
    
    const score = Math.round(preservationRate * 100);
    
    return { issues, warnings, score, changeRate };
  }
  
  // ============================================================================
  // METRIC PRESERVATION VALIDATION
  // ============================================================================
  
  private static validateMetricPreservation(
    original: ResumeData,
    optimized: ResumeData
  ): { issues: ValidationIssue[]; warnings: ValidationWarning[]; score: number } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Extract metrics from original
    const originalMetrics = this.extractMetrics(original);
    const optimizedMetrics = this.extractMetrics(optimized);
    
    // Check preservation
    let preservedCount = 0;
    for (const metric of originalMetrics) {
      const isPreserved = optimizedMetrics.some(m => 
        m.value === metric.value || 
        this.isEquivalentMetric(metric.value, m.value)
      );
      if (isPreserved) preservedCount++;
    }
    
    const preservationRate = originalMetrics.length > 0 
      ? preservedCount / originalMetrics.length 
      : 1;
    
    if (preservationRate < THRESHOLDS.MIN_METRIC_PRESERVATION) {
      issues.push({
        type: 'high',
        category: 'authenticity',
        message: `Only ${Math.round(preservationRate * 100)}% of original metrics preserved`,
        suggestion: 'Ensure all original quantified achievements are retained',
      });
    }
    
    const score = Math.round(preservationRate * 100);
    
    return { issues, warnings, score };
  }
  
  // ============================================================================
  // KEYWORD DENSITY VALIDATION
  // ============================================================================
  
  private static validateKeywordDensity(
    optimized: ResumeData
  ): { issues: ValidationIssue[]; warnings: ValidationWarning[]; density: number } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    
    const text = this.resumeToText(optimized).toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 2);
    const totalWords = words.length;
    
    // Count keyword frequencies
    const keywordCounts = new Map<string, number>();
    for (const word of words) {
      keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1);
    }
    
    // Check for keyword stuffing
    const stuffedKeywords: string[] = [];
    for (const [keyword, count] of keywordCounts) {
      const density = count / totalWords;
      if (density > THRESHOLDS.MAX_KEYWORD_DENSITY_PER_TERM) {
        stuffedKeywords.push(`${keyword} (${Math.round(density * 100)}%)`);
      }
    }
    
    if (stuffedKeywords.length > 0) {
      issues.push({
        type: 'medium',
        category: 'keyword_stuffing',
        message: `Potential keyword stuffing detected: ${stuffedKeywords.slice(0, 5).join(', ')}`,
        suggestion: 'Reduce repetition of these keywords for natural reading',
      });
    }
    
    // Calculate total technical keyword density
    const techKeywords = this.extractTechKeywords(text);
    const techDensity = techKeywords.length / totalWords;
    
    if (techDensity > THRESHOLDS.MAX_TOTAL_KEYWORD_DENSITY) {
      issues.push({
        type: 'medium',
        category: 'keyword_stuffing',
        message: `Technical keyword density (${Math.round(techDensity * 100)}%) is too high`,
        suggestion: 'Balance technical terms with descriptive content',
      });
    }
    
    return { issues, warnings, density: techDensity };
  }
  
  // ============================================================================
  // SKILL INFLATION VALIDATION
  // ============================================================================
  
  private static validateSkillInflation(
    original: ResumeData,
    optimized: ResumeData
  ): { issues: ValidationIssue[]; warnings: ValidationWarning[]; inflationRate: number } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    
    const originalSkills = this.extractAllSkills(original);
    const optimizedSkills = this.extractAllSkills(optimized);
    
    const originalCount = originalSkills.size;
    const optimizedCount = optimizedSkills.size;
    
    // Calculate inflation rate
    const inflationRate = originalCount > 0 
      ? optimizedCount / originalCount 
      : optimizedCount > 0 ? 2 : 1;
    
    // Find new skills
    const newSkills = [...optimizedSkills].filter(s => !originalSkills.has(s));
    
    if (inflationRate > THRESHOLDS.MAX_SKILL_INCREASE_RATIO) {
      issues.push({
        type: 'high',
        category: 'skill_bloat',
        message: `Skill count increased by ${Math.round((inflationRate - 1) * 100)}% (${originalCount} → ${optimizedCount})`,
        suggestion: 'Remove skills not demonstrated in experience or projects',
      });
    }
    
    if (newSkills.length > THRESHOLDS.MAX_NEW_SKILLS_COUNT) {
      issues.push({
        type: 'medium',
        category: 'skill_bloat',
        message: `${newSkills.length} new skills added may not be authentic`,
        location: 'Skills section',
        suggestion: 'Only add skills that can be backed by experience',
      });
    } else if (newSkills.length > 5) {
      warnings.push({
        type: 'caution',
        message: `${newSkills.length} new skills added: ${newSkills.slice(0, 5).join(', ')}...`,
      });
    }
    
    return { issues, warnings, inflationRate };
  }
  
  // ============================================================================
  // METRIC FABRICATION VALIDATION
  // ============================================================================
  
  private static validateMetricFabrication(
    original: ResumeData,
    optimized: ResumeData
  ): { issues: ValidationIssue[]; warnings: ValidationWarning[] } {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    
    const originalText = this.resumeToText(original);
    const optimizedText = this.resumeToText(optimized);
    
    // Find new metrics in optimized version
    const originalMetrics = this.extractMetricStrings(originalText);
    const optimizedMetrics = this.extractMetricStrings(optimizedText);
    
    const newMetrics = optimizedMetrics.filter(m => !originalMetrics.includes(m));
    
    // Check for suspicious fabricated metrics
    const suspiciousMetrics: string[] = [];
    
    for (const metric of newMetrics) {
      // Check against known fabrication indicators
      if (FABRICATED_METRIC_INDICATORS.some(indicator => metric.includes(indicator))) {
        suspiciousMetrics.push(metric);
        continue;
      }
      
      // Check for unrealistic percentages
      const percentMatch = metric.match(/(\d+)%/);
      if (percentMatch) {
        const percent = parseInt(percentMatch[1]);
        if (percent >= 90 || percent === 50 || percent === 100) {
          suspiciousMetrics.push(metric);
        }
      }
      
      // Check for round numbers (often fabricated)
      if (/\b(1000|5000|10000|50000|100000)\b/.test(metric)) {
        suspiciousMetrics.push(metric);
      }
    }
    
    if (suspiciousMetrics.length > 0) {
      issues.push({
        type: 'critical',
        category: 'metric_fabrication',
        message: `Potentially fabricated metrics detected: ${suspiciousMetrics.slice(0, 3).join(', ')}`,
        suggestion: 'Remove or replace with authentic metrics from original resume',
      });
    }
    
    // Check for experience inflation
    const originalYears = this.extractYearsExperience(originalText);
    const optimizedYears = this.extractYearsExperience(optimizedText);
    
    if (optimizedYears > originalYears && originalYears > 0) {
      issues.push({
        type: 'critical',
        category: 'metric_fabrication',
        message: `Experience years inflated from ${originalYears} to ${optimizedYears}`,
        suggestion: 'Do not modify years of experience',
      });
    }
    
    return { issues, warnings };
  }
  
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  
  private static extractAllBullets(resume: ResumeData): string[] {
    const bullets: string[] = [];
    
    resume.workExperience?.forEach(exp => {
      exp.bullets?.forEach(b => bullets.push(b));
    });
    
    resume.projects?.forEach(proj => {
      proj.bullets?.forEach(b => bullets.push(b));
    });
    
    return bullets;
  }
  
  private static extractMetrics(resume: ResumeData): { value: string; context: string }[] {
    const metrics: { value: string; context: string }[] = [];
    const metricPattern = /(\d+(?:\.\d+)?%|\$\d+(?:,\d{3})*(?:\.\d+)?[KMB]?|\d+(?:,\d{3})*\+?(?:\s*(?:users?|customers?|clients?|projects?|team|people|million|k\b)))/gi;
    
    const bullets = this.extractAllBullets(resume);
    
    for (const bullet of bullets) {
      const matches = bullet.match(metricPattern) || [];
      matches.forEach(m => metrics.push({ value: m, context: bullet }));
    }
    
    return metrics;
  }
  
  private static extractMetricStrings(text: string): string[] {
    const metricPattern = /\d+(?:\.\d+)?%|\$\d+(?:,\d{3})*(?:\.\d+)?[KMB]?|\d+(?:,\d{3})*\+?\s*(?:users?|customers?|clients?|projects?|team|people|million|k\b)/gi;
    return text.match(metricPattern) || [];
  }
  
  private static extractYearsExperience(text: string): number {
    const patterns = [
      /(\d+)\+?\s*years?\s*(?:of\s*)?experience/gi,
      /experience\s*:?\s*(\d+)\+?\s*years?/gi,
    ];
    
    let maxYears = 0;
    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        const years = parseInt(match[1]);
        if (years > maxYears) maxYears = years;
      }
    }
    
    return maxYears;
  }
  
  private static extractAllSkills(resume: ResumeData): Set<string> {
    const skills = new Set<string>();
    
    resume.skills?.forEach(category => {
      category.list?.forEach(skill => skills.add(skill.toLowerCase()));
    });
    
    return skills;
  }
  
  private static extractTechKeywords(text: string): string[] {
    const techPattern = /\b(javascript|typescript|python|java|c\+\+|c#|go|rust|ruby|php|react|angular|vue|node|express|django|flask|spring|mysql|postgresql|mongodb|redis|aws|azure|gcp|docker|kubernetes|terraform|jenkins|git|sql|api|rest|graphql|agile|scrum|ci\/cd|machine learning|tensorflow|pytorch)\b/gi;
    return text.match(techPattern) || [];
  }
  
  private static getSectionNames(resume: ResumeData): string[] {
    const sections: string[] = [];
    
    if (resume.workExperience?.length) sections.push('experience');
    if (resume.education?.length) sections.push('education');
    if (resume.skills?.length) sections.push('skills');
    if (resume.projects?.length) sections.push('projects');
    if (resume.certifications?.length) sections.push('certifications');
    if (resume.summary) sections.push('summary');
    
    return sections;
  }
  
  private static resumeToText(resume: ResumeData): string {
    const parts: string[] = [];
    
    if (resume.name) parts.push(resume.name);
    if (resume.summary) parts.push(resume.summary);
    if (resume.careerObjective) parts.push(resume.careerObjective);
    
    resume.workExperience?.forEach(exp => {
      parts.push(`${exp.role} at ${exp.company}`);
      exp.bullets?.forEach(b => parts.push(b));
    });
    
    resume.projects?.forEach(proj => {
      parts.push(proj.title);
      proj.bullets?.forEach(b => parts.push(b));
    });
    
    resume.skills?.forEach(cat => {
      parts.push(cat.list?.join(' ') || '');
    });
    
    resume.education?.forEach(edu => {
      parts.push(`${edu.degree} ${edu.school}`);
    });
    
    return parts.join(' ');
  }
  
  private static calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 3));
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
    const intersection = [...words1].filter(w => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;
    
    return intersection / union;
  }
  
  private static isEquivalentMetric(m1: string, m2: string): boolean {
    // Extract numeric values
    const num1 = m1.match(/\d+(?:\.\d+)?/)?.[0];
    const num2 = m2.match(/\d+(?:\.\d+)?/)?.[0];
    
    if (!num1 || !num2) return false;
    
    // Allow 10% variance
    const n1 = parseFloat(num1);
    const n2 = parseFloat(num2);
    
    return Math.abs(n1 - n2) / Math.max(n1, n2) <= 0.1;
  }
  
  private static calculateValidationScore(
    metrics: ValidationMetrics,
    issues: ValidationIssue[]
  ): number {
    let score = 100;
    
    // Deduct for authenticity issues
    score -= (100 - metrics.authenticityScore) * 0.3;
    
    // Deduct for metric preservation issues
    score -= (100 - metrics.metricPreservationRate) * 0.25;
    
    // Deduct for keyword stuffing
    if (metrics.keywordDensity > THRESHOLDS.MAX_TOTAL_KEYWORD_DENSITY) {
      score -= 15;
    }
    
    // Deduct for skill inflation
    if (metrics.skillInflationRate > THRESHOLDS.MAX_SKILL_INCREASE_RATIO) {
      score -= 20;
    }
    
    // Deduct for issues
    for (const issue of issues) {
      switch (issue.type) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 8; break;
        case 'low': score -= 3; break;
      }
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const optimizerValidation = OptimizerValidationService;
export default OptimizerValidationService;
