// src/services/enhancedConfidenceService.ts
// Enhanced Confidence Calibration Service - P0 Fix for Enterprise Readiness
//
// Addresses critical issue: Clean resumes getting "Medium" confidence when they should be "High"
// Implements proper confidence mapping aligned with actual parsing quality and score strength

import { ConfidenceLevel, ResumeData } from '../types/resume';
import { QualityMetrics } from './enhancedResumeParserService';

// ============================================================================
// ENHANCED CONFIDENCE CALIBRATION
// ============================================================================

export interface ConfidenceFactors {
  parsingQuality: number; // 0-1 from parsing process
  contentCompleteness: number; // 0-1 based on extracted data
  structuralIntegrity: number; // 0-1 based on resume structure
  formatComplexity: number; // 0-1 complexity penalty (inverted)
  scoreAlignment: number; // 0-1 based on ATS score strength
}

export interface ConfidenceResult {
  level: ConfidenceLevel;
  score: number; // 0-100
  factors: ConfidenceFactors;
  reasoning: string[];
  recommendations: string[];
}

export class EnhancedConfidenceService {
  
  /**
   * Calculate enhanced confidence with proper calibration
   * Addresses the issue where clean resumes get Medium confidence
   */
  static calculateEnhancedConfidence(
    resumeText: string,
    resumeData: ResumeData,
    qualityMetrics?: QualityMetrics,
    atsScore?: number,
    jobDescription?: string
  ): ConfidenceResult {
    
    console.log('🎯 Enhanced Confidence Calibration - P0 Fix');
    
    // Calculate individual confidence factors
    const factors = this.calculateConfidenceFactors(
      resumeText,
      resumeData,
      qualityMetrics,
      atsScore,
      jobDescription
    );
    
    // Calculate weighted confidence score
    const confidenceScore = this.calculateWeightedConfidence(factors);
    
    // Determine confidence level with proper thresholds
    const level = this.determineConfidenceLevel(confidenceScore, factors);
    
    // Generate reasoning and recommendations
    const reasoning = this.generateReasoning(factors, confidenceScore);
    const recommendations = this.generateRecommendations(factors, level);
    
    console.log(`✅ Enhanced Confidence: ${level} (${confidenceScore.toFixed(1)}%)`);
    console.log(`   Factors: Parsing=${factors.parsingQuality.toFixed(2)}, Content=${factors.contentCompleteness.toFixed(2)}, Structure=${factors.structuralIntegrity.toFixed(2)}`);
    
    return {
      level,
      score: confidenceScore,
      factors,
      reasoning,
      recommendations,
    };
  }

  /**
   * Calculate individual confidence factors
   */
  private static calculateConfidenceFactors(
    resumeText: string,
    resumeData: ResumeData,
    qualityMetrics?: QualityMetrics,
    atsScore?: number,
    jobDescription?: string
  ): ConfidenceFactors {
    
    return {
      parsingQuality: this.calculateParsingQuality(resumeText, resumeData, qualityMetrics),
      contentCompleteness: this.calculateContentCompleteness(resumeData),
      structuralIntegrity: this.calculateStructuralIntegrity(resumeData),
      formatComplexity: this.calculateFormatComplexity(resumeText, qualityMetrics),
      scoreAlignment: this.calculateScoreAlignment(atsScore, resumeData, jobDescription),
    };
  }

  /**
   * Calculate parsing quality factor (0-1)
   */
  private static calculateParsingQuality(
    resumeText: string,
    resumeData: ResumeData,
    qualityMetrics?: QualityMetrics
  ): number {
    let score = 0.3; // Base score
    
    // Use quality metrics if available (from enhanced parser)
    if (qualityMetrics) {
      score = qualityMetrics.overallConfidence;
    } else {
      // Fallback calculation for legacy parsing
      
      // Text length and readability
      if (resumeText.length > 2000) score += 0.25;
      else if (resumeText.length > 1000) score += 0.15;
      else if (resumeText.length > 500) score += 0.1;
      
      // Text quality indicators
      const wordCount = resumeText.split(/\s+/).length;
      const avgWordLength = resumeText.replace(/\s+/g, '').length / wordCount;
      
      if (avgWordLength > 4 && avgWordLength < 8) score += 0.1; // Good word length
      if (resumeText.match(/\b(experience|education|skills|projects)\b/gi)) score += 0.1;
      
      // Data extraction success
      if (resumeData.name && resumeData.name.length > 2) score += 0.15;
      if (resumeData.email && resumeData.email.includes('@')) score += 0.1;
    }
    
    return Math.min(1.0, score);
  }

