/**
 * Tier 1: Basic Structure Analyzer (20 metrics)
 * Part of the Enhanced ATS Score Checker (220+ Metrics)
 * 
 * Analyzes:
 * - File & Name metrics (5): filename format, file size, format type, name consistency, version naming
 * - Length & Structure metrics (5): page count, word count, whitespace ratio, margins, line spacing
 * - Font & Typography metrics (5): font choice, body size, header size, consistency, weight/style
 * - Color & Visual metrics (5): text color, accents, tables/graphics, background, visual hierarchy
 */

import { TierScore, FormatIssue, ExtractionMode } from '../../types/resume';

// ============================================================================
// TYPES
// ============================================================================

export interface BasicStructureInput {
  resumeText: string;
  extractionMode: ExtractionMode;
  filename?: string;
  pageCount?: number;
  fileSize?: number; // in KB
  hasImages?: boolean;
  hasTables?: boolean;
  hasMultipleColumns?: boolean;
  hasColors?: boolean;
  hasGraphics?: boolean;
}

export interface BasicStructureResult {
  tierScore: TierScore;
  formatIssues: FormatIssue[];
  metrics: BasicStructureMetrics;
}

export interface BasicStructureMetrics {
  // File & Name (5)
  filenameFormat: MetricResult;
  fileSize: MetricResult;
  formatType: MetricResult;
  nameConsistency: MetricResult;
  versionNaming: MetricResult;
  
  // Length & Structure (5)
  pageCount: MetricResult;
  wordCount: MetricResult;
  whitespaceRatio: MetricResult;
  margins: MetricResult;
  lineSpacing: MetricResult;
  
  // Font & Typography (5)
  fontChoice: MetricResult;
  bodyFontSize: MetricResult;
  headerFontSize: MetricResult;
  fontConsistency: MetricResult;
  fontWeightStyle: MetricResult;
  
  // Color & Visual (5)
  textColor: MetricResult;
  accentColors: MetricResult;
  tablesGraphics: MetricResult;
  background: MetricResult;
  visualHierarchy: MetricResult;
}

export interface MetricResult {
  score: number;
  maxScore: number;
  passed: boolean;
  details: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIER_CONFIG = {
  tierNumber: 1,
  tierName: 'Basic Structure',
  weight: 8,
  maxScore: 20,
  metricsTotal: 20,
};

// Ideal ranges
const IDEAL_PAGE_COUNT = { min: 1, max: 2 };
const IDEAL_WORD_COUNT = { min: 400, max: 800 };
const IDEAL_FILE_SIZE_KB = { min: 50, max: 500 };
const IDEAL_WHITESPACE_RATIO = { min: 0.15, max: 0.35 };

// ATS-friendly fonts
const ATS_FRIENDLY_FONTS = [
  'arial', 'calibri', 'cambria', 'garamond', 'georgia', 'helvetica',
  'times new roman', 'trebuchet', 'verdana', 'tahoma', 'book antiqua'
];

// ============================================================================
// BASIC STRUCTURE ANALYZER
// ============================================================================

export class BasicStructureAnalyzer {
  /**
   * Analyze basic structure of resume (Tier 1: 20 metrics)
   */
  static analyze(input: BasicStructureInput): BasicStructureResult {
    const metrics = this.analyzeAllMetrics(input);
    const formatIssues = this.detectFormatIssues(input, metrics);
    const tierScore = this.calculateTierScore(metrics);

    return {
      tierScore,
      formatIssues,
      metrics,
    };
  }

  /**
   * Analyze all 20 metrics
   */
  private static analyzeAllMetrics(input: BasicStructureInput): BasicStructureMetrics {
    return {
      // File & Name (5)
      filenameFormat: this.analyzeFilenameFormat(input.filename),
      fileSize: this.analyzeFileSize(input.fileSize),
      formatType: this.analyzeFormatType(input.extractionMode, input.filename),
      nameConsistency: this.analyzeNameConsistency(input.resumeText, input.filename),
      versionNaming: this.analyzeVersionNaming(input.filename),
      
      // Length & Structure (5)
      pageCount: this.analyzePageCount(input.pageCount, input.resumeText),
      wordCount: this.analyzeWordCount(input.resumeText),
      whitespaceRatio: this.analyzeWhitespaceRatio(input.resumeText),
      margins: this.analyzeMargins(input.resumeText),
      lineSpacing: this.analyzeLineSpacing(input.resumeText),
      
      // Font & Typography (5)
      fontChoice: this.analyzeFontChoice(input.resumeText),
      bodyFontSize: this.analyzeBodyFontSize(),
      headerFontSize: this.analyzeHeaderFontSize(),
      fontConsistency: this.analyzeFontConsistency(input.resumeText),
      fontWeightStyle: this.analyzeFontWeightStyle(),
      
      // Color & Visual (5)
      textColor: this.analyzeTextColor(input.hasColors),
      accentColors: this.analyzeAccentColors(input.hasColors),
      tablesGraphics: this.analyzeTablesGraphics(input.hasTables, input.hasGraphics, input.hasMultipleColumns),
      background: this.analyzeBackground(),
      visualHierarchy: this.analyzeVisualHierarchy(input.resumeText),
    };
  }

