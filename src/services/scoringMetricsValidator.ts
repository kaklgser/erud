/**
 * Scoring Metrics Validator
 * 
 * Ensures all scoring metrics are properly maintained and validated
 * for the PrimoBoost 16-parameter ATS scoring system.
 */

import { ATSScore16Parameter } from './atsScoreChecker16Parameter';

export interface MetricsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalMetrics: number;
    validMetrics: number;
    invalidMetrics: number;
    validationScore: number; // 0-100
  };
}

export interface ScoringValidationSummary {
  validationScore: number;
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  qualityRating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export class ScoringMetricsValidator {
  
  /**
   * Validate PrimoBoost 16-parameter scoring system
   */
  static validatePrimoBoostScoring(score: ATSScore16Parameter): MetricsValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let validMetrics = 0;
    let totalMetrics = 0;
    
    // Validate overall score
    totalMetrics++;
    if (this.isValidScore(score.overallScore, 0, 100)) {
      validMetrics++;
    } else {
      errors.push(`Invalid overall score: ${score.overallScore} (must be 0-100)`);
    }
    
    // Validate confidence
    totalMetrics++;
    if (['High', 'Medium', 'Low'].includes(score.confidence)) {
      validMetrics++;
    } else {
      errors.push(`Invalid confidence level: ${score.confidence}`);
    }
    
    // Validate match quality
    totalMetrics++;
    const validMatchQualities = ['Excellent', 'Good', 'Adequate', 'Poor', 'Inadequate'];
    if (validMatchQualities.includes(score.matchQuality)) {
      validMetrics++;
    } else {
      errors.push(`Invalid match quality: ${score.matchQuality}`);
    }
    
    // Validate interview chance
    totalMetrics++;
    const validInterviewChances = ['1-2%', '5-12%', '20-30%', '40-60%', '70-80%', '80-90%', '90%+'];
    if (validInterviewChances.includes(score.interviewChance)) {
      validMetrics++;
    } else {
      errors.push(`Invalid interview chance: ${score.interviewChance}`);
    }
    
    // Validate 16 parameter scores
    const parameterValidation = this.validate16Parameters(score.scores);
    totalMetrics += parameterValidation.totalMetrics;
    validMetrics += parameterValidation.validMetrics;
    errors.push(...parameterValidation.errors);
    warnings.push(...parameterValidation.warnings);
    
    // Validate arrays and strings
    totalMetrics += 4;
    if (Array.isArray(score.strengths)) validMetrics++;
    else errors.push('strengths must be an array');
    
    if (Array.isArray(score.areasToImprove)) validMetrics++;
    else errors.push('areasToImprove must be an array');
    
    if (score.missingKeywords && typeof score.missingKeywords === 'object') {
      if (Array.isArray(score.missingKeywords.critical) &&
          Array.isArray(score.missingKeywords.important) &&
          Array.isArray(score.missingKeywords.optional)) {
        validMetrics++;
      } else {
        errors.push('missingKeywords must have critical, important, and optional arrays');
      }
    } else {
      errors.push('missingKeywords must be an object');
    }
    
    if (typeof score.summary === 'string') validMetrics++;
    else errors.push('summary must be a string');
    
    const validationScore = totalMetrics > 0 ? Math.round((validMetrics / totalMetrics) * 100) : 0;
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalMetrics,
        validMetrics,
        invalidMetrics: totalMetrics - validMetrics,
        validationScore
      }
    };
  }
  
  /**
   * Generate validation summary for PrimoBoost scoring
   */
  static generateValidationSummary(score: ATSScore16Parameter): ScoringValidationSummary {
    const validation = this.validatePrimoBoostScoring(score);
    
    let qualityRating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    if (validation.summary.validationScore >= 95) {
      qualityRating = 'Excellent';
    } else if (validation.summary.validationScore >= 85) {
      qualityRating = 'Good';
    } else if (validation.summary.validationScore >= 70) {
      qualityRating = 'Fair';
    } else {
      qualityRating = 'Poor';
    }
    
    return {
      validationScore: validation.summary.validationScore,
      isValid: validation.isValid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      qualityRating
    };
  }

  
  /**
   * Validate 16 parameters structure
   */
  private static validate16Parameters(scores: ATSScore16Parameter['scores']): {
    totalMetrics: number;
    validMetrics: number;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let validMetrics = 0;
    let totalMetrics = 0;
    
    const expectedParameters = [
      { key: 'keywordMatch', max: 25 },
      { key: 'skillsAlignment', max: 20 },
      { key: 'experienceRelevance', max: 15 },
      { key: 'technicalCompetencies', max: 12 },
      { key: 'educationScore', max: 10 },
      { key: 'quantifiedAchievements', max: 8 },
      { key: 'employmentHistory', max: 8 },
      { key: 'industryExperience', max: 7 },
      { key: 'jobTitleMatch', max: 6 },
      { key: 'careerProgression', max: 6 },
      { key: 'certifications', max: 5 },
      { key: 'formatting', max: 5 },
      { key: 'contentQuality', max: 4 },
      { key: 'grammar', max: 3 },
      { key: 'resumeLength', max: 2 },
      { key: 'filenameQuality', max: 2 }
    ];
    
    for (const param of expectedParameters) {
      totalMetrics++;
      
      if (!(param.key in scores)) {
        errors.push(`Missing parameter: ${param.key}`);
        continue;
      }
      
      const score = scores[param.key as keyof typeof scores];
      if (this.isValidScore(score, 0, param.max)) {
        validMetrics++;
      } else {
        errors.push(`Invalid ${param.key} score: ${score} (must be 0-${param.max})`);
      }
    }
    
    // Check total scores sum to 138 (sum of all max scores)
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const expectedTotal = expectedParameters.reduce((sum, param) => sum + param.max, 0);
    
    if (totalScore > expectedTotal) {
      warnings.push(`Total parameter scores (${totalScore}) exceed maximum possible (${expectedTotal})`);
    }
    
    return { totalMetrics, validMetrics, errors, warnings };
  }
  
  /**
   * Check if a score is valid within range
   */
  private static isValidScore(score: number, min: number, max: number): boolean {
    return typeof score === 'number' && 
           !isNaN(score) && 
           isFinite(score) && 
           score >= min && 
           score <= max;
  }
  
  /**
   * Generate comprehensive health report for PrimoBoost scoring
   */
  static generateHealthReport(score: ATSScore16Parameter): {
    overallHealth: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    validation: MetricsValidationResult;
    summary: ScoringValidationSummary;
    recommendations: string[];
  } {
    const validation = this.validatePrimoBoostScoring(score);
    const summary = this.generateValidationSummary(score);
    
    const recommendations: string[] = [];
    
    // Add recommendations based on validation results
    if (validation.errors.length > 0) {
      recommendations.push('Fix scoring validation errors');
      validation.errors.forEach(error => {
        recommendations.push(`- ${error}`);
      });
    }
    
    if (validation.warnings.length > 0) {
      recommendations.push('Address validation warnings');
    }
    
    if (summary.validationScore < 90) {
      recommendations.push('Improve scoring system reliability');
    }
    
    return {
      overallHealth: summary.qualityRating,
      validation,
      summary,
      recommendations: recommendations.slice(0, 10)
    };
  }
}

// Export singleton instance
export const scoringMetricsValidator = ScoringMetricsValidator;