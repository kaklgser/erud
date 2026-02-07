import { 
  ParsingQuality, 
  QualityAssessment, 
  ExtractionMode, 
  ProcessingWarning,
  ConfidenceAssessment,
  ConfidenceFactor,
  ConfidenceLevel
} from '../types/resume';

/**
 * Parsing Quality Assessment Service
 * 
 * Provides comprehensive quality assessment for document parsing results,
 * including confidence calculation and quality metrics.
 */
export class ParsingQualityAssessment {
  
  /**
   * Assess overall parsing quality based on multiple factors
   */
  assessParsingQuality(
    extractedText: string,
    extractionMode: ExtractionMode,
    processingTime: number,
    warnings: ProcessingWarning[]
  ): ParsingQuality {
    
    const textAccuracy = this.assessTextAccuracy(extractedText, extractionMode);
    const structurePreservation = this.assessStructurePreservation(extractedText, extractionMode);
    const contentCompleteness = this.assessContentCompleteness(extractedText, warnings);
    const orderingAccuracy = this.assessOrderingAccuracy(extractedText, extractionMode);
    
    const overallScore = this.calculateOverallScore({
      textAccuracy,
      structurePreservation,
      contentCompleteness,
      orderingAccuracy
    });
    
    return {
      textAccuracy,
      structurePreservation,
      contentCompleteness,
      orderingAccuracy,
      overallScore
    };
  }
  
  /**
   * Calculate confidence assessment based on parsing quality
   */
  calculateConfidenceAssessment(
    parsingQuality: ParsingQuality,
    extractionMode: ExtractionMode,
    contentLength: number,
    warnings: ProcessingWarning[]
  ): ConfidenceAssessment {
    
    const factors = this.identifyConfidenceFactors(
      parsingQuality,
      extractionMode,
      contentLength,
      warnings
    );
    
    const score = this.calculateConfidenceScore(factors, parsingQuality.overallScore);
    const level = this.determineConfidenceLevel(score);
    const limitations = this.identifyLimitations(extractionMode, warnings);
    const recommendations = this.generateRecommendations(level, limitations);
    
    return {
      level,
      score,
      factors,
      limitations,
      recommendations
    };
  }
  
  /**
   * Assess text accuracy based on extraction mode and content analysis
   */
  private assessTextAccuracy(extractedText: string, extractionMode: ExtractionMode): number {
    let baseAccuracy = 95; // Start with high assumption for direct text
    
    // Adjust based on extraction mode
    switch (extractionMode) {
      case 'OCR':
        baseAccuracy = 75; // OCR has inherent accuracy limitations
        break;
      case 'HYBRID':
        baseAccuracy = 85; // Hybrid approach balances accuracy and capability
        break;
      case 'TEXT':
      default:
        baseAccuracy = 95; // Direct text extraction is most accurate
        break;
    }
    
    // Analyze text for quality indicators
    const qualityIndicators = this.analyzeTextQuality(extractedText);
    
    // Adjust based on quality indicators
    if (qualityIndicators.hasGarbledText) baseAccuracy -= 15;
    if (qualityIndicators.hasMissingSpaces) baseAccuracy -= 10;
    if (qualityIndicators.hasIncorrectCharacters) baseAccuracy -= 20;
    if (qualityIndicators.hasGoodStructure) baseAccuracy += 5;
    
    return Math.max(0, Math.min(100, baseAccuracy));
  }
  
  /**
   * Assess structure preservation during parsing
   */
  private assessStructurePreservation(extractedText: string, extractionMode: ExtractionMode): number {
    let baseScore = 90;
    
    // OCR and complex parsing may lose structure
    if (extractionMode === 'OCR') {
      baseScore = 70;
    } else if (extractionMode === 'HYBRID') {
      baseScore = 80;
    }
    
    // Analyze structure indicators
    const structureIndicators = this.analyzeStructure(extractedText);
    
    if (structureIndicators.hasHeaders) baseScore += 5;
    if (structureIndicators.hasBulletPoints) baseScore += 5;
    if (structureIndicators.hasProperSections) baseScore += 10;
    if (structureIndicators.hasJumbledContent) baseScore -= 20;
    
    return Math.max(0, Math.min(100, baseScore));
  }
  
  /**
   * Assess content completeness
   */
  private assessContentCompleteness(extractedText: string, warnings: ProcessingWarning[]): number {
    const textLength = extractedText.length;
    let completenessScore = 90;
    
    // Assess based on content length
    if (textLength < 100) {
      completenessScore = 20; // Very short suggests major extraction issues
    } else if (textLength < 500) {
      completenessScore = 50; // Short content may indicate partial extraction
    } else if (textLength < 1000) {
      completenessScore = 75; // Reasonable length
    } else {
      completenessScore = 90; // Good length suggests complete extraction
    }
    
    // Check for warning indicators
    const extractionWarnings = warnings.filter(w => 
      w.type === 'parsing' || w.type === 'ocr' || w.type === 'layout'
    );
    
    if (extractionWarnings.length > 0) {
      completenessScore -= extractionWarnings.length * 10;
    }
    
    return Math.max(0, Math.min(100, completenessScore));
  }
  
