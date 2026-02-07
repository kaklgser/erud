/**
 * Enhanced Scoring Service - Orchestrates 220+ Metrics ATS Score Checker
 * Integrates all 10 tier analyzers and calculates comprehensive scores
 */

import {
  ResumeData,
  ExtractionMode,
  TierScores,
  TierScore,
  CriticalMetrics,
  CriticalMetricScore,
  EnhancedComprehensiveScore,
  RedFlag,
  MissingKeyword,
  MatchBand,
  ConfidenceLevel,
  ProcessedDocument,
  ParsingQuality,
} from '../types/resume';

import { BasicStructureAnalyzer, BasicStructureInput } from './analyzers/basicStructureAnalyzer';
import { ContentStructureAnalyzer } from './analyzers/contentStructureAnalyzer';
import { ExperienceAnalyzer } from './analyzers/experienceAnalyzer';
import { EducationAnalyzer } from './analyzers/educationAnalyzer';
import { CertificationsAnalyzer } from './analyzers/certificationsAnalyzer';
import { SkillsKeywordsAnalyzer } from './analyzers/skillsKeywordsAnalyzer';
import { ProjectsAnalyzer } from './analyzers/projectsAnalyzer';
import { RedFlagDetector } from './analyzers/redFlagDetector';
import { CompetitiveAnalyzer } from './analyzers/competitiveAnalyzer';
import { CultureFitAnalyzer } from './analyzers/cultureFitAnalyzer';
import { QualitativeAnalyzer } from './analyzers/qualitativeAnalyzer';
import { ScoreMapperService } from './scoreMapperService';
import { enhancedDocumentProcessor } from './enhancedDocumentProcessor';
import { parsingMetricsService } from './parsingMetricsService';
import { 
  detectCandidateLevel, 
  CandidateLevel 
} from './resumeScoringFixes';
import {
  assessInputQuality,
  applyNormalizedWeights,
  calculateAdjustedScore,
  calculateAlignedConfidence,
  getAlignedMatchBand,
  getAlignedInterviewProbability,
  InputQualityAssessment,
} from './normalModeScoring';

// ============================================================================
// TYPES
// ============================================================================

export interface EnhancedScoringInput {
  resumeText: string;
  resumeData?: ResumeData;
  jobDescription?: string;
  extractionMode: ExtractionMode;
  filename?: string;
  pageCount?: number;
  fileSize?: number;
  hasImages?: boolean;
  hasTables?: boolean;
  hasMultipleColumns?: boolean;
  hasColors?: boolean;
  hasGraphics?: boolean;
  userType?: 'fresher' | 'experienced' | 'student';
  // Enhanced parsing fields
  file?: File;
  processedDocument?: ProcessedDocument;
  parsingQuality?: ParsingQuality;
  parsingWarnings?: string[];
}

// ============================================================================
// ENHANCED SCORING SERVICE
// ============================================================================

export class EnhancedScoringService {
  
