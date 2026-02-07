import { ConfidenceLevel } from '../types/resume';

export interface ConfidenceFeatures {
  literalMatchPercentage: number;
  semanticSimilarityScore: number;
  experienceRelevancyPercentage: number;
  missingCriticalKeywordsCount: number;
  totalCriticalKeywords: number;
  contextQualityScore: number;
  hasQuantifiedAchievements: boolean;
  sectionCompleteness: number;
  formattingScore: number;
}

export interface ConfidenceBreakdown {
  numericScore: number;
  level: ConfidenceLevel;
  components: {
    literalMatchContribution: number;
    semanticMatchContribution: number;
    experienceRelevancyContribution: number;
    keywordCoverageContribution: number;
    contextQualityContribution: number;
  };
  reasoning: string[];
  strengths: string[];
  weaknesses: string[];
}

export class ConfidenceCalculator {
  private static readonly WEIGHTS = {
    LITERAL_MATCH: 0.30,
    SEMANTIC_SIMILARITY: 0.25,
    EXPERIENCE_RELEVANCY: 0.20,
    KEYWORD_COVERAGE: 0.15,
    CONTEXT_QUALITY: 0.10
  };

  private static readonly THRESHOLDS = {
    HIGH_CONFIDENCE: 80,
    MEDIUM_CONFIDENCE: 50,
    LOW_CONFIDENCE: 0
  };

  static computeConfidence(features: ConfidenceFeatures): ConfidenceBreakdown {
    const keywordCoverageScore = this.calculateKeywordCoverageScore(
      features.missingCriticalKeywordsCount,
      features.totalCriticalKeywords
    );

    const contextQualityScore = this.calculateContextQualityScore(features);

    const literalMatchContribution = features.literalMatchPercentage * this.WEIGHTS.LITERAL_MATCH;
    const semanticMatchContribution = (features.semanticSimilarityScore * 100) * this.WEIGHTS.SEMANTIC_SIMILARITY;
    const experienceRelevancyContribution = features.experienceRelevancyPercentage * this.WEIGHTS.EXPERIENCE_RELEVANCY;
    const keywordCoverageContribution = keywordCoverageScore * this.WEIGHTS.KEYWORD_COVERAGE;
    const contextQualityContribution = contextQualityScore * this.WEIGHTS.CONTEXT_QUALITY;

    const numericScore = Math.round(
      literalMatchContribution +
      semanticMatchContribution +
      experienceRelevancyContribution +
      keywordCoverageContribution +
      contextQualityContribution
    );

    const level = this.mapScoreToLevel(numericScore);
    const reasoning = this.generateReasoning(features, numericScore);
    const strengths = this.identifyStrengths(features);
    const weaknesses = this.identifyWeaknesses(features);

    return {
      numericScore,
      level,
      components: {
        literalMatchContribution: Math.round(literalMatchContribution * 10) / 10,
        semanticMatchContribution: Math.round(semanticMatchContribution * 10) / 10,
        experienceRelevancyContribution: Math.round(experienceRelevancyContribution * 10) / 10,
        keywordCoverageContribution: Math.round(keywordCoverageContribution * 10) / 10,
        contextQualityContribution: Math.round(contextQualityContribution * 10) / 10
      },
      reasoning,
      strengths,
      weaknesses
    };
  }

  private static calculateKeywordCoverageScore(missing: number, total: number): number {
    if (total === 0) return 50;

    const coverageRatio = 1 - (missing / total);
    const coverageScore = coverageRatio * 100;

    return Math.max(0, Math.min(100, coverageScore));
  }

  private static calculateContextQualityScore(features: ConfidenceFeatures): number {
    let score = features.contextQualityScore;

    if (features.hasQuantifiedAchievements) {
      score += 15;
    }

    score += (features.sectionCompleteness / 100) * 10;

    score += (features.formattingScore / 100) * 10;

    return Math.min(100, score);
  }

  private static mapScoreToLevel(score: number): ConfidenceLevel {
    if (score >= this.THRESHOLDS.HIGH_CONFIDENCE) {
      return 'High';
    } else if (score >= this.THRESHOLDS.MEDIUM_CONFIDENCE) {
      return 'Medium';
    } else {
      return 'Low';
    }
  }