  /**
   * Assess content ordering accuracy
   */
  private assessOrderingAccuracy(extractedText: string, extractionMode: ExtractionMode): number {
    let baseScore = 90;
    
    // Multi-column and complex layouts may have ordering issues
    if (extractionMode === 'OCR') {
      baseScore = 70; // OCR may not preserve reading order
    } else if (extractionMode === 'HYBRID') {
      baseScore = 80;
    }
    
    // Analyze ordering indicators
    const orderingIndicators = this.analyzeOrdering(extractedText);
    
    if (orderingIndicators.hasLogicalFlow) baseScore += 5;
    if (orderingIndicators.hasProperSequence) baseScore += 5;
    if (orderingIndicators.hasJumbledSections) baseScore -= 15;
    
    return Math.max(0, Math.min(100, baseScore));
  }
  
  /**
   * Calculate overall quality score with weighted average
   */
  private calculateOverallScore(scores: {
    textAccuracy: number;
    structurePreservation: number;
    contentCompleteness: number;
    orderingAccuracy: number;
  }): number {
    const weights = {
      textAccuracy: 0.3,        // 30% - Most important
      contentCompleteness: 0.3,  // 30% - Equally important
      structurePreservation: 0.25, // 25%
      orderingAccuracy: 0.15     // 15%
    };
    
    return (
      scores.textAccuracy * weights.textAccuracy +
      scores.contentCompleteness * weights.contentCompleteness +
      scores.structurePreservation * weights.structurePreservation +
      scores.orderingAccuracy * weights.orderingAccuracy
    );
  }
  
  /**
   * Identify confidence factors affecting the assessment
   */
  private identifyConfidenceFactors(
    parsingQuality: ParsingQuality,
    extractionMode: ExtractionMode,
    contentLength: number,
    warnings: ProcessingWarning[]
  ): ConfidenceFactor[] {
    const factors: ConfidenceFactor[] = [];
    
    // Extraction mode factor
    if (extractionMode === 'TEXT') {
      factors.push({
        factor: 'Direct text extraction',
        impact: 'positive',
        weight: 0.2,
        description: 'Text was extracted directly from the document format'
      });
    } else if (extractionMode === 'OCR') {
      factors.push({
        factor: 'OCR processing required',
        impact: 'negative',
        weight: 0.3,
        description: 'Optical character recognition may introduce errors'
      });
    }
    
    // Content length factor
    if (contentLength > 1000) {
      factors.push({
        factor: 'Substantial content extracted',
        impact: 'positive',
        weight: 0.15,
        description: 'Good amount of content suggests successful extraction'
      });
    } else if (contentLength < 500) {
      factors.push({
        factor: 'Limited content extracted',
        impact: 'negative',
        weight: 0.2,
        description: 'Short content may indicate extraction issues'
      });
    }
    
    // Quality score factor
    if (parsingQuality.overallScore > 85) {
      factors.push({
        factor: 'High parsing quality',
        impact: 'positive',
        weight: 0.25,
        description: 'Parsing quality metrics indicate successful extraction'
      });
    } else if (parsingQuality.overallScore < 60) {
      factors.push({
        factor: 'Low parsing quality',
        impact: 'negative',
        weight: 0.3,
        description: 'Quality metrics suggest potential parsing issues'
      });
    }
    
    // Warnings factor
    if (warnings.length === 0) {
      factors.push({
        factor: 'No processing warnings',
        impact: 'positive',
        weight: 0.1,
        description: 'Processing completed without issues'
      });
    } else if (warnings.length > 2) {
      factors.push({
        factor: 'Multiple processing warnings',
        impact: 'negative',
        weight: 0.15,
        description: 'Several issues detected during processing'
      });
    }
    
    return factors;
  }
  
  /**
   * Calculate confidence score based on factors
   */
  private calculateConfidenceScore(factors: ConfidenceFactor[], baseScore: number): number {
    let adjustedScore = baseScore;
    
    for (const factor of factors) {
      const adjustment = factor.weight * 100;
      if (factor.impact === 'positive') {
        adjustedScore += adjustment * 0.1; // Positive factors add up to 10% of their weight
      } else if (factor.impact === 'negative') {
        adjustedScore -= adjustment * 0.15; // Negative factors subtract up to 15% of their weight
      }
    }
    
    return Math.max(0, Math.min(100, adjustedScore));
  }
  