  /**
   * Enhanced document processing and scoring with ATS parsing capabilities
   */
  static async processAndScore(
    file: File,
    resumeData?: ResumeData,
    jobDescription?: string,
    userType?: 'fresher' | 'experienced' | 'student'
  ): Promise<EnhancedComprehensiveScore> {
    const startTime = Date.now();
    
    try {
      // Step 1: Process document with enhanced parsing
      const processedDocument = await enhancedDocumentProcessor.processDocument(file);
      
      // Step 2: Record parsing metrics
      parsingMetricsService.recordParsingSession({
        fileName: file.name,
        fileSize: file.size,
        documentFormat: enhancedDocumentProcessor.detectFormat(file),
        extractionMode: processedDocument.extractionMode,
        layoutComplexity: processedDocument.layoutStructure.complexity,
        processingTime: Date.now() - startTime,
        success: processedDocument.extractedText.length > 50,
        parsingQuality: processedDocument.parsingQuality,
        confidence: processedDocument.confidence,
        warnings: processedDocument.warnings.map(w => ({
          type: 'parsing' as const,
          severity: 'warning' as const,
          message: w
        })),
        errors: processedDocument.warnings.filter(w => w.includes('failed') || w.includes('error')),
        fallbackUsed: processedDocument.warnings.some(w => w.includes('fallback'))
      });
      
      // Step 3: Create enhanced scoring input
      const enhancedInput: EnhancedScoringInput = {
        resumeText: processedDocument.extractedText,
        resumeData,
        jobDescription,
        extractionMode: processedDocument.extractionMode,
        filename: file.name,
        pageCount: 1, // Could be extracted from processedDocument in future
        fileSize: file.size,
        hasImages: false, // Could be detected from layout structure
        hasTables: processedDocument.layoutStructure.tables.length > 0,
        hasMultipleColumns: processedDocument.layoutStructure.columns.columnCount > 1,
        hasColors: false, // Could be detected in future
        hasGraphics: false, // Could be detected in future
        userType,
        file,
        processedDocument,
        parsingQuality: processedDocument.parsingQuality,
        parsingWarnings: processedDocument.warnings
      };
      
      // Step 4: Calculate comprehensive score with enhanced data
      const score = await this.calculateScore(enhancedInput);
      
      // Step 5: Enhance score with parsing information
      return this.enhanceScoreWithParsingData(score, processedDocument);
      
    } catch (error) {
      console.error('Enhanced processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Fallback to basic scoring
      const basicInput: EnhancedScoringInput = {
        resumeText: resumeData ? this.extractBasicText(resumeData) : '',
        resumeData,
        jobDescription,
        extractionMode: 'TEXT',
        filename: file.name,
        fileSize: file.size,
        userType,
        parsingWarnings: [`Processing failed: ${errorMessage}`]
      };
      
      return this.calculateScore(basicInput);
    }
  }
  
  /**
   * Calculate comprehensive score using 220+ metrics
   */
  static async calculateScore(input: EnhancedScoringInput): Promise<EnhancedComprehensiveScore> {
    const { resumeText, resumeData, jobDescription, extractionMode } = input;

    // =========================================================================
    // FIX: Input Quality Assessment (prevents static fallback scoring)
    // =========================================================================
    const inputQuality = assessInputQuality({
      resumeText,
      resumeData,
      userType: input.userType,
    });
    
    console.log('[EnhancedScoringService] Input Quality:', inputQuality.quality, 
      '| Score:', inputQuality.qualityScore, 
      '| Valid:', inputQuality.isValid);
    
    // If input is invalid, return a low score with clear feedback
    if (!inputQuality.isValid) {
      return this.createInvalidInputScore(inputQuality, extractionMode);
    }

    // =========================================================================
    // FIX: Detect Candidate Level for Weight Normalization
    // =========================================================================
    const candidateLevelResult = detectCandidateLevel(resumeText, {
      workExperience: resumeData?.workExperience,
      education: resumeData?.education,
      projects: resumeData?.projects,
      certifications: resumeData?.certifications,
    });
    
    console.log('[EnhancedScoringService] Candidate Level:', candidateLevelResult.level,
      '| Confidence:', candidateLevelResult.confidence,
      '| Signals:', candidateLevelResult.signals.slice(0, 2));

    // =========================================================================
    // TIER 1: Basic Structure Analysis (20 metrics)
    // =========================================================================
    let basicStructureResult;
    try {
      const basicStructureInput: BasicStructureInput = {
        resumeText,
        extractionMode,
        filename: input.filename,
        pageCount: input.pageCount,
        fileSize: input.fileSize,
        hasImages: input.hasImages,
        hasTables: input.hasTables,
        hasMultipleColumns: input.hasMultipleColumns,
        hasColors: input.hasColors,
        hasGraphics: input.hasGraphics,
      };
      basicStructureResult = BasicStructureAnalyzer.analyze(basicStructureInput);
    } catch (error) {
      console.error('[EnhancedScoringService] Basic structure analysis failed:', error);
      basicStructureResult = this.createFallbackTierResult('Basic Structure', 1, 20);
    }

    // =========================================================================
    // TIER 2: Content Structure Analysis (25 metrics)
    // =========================================================================
    let contentStructureResult;
    try {
      contentStructureResult = ContentStructureAnalyzer.analyze({
        resumeText,
        resumeData,
      });
    } catch (error) {
      console.error('[EnhancedScoringService] Content structure analysis failed:', error);
      contentStructureResult = this.createFallbackTierResult('Content Structure', 2, 25);
    }

    // =========================================================================
    // Detect Job Role Type FIRST (before experience analysis)
    // =========================================================================
    const isFresherRole = this.detectFresherRole(resumeData, jobDescription, input.userType);

    // =========================================================================
    // TIER 3: Experience Analysis (35 metrics) - CONDITIONAL
    // =========================================================================
    let experienceResult;
    try {
      if (isFresherRole) {
        // For fresher roles, create a neutral experience result without penalties
        experienceResult = this.createFresherExperienceResult();
      } else {
        // For experienced roles, run full experience analysis
        experienceResult = ExperienceAnalyzer.analyze({
          resumeText,
          resumeData,
          jobDescription,
          targetRole: resumeData?.targetRole,
        });
      }
    } catch (error) {
      console.error('[EnhancedScoringService] Experience analysis failed:', error);
      experienceResult = this.createFallbackTierResult('Experience', 3, 35);
    }

    // =========================================================================
    // TIER 5: Skills & Keywords Analysis (40 metrics)
    // =========================================================================
    let skillsKeywordsResult;
    try {
      skillsKeywordsResult = SkillsKeywordsAnalyzer.analyze({
        resumeText,
        resumeData,
        jobDescription,
      });
    } catch (error) {
      console.error('[EnhancedScoringService] Skills analysis failed:', error);
      skillsKeywordsResult = this.createFallbackTierResult('Skills & Keywords', 5, 40);
    }

    // =========================================================================
    // TIER 4a: Education Analysis (12 metrics)
    // =========================================================================
    let educationResult;
    try {
      educationResult = EducationAnalyzer.analyze({
        resumeText,
        resumeData,
        jobDescription,
      });
    } catch (error) {
      console.error('[EnhancedScoringService] Education analysis failed:', error);
      educationResult = this.createFallbackTierResult('Education', 4, 12);
    }

    // =========================================================================
    // TIER 4b: Certifications Analysis (8 metrics)
    // =========================================================================
    let certificationsResult;
    try {
      certificationsResult = CertificationsAnalyzer.analyze({
        resumeText,
        resumeData,
        jobDescription,
      });
    } catch (error) {
      console.error('[EnhancedScoringService] Certifications analysis failed:', error);
      certificationsResult = this.createFallbackTierResult('Certifications', 4, 8);
    }

    // =========================================================================
    // TIER 6: Projects Analysis (15 metrics)
    // =========================================================================
    let projectsResult;
    try {
      projectsResult = ProjectsAnalyzer.analyze({
        resumeText,
        resumeData,
        jobDescription,
      });
    } catch (error) {
      console.error('[EnhancedScoringService] Projects analysis failed:', error);
      projectsResult = this.createFallbackTierResult('Projects', 6, 15);
    }

    // =========================================================================
    // TIER 7: Red Flag Detection (30 metrics)
    // =========================================================================
    let redFlagResult;
    try {
      redFlagResult = RedFlagDetector.analyze({
        resumeText,
        resumeData,
        jobDescription,
      });
    } catch (error) {
      console.error('[EnhancedScoringService] Red flag analysis failed:', error);
      const fallbackResult = this.createFallbackTierResult('Red Flags', 7, 30);
      redFlagResult = {
        tierScore: fallbackResult.tierScore,
        redFlags: [],
        totalPenalty: 0,
        autoRejectRisk: false,
      };
    }

    // =========================================================================
    // TIER 8: Competitive Analysis (15 metrics)
    // =========================================================================
    let competitiveResult;
    try {
      competitiveResult = CompetitiveAnalyzer.analyze({
        resumeText,
        resumeData,
        jobDescription,
      });
    } catch (error) {
      console.error('[EnhancedScoringService] Competitive analysis failed:', error);
      competitiveResult = this.createFallbackTierResult('Competitive', 8, 15);
    }

    // =========================================================================
    // TIER 9: Culture Fit Analysis (20 metrics)
    // =========================================================================
    let cultureFitResult;
    try {
      cultureFitResult = CultureFitAnalyzer.analyze({
        resumeText,
        resumeData,
        jobDescription,
      });
    } catch (error) {
      console.error('[EnhancedScoringService] Culture fit analysis failed:', error);
      cultureFitResult = this.createFallbackTierResult('Culture Fit', 9, 20);
    }

    // =========================================================================
    // TIER 10: Qualitative Analysis (10 metrics)
    // =========================================================================
    let qualitativeResult;
    try {
      qualitativeResult = QualitativeAnalyzer.analyze({
        resumeText,
        resumeData,
        jobDescription,
      });
    } catch (error) {
      console.error('[EnhancedScoringService] Qualitative analysis failed:', error);
      qualitativeResult = this.createFallbackTierResult('Qualitative', 10, 10);
    }

    // =========================================================================
    // Build Tier Scores (separate Education & Certifications)
    // =========================================================================
    let tierScores: TierScores = {
      basic_structure: basicStructureResult.tierScore,
      content_structure: contentStructureResult.tierScore,
      experience: experienceResult.tierScore, // Already adjusted for role type
      education: educationResult.tierScore,
      certifications: certificationsResult.tierScore,
      skills_keywords: skillsKeywordsResult.tierScore,
      projects: projectsResult.tierScore,
      red_flags: redFlagResult.tierScore,
      competitive: competitiveResult.tierScore,
      culture_fit: cultureFitResult.tierScore,
      qualitative: qualitativeResult.tierScore,
    };

    // Adjust tier weights based on role type
    tierScores = this.adjustTierWeightsForRole(tierScores, isFresherRole);
    
    // =========================================================================
    // FIX: Apply Candidate Level Normalization
    // =========================================================================
    tierScores = applyNormalizedWeights(tierScores, candidateLevelResult.level);

    // =========================================================================
    // Calculate Big 5 Critical Metrics
    // =========================================================================
    const criticalMetrics = this.calculateCriticalMetrics(
      resumeText,
      resumeData,
      jobDescription,
      skillsKeywordsResult.keywordMatchRate
    );

    // =========================================================================
    // Calculate Final Score
    // =========================================================================
    const scoreResult = ScoreMapperService.mapScore(tierScores, redFlagResult.redFlags);
    
    // =========================================================================
    // FIX: Apply Quality-Based Score Adjustment
    // =========================================================================
    const scoreAdjustment = calculateAdjustedScore(
      scoreResult.finalScore,
      inputQuality,
      candidateLevelResult.level
    );
    
    const adjustedFinalScore = scoreAdjustment.finalScore;
    
    // =========================================================================
    // FIX: Calculate Aligned Confidence (matches score bands)
    // =========================================================================
    const alignedConfidence = calculateAlignedConfidence(
      adjustedFinalScore,
      inputQuality,
      !!jobDescription
    );
    
    const alignedMatchBand = getAlignedMatchBand(adjustedFinalScore);
    const alignedInterviewProbability = getAlignedInterviewProbability(adjustedFinalScore);
    
    console.log('[EnhancedScoringService] Score Adjustment:', 
      'Base:', scoreResult.finalScore,
      '→ Adjusted:', adjustedFinalScore,
      '| Confidence:', alignedConfidence,
      '| Band:', alignedMatchBand);

    // =========================================================================
    // Build Enhanced Comprehensive Score
    // =========================================================================
    const enhancedScore: EnhancedComprehensiveScore = {
      // Base ComprehensiveScore fields
      overall: adjustedFinalScore,
      match_band: alignedMatchBand,
      interview_probability_range: alignedInterviewProbability,
      confidence: alignedConfidence,
      rubric_version: '2.0-220metrics',
      weighting_mode: jobDescription ? 'JD' : 'GENERAL',
      extraction_mode: extractionMode,
      trimmed: false,
      job_title: resumeData?.targetRole,
      breakdown: this.buildAdaptiveBreakdown(tierScores, resumeData, jobDescription),
      missing_keywords: skillsKeywordsResult.missingKeywords.map((k: any) => k.keyword),
      actions: this.generateActions(tierScores, redFlagResult.redFlags, skillsKeywordsResult.missingKeywords),
      example_rewrites: this.generateExampleRewrites(resumeData),
      notes: this.generateNotes(tierScores, { autoRejectRisk: redFlagResult.autoRejectRisk }),
      analysis: this.generateAnalysis(scoreResult, tierScores, criticalMetrics),
      keyStrengths: this.identifyStrengths(tierScores),
      improvementAreas: this.identifyImprovements(tierScores),
      recommendations: this.generateRecommendations(tierScores, redFlagResult.redFlags),

      // Enhanced fields
      tier_scores: tierScores,
      critical_metrics: criticalMetrics,
      red_flags: redFlagResult.redFlags,
      red_flag_penalty: scoreResult.totalPenalty,
      auto_reject_risk: scoreResult.autoRejectRisk,
      missing_keywords_enhanced: skillsKeywordsResult.missingKeywords,
      section_order_issues: contentStructureResult.orderIssues,
      format_issues: basicStructureResult.formatIssues,
    };

    return enhancedScore;
  }

  // ============================================================================
  // INVALID INPUT HANDLING
  // ============================================================================

  /**
   * Create a score result for invalid/empty inputs
   * CRITICAL FIX: Returns appropriate low score instead of static ~54
   */
  private static createInvalidInputScore(
    inputQuality: InputQualityAssessment,
    extractionMode: ExtractionMode
  ): EnhancedComprehensiveScore {
    // Calculate a score based on what little content exists
    let baseScore = inputQuality.qualityScore * 0.4; // Max 40 for invalid input
    
    // Add small bonuses for any detected content
    const { contentMetrics } = inputQuality;
    if (contentMetrics.hasContactInfo) baseScore += 3;
    if (contentMetrics.hasSkills) baseScore += 5;
    if (contentMetrics.hasEducation) baseScore += 3;
    if (contentMetrics.wordCount > 100) baseScore += 5;
    
    const finalScore = Math.max(0, Math.min(35, Math.round(baseScore))); // Cap at 35 for invalid
    
    return {
      overall: finalScore,
      match_band: 'Very Poor',
      interview_probability_range: '0-3%',
      confidence: 'Low',
      rubric_version: '2.0-220metrics',
      weighting_mode: 'GENERAL',
      extraction_mode: extractionMode,
      trimmed: false,
      job_title: undefined,
      breakdown: [],
      missing_keywords: [],
      actions: [
        'Resume appears incomplete or invalid',
        ...inputQuality.issues.slice(0, 3),
        'Please upload a complete resume with standard sections',
      ],
      example_rewrites: {},
      notes: [
        '⚠️ Input Quality: ' + inputQuality.quality,
        `Word count: ${inputQuality.contentMetrics.wordCount}`,
        `Sections detected: ${inputQuality.contentMetrics.sectionCount}`,
      ],
      analysis: `Resume quality assessment: ${inputQuality.quality}. ${inputQuality.issues.join('. ')}`,
      keyStrengths: [],
      improvementAreas: inputQuality.issues,
      recommendations: [
        'Ensure resume has standard sections (Experience, Education, Skills)',
        'Add contact information (email, phone)',
        'Include relevant work experience or projects',
        'List technical and soft skills',
      ],
      tier_scores: {} as TierScores,
      critical_metrics: {
        jd_keywords_match: { score: 0, max_score: 5, percentage: 0, status: 'poor', details: 'Cannot assess' },
        technical_skills_alignment: { score: 0, max_score: 5, percentage: 0, status: 'poor', details: 'Cannot assess' },
        quantified_results_presence: { score: 0, max_score: 3, percentage: 0, status: 'poor', details: 'Cannot assess' },
        job_title_relevance: { score: 0, max_score: 3, percentage: 0, status: 'poor', details: 'Cannot assess' },
        experience_relevance: { score: 0, max_score: 3, percentage: 0, status: 'poor', details: 'Cannot assess' },
        total_critical_score: 0,
      },
      red_flags: [{
        type: 'formatting',
        id: 1,
        name: 'Incomplete Resume',
        severity: 'critical',
        description: 'Resume appears incomplete or improperly formatted',
        recommendation: 'Upload a complete resume with all standard sections',
        penalty: -20,
      }],
      red_flag_penalty: -20,
      auto_reject_risk: true,
      missing_keywords_enhanced: [],
      section_order_issues: inputQuality.issues.map((issue, idx) => ({
        section: 'general',
        currentPosition: idx,
        expectedPosition: 0,
        penalty: -2,
      })),
      format_issues: [{
        type: 'image' as const,
        description: 'Resume content is insufficient for proper analysis',
        severity: 'high' as const,
      }],
    };
  }

  // ============================================================================
  // CRITICAL METRICS CALCULATION
  // ============================================================================

  private static calculateCriticalMetrics(
    resumeText: string,
    resumeData: ResumeData | undefined,
    jobDescription: string | undefined,
    keywordMatchRate: number
  ): CriticalMetrics {
    // Big 5 Critical Metrics
    const jdKeywordsMatch = this.calculateJdKeywordsMatch(keywordMatchRate);
    const technicalSkillsAlignment = this.calculateTechnicalSkillsAlignment(resumeText, jobDescription);
    const quantifiedResultsPresence = this.calculateQuantifiedResults(resumeData);
    const jobTitleRelevance = this.calculateJobTitleRelevance(resumeData, jobDescription);
    const experienceRelevance = this.calculateExperienceRelevance(resumeData, jobDescription);

    // Calculate total with NaN protection
    const scores = [
      jdKeywordsMatch.score,
      technicalSkillsAlignment.score,
      quantifiedResultsPresence.score,
      jobTitleRelevance.score,
      experienceRelevance.score
    ].map(s => isNaN(s) ? 0 : s);
    
    const totalCriticalScore = scores.reduce((sum, s) => sum + s, 0);

    return {
      jd_keywords_match: jdKeywordsMatch,
      technical_skills_alignment: technicalSkillsAlignment,
      quantified_results_presence: quantifiedResultsPresence,
      job_title_relevance: jobTitleRelevance,
      experience_relevance: experienceRelevance,
      total_critical_score: Math.round(totalCriticalScore * 100) / 100,
    };
  }

  private static calculateJdKeywordsMatch(keywordMatchRate: number): CriticalMetricScore {
    // NaN protection
    const safeRate = isNaN(keywordMatchRate) ? 0 : keywordMatchRate;
    const score = (safeRate / 100) * 5;
    return {
      score: Math.round(score * 100) / 100,
      max_score: 5,
      percentage: safeRate,
      status: ScoreMapperService.getCriticalMetricStatus(safeRate),
      details: `${safeRate}% of JD keywords found in resume`,
    };
  }

  private static calculateTechnicalSkillsAlignment(resumeText: string, jobDescription?: string): CriticalMetricScore {
    if (!jobDescription) {
      return {
        score: 2.5,
        max_score: 5,
        percentage: 50,
        status: 'fair',
        details: 'No JD provided for comparison',
      };
    }

    // FIXED: Comprehensive technical keywords including Data Analyst skills
    const techKeywords = /javascript|typescript|python|java|react|angular|vue|node|aws|azure|docker|kubernetes|sql|mysql|postgresql|mongodb|tableau|power bi|excel|r|sas|spss|pandas|numpy|matplotlib|seaborn|plotly|jupyter|anaconda|hadoop|spark|kafka|airflow|dbt|snowflake|redshift|bigquery|looker|qlik|alteryx|stata|matlab|tensorflow|pytorch|scikit-learn|machine learning|data science|analytics|etl|data modeling|statistics|regression|classification|clustering|visualization|dashboard|reporting|bi|business intelligence|data warehouse|olap|oltp|nosql|redis|elasticsearch|cassandra|oracle|sqlite|mariadb|firebase|supabase|git|jira|agile|scrum|api|rest|graphql|json|xml|csv|parquet|avro|linux|unix|bash|powershell|docker|kubernetes|terraform|jenkins|ci\/cd|devops|cloud|gcp|google cloud|microsoft azure|amazon web services/gi;
    
    const jdTech = [...new Set((jobDescription.match(techKeywords) || []).map(t => t.toLowerCase()))];
    const resumeTech = [...new Set((resumeText.match(techKeywords) || []).map(t => t.toLowerCase()))];
    
    const matches = jdTech.filter(t => resumeTech.includes(t)).length;
    const percentage = jdTech.length > 0 ? (matches / jdTech.length) * 100 : 50;
    const score = (percentage / 100) * 5;

    return {
      score: Math.round(score * 100) / 100,
      max_score: 5,
      percentage: Math.round(percentage),
      status: ScoreMapperService.getCriticalMetricStatus(percentage),
      details: `${matches}/${jdTech.length} technical skills match JD`,
    };
  }

  private static calculateQuantifiedResults(resumeData?: ResumeData): CriticalMetricScore {
    if (!resumeData?.workExperience) {
      return {
        score: 0,
        max_score: 3,
        percentage: 0,
        status: 'poor',
        details: 'No work experience to analyze',
      };
    }

    const allBullets = resumeData.workExperience.flatMap(exp => exp.bullets || []);
    const quantifiedPattern = /\d+%|\$\d+|\d+\s*(users?|customers?|clients?|projects?|team|people|million|k\b)/i;
    const quantified = allBullets.filter(b => quantifiedPattern.test(b)).length;
    const percentage = allBullets.length > 0 ? (quantified / allBullets.length) * 100 : 0;
    const score = (percentage / 100) * 3;

    return {
      score: Math.round(score * 100) / 100,
      max_score: 3,
      percentage: Math.round(percentage),
      status: ScoreMapperService.getCriticalMetricStatus(percentage),
      details: `${quantified}/${allBullets.length} bullets have metrics`,
    };
  }

  private static calculateJobTitleRelevance(resumeData?: ResumeData, jobDescription?: string): CriticalMetricScore {
    if (!resumeData?.workExperience || !jobDescription) {
      return {
        score: 1.5,
        max_score: 3,
        percentage: 50,
        status: 'fair',
        details: 'Cannot assess title relevance',
      };
    }

    const jdLower = jobDescription.toLowerCase();
    const titles = resumeData.workExperience.map(e => e.role?.toLowerCase() || '').filter(t => t.length > 0);
    
    // Handle empty titles array to avoid NaN
    if (titles.length === 0) {
      return {
        score: 1.5,
        max_score: 3,
        percentage: 50,
        status: 'fair',
        details: 'No job titles found in resume',
      };
    }
    
    const relevantTitles = titles.filter(title => {
      const words = title.split(/\s+/);
      return words.some(w => w.length > 3 && jdLower.includes(w));
    });

    const percentage = (relevantTitles.length / titles.length) * 100;
    const score = (percentage / 100) * 3;

    return {
      score: Math.round(score * 100) / 100,
      max_score: 3,
      percentage: Math.round(percentage),
      status: ScoreMapperService.getCriticalMetricStatus(percentage),
      details: `${relevantTitles.length}/${titles.length} titles relevant to JD`,
    };
  }

  private static calculateExperienceRelevance(resumeData?: ResumeData, jobDescription?: string): CriticalMetricScore {
    if (!resumeData?.workExperience || !jobDescription) {
      return {
        score: 1.5,
        max_score: 3,
        percentage: 50,
        status: 'fair',
        details: 'Cannot assess experience relevance',
      };
    }

    const jdLower = jobDescription.toLowerCase();
    const allBullets = resumeData.workExperience.flatMap(e => e.bullets || []).filter(b => b && b.trim().length > 0);
    
    // Handle empty bullets array
    if (allBullets.length === 0) {
      return {
        score: 0,
        max_score: 3,
        percentage: 0,
        status: 'poor',
        details: 'No experience bullets found',
      };
    }
    
    const relevantBullets = allBullets.filter(bullet => {
      const words = bullet.toLowerCase().split(/\s+/);
      return words.filter(w => w.length > 4 && jdLower.includes(w)).length >= 2;
    });

    const percentage = (relevantBullets.length / allBullets.length) * 100;
    const score = (percentage / 100) * 3;

    return {
      score: Math.round(score * 100) / 100,
      max_score: 3,
      percentage: Math.round(percentage),
      status: ScoreMapperService.getCriticalMetricStatus(percentage),
      details: `${relevantBullets.length}/${allBullets.length} bullets relevant to JD`,
    };
  }


  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static calculateConfidence(
    resumeText: string,
    resumeData?: ResumeData,
    jobDescription?: string,
    finalScore?: number
  ): ConfidenceLevel {
    // FIX: Score-based confidence mapping (primary factor)
    // Market expectation: High scores = High confidence
    if (finalScore !== undefined) {
      if (finalScore >= 75) return 'High';   // Good scores get High confidence
      if (finalScore >= 60) return 'Medium'; // Fair scores get Medium confidence
      return 'Low';                          // Below average gets Low confidence
    }
    
    // Fallback: Data completeness factors (if no score provided)
    let confidenceScore = 0;
    if (resumeText.length > 1000) confidenceScore += 1;
    if (resumeText.length > 2000) confidenceScore += 1;
    if (resumeData) confidenceScore += 1;
    if (resumeData?.workExperience && resumeData.workExperience.length > 0) confidenceScore += 1;
    if (resumeData?.skills && resumeData.skills.length > 0) confidenceScore += 1;
    if (jobDescription && jobDescription.length > 200) confidenceScore += 1;

    if (confidenceScore >= 5) return 'High';
    if (confidenceScore >= 3) return 'Medium';
    return 'Low';
  }

  private static buildAdaptiveBreakdown(tierScores: TierScores, resumeData?: ResumeData, jobDescription?: string) {
    // Detect if this is a fresher role or experienced role
    const isFresherRole = this.detectFresherRole(resumeData, jobDescription);
    
    // Build base breakdown with all tiers (already separated)
    const breakdown = Object.entries(tierScores).map(([key, tier]) => ({
      key,
      name: tier.tier_name,
      weight_pct: tier.weight,
      score: tier.score,
      max_score: tier.max_score,
      contribution: tier.weighted_contribution,
      details: this.getBreakdownDetails(key, tier, isFresherRole),
      isVisible: this.shouldShowSection(key, isFresherRole),
      priority: this.getTierPriority(key, isFresherRole),
      roleType: isFresherRole ? 'fresher' : 'experienced',
    }));

    // Adjust weights and visibility based on experience level
    return this.adjustBreakdownForExperience(breakdown, isFresherRole);
  }

  /**
   * Get appropriate details message for breakdown item
   */
  private static getBreakdownDetails(key: string, tier: TierScore, isFresherRole: boolean): string {
    if (key === 'experience' && isFresherRole) {
      return 'Experience section not required for fresher roles';
    }
    
    if (tier && tier.top_issues && tier.top_issues.length > 0) {
      return tier.top_issues[0];
    }
    
    if (tier && typeof tier.percentage === 'number') {
      if (tier.percentage >= 80) return 'Excellent';
      if (tier.percentage >= 70) return 'Good';
      if (tier.percentage >= 60) return 'Fair';
    }
    
    return 'Needs improvement';
  }

  /**
   * FIXED: Create neutral experience result for fresher roles (score = 0, weight = 0)
   */
  private static createFresherExperienceResult() {
    return {
      tierScore: {
        tier_number: 3,
        tier_name: 'Experience',
        score: 0, // FIXED: No score for fresher roles
        max_score: 25,
        percentage: 0, // FIXED: 0% since experience not required
        weight: 0, // FIXED: 0 weight for freshers (not counted)
        weighted_contribution: 0, // FIXED: No contribution to final score
        metrics_passed: 0, // FIXED: No metrics evaluated
        metrics_total: 35,
        top_issues: ['Experience not required for this job role (Fresher)'],
      },
      // Additional fields that ExperienceAnalyzer would return
      impactStrength: 0,
      metricsUsage: 0,
      actionVerbRatio: 0,
      achievementRatio: 0,
      quantifiedPercentage: 0,
      strongVerbs: 0,
      qualityIssues: 0,
    };
  }

  /**
   * FIXED: Adjust tier weights based on role type - proper weight redistribution
   */
  private static adjustTierWeightsForRole(tierScores: TierScores, isFresherRole: boolean): TierScores {
    // Helper function to safely calculate weighted contribution
    const safeWeightedContribution = (tier: any, weight: number): number => {
      if (!tier || typeof tier.percentage !== 'number') {
        console.warn('[EnhancedScoringService] Invalid tier for weight calculation:', tier);
        return 0;
      }
      return tier.percentage * weight / 100;
    };

    if (isFresherRole) {
      // FIXED: Redistribute 25% experience weight to other tiers (total must = 100%)
      // Original experience weight (25%) redistributed as:
      // Skills +10% (25→35%), Education +5% (6→11%), Projects +5% (8→13%), Others +5% distributed
      return {
        ...tierScores,
        experience: { ...tierScores.experience, weight: 0, weighted_contribution: 0 }, // FIXED: 0 weight
        skills_keywords: { ...tierScores.skills_keywords, weight: 35, weighted_contribution: safeWeightedContribution(tierScores.skills_keywords, 35) }, // +10%
        education: { ...tierScores.education, weight: 11, weighted_contribution: safeWeightedContribution(tierScores.education, 11) }, // +5%
        projects: { ...tierScores.projects, weight: 13, weighted_contribution: safeWeightedContribution(tierScores.projects, 13) }, // +5%
        certifications: { ...tierScores.certifications, weight: 6, weighted_contribution: safeWeightedContribution(tierScores.certifications, 6) }, // +2%
        basic_structure: { ...tierScores.basic_structure, weight: 10, weighted_contribution: safeWeightedContribution(tierScores.basic_structure, 10) }, // +2%
        content_structure: { ...tierScores.content_structure, weight: 12, weighted_contribution: safeWeightedContribution(tierScores.content_structure, 12) }, // +2%
        competitive: { ...tierScores.competitive, weight: 7, weighted_contribution: safeWeightedContribution(tierScores.competitive, 7) }, // +1%
        culture_fit: { ...tierScores.culture_fit, weight: 3, weighted_contribution: safeWeightedContribution(tierScores.culture_fit, 3) }, // -1%
        qualitative: { ...tierScores.qualitative, weight: 3, weighted_contribution: safeWeightedContribution(tierScores.qualitative, 3) }, // -1%
        // Total: 0+35+11+13+6+10+12+7+3+3 = 100% ✓
      };
    } else {
      // Keep standard weights for experienced roles
      return {
        ...tierScores,
        experience: { ...tierScores.experience, weight: 25, weighted_contribution: safeWeightedContribution(tierScores.experience, 25) },
        skills_keywords: { ...tierScores.skills_keywords, weight: 25, weighted_contribution: safeWeightedContribution(tierScores.skills_keywords, 25) },
        education: { ...tierScores.education, weight: 6, weighted_contribution: safeWeightedContribution(tierScores.education, 6) },
        certifications: { ...tierScores.certifications, weight: 4, weighted_contribution: safeWeightedContribution(tierScores.certifications, 4) },
        projects: { ...tierScores.projects, weight: 8, weighted_contribution: safeWeightedContribution(tierScores.projects, 8) },
        basic_structure: { ...tierScores.basic_structure, weight: 8, weighted_contribution: safeWeightedContribution(tierScores.basic_structure, 8) },
        content_structure: { ...tierScores.content_structure, weight: 10, weighted_contribution: safeWeightedContribution(tierScores.content_structure, 10) },
        competitive: { ...tierScores.competitive, weight: 6, weighted_contribution: safeWeightedContribution(tierScores.competitive, 6) },
        culture_fit: { ...tierScores.culture_fit, weight: 4, weighted_contribution: safeWeightedContribution(tierScores.culture_fit, 4) },
        qualitative: { ...tierScores.qualitative, weight: 4, weighted_contribution: safeWeightedContribution(tierScores.qualitative, 4) },
      };
    }
  }

  /**
   * FIXED: Detect if this is a fresher role - uses enhanced candidate level detection
   * Now works properly in Normal Mode (without JD) by analyzing resume content
   */
  private static detectFresherRole(resumeData?: ResumeData, jobDescription?: string, userType?: 'fresher' | 'experienced' | 'student'): boolean {
    // Explicit override from frontend (highest priority)
    if (userType === 'fresher' || userType === 'student') return true;
    if (userType === 'experienced') return false;

    // FIXED: Use enhanced candidate level detection from resume content
    // This works even without JD by analyzing work experience, projects, education
    const resumeText = this.extractBasicText(resumeData || {} as ResumeData);
    const candidateLevelResult = detectCandidateLevel(resumeText, {
      workExperience: resumeData?.workExperience,
      education: resumeData?.education,
      projects: resumeData?.projects,
      certifications: resumeData?.certifications
    });
    
    // If candidate is detected as fresher from resume content, return true
    if (candidateLevelResult.level === 'fresher') {
      console.log('[EnhancedScoringService] Detected fresher from resume content:', candidateLevelResult.signals);
      return true;
    }

    // If we have a JD, also check JD-based indicators
    if (jobDescription) {
      const jd = jobDescription.toLowerCase();

      // Strong fresher indicators in JD
      const fresherKeywords = [
        'fresher', 'freshers', 'entry level', 'graduate', 'new grad',
        'campus hire', 'trainee', 'intern', '0-1 years', '0–1 years',
        '0-2 years', '0–2 years', 'no experience required', 'recent graduate',
        'entry-level', 'junior', 'graduate program'
      ];
      
      if (fresherKeywords.some(k => jd.includes(k))) return true;

      // Check for explicit experience requirements
      const expRequirementPatterns = [
        /(\d+)\+?\s*years?\s+(?:of\s+)?(?:work\s+|professional\s+|relevant\s+)?experience/gi,
        /minimum\s+(\d+)\+?\s*years?/gi,
        /at\s+least\s+(\d+)\+?\s*years?/gi,
      ];
      
      for (const pattern of expRequirementPatterns) {
        const match = jd.match(pattern);
        if (match) {
          const years = parseInt(match[1]);
          if (years >= 2) return false; // Experienced role
        }
      }
    }

    // Default: if candidate level is junior, treat as fresher-friendly
    return candidateLevelResult.level === 'junior';
  }
  
  /**
   * Get candidate level for weight adjustment
   */
  private static getCandidateLevel(resumeData?: ResumeData, jobDescription?: string, userType?: 'fresher' | 'experienced' | 'student'): CandidateLevel {
    if (userType === 'fresher' || userType === 'student') return 'fresher';
    if (userType === 'experienced') return 'mid';
    
    const resumeText = this.extractBasicText(resumeData || {} as ResumeData);
    const result = detectCandidateLevel(resumeText, {
      workExperience: resumeData?.workExperience,
      education: resumeData?.education,
      projects: resumeData?.projects,
      certifications: resumeData?.certifications
    });
    
    return result.level;
  }

  /**
   * Calculate total years of experience
   */
  private static calculateTotalExperience(workExperience: any[]): number {
    let totalMonths = 0;
    const currentYear = new Date().getFullYear();

    for (const exp of workExperience) {
      if (exp.year) {
        const yearRange = exp.year.toLowerCase();
        
        // Handle "Present" or "Current"
        if (yearRange.includes('present') || yearRange.includes('current')) {
          const startYear = this.extractStartYear(yearRange);
          if (startYear) {
            totalMonths += (currentYear - startYear) * 12;
          }
        } else {
          // Handle year ranges like "2020-2022"
          const years = yearRange.match(/\d{4}/g);
          if (years && years.length >= 2) {
            const start = parseInt(years[0]);
            const end = parseInt(years[1]);
            totalMonths += (end - start) * 12;
          }
        }
      }
    }

    return totalMonths / 12; // Convert to years
  }

  /**
   * Extract start year from year string
   */
  private static extractStartYear(yearStr: string): number | null {
    const match = yearStr.match(/\d{4}/);
    return match ? parseInt(match[0]) : null;
  }

  /**
   * Determine if a section should be visible based on role type
   */
  private static shouldShowSection(tierKey: string, isFresher: boolean): boolean {
    // Always show these sections regardless of role type
    const alwaysShow = ['basic_structure', 'content_structure', 'skills_keywords', 'projects', 'red_flags'];
    if (alwaysShow.includes(tierKey)) {
      return true;
    }

    // Experience section handling - always show but with different messaging
    if (tierKey === 'experience') {
      return true; // Show for both fresher and experienced roles
    }

    // Education - higher priority for freshers
    if (tierKey === 'education') {
      return true; // Always show education
    }

    // Certifications - show for all but more important for experienced roles
    if (tierKey === 'certifications') {
      return true; // Always show certifications
    }

    // Other sections - show based on role type
    if (tierKey === 'competitive' || tierKey === 'culture_fit') {
      return !isFresher; // Show for experienced roles primarily
    }

    // Qualitative - show for all
    return true;
  }

  /**
   * Get tier priority based on experience level
   */
  private static getTierPriority(tierKey: string, isFresher: boolean): number {
    if (isFresher) {
      // Fresher priority: Skills, Education, Certifications, Projects, then others
      const fresherPriority: Record<string, number> = {
        'skills_keywords': 1,
        'education': 2,
        'certifications': 3,
        'projects': 4,
        'content_structure': 5,
        'basic_structure': 6,
        'experience': 7, // Lower priority for freshers
        'qualitative': 8,
        'culture_fit': 9,
        'competitive': 10,
        'red_flags': 11,
      };
      return fresherPriority[tierKey] || 11;
    } else {
      // Experienced priority: Experience, Skills, then others
      const experiencedPriority: Record<string, number> = {
        'experience': 1,
        'skills_keywords': 2,
        'content_structure': 3,
        'projects': 4,
        'basic_structure': 5,
        'education': 6, // Lower priority for experienced
        'certifications': 7,
        'competitive': 8,
        'culture_fit': 9,
        'qualitative': 10,
        'red_flags': 11,
      };
      return experiencedPriority[tierKey] || 11;
    }
  }



  /**
   * Adjust breakdown visibility and weights based on experience level
   */
  private static adjustBreakdownForExperience(breakdown: any[], isFresher: boolean) {
    return breakdown.map(item => {
      if (isFresher) {
        // For freshers: Adjust weights to emphasize education/skills over experience
        if (item.key === 'experience') {
          return {
            ...item,
            weight_pct: 8, // Reduced weight for freshers
            details: item.details === 'Good' ? 'Experience section not required for fresher roles' : item.details,
          };
        }
        if (item.key === 'skills_keywords') {
          return {
            ...item,
            weight_pct: 28, // Boost skills for freshers
          };
        }
        if (item.key === 'education') {
          return {
            ...item,
            weight_pct: 15, // Higher weight for education in fresher roles
          };
        }
        if (item.key === 'certifications') {
          return {
            ...item,
            weight_pct: 8, // Moderate weight for certifications in fresher roles
          };
        }
        if (item.key === 'projects') {
          return {
            ...item,
            weight_pct: 12, // Higher weight for projects in fresher roles
          };
        }
      } else {
        // For experienced: Boost experience, moderate education/certifications weight
        if (item.key === 'experience') {
          return {
            ...item,
            weight_pct: 25, // High weight for experienced
          };
        }
        if (item.key === 'skills_keywords') {
          return {
            ...item,
            weight_pct: 25, // Standard weight for skills
          };
        }
        if (item.key === 'education') {
          return {
            ...item,
            weight_pct: 6, // Standard weight for experienced roles
          };
        }
        if (item.key === 'certifications') {
          return {
            ...item,
            weight_pct: 4, // Standard weight for experienced roles
          };
        }
        if (item.key === 'projects') {
          return {
            ...item,
            weight_pct: 8, // Standard weight for projects
          };
        }
      }
      return item;
    })
    .filter(item => item.isVisible !== false) // Keep all visible items
    .sort((a, b) => a.priority - b.priority); // Sort by priority
  }

  private static generateActions(
    tierScores: TierScores,
    redFlags: RedFlag[],
    missingKeywords: MissingKeyword[]
  ): string[] {
    const actions: string[] = [];

    // Add actions based on tier issues
    Object.values(tierScores).forEach(tier => {
      if (tier && typeof tier.percentage === 'number' && tier.percentage < 70 && tier.top_issues && tier.top_issues.length > 0) {
        actions.push(tier.top_issues[0]);
      }
    });

    // Add actions for red flags
    redFlags.slice(0, 3).forEach(flag => {
      actions.push(flag.recommendation);
    });

    // Add actions for missing keywords
    const criticalMissing = missingKeywords.filter((k: any) => k.tier === 'critical').slice(0, 2);
    criticalMissing.forEach((k: any) => {
      actions.push(`Add "${k.keyword}" to ${k.suggestedPlacement}`);
    });

    return actions.slice(0, 10);
  }

  private static generateExampleRewrites(resumeData?: ResumeData) {
    if (!resumeData?.workExperience || resumeData.workExperience.length === 0) {
      return {};
    }

    const firstBullet = resumeData.workExperience[0]?.bullets?.[0];
    if (!firstBullet) return {};

    return {
      experience: {
        original: firstBullet,
        improved: `${firstBullet.replace(/^(Worked on|Helped with|Responsible for)/i, 'Led')} resulting in measurable impact`,
        explanation: 'Start with action verb and add quantified results',
      },
    };
  }

  private static generateNotes(tierScores: TierScores, redFlagResult: { autoRejectRisk: boolean }): string[] {
    const notes: string[] = [];

    if (redFlagResult.autoRejectRisk) {
      notes.push('⚠️ Auto-reject risk: Multiple critical red flags detected');
    }

    const lowTiers = Object.values(tierScores).filter(t => t && typeof t.percentage === 'number' && t.percentage < 50);
    if (lowTiers.length > 0) {
      notes.push(`${lowTiers.length} tier(s) need significant improvement`);
    }

    return notes;
  }

  private static generateAnalysis(
    scoreResult: { finalScore: number; matchBand: MatchBand },
    tierScores: TierScores,
    criticalMetrics: CriticalMetrics
  ): string {
    const strongTiers = Object.values(tierScores).filter(t => t && typeof t.percentage === 'number' && t.percentage >= 80);
    const weakTiers = Object.values(tierScores).filter(t => t && typeof t.percentage === 'number' && t.percentage < 60);

    let analysis = `Overall score: ${scoreResult.finalScore}/100 (${scoreResult.matchBand}). `;
    
    if (strongTiers.length > 0) {
      analysis += `Strong in: ${strongTiers.map(t => t.tier_name).join(', ')}. `;
    }
    
    if (weakTiers.length > 0) {
      analysis += `Needs improvement: ${weakTiers.map(t => t.tier_name).join(', ')}. `;
    }

    analysis += `Big 5 score: ${criticalMetrics.total_critical_score}/19.`;

    return analysis;
  }

  private static identifyStrengths(tierScores: TierScores): string[] {
    return Object.values(tierScores)
      .filter(t => t && typeof t.percentage === 'number' && t.percentage >= 75)
      .map(t => `${t.tier_name}: ${t.percentage}%`)
      .slice(0, 5);
  }

  private static identifyImprovements(tierScores: TierScores): string[] {
    return Object.values(tierScores)
      .filter(t => t && typeof t.percentage === 'number' && t.percentage < 70)
      .sort((a, b) => (a.percentage || 0) - (b.percentage || 0))
      .map(t => `${t.tier_name}: ${t.percentage}%`)
      .slice(0, 5);
  }

  private static generateRecommendations(tierScores: TierScores, redFlags: RedFlag[]): string[] {
    const recommendations: string[] = [];

    // Recommendations based on weak tiers
    Object.values(tierScores)
      .filter(t => t && typeof t.percentage === 'number' && t.percentage < 70)
      .forEach(tier => {
        if (tier.top_issues && tier.top_issues.length > 0) {
          recommendations.push(`[${tier.tier_name}] ${tier.top_issues[0]}`);
        }
      });

    // Recommendations based on red flags
    redFlags
      .filter(f => f.severity === 'critical' || f.severity === 'high')
      .slice(0, 3)
      .forEach(flag => {
        recommendations.push(`[Red Flag] ${flag.recommendation}`);
      });

    return recommendations.slice(0, 10);
  }

  /**
   * Enhance score with parsing-specific data and insights
   */
  private static enhanceScoreWithParsingData(
    score: EnhancedComprehensiveScore,
    processedDocument: ProcessedDocument
  ): EnhancedComprehensiveScore {
    
    // Add parsing quality information to the analysis
    const parsingInsights = this.generateParsingInsights(processedDocument);
    
    // Enhance existing analysis with parsing information
    const enhancedAnalysis = `${score.analysis} ${parsingInsights}`;
    
    // Add parsing-specific recommendations
    const parsingRecommendations = this.generateParsingRecommendations(processedDocument);
    const enhancedRecommendations = [...score.recommendations, ...parsingRecommendations];
    
    // Add parsing warnings to notes
    const parsingNotes = processedDocument.warnings.length > 0 
      ? [`Parsing: ${processedDocument.warnings.join('; ')}`]
      : [];
    const enhancedNotes = [...score.notes, ...parsingNotes];
    
    // Adjust confidence based on parsing quality
    const adjustedConfidence = this.adjustConfidenceForParsing(
      score.confidence, 
      processedDocument.parsingQuality,
      processedDocument.extractionMode
    );
    
    return {
      ...score,
      analysis: enhancedAnalysis,
      recommendations: enhancedRecommendations.slice(0, 10),
      notes: enhancedNotes,
      confidence: adjustedConfidence,
      // Add parsing metadata
      extraction_mode: processedDocument.extractionMode,
      parsing_quality: processedDocument.parsingQuality.overallScore,
      parsing_confidence: processedDocument.confidence
    } as EnhancedComprehensiveScore & {
      parsing_quality: number;
      parsing_confidence: number;
    };
  }
  
  /**
   * Generate insights based on parsing results
   */
  private static generateParsingInsights(processedDocument: ProcessedDocument): string {
    const { extractionMode, parsingQuality, layoutStructure } = processedDocument;
    
    let insights = '';
    
    // Extraction mode insights
    if (extractionMode === 'OCR') {
      insights += 'Document processed using OCR technology. ';
    } else if (extractionMode === 'HYBRID') {
      insights += 'Document processed using hybrid parsing approach. ';
    }
    
    // Layout complexity insights
    if (layoutStructure.columns.columnCount > 1) {
      insights += `Multi-column layout detected (${layoutStructure.columns.columnCount} columns). `;
    }
    
    if (layoutStructure.tables.length > 0) {
      insights += `${layoutStructure.tables.length} table(s) found and processed. `;
    }
    
    if (layoutStructure.textboxes.length > 0) {
      insights += `${layoutStructure.textboxes.length} textbox(es) extracted. `;
    }
    
    // Quality insights
    if (parsingQuality.overallScore < 70) {
      insights += 'Parsing quality below optimal - consider using a cleaner document format. ';
    } else if (parsingQuality.overallScore > 90) {
      insights += 'Excellent parsing quality achieved. ';
    }
    
    return insights.trim();
  }
  
  /**
   * Generate parsing-specific recommendations
   */
  private static generateParsingRecommendations(processedDocument: ProcessedDocument): string[] {
    const recommendations: string[] = [];
    const { extractionMode, parsingQuality, warnings } = processedDocument;
    
    // OCR-specific recommendations
    if (extractionMode === 'OCR') {
      if (parsingQuality.textAccuracy < 80) {
        recommendations.push('Consider using a higher quality image or converting to PDF format');
      }
      if (parsingQuality.structurePreservation < 70) {
        recommendations.push('OCR may have affected document structure - review section organization');
      }
    }
    
    // Layout-specific recommendations
    if (parsingQuality.structurePreservation < 60) {
      recommendations.push('Document layout may not be ATS-friendly - consider simplifying formatting');
    }
    
    if (parsingQuality.contentCompleteness < 80) {
      recommendations.push('Some content may have been missed during parsing - verify all sections are present');
    }
    
    // Warning-based recommendations
    if (warnings.some(w => w.includes('timeout') || w.includes('slow'))) {
      recommendations.push('Document processing was slow - consider optimizing file size or format');
    }
    
    if (warnings.some(w => w.includes('fallback'))) {
      recommendations.push('Fallback processing was used - try uploading in a different format for better results');
    }
    
    return recommendations;
  }
  
  /**
   * Adjust confidence based on parsing quality
   */
  private static adjustConfidenceForParsing(
    originalConfidence: ConfidenceLevel,
    parsingQuality: ParsingQuality,
    extractionMode: ExtractionMode
  ): ConfidenceLevel {
    
    // Convert confidence to numeric for calculation
    let confidenceScore = originalConfidence === 'High' ? 3 : originalConfidence === 'Medium' ? 2 : 1;
    
    // Adjust based on parsing quality
    if (parsingQuality.overallScore < 60) {
      confidenceScore = Math.max(1, confidenceScore - 1); // Reduce confidence
    } else if (parsingQuality.overallScore > 90) {
      confidenceScore = Math.min(3, confidenceScore + 0.5); // Slight boost for excellent parsing
    }
    
    // Adjust based on extraction mode
    if (extractionMode === 'OCR' && parsingQuality.textAccuracy < 80) {
      confidenceScore = Math.max(1, confidenceScore - 0.5); // OCR uncertainty
    }
    
    // Convert back to confidence level
    if (confidenceScore >= 2.5) return 'High';
    if (confidenceScore >= 1.5) return 'Medium';
    return 'Low';
  }
  
  /**
   * Extract basic text from resume data for fallback
   */
  private static extractBasicText(resumeData: ResumeData): string {
    const sections: string[] = [];
    
    // Contact info
    sections.push(`${resumeData.name}`);
    if (resumeData.email) sections.push(resumeData.email);
    if (resumeData.phone) sections.push(resumeData.phone);
    
    // Summary
    if (resumeData.summary) sections.push(resumeData.summary);
    if (resumeData.careerObjective) sections.push(resumeData.careerObjective);
    
    // Experience
    resumeData.workExperience?.forEach(exp => {
      sections.push(`${exp.role} at ${exp.company} (${exp.year})`);
      exp.bullets?.forEach(bullet => sections.push(`• ${bullet}`));
    });
    
    // Education
    resumeData.education?.forEach(edu => {
      sections.push(`${edu.degree} from ${edu.school} (${edu.year})`);
    });
    
    // Skills
    resumeData.skills?.forEach(skillGroup => {
      sections.push(`${skillGroup.category}: ${skillGroup.list.join(', ')}`);
    });
    
    // Projects
    resumeData.projects?.forEach(project => {
      sections.push(`Project: ${project.title}`);
      project.bullets?.forEach(bullet => sections.push(`• ${bullet}`));
    });
    
    return sections.join('\n');
  }

  /**
   * Create a fallback tier result when an analyzer fails
   * CRITICAL FIX: Don't give 50% fallback - give a low score to indicate failure
   * This prevents the static ~54 score issue
   */
  private static createFallbackTierResult(tierName: string, tierNumber: number, maxScore: number): any {
    // FIXED: Give a low score (20%) instead of 50% to indicate analyzer failure
    // This ensures failed analyzers don't artificially inflate the score
    const fallbackPercentage = 20; // Low score for failed analysis
    
    const tierScore: TierScore = {
      tier_number: tierNumber,
      tier_name: tierName,
      score: maxScore * (fallbackPercentage / 100),
      max_score: maxScore,
      percentage: fallbackPercentage, // FIXED: Low percentage instead of 50%
      weight: 0, // Will be set later by weight normalization
      weighted_contribution: 0, // Will be calculated later
      metrics_passed: Math.floor(maxScore * (fallbackPercentage / 100)),
      metrics_total: maxScore,
      top_issues: [`${tierName} analysis incomplete - limited data available`],
    };

    // Return object with all possible properties that analyzers might have
    return {
      tierScore,
      keywordMatchRate: 0,
      missingKeywords: [],
      orderIssues: [],
      formatIssues: [],
    };
  }
}

// Export as both class and instance for compatibility
export const enhancedScoringService = EnhancedScoringService;
export default EnhancedScoringService;