  /**
   * Calculate content completeness factor (0-1)
   * Enhanced to properly reward complete resumes
   */
  private static calculateContentCompleteness(resumeData: ResumeData): number {
    let score = 0;
    
    // Essential contact information (30%)
    if (resumeData.name && resumeData.name.length > 2) score += 0.15;
    if (resumeData.email && resumeData.email.includes('@')) score += 0.1;
    if (resumeData.phone && resumeData.phone.length >= 10) score += 0.05;
    
    // Core resume sections (50%)
    if (resumeData.workExperience && resumeData.workExperience.length > 0) {
      score += 0.2;
      // Bonus for detailed work experience
      const totalBullets = resumeData.workExperience.reduce((sum, exp) => sum + (exp.bullets?.length || 0), 0);
      if (totalBullets >= 6) score += 0.05;
    }
    
    if (resumeData.skills && resumeData.skills.length > 0) {
      score += 0.15;
      // Bonus for multiple skill categories
      if (resumeData.skills.length >= 3) score += 0.05;
    }
    
    if (resumeData.education && resumeData.education.length > 0) score += 0.1;
    
    // Additional sections (20%)
    if (resumeData.projects && resumeData.projects.length > 0) {
      score += 0.1;
      // Bonus for detailed projects
      const totalProjectBullets = resumeData.projects.reduce((sum, proj) => sum + (proj.bullets?.length || 0), 0);
      if (totalProjectBullets >= 4) score += 0.05;
    }
    
    if (resumeData.summary && resumeData.summary.length > 50) score += 0.05;
    if (resumeData.certifications && resumeData.certifications.length > 0) score += 0.05;
    
    return Math.min(1.0, score);
  }

  /**
   * Calculate structural integrity factor (0-1)
   * Measures how well-structured and complete the resume data is
   */
  private static calculateStructuralIntegrity(resumeData: ResumeData): number {
    let score = 0.4; // Base score for basic structure
    
    // Work experience quality
    if (resumeData.workExperience && resumeData.workExperience.length > 0) {
      const expQuality = resumeData.workExperience.every(exp => 
        exp.role && exp.company && exp.year && exp.bullets && exp.bullets.length > 0
      );
      if (expQuality) score += 0.2;
      
      // Check for date consistency
      const hasValidDates = resumeData.workExperience.every(exp => 
        exp.year && (exp.year.includes('-') || exp.year.includes('to') || exp.year.includes('Present'))
      );
      if (hasValidDates) score += 0.1;
    }
    
    // Skills organization
    if (resumeData.skills && resumeData.skills.length > 0) {
      const skillsQuality = resumeData.skills.every(skill => 
        skill.category && skill.list && skill.list.length > 0
      );
      if (skillsQuality) score += 0.1;
      
      // Bonus for well-categorized skills
      const hasMultipleCategories = resumeData.skills.length >= 2;
      if (hasMultipleCategories) score += 0.05;
    }
    
    // Education completeness
    if (resumeData.education && resumeData.education.length > 0) {
      const eduQuality = resumeData.education.every(edu => 
        edu.degree && edu.school && edu.year
      );
      if (eduQuality) score += 0.1;
    }
    
    // Projects quality
    if (resumeData.projects && resumeData.projects.length > 0) {
      const projQuality = resumeData.projects.every(proj => 
        proj.title && proj.bullets && proj.bullets.length > 0
      );
      if (projQuality) score += 0.05;
    }
    
    return Math.min(1.0, score);
  }

