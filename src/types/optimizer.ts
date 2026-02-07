/**
 * Enhanced JD-Based Resume Optimizer Types
 * Uses the same 220+ metrics framework as the ATS Score Checker
 */

import {
  ResumeData,
  TierScores,
  CriticalMetrics,
  RedFlag,
  MissingKeyword,
  EnhancedComprehensiveScore,
} from './resume';

// ============================================================================
// OPTIMIZATION MODES
// ============================================================================

export type OptimizationMode = 'light' | 'standard' | 'aggressive';

export interface OptimizationModeConfig {
  addMissingKeywords: boolean;
  rewriteBullets: boolean;
  restructureSections: boolean;
  generateSummary: boolean;
  maxChangesPerSection: number;
}

export const OPTIMIZATION_MODES: Record<OptimizationMode, OptimizationModeConfig> = {
  light: {
    addMissingKeywords: true,
    rewriteBullets: false,
    restructureSections: false,
    generateSummary: false,
    maxChangesPerSection: 2,
  },
  standard: {
    addMissingKeywords: true,
    rewriteBullets: true,
    restructureSections: false,
    generateSummary: true,
    maxChangesPerSection: 5,
  },
  aggressive: {
    addMissingKeywords: true,
    rewriteBullets: true,
    restructureSections: true,
    generateSummary: true,
    maxChangesPerSection: 10,
  },
};


// ============================================================================
// GAP ANALYSIS TYPES
// ============================================================================

export interface FailingMetric {
  metricId: number;
  metricName: string;
  currentValue: string;
  expectedValue: string;
  impact: number;
  recommendation: string;
}

export interface TierGap {
  tierNumber: number;
  tierName: string;
  currentScore: number;
  maxScore: number;
  percentage: number;
  weight: number;
  failingMetrics: FailingMetric[];
}

export interface Big5Gap {
  metric: 'jd_keywords_match' | 'technical_skills_alignment' | 'quantified_results_presence' | 'job_title_relevance' | 'experience_relevance';
  metricName: string;
  currentScore: number;
  maxScore: number;
  gap: number;
  priority: 'critical' | 'high' | 'medium';
  improvements: string[];
}

export interface Improvement {
  priority: number;
  tier: number;
  tierName: string;
  metricName: string;
  impact: number;
  recommendation: string;
  isBig5: boolean;
}

export interface GapAnalysisResult {
  beforeScore: EnhancedComprehensiveScore;
  tierGaps: TierGap[];
  big5Gaps: Big5Gap[];
  prioritizedImprovements: Improvement[];
  redFlags: RedFlag[];
  missingKeywords: MissingKeyword[];
}

// ============================================================================
// OPTIMIZATION RESULT TYPES
// ============================================================================

export interface TierComparison {
  tierNumber: number;
  tierName: string;
  beforeScore: number;
  afterScore: number;
  improvement: number;
  metricsImproved: number;
}

export interface Big5Improvement {
  metric: string;
  metricName: string;
  beforeScore: number;
  afterScore: number;
  improvement: number;
  changesApplied: string[];
}

export type ChangeType = 'added' | 'modified' | 'rewritten' | 'reordered' | 'removed' | 'cleaned';

export interface SectionChange {
  section: string;
  changeType: ChangeType;
  description: string;
  before?: string;
  after?: string;
}

// ============================================================================
// USER ACTION REQUIRED TYPES
// ============================================================================

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

export interface Parameter16Score {
  parameter: string;
  parameterNumber: number;
  score: number;
  maxScore: number;
  percentage: number;
  suggestions: string[];
}

export interface Parameter16Scores {
  beforeScores?: Parameter16Score[];
  afterScores?: Parameter16Score[];
  overallBefore?: number;
  overallAfter?: number;
  improvement?: number;
}

export interface OptimizationResult {
  // Optimized resume
  optimizedResume: ResumeData;
  
  // Scores
  beforeScore: EnhancedComprehensiveScore;
  afterScore: EnhancedComprehensiveScore;
  scoreImprovement: number;
  
  // Tier comparisons (all 10 tiers)
  tierComparison: TierComparison[];
  
  // Big 5 improvements
  big5Improvements: Big5Improvement[];
  
  // Changes made
  changesBySection: SectionChange[];
  totalChanges: number;
  
  // Keywords
  keywordsAdded: string[];
  keywordMatchBefore: number;
  keywordMatchAfter: number;
  
  // Red flags
  redFlagsFixed: string[];
  redFlagsRemaining: string[];
  
  // Metadata
  optimizationMode: OptimizationMode;
  processingTime: number;
  
  // NEW: User actions required to reach 90%+ score
  userActionsRequired?: UserActionRequired[];
  
  // NEW: 16-Parameter optimization scores
  parameter16Scores?: Parameter16Scores;
}

// ============================================================================
// OPTIMIZER INPUT TYPES
// ============================================================================

export interface OptimizerInput {
  resumeData: ResumeData;
  jobDescription: string;
  targetRole?: string;
  mode: OptimizationMode;
}

export interface TierOptimizerInput {
  resumeData: ResumeData;
  gap: TierGap;
  jobDescription: string;
  missingKeywords: MissingKeyword[];
  mode: OptimizationMode;
  modeConfig: OptimizationModeConfig;
}

export interface TierOptimizerResult {
  changes: SectionChange[];
  updatedData: Partial<ResumeData>;
  metricsImproved: string[];
}
