// src/types/resume.ts

export interface Education {
  degree: string;
  school: string;
  year: string;
  cgpa?: string;
  location?: string;
  field?: string;
}

export interface WorkExperience {
  role: string;
  company: string;
  year: string;
  bullets: string[];
  location?: string;
}

export interface Project {
  title: string;
  bullets: string[];
  githubUrl?: string;
  description?: string;
  techStack?: string[];
}

export interface Skill {
  category: string;
  count: number;
  list: string[];
}

export interface Certification {
  title: string;
  description: string;
}

export interface AdditionalSection {
  title: string;
  bullets: string[];
}

export interface ResumeData {
  name: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  location?: string;
  targetRole?: string;
  summary?: string;
  careerObjective?: string;
  education: Education[];
  workExperience: WorkExperience[];
  projects: Project[];
  skills: Skill[];
  certifications: (string | Certification)[];
  additionalSections?: AdditionalSection[];
  achievements?: string[];
  origin?: string;
}

export type UserType = 'fresher' | 'experienced' | 'student';
export type ScoringMode = 'jd_based' | 'general';
export type ExtractionMode = 'TEXT' | 'OCR' | 'HYBRID';
export type MatchBand = 'Excellent Match' | 'Very Good Match' | 'Good Match' | 'Fair Match' | 'Below Average' | 'Poor Match' | 'Very Poor' | 'Inadequate' | 'Minimal Match';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface ExtractionResult {
  text: string;
  extraction_mode: ExtractionMode;
  trimmed: boolean;
  pages?: number;
  chars_pre?: number;
  chars_post?: number;
  filename?: string;
}

export interface MetricScore {
  key: string;
  name: string;
  weight_pct: number;
  score: number;
  max_score: number;
  contribution: number;
  details: string;
}

export interface ExampleRewrite {
  original: string;
  improved: string;
  explanation: string;
}

export interface SectionLevelScore {
  jd_alignment_score: number;
  ats_score: number;
  skills_gap_score: number;
  experience_relevancy_score: number;
  project_match_score: number;
}

export interface ComprehensiveScore {
  overall: number;
  match_band: MatchBand;
  interview_probability_range: string;
  confidence: ConfidenceLevel;
  rubric_version: string;
  weighting_mode: 'JD' | 'GENERAL';
  extraction_mode: ExtractionMode;
  trimmed: boolean;
  job_title?: string;
  breakdown: MetricScore[];
  missing_keywords: string[];
  actions: string[];
  example_rewrites: {
    experience?: ExampleRewrite;
    projects?: ExampleRewrite;
  };
  notes: string[];
  analysis: string;
  keyStrengths: string[];
  improvementAreas: string[];
  recommendations: string[];
  cached?: boolean;
  cache_expires_at?: string;
  section_scores?: SectionLevelScore;
  confidence_breakdown?: {
    numeric_score: number;
    components: {
      literal_match: number;
      semantic_match: number;
      experience_relevancy: number;
      keyword_coverage: number;
      context_quality: number;
    };
    reasoning: string[];
  };
}

export interface MatchScore {
  score: number;
  analysis: string;
  keyStrengths: string[];
  improvementAreas: string[];
}

export interface ScoreBreakdown {
  atsCompatibility: {
    score: number;
    maxScore: number;
    details: string;
    noTablesColumnsFonts: boolean;
    properFileStructure: boolean;
    consistentBulletFormatting: boolean;
  };
  keywordSkillMatch: {
    score: number;
    maxScore: number;
    details: string;
    technicalSoftSkillsAligned: boolean;
    toolsTechCertsPresent: boolean;
    roleSpecificVerbsUsed: boolean;
  };
  projectWorkRelevance: {
    score: number;
    maxScore: number;
    details: string;
    projectsAlignedWithJD: boolean;
    quantifiedImpact: boolean;
  };
  structureFlow: {
    score: number;
    maxScore: number;
    details: string;
    logicalSectionOrder: boolean;
    noMissingSections: boolean;
    goodWhitespaceMargins: boolean;
  };
  criticalFixesRedFlags: {
    score: number;
    maxScore: number;
    details: string;
    hasContactInfo: boolean;
    noOverusedWords: boolean;
    usesActionVerbs: boolean;
    noGrammarSpellingErrors: boolean;
  };
  impactScore: {
    score: number;
    maxScore: number;
    details: string;
    strongActionVerbs: boolean;
    quantifiedAccomplishments: boolean;
    achievementOrientedContent: boolean;
    measurableResults: boolean;
  };
  brevityScore: {
    score: number;
    maxScore: number;
    details: string;
    conciseness: boolean;
    wordEconomy: boolean;
    avoidingRedundancy: boolean;
    directLanguage: boolean;
  };
  styleScore: {
    score: number;
    maxScore: number;
    details: string;
    professionalTone: boolean;
    consistencyInFormatting: boolean;
    clarityOfLanguage: boolean;
    overallPolish: boolean;
  };
  skillsScore: {
    score: number;
    maxScore: number;
    details: string;
    relevanceToJD: boolean;
    proficiencyIndicated: boolean;
    varietyTechnicalSoft: boolean;
    placement: boolean;
  };
}