  /**
   * Calculate format complexity factor (0-1)
   * Higher score = less complex format (easier to parse reliably)
   */
  private static calculateFormatComplexity(
    resumeText: string,
    qualityMetrics?: QualityMetrics
  ): number {
    let score = 0.8; // Start with high score (simple format assumption)
    
    // Use quality metrics if available
    if (qualityMetrics) {
      score = qualityMetrics.formatHandling;
    } else {
      // Fallback complexity detection
      
      // Check for complex formatting indicators
      if (resumeText.includes('\t\t')) score -= 0.1; // Multiple tabs
      if (resumeText.match(/\n\s{20,}/g)) score -= 0.1; // Large indentations
      if (resumeText.match(/[^\w\s\n.,;:!?()-]{5,}/g)) score -= 0.15; // Special chars
      
      // Check for multi-column indicators
      const lines = resumeText.split('\n');
      const shortLines = lines.filter(line => line.trim().length > 0 && line.trim().length < 40).length;
      const shortLineRatio = shortLines / Math.max(lines.length, 1);
      
      if (shortLineRatio > 0.4) score -= 0.2; // Likely multi-column
      
      // Bonus for clean structure
      if (resumeText.match(/^(EXPERIENCE|EDUCATION|SKILLS|PROJECTS)/gm)) score += 0.1;
    }
    
    return Math.max(0.1, Math.min(1.0, score));
  }

  /**
   * Calculate score alignment factor (0-1)
   * How well the confidence aligns with actual ATS score performance
   */
  private static calculateScoreAlignment(
    atsScore?: number,
    resumeData?: ResumeData,
    jobDescription?: string
  ): number {
    let score = 0.5; // Neutral base
    
    // If we have an ATS score, use it as primary indicator
    if (atsScore !== undefined) {
      if (atsScore >= 80) score = 0.9;
      else if (atsScore >= 70) score = 0.8;
      else if (atsScore >= 60) score = 0.7;
      else if (atsScore >= 50) score = 0.6;
      else score = 0.4;
    } else {
      // Estimate based on resume completeness and JD presence
      let estimatedScore = 0.5;
      
      // Resume completeness indicators
      if (resumeData?.workExperience && resumeData.workExperience.length > 0) estimatedScore += 0.15;
      if (resumeData?.skills && resumeData.skills.length >= 3) estimatedScore += 0.1;
      if (resumeData?.projects && resumeData.projects.length > 0) estimatedScore += 0.1;
      if (resumeData?.education && resumeData.education.length > 0) estimatedScore += 0.05;
      
      // JD alignment potential
      if (jobDescription && jobDescription.length > 200) estimatedScore += 0.1;
      
      score = Math.min(1.0, estimatedScore);
    }
    
    return score;
  }

  /**
   * Calculate weighted confidence score (0-100)
   */
  private static calculateWeightedConfidence(factors: ConfidenceFactors): number {
    // Weighted combination of factors
    const weights = {
      parsingQuality: 0.25,    // How well we extracted the data
      contentCompleteness: 0.30, // How complete the resume is
      structuralIntegrity: 0.20,  // How well-structured the data is
      formatComplexity: 0.10,     // How complex the format was (penalty)
      scoreAlignment: 0.15,       // How well this aligns with expected performance
    };
    
    const weightedScore = (
      factors.parsingQuality * weights.parsingQuality +
      factors.contentCompleteness * weights.contentCompleteness +
      factors.structuralIntegrity * weights.structuralIntegrity +
      factors.formatComplexity * weights.formatComplexity +
      factors.scoreAlignment * weights.scoreAlignment
    );
    
    return Math.round(weightedScore * 100);
  }

  /**
   * Determine confidence level with proper thresholds
   * Addresses the issue where clean resumes get Medium instead of High
   */
  private static determineConfidenceLevel(
    confidenceScore: number,
    factors: ConfidenceFactors
  ): ConfidenceLevel {
    
    // Enhanced thresholds that properly reward clean, complete resumes
    
    // High confidence: Clean, complete resumes with good parsing
    if (confidenceScore >= 85 && 
        factors.contentCompleteness >= 0.8 && 
        factors.parsingQuality >= 0.7) {
      return 'High';
    }
    
    // High confidence: Very complete resumes even with some parsing challenges
    if (confidenceScore >= 80 && 
        factors.contentCompleteness >= 0.9 && 
        factors.structuralIntegrity >= 0.8) {
      return 'High';
    }
    
    // High confidence: Good ATS score alignment
    if (confidenceScore >= 75 && 
        factors.scoreAlignment >= 0.8 && 
        factors.contentCompleteness >= 0.7) {
      return 'High';
    }
    
    // Medium confidence: Decent resumes with minor issues
    if (confidenceScore >= 60 && 
        factors.contentCompleteness >= 0.6) {
      return 'Medium';
    }
    
    // Medium confidence: Complex format but good content
    if (confidenceScore >= 55 && 
        factors.contentCompleteness >= 0.7 && 
        factors.formatComplexity < 0.5) {
      return 'Medium';
    }
    
    // Low confidence: Incomplete or poorly parsed resumes
    return 'Low';
  }

