import { 
  FormattingAnalyzerInterface, 
  FormattingAssessment, 
  FormattingIssue, 
  PenaltyAssessment, 
  ProcessedDocument,
  FormattingIssueType,
  ADAPTIVE_PENALTIES,
  FORMATTING_WEIGHTS
} from '../types/resume';

/**
 * Adaptive Formatting Analyzer
 * 
 * Provides graduated penalty system for formatting issues, replacing
 * harsh binary penalties with nuanced assessment based on ATS impact severity.
 */
export class AdaptiveFormattingAnalyzer implements FormattingAnalyzerInterface {
  
  /**
   * Analyze document formatting with adaptive penalties
   */
  analyzeFormatting(document: ProcessedDocument): FormattingAssessment {
    try {
      // Detect formatting issues
      const issues = this.detectFormattingIssues(document);
      
      // Calculate penalties
      const penalties = this.calculatePenalties(issues);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(issues);
      
      // Calculate overall score
      const overallScore = this.calculateOverallScore(penalties);
      
      // Assess ATS compatibility
      const atsCompatibility = this.assessATSCompatibility(overallScore, issues);
      
      return {
        overallScore,
        issues,
        penalties,
        atsCompatibility
      };
      
    } catch (error) {
      console.error('Formatting analysis failed:', error);
      
      // Return fallback assessment
      return {
        overallScore: 50, // Neutral score
        issues: [],
        penalties: {
          totalPenalty: 0,
          penaltiesByType: {} as Record<FormattingIssueType, number>,
          severityBreakdown: { Minor: 0, Moderate: 0, Severe: 0 }
        },
        atsCompatibility: 'Medium'
      };
    }
  }
  
  /**
   * Calculate penalties based on formatting issues
   */
  calculatePenalties(issues: FormattingIssue[]): PenaltyAssessment {
    let totalPenalty = 0;
    const penaltiesByType: Record<FormattingIssueType, number> = {} as Record<FormattingIssueType, number>;
    const severityBreakdown = { Minor: 0, Moderate: 0, Severe: 0 };
    
    issues.forEach(issue => {
      // Add to total penalty
      totalPenalty += issue.penalty;
      
      // Track penalties by type
      if (!penaltiesByType[issue.type]) {
        penaltiesByType[issue.type] = 0;
      }
      penaltiesByType[issue.type] += issue.penalty;
      
      // Track by severity
      severityBreakdown[issue.severity] += issue.penalty;
    });
    
    return {
      totalPenalty,
      penaltiesByType,
      severityBreakdown
    };
  }
  
  /**
   * Generate specific recommendations for formatting issues
   */
  generateRecommendations(issues: FormattingIssue[]): string[] {
    const recommendations: string[] = [];
    const issueTypes = new Set(issues.map(issue => issue.type));
    
    // Generate type-specific recommendations
    if (issueTypes.has('multi_column')) {
      recommendations.push('Convert to single-column layout for better ATS compatibility');
      recommendations.push('Ensure content flows logically from top to bottom');
    }
    
    if (issueTypes.has('tables')) {
      recommendations.push('Replace tables with simple text formatting using bullet points');
      recommendations.push('Use consistent spacing instead of table borders');
    }
    
    if (issueTypes.has('textboxes')) {
      recommendations.push('Remove textboxes and integrate content into main document flow');
      recommendations.push('Use standard section headers instead of textbox titles');
    }
    
    if (issueTypes.has('graphics')) {
      recommendations.push('Remove graphics, icons, and images for ATS compatibility');
      recommendations.push('Replace visual elements with text descriptions if necessary');
    }
    
    if (issueTypes.has('colors')) {
      recommendations.push('Use black text on white background only');
      recommendations.push('Remove colored text, backgrounds, and highlighting');
    }
    
    if (issueTypes.has('fonts')) {
      recommendations.push('Use standard fonts like Arial, Calibri, or Times New Roman');
      recommendations.push('Maintain consistent font size (10-12pt for body text)');
    }
    
    if (issueTypes.has('spacing')) {
      recommendations.push('Use consistent line spacing (1.0 or 1.15)');
      recommendations.push('Maintain proper margins (0.5-1 inch on all sides)');
    }
    
    if (issueTypes.has('headers')) {
      recommendations.push('Use standard section headers (EXPERIENCE, EDUCATION, SKILLS)');
      recommendations.push('Ensure headers are clearly distinguishable but ATS-friendly');
    }
    
    // Add general recommendations based on severity
    const severeIssues = issues.filter(issue => issue.severity === 'Severe');
    if (severeIssues.length > 0) {
      recommendations.unshift('Consider generating a new ATS-friendly resume to address critical formatting issues');
    }
    
    return recommendations;
  }
  
