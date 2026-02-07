// src/types/pipeline.ts
// Core types for the 8-step resume optimization pipeline

import { ResumeData } from './resume';

export enum PipelineStep {
  PARSE_RESUME = 1,
  ANALYZE_AGAINST_JD = 2,
  MISSING_SECTIONS_MODAL = 3,
  PROJECT_ANALYSIS = 4,
  RE_ANALYSIS = 5,
  BULLET_REWRITING = 6,
  FINAL_OPTIMIZATION = 7,
  OUTPUT_RESUME = 8
}

export interface PipelineState {
  sessionId: string;
  userId: string;
  currentStep: PipelineStep;
  completedSteps: PipelineStep[];
  failedSteps: PipelineStep[];
  userInputRequired: boolean;
  errorMessages: string[];
  progressPercentage: number;
  startTime: Date;
  lastUpdated: Date;
}

export interface StepExecution {
  step: PipelineStep;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  retryCount: number;
}

export interface ResumeVersion {
  version: number;
  step: PipelineStep;
  data: ResumeData;
  timestamp: Date;
  changes: string[];
}

export interface PipelineExecutionContext {
  sessionId: string;
  userId: string;
  startTime: Date;
  currentStep: PipelineStep;
  stepHistory: StepExecution[];
  resumeVersions: ResumeVersion[];
  userInputs: UserInputRecord[];
  errorLog: ErrorRecord[];
  jobDescription: string;
  targetRole: string;
}

export interface UserInputRecord {
  step: PipelineStep;
  timestamp: Date;
  inputType: string;
  data: any;
}

export interface ErrorRecord {
  step: PipelineStep;
  timestamp: Date;
  error: string;
  stackTrace?: string;
  retryAttempt: number;
}

export interface StepResult {
  success: boolean;
  data?: any;
  error?: string;
  nextStep?: PipelineStep;
  userInputRequired?: boolean;
  progressUpdate?: number;
}

export interface ProgressIndicator {
  currentStep: PipelineStep;
  totalSteps: number;
  stepName: string;
  stepDescription: string;
  percentageComplete: number;
  estimatedTimeRemaining?: number;
  userActionRequired: boolean;
  actionDescription?: string;
}

export interface ErrorRecoveryStrategy {
  errorType: string;
  retryAttempts: number;
  fallbackOptions: string[];
  userNotification: string;
  progressPreservation: boolean;
}

// Step-specific result types
export interface ParseResumeResult extends StepResult {
  data?: {
    resumeData: ResumeData;
    missingSections: string[];
    parsingConfidence: number;
  };
}

export interface AnalysisResult extends StepResult {
  data?: {
    gapAnalysis: any;
    beforeScore: any;
    criticalIssues: string[];
    recommendations: string[];
  };
}

export interface MissingSectionsResult extends StepResult {
  data?: {
    providedSections: any;
    updatedResume: ResumeData;
    remainingMissingSections: string[];
  };
}

export interface ProjectAnalysisResult extends StepResult {
  data?: {
    projectRecommendations: any[];
    alignmentScores: number[];
    suggestedChanges: string[];
  };
}

export interface BulletRewritingResult extends StepResult {
  data?: {
    rewrittenBullets: string[];
    improvementCount: number;
    formatCompliance: boolean;
  };
}

export interface FinalOptimizationResult extends StepResult {
  data?: {
    optimizedResume: ResumeData;
    keywordsAdded: string[];
    summaryGenerated: string;
    atsScore: number;
  };
}

export interface OutputResult extends StepResult {
  data?: {
    finalResume: ResumeData;
    beforeAfterComparison: any;
    userActionsRequired: any[];
    exportOptions: any[];
  };
}