  /**
   * Generate reasoning for confidence level
   */
  private static generateReasoning(
    factors: ConfidenceFactors,
    confidenceScore: number
  ): string[] {
    const reasoning: string[] = [];
    
    // Parsing quality
    if (factors.parsingQuality >= 0.8) {
      reasoning.push('Excellent text extraction and parsing quality');
    } else if (factors.parsingQuality >= 0.6) {
      reasoning.push('Good text extraction with minor parsing challenges');
    } else {
      reasoning.push('Text extraction faced some challenges');
    }
    
    // Content completeness
    if (factors.contentCompleteness >= 0.8) {
      reasoning.push('Resume contains comprehensive information across all sections');
    } else if (factors.contentCompleteness >= 0.6) {
      reasoning.push('Resume has good coverage of essential sections');
    } else {
      reasoning.push('Resume is missing some important sections or details');
    }
    
    // Structural integrity
    if (factors.structuralIntegrity >= 0.8) {
      reasoning.push('Well-structured resume with consistent formatting');
    } else if (factors.structuralIntegrity >= 0.6) {
      reasoning.push('Generally well-organized with minor structural issues');
    } else {
      reasoning.push('Some structural inconsistencies detected');
    }
    
    // Format complexity
    if (factors.formatComplexity >= 0.8) {
      reasoning.push('Clean, ATS-friendly format');
    } else if (factors.formatComplexity >= 0.6) {
      reasoning.push('Moderately complex format handled successfully');
    } else {
      reasoning.push('Complex formatting may have affected parsing accuracy');
    }
    
    // Score alignment
    if (factors.scoreAlignment >= 0.8) {
      reasoning.push('Strong alignment with ATS scoring expectations');
    } else if (factors.scoreAlignment >= 0.6) {
      reasoning.push('Good potential for ATS performance');
    } else {
      reasoning.push('May need optimization for better ATS performance');
    }
    
    return reasoning;
  }

  /**
   * Generate recommendations based on confidence factors
   */
  private static generateRecommendations(
    factors: ConfidenceFactors,
    level: ConfidenceLevel
  ): string[] {
    const recommendations: string[] = [];
    
    if (level === 'High') {
      recommendations.push('Resume is well-optimized and ready for ATS systems');
      if (factors.scoreAlignment < 0.9) {
        recommendations.push('Consider minor keyword optimization for specific job descriptions');
      }
      return recommendations;
    }
    
    if (level === 'Medium') {
      if (factors.contentCompleteness < 0.7) {
        recommendations.push('Add more detailed bullet points to work experience');
        recommendations.push('Consider adding a projects section if missing');
      }
      
      if (factors.structuralIntegrity < 0.7) {
        recommendations.push('Ensure consistent date formatting across all sections');
        recommendations.push('Organize skills into clear categories');
      }
      
      if (factors.formatComplexity < 0.6) {
        recommendations.push('Simplify formatting for better ATS compatibility');
        recommendations.push('Avoid complex layouts, tables, or text boxes');
      }
      
      return recommendations;
    }
    
    // Low confidence
    if (factors.parsingQuality < 0.5) {
      recommendations.push('Try uploading a cleaner version of your resume');
      recommendations.push('Ensure the file is not corrupted or password-protected');
    }
    
    if (factors.contentCompleteness < 0.5) {
      recommendations.push('Add missing essential sections (work experience, skills, education)');
      recommendations.push('Include more detailed descriptions and achievements');
    }
    
    recommendations.push('Consider using a simpler, more ATS-friendly template');
    recommendations.push('Review and optimize content before re-uploading');
    
    return recommendations;
  }

  /**
   * Legacy compatibility method
   */
  static calculateLegacyConfidence(
    resumeText: string,
    resumeData?: ResumeData,
    jobDescription?: string
  ): ConfidenceLevel {
    const result = this.calculateEnhancedConfidence(
      resumeText,
      resumeData || {} as ResumeData,
      undefined,
      undefined,
      jobDescription
    );
    
    return result.level;
  }
}

export default EnhancedConfidenceService;