  /**
   * Detect formatting issues in the document
   */
  private detectFormattingIssues(document: ProcessedDocument): FormattingIssue[] {
    const issues: FormattingIssue[] = [];
    
    // Check for multi-column layout
    if (document.layoutStructure?.columns.columnCount > 1) {
      const severity = document.layoutStructure.columns.columnCount > 2 ? 'Severe' : 'Moderate';
      issues.push({
        type: 'multi_column',
        severity,
        description: `Document uses ${document.layoutStructure.columns.columnCount}-column layout`,
        penalty: this.getPenaltyForIssue('multi_column', severity),
        recommendation: 'Convert to single-column layout for better ATS parsing',
        atsImpact: 'Multi-column layouts can cause content to be read out of order by ATS systems'
      });
    }
    
    // Check for textboxes
    if (document.layoutStructure?.textboxes.length > 0) {
      const count = document.layoutStructure.textboxes.length;
      const severity = count > 3 ? 'Severe' : count > 1 ? 'Moderate' : 'Minor';
      issues.push({
        type: 'textboxes',
        severity,
        description: `Document contains ${count} textbox(es)`,
        penalty: this.getPenaltyForIssue('textboxes', severity),
        recommendation: 'Remove textboxes and integrate content into main text flow',
        atsImpact: 'Textboxes may not be parsed correctly or may be ignored entirely'
      });
    }
    
    // Check for tables
    if (document.layoutStructure?.tables.length > 0) {
      const count = document.layoutStructure.tables.length;
      const severity = count > 2 ? 'Severe' : count > 1 ? 'Moderate' : 'Minor';
      issues.push({
        type: 'tables',
        severity,
        description: `Document contains ${count} table(s)`,
        penalty: this.getPenaltyForIssue('tables', severity),
        recommendation: 'Replace tables with bullet points and consistent formatting',
        atsImpact: 'Tables can cause parsing errors and content misalignment'
      });
    }
    
    // Check for OCR-based extraction (indicates image-based resume)
    if (document.extractionMode === 'OCR') {
      issues.push({
        type: 'graphics',
        severity: 'Severe',
        description: 'Resume appears to be image-based (scanned or screenshot)',
        penalty: this.getPenaltyForIssue('graphics', 'Severe'),
        recommendation: 'Use a text-based PDF or Word document instead of images',
        atsImpact: 'Image-based resumes cannot be parsed by most ATS systems'
      });
    }
    
    // Analyze text content for formatting issues
    const textIssues = this.analyzeTextFormatting(document.extractedText);
    issues.push(...textIssues);
    
    return issues;
  }
  