export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';

export interface DetailedScore {
  totalScore: number;
  analysis: string;
  keyStrengths: string[];
  improvementAreas: string[];
  breakdown: ScoreBreakdown;
  recommendations: string[];
  grade: Grade;
}

export interface EmbeddingVector {
  id?: string;
  vector: number[];
  text: string;
  type: 'resume_section' | 'jd_requirement' | 'skill' | 'keyword';
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface SemanticMatchResult {
  similarity_score: number;
  match_type: 'exact' | 'semantic' | 'partial' | 'none';
  confidence: number;
  matched_text?: string;
  context?: string;
}

export interface HybridMatchScore {
  literal_score: number;
  semantic_score: number;
  combined_score: number;
  literal_weight: number;
  semantic_weight: number;
  match_details: SemanticMatchResult[];
}

export interface KeywordContext {
  keyword: string;
  found_in_resume: boolean;
  context_sentences: string[];
  relevance_score: number;
  semantic_alternatives?: string[];
}

export interface ATSProfile {
  profile_id: string;
  name: 'workday' | 'greenhouse' | 'lever' | 'taleo' | 'generic';
  keyword_weight: number;
  experience_weight: number;
  section_order_strict: boolean;
  parsing_tolerance: 'strict' | 'moderate' | 'lenient';
  metadata_emphasis: number;
  custom_rules: Record<string, any>;
}

export interface ATSSimulationResult {
  ats_system: string;
  parse_success: boolean;
  compatibility_score: number;
  issues_detected: string[];
  recommendations: string[];
}


// ============================================================================
// 220+ METRICS FRAMEWORK TYPES
// ============================================================================

// Tier Score for each of the 10 evaluation tiers
export interface TierScore {
  tier_number: number;
  tier_name: string;
  score: number;
  max_score: number;
  percentage: number;
  weight: number;
  weighted_contribution: number;
  metrics_passed: number;
  metrics_total: number;
  top_issues: string[];
}

// All 10 tier scores
export interface TierScores {
  basic_structure: TierScore;      // Tier 1: 20 metrics
  content_structure: TierScore;    // Tier 2: 25 metrics
  experience: TierScore;           // Tier 3: 35 metrics
  education: TierScore;            // Tier 4a: 12 metrics
  certifications: TierScore;       // Tier 4b: 8 metrics
  skills_keywords: TierScore;      // Tier 5: 40 metrics
  projects: TierScore;             // Tier 6: 15 metrics
  red_flags: TierScore;            // Tier 7: 30 metrics (penalty-based)
  competitive: TierScore;          // Tier 8: 15 metrics
  culture_fit: TierScore;          // Tier 9: 20 metrics
  qualitative: TierScore;          // Tier 10: 10 metrics
}

// Big 5 Critical Metrics (highest impact)
export interface CriticalMetricScore {
  score: number;
  max_score: number;
  percentage: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  details: string;
}

export interface CriticalMetrics {
  jd_keywords_match: CriticalMetricScore;      // 5 points max
  technical_skills_alignment: CriticalMetricScore; // 5 points max
  quantified_results_presence: CriticalMetricScore; // 3 points max
  job_title_relevance: CriticalMetricScore;    // 3 points max
  experience_relevance: CriticalMetricScore;   // 3 points max
  total_critical_score: number;                // 19 points max
}

// Red Flag types
export type RedFlagType = 'employment' | 'skills' | 'formatting';
export type RedFlagSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface RedFlag {
  type: RedFlagType;
  id: number;
  name: string;
  severity: RedFlagSeverity;
  penalty: number;
  description: string;
  recommendation: string;
}

// Missing Keyword with tier and color
export type KeywordTier = 'critical' | 'important' | 'nice_to_have';
export type KeywordColor = 'red' | 'orange' | 'yellow';

export interface MissingKeyword {
  keyword: string;
  tier: KeywordTier;
  impact: number;
  suggestedPlacement: string;
  color: KeywordColor;
}

// Format Issue types
export type FormatIssueType = 'table' | 'multi_column' | 'color' | 'icon' | 'image' | 'font' | 'graphics';

export interface FormatIssue {
  type: FormatIssueType;
  description: string;
  severity: 'low' | 'medium' | 'high';
  location?: string;
}

// Section Order Issue
export interface OrderIssue {
  section: string;
  currentPosition: number;
  expectedPosition: number;
  penalty: number;
}

// Section Info for validation
export interface SectionInfo {
  name: string;
  position: number;
  expectedPosition: number;
  isCorrectlyPlaced: boolean;
}

// Enhanced ComprehensiveScore with 220+ metrics
export interface EnhancedComprehensiveScore extends ComprehensiveScore {
  // Tier-based scores (220+ metrics)
  tier_scores: TierScores;
  