  /**
   * Determine confidence level based on score
   */
  private determineConfidenceLevel(score: number): ConfidenceLevel {
    if (score >= 80) return 'High';
    if (score >= 60) return 'Medium';
    return 'Low';
  }
  
  /**
   * Identify limitations based on extraction mode and warnings
   */
  private identifyLimitations(extractionMode: ExtractionMode, warnings: ProcessingWarning[]): string[] {
    const limitations: string[] = [];
    
    if (extractionMode === 'OCR') {
      limitations.push('OCR processing may have introduced character recognition errors');
      limitations.push('Complex layouts may not be perfectly preserved');
    }
    
    if (extractionMode === 'HYBRID') {
      limitations.push('Hybrid processing may have mixed accuracy across different document sections');
    }
    
    const layoutWarnings = warnings.filter(w => w.type === 'layout');
    if (layoutWarnings.length > 0) {
      limitations.push('Document layout complexity may affect content ordering');
    }
    
    const formatWarnings = warnings.filter(w => w.type === 'format');
    if (formatWarnings.length > 0) {
      limitations.push('Document formatting may not be fully compatible with ATS systems');
    }
    
    return limitations;
  }
  
  /**
   * Generate recommendations based on confidence level and limitations
   */
  private generateRecommendations(level: ConfidenceLevel, limitations: string[]): string[] {
    const recommendations: string[] = [];
    
    if (level === 'Low') {
      recommendations.push('Consider uploading a simpler document format (PDF or DOCX)');
      recommendations.push('Verify that the extracted content matches your original resume');
      recommendations.push('Consider manually reviewing and correcting any extraction errors');
    } else if (level === 'Medium') {
      recommendations.push('Review the extracted content for any obvious errors');
      recommendations.push('Consider the confidence limitations when interpreting results');
    }
    
    if (limitations.some(l => l.includes('OCR'))) {
      recommendations.push('For better accuracy, use a text-based PDF instead of scanned images');
    }
    
    if (limitations.some(l => l.includes('layout'))) {
      recommendations.push('Consider using a simpler, single-column resume layout');
    }
    
    return recommendations;
  }
  
  /**
   * Analyze text quality indicators
   */
  private analyzeTextQuality(text: string): {
    hasGarbledText: boolean;
    hasMissingSpaces: boolean;
    hasIncorrectCharacters: boolean;
    hasGoodStructure: boolean;
  } {
    // Simple heuristics for text quality
    const hasGarbledText = /[^\w\s\-.,;:!?()[\]{}'"@#$%^&*+=<>\/\\|`~]/g.test(text);
    const hasMissingSpaces = /\w{20,}/.test(text); // Very long words suggest missing spaces
    const hasIncorrectCharacters = /[^\x00-\x7F]/g.test(text) && !/[àáâãäåæçèéêëìíîïñòóôõöøùúûüý]/i.test(text);
    const hasGoodStructure = /\n\s*\n/.test(text) && /[A-Z][a-z]+:/.test(text);
    
    return {
      hasGarbledText,
      hasMissingSpaces,
      hasIncorrectCharacters,
      hasGoodStructure
    };
  }
  
  /**
   * Analyze structure indicators
   */
  private analyzeStructure(text: string): {
    hasHeaders: boolean;
    hasBulletPoints: boolean;
    hasProperSections: boolean;
    hasJumbledContent: boolean;
  } {
    const hasHeaders = /^[A-Z][A-Z\s]+$/m.test(text) || /\n[A-Z][a-z\s]+:\s*\n/.test(text);
    const hasBulletPoints = /[•·▪▫◦‣⁃]\s/.test(text) || /^\s*[-*]\s/m.test(text);
    const hasProperSections = /experience|education|skills|projects/i.test(text);
    const hasJumbledContent = /\d{4}.*\d{4}.*[A-Za-z]{10,}.*\d{4}/g.test(text.replace(/\s/g, ''));
    
    return {
      hasHeaders,
      hasBulletPoints,
      hasProperSections,
      hasJumbledContent
    };
  }
  
  /**
   * Analyze ordering indicators
   */
  private analyzeOrdering(text: string): {
    hasLogicalFlow: boolean;
    hasProperSequence: boolean;
    hasJumbledSections: boolean;
  } {
    const sections = text.toLowerCase();
    const hasLogicalFlow = sections.indexOf('experience') < sections.indexOf('education') || 
                          sections.indexOf('skills') < sections.indexOf('experience');
    const hasProperSequence = /\d{4}.*\d{4}/g.test(text);
    const hasJumbledSections = /education.*experience.*skills.*experience/i.test(text);
    
    return {
      hasLogicalFlow,
      hasProperSequence,
      hasJumbledSections
    };
  }
}

// Export singleton instance
export const parsingQualityAssessment = new ParsingQualityAssessment();