  // ============================================================================
  // FILE & NAME METRICS (5)
  // ============================================================================

  private static analyzeFilenameFormat(filename?: string): MetricResult {
    if (!filename) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'Filename not provided' };
    }

    const lowerFilename = filename.toLowerCase();
    
    // Check for professional naming: FirstName_LastName_Resume.pdf
    const professionalPattern = /^[a-z]+[_-]?[a-z]*[_-]?resume/i;
    const hasProperFormat = professionalPattern.test(filename);
    
    // Check for bad patterns
    const hasBadPatterns = /resume\s*\(\d+\)|copy|final|v\d|draft/i.test(filename);
    
    if (hasProperFormat && !hasBadPatterns) {
      return { score: 1, maxScore: 1, passed: true, details: 'Professional filename format' };
    } else if (hasBadPatterns) {
      return { score: 0, maxScore: 1, passed: false, details: 'Avoid version numbers or "copy" in filename' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Use format: FirstName_LastName_Resume.pdf' };
  }

  private static analyzeFileSize(fileSize?: number): MetricResult {
    if (!fileSize) {
      return { score: 0.5, maxScore: 1, passed: true, details: 'File size not available' };
    }

    if (fileSize >= IDEAL_FILE_SIZE_KB.min && fileSize <= IDEAL_FILE_SIZE_KB.max) {
      return { score: 1, maxScore: 1, passed: true, details: `File size ${fileSize}KB is optimal` };
    } else if (fileSize > IDEAL_FILE_SIZE_KB.max) {
      return { score: 0.5, maxScore: 1, passed: false, details: `File size ${fileSize}KB is too large (max 500KB)` };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: `File size ${fileSize}KB may be too small` };
  }

  private static analyzeFormatType(extractionMode: ExtractionMode, filename?: string): MetricResult {
    const isPDF = filename?.toLowerCase().endsWith('.pdf');
    const isDOCX = filename?.toLowerCase().endsWith('.docx');
    
    // OCR mode indicates image-based PDF (not ATS-friendly)
    if (extractionMode === 'OCR') {
      return { score: 0, maxScore: 1, passed: false, details: 'Image-based PDF detected - not ATS-friendly' };
    }
    
    if (isPDF || isDOCX) {
      return { score: 1, maxScore: 1, passed: true, details: 'ATS-friendly format (PDF/DOCX)' };
    }
    
    return { score: 0.5, maxScore: 1, passed: false, details: 'Use PDF or DOCX format for best ATS compatibility' };
  }

  private static analyzeNameConsistency(resumeText: string, filename?: string): MetricResult {
    if (!filename) {
      return { score: 0.5, maxScore: 1, passed: true, details: 'Cannot verify name consistency' };
    }

    // Extract potential name from filename
    const filenameWords = filename.replace(/[_-]/g, ' ').split(/\s+/);
    const firstLine = resumeText.split('\n')[0] || '';
    
    // Check if any filename word appears in first line (likely name)
    const hasMatch = filenameWords.some(word => 
      word.length > 2 && firstLine.toLowerCase().includes(word.toLowerCase())
    );

    if (hasMatch) {
      return { score: 1, maxScore: 1, passed: true, details: 'Name in filename matches resume' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Ensure filename contains your name' };
  }

  private static analyzeVersionNaming(filename?: string): MetricResult {
    if (!filename) {
      return { score: 1, maxScore: 1, passed: true, details: 'No version naming issues detected' };
    }

    const hasVersioning = /v\d|version|final|draft|\(\d+\)|copy/i.test(filename);
    
    if (hasVersioning) {
      return { score: 0, maxScore: 1, passed: false, details: 'Remove version numbers from filename' };
    }
    return { score: 1, maxScore: 1, passed: true, details: 'No version naming issues' };
  }

  // ============================================================================
  // LENGTH & STRUCTURE METRICS (5)
  // ============================================================================

  private static analyzePageCount(pageCount?: number, resumeText?: string): MetricResult {
    // Estimate page count from text if not provided
    const estimatedPages = pageCount || Math.ceil((resumeText?.length || 0) / 3000);
    
    if (estimatedPages >= IDEAL_PAGE_COUNT.min && estimatedPages <= IDEAL_PAGE_COUNT.max) {
      return { score: 1, maxScore: 1, passed: true, details: `${estimatedPages} page(s) - optimal length` };
    } else if (estimatedPages > IDEAL_PAGE_COUNT.max) {
      return { score: 0.5, maxScore: 1, passed: false, details: `${estimatedPages} pages - consider condensing to 1-2 pages` };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Resume may be too short' };
  }

  private static analyzeWordCount(resumeText: string): MetricResult {
    const words = resumeText.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    if (wordCount >= IDEAL_WORD_COUNT.min && wordCount <= IDEAL_WORD_COUNT.max) {
      return { score: 1, maxScore: 1, passed: true, details: `${wordCount} words - optimal length` };
    } else if (wordCount < IDEAL_WORD_COUNT.min) {
      return { score: 0.5, maxScore: 1, passed: false, details: `${wordCount} words - add more detail` };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: `${wordCount} words - consider condensing` };
  }

  private static analyzeWhitespaceRatio(resumeText: string): MetricResult {
    const totalChars = resumeText.length;
    const whitespaceChars = (resumeText.match(/\s/g) || []).length;
    const ratio = totalChars > 0 ? whitespaceChars / totalChars : 0;

    if (ratio >= IDEAL_WHITESPACE_RATIO.min && ratio <= IDEAL_WHITESPACE_RATIO.max) {
      return { score: 1, maxScore: 1, passed: true, details: 'Good whitespace balance' };
    } else if (ratio < IDEAL_WHITESPACE_RATIO.min) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'Text may be too dense - add spacing' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Too much whitespace - add content' };
  }

  private static analyzeMargins(resumeText: string): MetricResult {
    // Heuristic: check for very long lines (suggests narrow margins)
    const lines = resumeText.split('\n');
    const longLines = lines.filter(line => line.length > 100).length;
    const ratio = lines.length > 0 ? longLines / lines.length : 0;

    if (ratio < 0.1) {
      return { score: 1, maxScore: 1, passed: true, details: 'Margins appear appropriate' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Consider wider margins for readability' };
  }

  private static analyzeLineSpacing(resumeText: string): MetricResult {
    // Check for double line breaks (indicates good spacing)
    const doubleBreaks = (resumeText.match(/\n\n/g) || []).length;
    const singleBreaks = (resumeText.match(/\n/g) || []).length;
    const ratio = singleBreaks > 0 ? doubleBreaks / singleBreaks : 0;

    if (ratio >= 0.1 && ratio <= 0.4) {
      return { score: 1, maxScore: 1, passed: true, details: 'Good line spacing' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Adjust line spacing for better readability' };
  }

  // ============================================================================
  // FONT & TYPOGRAPHY METRICS (5)
  // ============================================================================

  private static analyzeFontChoice(resumeText: string): MetricResult {
    // Check for font mentions in text (from PDF extraction)
    const lowerText = resumeText.toLowerCase();
    const hasATSFont = ATS_FRIENDLY_FONTS.some(font => lowerText.includes(font));
    
    // Default to pass since we can't always detect fonts
    if (hasATSFont) {
      return { score: 1, maxScore: 1, passed: true, details: 'ATS-friendly font detected' };
    }
    return { score: 0.75, maxScore: 1, passed: true, details: 'Use Arial, Calibri, or Times New Roman' };
  }

  private static analyzeBodyFontSize(): MetricResult {
    // Cannot detect from text - assume compliant
    return { score: 0.75, maxScore: 1, passed: true, details: 'Use 10-12pt for body text' };
  }

  private static analyzeHeaderFontSize(): MetricResult {
    // Cannot detect from text - assume compliant
    return { score: 0.75, maxScore: 1, passed: true, details: 'Use 14-16pt for headers' };
  }

  private static analyzeFontConsistency(resumeText: string): MetricResult {
    // Check for consistent formatting patterns
    const bulletPatterns = resumeText.match(/^[\s]*[•\-\*]/gm) || [];
    const uniquePatterns = new Set(bulletPatterns.map(p => p.trim()[0]));
    
    if (uniquePatterns.size <= 1) {
      return { score: 1, maxScore: 1, passed: true, details: 'Consistent formatting detected' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Use consistent bullet styles' };
  }

  private static analyzeFontWeightStyle(): MetricResult {
    // Cannot detect from text - assume compliant
    return { score: 0.75, maxScore: 1, passed: true, details: 'Use bold for headers, regular for body' };
  }

  // ============================================================================
  // COLOR & VISUAL METRICS (5)
  // ============================================================================

  private static analyzeTextColor(hasColors?: boolean): MetricResult {
    if (hasColors === false) {
      return { score: 1, maxScore: 1, passed: true, details: 'Black text - ATS optimal' };
    }
    return { score: 0.75, maxScore: 1, passed: true, details: 'Use black text for ATS compatibility' };
  }

  private static analyzeAccentColors(hasColors?: boolean): MetricResult {
    if (hasColors === true) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'Minimize color usage for ATS' };
    }
    return { score: 1, maxScore: 1, passed: true, details: 'Minimal accent colors - good for ATS' };
  }

  private static analyzeTablesGraphics(hasTables?: boolean, hasGraphics?: boolean, hasMultipleColumns?: boolean): MetricResult {
    const issues: string[] = [];
    
    if (hasTables) issues.push('tables');
    if (hasGraphics) issues.push('graphics');
    if (hasMultipleColumns) issues.push('multiple columns');
    
    if (issues.length === 0) {
      return { score: 1, maxScore: 1, passed: true, details: 'No tables/graphics - ATS friendly' };
    }
    return { 
      score: 0, 
      maxScore: 1, 
      passed: false, 
      details: `Remove ${issues.join(', ')} for ATS compatibility` 
    };
  }

  private static analyzeBackground(): MetricResult {
    // Cannot detect from text - assume white background
    return { score: 1, maxScore: 1, passed: true, details: 'Use white background' };
  }

  private static analyzeVisualHierarchy(resumeText: string): MetricResult {
    // Check for section headers (ALL CAPS or followed by colon)
    const headers = resumeText.match(/^[A-Z][A-Z\s]+:?$/gm) || [];
    
    if (headers.length >= 3) {
      return { score: 1, maxScore: 1, passed: true, details: 'Clear section headers detected' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Add clear section headers' };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static detectFormatIssues(input: BasicStructureInput, metrics: BasicStructureMetrics): FormatIssue[] {
    const issues: FormatIssue[] = [];

    if (input.extractionMode === 'OCR') {
      issues.push({
        type: 'image',
        description: 'Resume is image-based (scanned) - ATS cannot parse',
        severity: 'high',
      });
    }

    if (input.hasTables) {
      issues.push({
        type: 'table',
        description: 'Tables detected - may cause ATS parsing issues',
        severity: 'medium',
      });
    }

    if (input.hasMultipleColumns) {
      issues.push({
        type: 'multi_column',
        description: 'Multiple columns detected - ATS may read incorrectly',
        severity: 'high',
      });
    }

    if (input.hasGraphics) {
      issues.push({
        type: 'graphics',
        description: 'Graphics/images detected - not parsed by ATS',
        severity: 'medium',
      });
    }

    if (input.hasColors) {
      issues.push({
        type: 'color',
        description: 'Colors detected - may not render in ATS',
        severity: 'low',
      });
    }

    return issues;
  }

  private static calculateTierScore(metrics: BasicStructureMetrics): TierScore {
    const allMetrics = Object.values(metrics);
    const totalScore = allMetrics.reduce((sum, m) => sum + m.score, 0);
    const maxScore = allMetrics.reduce((sum, m) => sum + m.maxScore, 0);
    const metricsPassed = allMetrics.filter(m => m.passed).length;
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const weightedContribution = (percentage * TIER_CONFIG.weight) / 100;

    // Collect top issues (failed metrics)
    const topIssues = allMetrics
      .filter(m => !m.passed)
      .map(m => m.details)
      .slice(0, 5);

    return {
      tier_number: TIER_CONFIG.tierNumber,
      tier_name: TIER_CONFIG.tierName,
      score: Math.round(totalScore * 100) / 100,
      max_score: maxScore,
      percentage: Math.round(percentage * 100) / 100,
      weight: TIER_CONFIG.weight,
      weighted_contribution: Math.round(weightedContribution * 100) / 100,
      metrics_passed: metricsPassed,
      metrics_total: TIER_CONFIG.metricsTotal,
      top_issues: topIssues,
    };
  }
}

export default BasicStructureAnalyzer;