  // Big 5 Critical Metrics
  critical_metrics: CriticalMetrics;
  
  // Red flags with penalties
  red_flags: RedFlag[];
  red_flag_penalty: number;
  auto_reject_risk: boolean;
  
  // Enhanced missing keywords with tier/color
  missing_keywords_enhanced: MissingKeyword[];
  
  // Section order issues
  section_order_issues: OrderIssue[];
  
  // Format issues
  format_issues: FormatIssue[];
}

// Tier weights configuration
export const TIER_WEIGHTS = {
  basic_structure: 8,        // Tier 1
  content_structure: 10,     // Tier 2
  experience: 25,            // Tier 3 (highest weight)
  education: 6,              // Tier 4a (separate from certifications)
  certifications: 4,         // Tier 4b (separate from education)
  skills_keywords: 25,       // Tier 5 (highest weight)
  projects: 8,               // Tier 6
  red_flags: 0,              // Tier 7 (penalty-based, not weighted)
  competitive: 6,            // Tier 8
  culture_fit: 4,            // Tier 9
  qualitative: 4             // Tier 10
} as const;

// Red flag penalties
export const RED_FLAG_PENALTIES = {
  employment_gap_6_months: -3,
  job_hopping_pattern: -3,
  title_inflation: -5,
  keyword_stuffing: -5,
  multiple_red_flags_threshold: 3 // Auto-reject warning if >= 3 critical flags
} as const;

// Match band thresholds with interview probabilities
export const MATCH_BAND_THRESHOLDS = {
  'Excellent Match': { min: 85, max: 100, probability: '85-100%' },
  'Very Good Match': { min: 75, max: 84, probability: '70-84%' },
  'Good Match': { min: 65, max: 74, probability: '55-69%' },
  'Fair Match': { min: 55, max: 64, probability: '35-54%' },
  'Below Average': { min: 45, max: 54, probability: '20-34%' },
  'Poor Match': { min: 35, max: 44, probability: '8-19%' },
  'Very Poor': { min: 25, max: 34, probability: '3-7%' },
  'Inadequate': { min: 15, max: 24, probability: '1-2%' },
  'Minimal Match': { min: 0, max: 14, probability: '0-0.5%' }
} as const;

// Expected section order for ATS
export const EXPECTED_SECTION_ORDER = [
  'contact',
  'summary',
  'skills',
  'experience',
  'projects',
  'education',
  'certifications',
  'additional'
] as const;
// ============================================================================
// COMPREHENSIVE RESUME ANALYZER TYPES
// ============================================================================

// Analysis Options
export interface AnalysisOptions {
  includeJDMatching?: boolean;
  skipFileAnalysis?: boolean;
  analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
}

// File Analysis
export interface FileAnalysisResult {
  pdf_name: string;
  file_size_kb: string;
  page_count: number;
  word_count: number;
  bullet_count: number;
  file_format_valid: boolean;
  size_appropriate: boolean;
  page_count_appropriate: boolean;
}

// Section Detection
export interface OrderIssue {
  section: string;
  currentPosition: number;
  expectedPosition: number;
  penalty: number;
}

export interface SectionDetectionResult {
  present_sections: string[];
  missing_sections: string[];
  section_order_correct: boolean;
  section_positions: Record<string, number>;
  section_word_counts: Record<string, number>;
  section_bullet_counts: Record<string, number>;
  order_issues: OrderIssue[];
}

// Section Quality Analysis
export interface SectionQualityResult {
  bullet_clarity_score: number;
  metrics_usage_ratio: number;
  action_verb_ratio: number;
  tech_stack_completeness: number;
  grammar_issues_count: number;
  date_format_consistency: boolean;
  section_quality_scores: Record<string, number>;
}

// ATS Compatibility
export interface ATSCompatibilityResult {
  critical_errors: string[];
  warnings: string[];
  compatibility_score: number;
  has_tables: boolean;
  has_images_icons: boolean;
  has_multi_columns: boolean;
  has_fancy_fonts_colors: boolean;
  has_text_in_graphics: boolean;
  has_problematic_headers_footers: boolean;
}

// Skill Extraction
export interface SkillExtractionResult {
  skills_found: string[];
  skill_categories: Record<string, string[]>;
  skills_count: number;
  skills_quality_score: number;
  programming_languages: string[];
  tools_technologies: string[];
  cloud_platforms: string[];
  soft_skills: string[];
}

// Experience Analysis
export interface ExperienceAnalysisResult {
  impact_strength_score: number;
  metrics_usage_ratio: number;
  action_verb_ratio: number;
  achievement_vs_responsibility_ratio: number;
  quantified_bullets_percentage: number;
  strong_action_verbs_count: number;
  experience_quality_issues: string[];
}

// Content Quality
export interface ContentQualityResult {
  writing_clarity_score: number;
  content_quality_score: number;
  grammar_issues: string[];
  style_issues: string[];
  consistency_issues: string[];
}

// JD Requirements
export interface JDRequirements {
  hard_skills: string[];
  soft_skills: string[];
  tools: string[];
  cloud_platforms: string[];
  experience_level: string;
  certifications: string[];
  domain_knowledge: string[];
}

// JD Matching
export interface JDMatchingResult {
  jd_skill_match_score: number;
  jd_experience_match_score: number;
  jd_project_match_score: number;
  overall_fit_score: number;
  exact_skill_matches: string[];
  partial_matches: string[];
  missing_skills: string[];
  missing_hard_skills: string[];
  missing_soft_skills: string[];
  missing_tools: string[];
  missing_certifications: string[];
  missing_domain_keywords: string[];
  jd_requirements: JDRequirements;
}

// Comprehensive Scoring
export interface ComprehensiveScores {
  ats_score: number;           // 0-100
  structure_score: number;     // 0-100
  impact_score: number;        // 0-100
  content_quality_score: number; // 0-100
  final_resume_score: number;  // 0-100 (weighted average)
  