  /**
   * Analyze text content for formatting issues
   */
  private analyzeTextFormatting(text: string): FormattingIssue[] {
    const issues: FormattingIssue[] = [];
    
    // Check for excessive spacing
    if (/\s{5,}/.test(text)) {
      issues.push({
        type: 'spacing',
        severity: 'Minor',
        description: 'Excessive whitespace detected',
        penalty: this.getPenaltyForIssue('spacing', 'Minor'),
        recommendation: 'Use consistent, standard spacing',
        atsImpact: 'Excessive spacing can interfere with content parsing'
      });
    }
    
    // Check for unusual characters (may indicate font/encoding issues)
    const unusualChars = text.match(/[^\w\s\-.,;:!?()[\]{}'"@#$%^&*+=<>\/\\|`~]/g);
    if (unusualChars && unusualChars.length > 5) {
      issues.push({
        type: 'fonts',
        severity: 'Moderate',
        description: 'Unusual characters detected (possible font/encoding issues)',
        penalty: this.getPenaltyForIssue('fonts', 'Moderate'),
        recommendation: 'Use standard fonts and avoid special characters',
        atsImpact: 'Special characters may not be recognized by ATS systems'
      });
    }
    
    // Check for inconsistent header formatting
    const headers = text.match(/^[A-Z][A-Z\s]+$/gm);
    if (headers && headers.length > 0) {
      const inconsistentHeaders = headers.some(header => 
        header.length < 3 || header.length > 30 || !/^[A-Z\s]+$/.test(header)
      );
      
      if (inconsistentHeaders) {
        issues.push({
          type: 'headers',
          severity: 'Minor',
          description: 'Inconsistent header formatting detected',
          penalty: this.getPenaltyForIssue('headers', 'Minor'),
          recommendation: 'Use consistent, standard section headers',
          atsImpact: 'Inconsistent headers may not be recognized as section dividers'
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Get penalty value for specific issue type and severity
   */
  private getPenaltyForIssue(type: FormattingIssueType, severity: 'Minor' | 'Moderate' | 'Severe'): number {
    const typeKey = type === 'multi_column' ? 'multiColumn' : type;
    const weights = FORMATTING_WEIGHTS[typeKey as keyof typeof FORMATTING_WEIGHTS];
    
    if (!weights) {
      // Default penalties if type not found
      return severity === 'Minor' ? 1 : severity === 'Moderate' ? 3 : 6;
    }
    
    return weights[severity.toLowerCase() as keyof typeof weights];
  }
  
  /**
   * Calculate overall formatting score
   */
  private calculateOverallScore(penalties: PenaltyAssessment): number {
    const baseScore = 100;
    const adjustedScore = baseScore - penalties.totalPenalty;
    
    // Ensure score stays within bounds
    return Math.max(0, Math.min(100, adjustedScore));
  }
  
  /**
   * Assess ATS compatibility based on score and issues
   */
  private assessATSCompatibility(
    score: number, 
    issues: FormattingIssue[]
  ): 'High' | 'Medium' | 'Low' {
    const severeIssues = issues.filter(issue => issue.severity === 'Severe');
    const moderateIssues = issues.filter(issue => issue.severity === 'Moderate');
    
    // Severe issues automatically reduce compatibility
    if (severeIssues.length > 0) {
      return 'Low';
    }
    
    // Multiple moderate issues reduce compatibility
    if (moderateIssues.length > 2) {
      return 'Low';
    }
    
    // Score-based assessment
    if (score >= 85) return 'High';
    if (score >= 70) return 'Medium';
    return 'Low';
  }
  
  /**
   * Validate formatting assessment results
   */
  validateAssessment(assessment: FormattingAssessment): {
    valid: boolean;
    issues: string[];
  } {
    const validationIssues: string[] = [];
    
    // Check score bounds
    if (assessment.overallScore < 0 || assessment.overallScore > 100) {
      validationIssues.push('Overall score is out of valid range (0-100)');
    }
    
    // Check penalty calculation
    const calculatedTotal = assessment.issues.reduce((sum, issue) => sum + issue.penalty, 0);
    if (Math.abs(calculatedTotal - assessment.penalties.totalPenalty) > 0.1) {
      validationIssues.push('Penalty calculation mismatch');
    }
    
    // Check severity breakdown
    const severitySum = Object.values(assessment.penalties.severityBreakdown).reduce((sum, val) => sum + val, 0);
    if (Math.abs(severitySum - assessment.penalties.totalPenalty) > 0.1) {
      validationIssues.push('Severity breakdown does not match total penalty');
    }
    
    // Check ATS compatibility logic
    const severeCount = assessment.issues.filter(issue => issue.severity === 'Severe').length;
    if (severeCount > 0 && assessment.atsCompatibility !== 'Low') {
      validationIssues.push('ATS compatibility should be Low when severe issues are present');
    }
    
    return {
      valid: validationIssues.length === 0,
      issues: validationIssues
    };
  }
  
  /**
   * Get formatting improvement priority
   */
  getImprovementPriority(issues: FormattingIssue[]): FormattingIssue[] {
    return issues.sort((a, b) => {
      // Sort by severity first
      const severityOrder = { 'Severe': 3, 'Moderate': 2, 'Minor': 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      
      if (severityDiff !== 0) return severityDiff;
      
      // Then by penalty value
      return b.penalty - a.penalty;
    });
  }
  
  /**
   * Generate summary of formatting issues
   */
  generateSummary(assessment: FormattingAssessment): string {
    const { issues, overallScore, atsCompatibility } = assessment;
    
    if (issues.length === 0) {
      return `Excellent formatting! Your resume has no detected formatting issues and scores ${overallScore}/100 with ${atsCompatibility} ATS compatibility.`;
    }
    
    const severeCount = issues.filter(i => i.severity === 'Severe').length;
    const moderateCount = issues.filter(i => i.severity === 'Moderate').length;
    const minorCount = issues.filter(i => i.severity === 'Minor').length;
    
    let summary = `Formatting Score: ${overallScore}/100 (${atsCompatibility} ATS Compatibility)\n\n`;
    
    if (severeCount > 0) {
      summary += `⚠️ ${severeCount} severe issue(s) detected that significantly impact ATS compatibility.\n`;
    }
    
    if (moderateCount > 0) {
      summary += `⚡ ${moderateCount} moderate issue(s) that may affect parsing accuracy.\n`;
    }
    
    if (minorCount > 0) {
      summary += `ℹ️ ${minorCount} minor issue(s) with minimal impact.\n`;
    }
    
    summary += `\nPriority: Address ${severeCount > 0 ? 'severe' : moderateCount > 0 ? 'moderate' : 'minor'} issues first for maximum improvement.`;
    
    return summary;
  }
}

// Export singleton instance
export const adaptiveFormattingAnalyzer = new AdaptiveFormattingAnalyzer();