  private static generateReasoning(features: ConfidenceFeatures, score: number): string[] {
    const reasoning: string[] = [];

    if (score >= 80) {
      reasoning.push('Strong overall match with high confidence in scoring accuracy');
    } else if (score >= 50) {
      reasoning.push('Moderate match with reasonable confidence in scoring');
    } else {
      reasoning.push('Weak match with limited confidence in scoring accuracy');
    }

    if (features.literalMatchPercentage >= 70) {
      reasoning.push(`High literal keyword match (${features.literalMatchPercentage.toFixed(1)}%)`);
    } else if (features.literalMatchPercentage < 40) {
      reasoning.push(`Low literal keyword match (${features.literalMatchPercentage.toFixed(1)}%) reduces confidence`);
    }

    if (features.semanticSimilarityScore >= 0.75) {
      reasoning.push('Strong semantic similarity between resume and job requirements');
    } else if (features.semanticSimilarityScore < 0.5) {
      reasoning.push('Weak semantic similarity impacts confidence');
    }

    if (features.missingCriticalKeywordsCount > 0) {
      reasoning.push(`${features.missingCriticalKeywordsCount} critical keywords missing from resume`);
    }

    if (features.contextQualityScore < 50) {
      reasoning.push('Keywords lack contextual support (action verbs, metrics)');
    }

    if (!features.hasQuantifiedAchievements) {
      reasoning.push('Limited quantified achievements reduce scoring confidence');
    }

    return reasoning;
  }

  private static identifyStrengths(features: ConfidenceFeatures): string[] {
    const strengths: string[] = [];

    if (features.literalMatchPercentage >= 70) {
      strengths.push('Excellent keyword coverage');
    }

    if (features.semanticSimilarityScore >= 0.75) {
      strengths.push('Strong semantic alignment with job requirements');
    }

    if (features.experienceRelevancyPercentage >= 70) {
      strengths.push('Highly relevant work experience');
    }

    if (features.contextQualityScore >= 70) {
      strengths.push('Skills demonstrated in meaningful context');
    }

    if (features.hasQuantifiedAchievements) {
      strengths.push('Quantified achievements present');
    }

    if (features.formattingScore >= 80) {
      strengths.push('Professional formatting and structure');
    }

    if (strengths.length === 0) {
      strengths.push('Basic resume structure present');
    }

    return strengths;
  }

  private static identifyWeaknesses(features: ConfidenceFeatures): string[] {
    const weaknesses: string[] = [];

    if (features.literalMatchPercentage < 40) {
      weaknesses.push('Low keyword match rate');
    }

    if (features.semanticSimilarityScore < 0.5) {
      weaknesses.push('Weak semantic alignment with job description');
    }

    if (features.experienceRelevancyPercentage < 40) {
      weaknesses.push('Limited relevant experience');
    }

    if (features.missingCriticalKeywordsCount > 3) {
      weaknesses.push('Multiple critical keywords missing');
    }

    if (features.contextQualityScore < 40) {
      weaknesses.push('Skills lack contextual support');
    }

    if (!features.hasQuantifiedAchievements) {
      weaknesses.push('No quantified achievements');
    }

    if (features.sectionCompleteness < 60) {
      weaknesses.push('Incomplete resume sections');
    }

    if (weaknesses.length === 0) {
      weaknesses.push('No major weaknesses identified');
    }

    return weaknesses;
  }

  static createFeaturesFromAnalysis(
    literalMatchPct: number,
    semanticScore: number,
    experienceYears: number,
    requiredYears: number,
    missingKeywords: number,
    totalKeywords: number,
    contextScore: number,
    hasMetrics: boolean,
    sectionCompleteness: number = 100,
    formattingScore: number = 100
  ): ConfidenceFeatures {
    const experienceRelevancy = requiredYears > 0
      ? Math.min(100, (experienceYears / requiredYears) * 100)
      : 100;

    return {
      literalMatchPercentage: literalMatchPct,
      semanticSimilarityScore: semanticScore,
      experienceRelevancyPercentage: experienceRelevancy,
      missingCriticalKeywordsCount: missingKeywords,
      totalCriticalKeywords: totalKeywords,
      contextQualityScore: contextScore,
      hasQuantifiedAchievements: hasMetrics,
      sectionCompleteness,
      formattingScore
    };
  }

  static adjustConfidenceForMode(
    baseConfidence: ConfidenceBreakdown,
    mode: 'general' | 'jd_based'
  ): ConfidenceBreakdown {
    if (mode === 'general') {
      const adjustedScore = Math.min(100, baseConfidence.numericScore + 5);
      return {
        ...baseConfidence,
        numericScore: adjustedScore,
        level: this.mapScoreToLevel(adjustedScore),
        reasoning: [
          ...baseConfidence.reasoning,
          'General mode: Confidence slightly boosted due to broader matching criteria'
        ]
      };
    }

    return baseConfidence;
  }
}

export const confidenceCalculator = ConfidenceCalculator;