  // JD-specific scores (when JD provided)
  jd_skill_match_score?: number;
  jd_experience_match_score?: number;
  jd_project_match_score?: number;
  overall_fit_score?: number;
}

// Main Comprehensive Analysis Result
export interface ComprehensiveAnalysisResult {
  // File-level analysis
  file_analysis: FileAnalysisResult;
  
  // ATS compatibility
  ats_compatibility: ATSCompatibilityResult;
  
  // Section analysis
  sections: SectionDetectionResult;
  
  // Skills analysis
  skills_analysis: SkillExtractionResult;
  
  // Experience analysis
  experience_analysis: ExperienceAnalysisResult;
  
  // Content quality
  content_quality: ContentQualityResult;
  
  // Scoring
  scores: ComprehensiveScores;
  
  // JD matching (optional)
  jd_matching?: JDMatchingResult;
  
  // Recommendations
  improvements: string[];
  
  // Metadata
  analysis_timestamp: string;
  analysis_version: string;
}

// Scoring Weights Configuration
export const COMPREHENSIVE_SCORING_WEIGHTS = {
  ats_compatibility: 25,    // ATS compatibility is critical
  structure_quality: 20,    // Section organization and completeness
  impact_strength: 30,      // Experience quality and achievements (highest weight)
  content_quality: 25       // Writing quality and clarity
} as const;

export const JD_MATCHING_WEIGHTS = {
  skill_match: 40,          // Skills alignment with JD
  experience_match: 35,     // Experience relevance to JD
  project_match: 25         // Project relevance to JD
} as const;

// Service Interfaces
export interface FileAnalyzerInterface {
  analyzeFile(file: File, resumeText: string): FileAnalysisResult;
}

export interface SectionDetectorInterface {
  detectSections(resumeText: string): SectionDetectionResult;
}

export interface QualityAnalyzerInterface {
  analyzeSectionQuality(
    sections: Record<string, string>,
    targetRole?: string
  ): SectionQualityResult;
}

export interface ATSCompatibilityCheckerInterface {
  checkCompatibility(resumeText: string, extractionMode: string): ATSCompatibilityResult;
}

export interface SkillExtractorInterface {
  extractSkills(resumeText: string): SkillExtractionResult;
}

export interface ExperienceAnalyzerInterface {
  analyzeExperience(resumeText: string): ExperienceAnalysisResult;
}

export interface JDMatcherInterface {
  matchResumeToJD(
    resumeText: string,
    jobDescription: string
  ): JDMatchingResult;
}

export interface ComprehensiveAnalyzerServiceInterface {
  analyzeResume(
    resumeText: string,
    resumeFile?: File,
    jobDescription?: string,
    options?: AnalysisOptions
  ): Promise<ComprehensiveAnalysisResult>;
}

// ============================================================================
// ENHANCED PARSING AND OCR TYPES
// ============================================================================

// Document Format Detection
export type DocumentFormat = 'pdf' | 'docx' | 'doc' | 'rtf' | 'txt' | 'md' | 'jpg' | 'png' | 'unknown';
export type LayoutComplexity = 'simple' | 'multi-column' | 'complex' | 'template-heavy';
export type ParsingStrategy = 'direct' | 'ocr' | 'hybrid' | 'fallback';

// OCR Quality and Results
export interface OCRQuality {
  characterAccuracy: number;    // 0-100
  wordAccuracy: number;        // 0-100
  confidence: number;          // 0-100
  imageQuality: number;        // 0-100
  textClarity: number;         // 0-100
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  characterAccuracy: number;
  boundingBoxes: BoundingBox[];
  detectedLanguage: string;
  processingTime: number;
  imagePreprocessed: boolean;
}

// Layout Parsing
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ContentElement {
  id: string;
  type: 'text' | 'header' | 'table' | 'textbox' | 'image';
  content: string;
  position: Rectangle;
  confidence: number;
}

export interface ColumnStructure {
  columnCount: number;
  columnBoundaries: Rectangle[];
  readingOrder: ContentElement[];
  confidence: number;
}

export interface TextboxContent {
  id: string;
  content: string;
  position: Rectangle;
  contextualPlacement: string;
}

export interface TableContent {
  id: string;
  headers: string[];
  rows: string[][];
  extractedText: string;
  preservedStructure: boolean;
}

export interface LayoutStructure {
  columns: ColumnStructure;
  textboxes: TextboxContent[];
  tables: TableContent[];
  elements: ContentElement[];
  complexity: LayoutComplexity;
}

// Parsing Quality Assessment
export interface ParsingQuality {
  textAccuracy: number;           // 0-100
  structurePreservation: number;  // 0-100
  contentCompleteness: number;    // 0-100
  orderingAccuracy: number;       // 0-100
  overallScore: number;          // 0-100
}

export interface QualityAssessment {
  score: number;
  issues: string[];
  recommendations: string[];
}

// Semantic Matching
export interface SemanticMatch {
  resumeTerm: string;
  jdTerm: string;
  similarity: number;           // 0-1
  matchType: 'exact' | 'semantic' | 'related';
  confidence: number;           // 0-100
  explanation: string;
}

export interface SimilarityScore {
  score: number;               // 0-1
  confidence: number;          // 0-100
  method: 'embedding' | 'lexical' | 'hybrid';
}

export interface ExpandedKeyword {
  original: string;
  synonyms: string[];
  relatedTerms: string[];
  contextualVariations: string[];
}

// Enhanced Confidence Assessment
export interface ConfidenceFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface ConfidenceAssessment {
  level: ConfidenceLevel;
  score: number;               // 0-100
  factors: ConfidenceFactor[];
  limitations: string[];
  recommendations: string[];
}

// Formatting Analysis
export type FormattingIssueType = 
  | 'multi_column' 
  | 'tables' 
  | 'textboxes' 
  | 'graphics' 
  | 'colors' 
  | 'fonts' 
  | 'spacing' 
  | 'headers';

export interface FormattingIssue {
  type: FormattingIssueType;
  severity: 'Minor' | 'Moderate' | 'Severe';
  description: string;
  penalty: number;
  recommendation: string;
  atsImpact: string;
}

export interface PenaltyAssessment {
  totalPenalty: number;
  penaltiesByType: Record<FormattingIssueType, number>;
  severityBreakdown: Record<'Minor' | 'Moderate' | 'Severe', number>;
}

export interface FormattingAssessment {
  overallScore: number;
  issues: FormattingIssue[];
  penalties: PenaltyAssessment;
  atsCompatibility: 'High' | 'Medium' | 'Low';
}

// Processing Warnings and Errors
export interface ProcessingWarning {
  type: 'parsing' | 'ocr' | 'layout' | 'format' | 'performance';
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion?: string;
}

// Enhanced Processing Result
export interface EnhancedProcessingResult {
  // Core extraction data
  extractedText: string;
  extractionMode: ExtractionMode;
  