// Pipeline configuration
export const PIPELINE_CONFIG = {
  STEP_NAMES: {
    [PipelineStep.PARSE_RESUME]: 'Parse Resume',
    [PipelineStep.ANALYZE_AGAINST_JD]: 'Analyze Against Job Description',
    [PipelineStep.MISSING_SECTIONS_MODAL]: 'Complete Missing Sections',
    [PipelineStep.PROJECT_ANALYSIS]: 'Analyze Projects',
    [PipelineStep.RE_ANALYSIS]: 'Re-analyze After Changes',
    [PipelineStep.BULLET_REWRITING]: 'Rewrite Bullet Points',
    [PipelineStep.FINAL_OPTIMIZATION]: 'Final Optimization',
    [PipelineStep.OUTPUT_RESUME]: 'Generate Optimized Resume'
  },
  STEP_DESCRIPTIONS: {
    [PipelineStep.PARSE_RESUME]: 'Extracting information from your resume using AI',
    [PipelineStep.ANALYZE_AGAINST_JD]: 'Analyzing your resume against the job description using 220+ metrics',
    [PipelineStep.MISSING_SECTIONS_MODAL]: 'Please provide any missing information to complete your resume',
    [PipelineStep.PROJECT_ANALYSIS]: 'Analyzing your projects for alignment with job requirements',
    [PipelineStep.RE_ANALYSIS]: 'Re-analyzing your updated projects for better alignment',
    [PipelineStep.BULLET_REWRITING]: 'Rewriting bullet points with action verbs and quantified results',
    [PipelineStep.FINAL_OPTIMIZATION]: 'Applying final optimizations and adding missing keywords',
    [PipelineStep.OUTPUT_RESUME]: 'Generating your optimized resume with 90%+ ATS score'
  },
  TOTAL_STEPS: 8,
  MAX_RETRY_ATTEMPTS: 3,
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  PROGRESS_WEIGHTS: {
    [PipelineStep.PARSE_RESUME]: 15,
    [PipelineStep.ANALYZE_AGAINST_JD]: 15,
    [PipelineStep.MISSING_SECTIONS_MODAL]: 10,
    [PipelineStep.PROJECT_ANALYSIS]: 15,
    [PipelineStep.RE_ANALYSIS]: 10,
    [PipelineStep.BULLET_REWRITING]: 15,
    [PipelineStep.FINAL_OPTIMIZATION]: 15,
    [PipelineStep.OUTPUT_RESUME]: 5
  }
};

// Error recovery strategies
export const ERROR_RECOVERY_STRATEGIES: Record<string, ErrorRecoveryStrategy> = {
  'parsing_failure': {
    errorType: 'parsing_failure',
    retryAttempts: 3,
    fallbackOptions: ['manual_text_input', 'different_file_format'],
    userNotification: 'Unable to parse resume. Please try a different format or enter text manually.',
    progressPreservation: true
  },
  'authentication_error': {
    errorType: 'authentication_error',
    retryAttempts: 1,
    fallbackOptions: ['check_api_key', 'contact_support'],
    userNotification: 'API authentication failed. Please check your configuration.',
    progressPreservation: true
  },
  'file_format_error': {
    errorType: 'file_format_error',
    retryAttempts: 1,
    fallbackOptions: ['different_file_format', 'manual_text_input'],
    userNotification: 'Unsupported file format. Please upload a PDF, DOCX, or TXT file.',
    progressPreservation: true
  },
  'analysis_timeout': {
    errorType: 'analysis_timeout',
    retryAttempts: 2,
    fallbackOptions: ['simplified_analysis', 'manual_review'],
    userNotification: 'Analysis is taking longer than expected. Trying simplified approach.',
    progressPreservation: true
  },
  'network_error': {
    errorType: 'network_error',
    retryAttempts: 3,
    fallbackOptions: ['offline_mode', 'retry_later'],
    userNotification: 'Network connection issue. Retrying automatically.',
    progressPreservation: true
  },
  'validation_error': {
    errorType: 'validation_error',
    retryAttempts: 1,
    fallbackOptions: ['user_correction', 'skip_validation'],
    userNotification: 'Please correct the highlighted fields and try again.',
    progressPreservation: true
  }
};