  // Quality metrics
  parsingQuality: ParsingQuality;
  ocrQuality?: OCRQuality;
  layoutAccuracy: number;
  
  // Confidence assessment
  confidence: ConfidenceAssessment;
  
  // Semantic enhancements
  semanticMatches: SemanticMatch[];
  expandedKeywords: ExpandedKeyword[];
  
  // Formatting analysis
  formattingAssessment: FormattingAssessment;
  
  // Processing metadata
  processingTime: number;
  fallbacksUsed: string[];
  warnings: ProcessingWarning[];
  
  // Layout structure
  layoutStructure?: LayoutStructure;
}

// Service Interfaces
export interface DocumentProcessorInterface {
  processDocument(file: File): Promise<ProcessedDocument>;
  detectFormat(file: File): DocumentFormat;
  selectParsingStrategy(format: DocumentFormat, complexity: LayoutComplexity): ParsingStrategy;
}

export interface ProcessedDocument {
  extractedText: string;
  extractionMode: ExtractionMode;
  layoutStructure: LayoutStructure;
  parsingQuality: ParsingQuality;
  confidence: number;
  warnings: string[];
}

export interface OCRServiceInterface {
  extractTextFromImage(imageData: Buffer): Promise<OCRResult>;
  preprocessImage(imageData: Buffer): Promise<Buffer>;
  assessOCRQuality(result: OCRResult): QualityAssessment;
}

export interface LayoutParserInterface {
  detectColumns(document: Document): ColumnStructure;
  extractTextboxContent(document: Document): TextboxContent[];
  parseTableContent(document: Document): TableContent[];
  orderContentLogically(elements: ContentElement[]): ContentElement[];
}

export interface SemanticMatcherInterface {
  findSemanticMatches(resumeText: string, jobDescription: string): SemanticMatch[];
  calculateSimilarity(term1: string, term2: string): SimilarityScore;
  expandKeywords(keywords: string[]): ExpandedKeyword[];
}

export interface ConfidenceCalculatorInterface {
  calculateOverallConfidence(
    parsingQuality: ParsingQuality,
    contentCompleteness: number,
    extractionMode: ExtractionMode
  ): ConfidenceAssessment;
}

export interface FormattingAnalyzerInterface {
  analyzeFormatting(document: ProcessedDocument): FormattingAssessment;
  calculatePenalties(issues: FormattingIssue[]): PenaltyAssessment;
  generateRecommendations(issues: FormattingIssue[]): string[];
}

// Penalty System Configuration
export const ADAPTIVE_PENALTIES = {
  minor: { range: [1, 2], description: 'Minimal ATS impact' },
  moderate: { range: [3, 5], description: 'Some ATS compatibility issues' },
  severe: { range: [6, 10], description: 'Significant ATS parsing problems' }
} as const;

export const FORMATTING_WEIGHTS = {
  textboxes: { minor: 1, moderate: 3, severe: 7 },
  multiColumn: { minor: 2, moderate: 4, severe: 8 },
  tables: { minor: 1, moderate: 3, severe: 6 },
  graphics: { minor: 2, moderate: 5, severe: 9 },
  colors: { minor: 1, moderate: 2, severe: 4 },
  fonts: { minor: 1, moderate: 2, severe: 3 }
} as const;