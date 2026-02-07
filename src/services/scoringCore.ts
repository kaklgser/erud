import { semanticMatchingService } from './semanticMatchingService';
import { synonymExpansionService } from './synonymExpansionService';
import { dateNormalizer, ParsedDate } from '../utils/dateNormalizer';
import { confidenceCalculator, ConfidenceFeatures, ConfidenceBreakdown } from './confidenceCalculator';
import { keywordContextAnalyzer, KeywordContextResult } from './keywordContextAnalyzer';

export interface ProportionalPenalty {
  type: 'missing_critical_skill' | 'missing_optional_skill' | 'date_issue' | 'formatting' | 'experience_gap';
  severity: 'critical' | 'high' | 'medium' | 'low';
  penaltyPercentage: number;
  maxPenalty: number;
  appliedPenalty: number;
  reason: string;
}

export interface SemanticMatchResult {
  literalScore: number;
  semanticScore: number;
  combinedScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

export class ScoringCore {
  private static readonly MAX_PENALTY_PER_ISSUE = 15;
  private static readonly SEMANTIC_WEIGHT = 0.6;
  private static readonly LITERAL_WEIGHT = 0.4;

  static async semantic_match(
    resumeText: string,
    jdText: string,
    keywords: string[]
  ): Promise<SemanticMatchResult> {
    try {
      await semanticMatchingService.initialize();

      const resumeEmbedding = await semanticMatchingService.generateEmbedding(resumeText);
      const jdEmbedding = await semanticMatchingService.generateEmbedding(jdText);

      const documentSimilarity = semanticMatchingService.cosineSimilarity(resumeEmbedding, jdEmbedding);

      const keywordMatches = await this.matchKeywordsWithSemantics(resumeText, keywords);

      const literalMatchCount = keywordMatches.filter(k => k.literalMatch).length;
      const semanticMatchCount = keywordMatches.filter(k => k.semanticMatch).length;

      const literalScore = keywords.length > 0 ? literalMatchCount / keywords.length : 0;
      const semanticScore = keywords.length > 0 ? semanticMatchCount / keywords.length : documentSimilarity;

      const combinedScore = (this.SEMANTIC_WEIGHT * semanticScore) + (this.LITERAL_WEIGHT * literalScore);

      const matchedKeywords = keywordMatches
        .filter(k => k.literalMatch || k.semanticMatch)
        .map(k => k.keyword);

      const missingKeywords = keywordMatches
        .filter(k => !k.literalMatch && !k.semanticMatch)
        .map(k => k.keyword);

      return {
        literalScore: Math.round(literalScore * 100) / 100,
        semanticScore: Math.round(semanticScore * 100) / 100,
        combinedScore: Math.round(combinedScore * 100) / 100,
        matchedKeywords,
        missingKeywords
      };
    } catch (error) {
      console.error('Error in semantic_match:', error);
      return {
        literalScore: 0,
        semanticScore: 0,
        combinedScore: 0,
        matchedKeywords: [],
        missingKeywords: keywords
      };
    }
  }

  private static async matchKeywordsWithSemantics(
    resumeText: string,
    keywords: string[]
  ): Promise<Array<{ keyword: string; literalMatch: boolean; semanticMatch: boolean; score: number }>> {
    const results = [];
    const lowerResume = resumeText.toLowerCase();

    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      const literalMatch = lowerResume.includes(lowerKeyword);

      const synonyms = await synonymExpansionService.expandKeyword(keyword, false);
      const synonymMatch = synonyms.some(syn => lowerResume.includes(syn.toLowerCase()));

      let semanticMatch = literalMatch || synonymMatch;
      let score = literalMatch ? 1.0 : (synonymMatch ? 0.8 : 0);

      if (!semanticMatch) {
        try {
          const keywordEmbedding = await semanticMatchingService.generateEmbedding(keyword);
          const sentences = resumeText.split(/[.!?]\s+/);

          for (const sentence of sentences) {
            if (sentence.length < 10) continue;

            const sentenceEmbedding = await semanticMatchingService.generateEmbedding(sentence);
            const similarity = semanticMatchingService.cosineSimilarity(keywordEmbedding, sentenceEmbedding);

            if (similarity >= 0.75) {
              semanticMatch = true;
              score = similarity;
              break;
            }
          }
        } catch (error) {
          console.error(`Error checking semantic match for ${keyword}:`, error);
        }
      }

      results.push({
        keyword,
        literalMatch,
        semanticMatch,
        score
      });
    }

    return results;
  }

  static async synonym_expand(keyword: string, mode: 'general' | 'jd_based'): Promise<string[]> {
    const includeSemantic = mode === 'jd_based';
    return await synonymExpansionService.expandKeyword(keyword, includeSemantic);
  }

  static date_normalize(dateString: string): ParsedDate {
    return dateNormalizer.parseDateFlexible(dateString);
  }

  static compute_confidence(features: ConfidenceFeatures, mode: 'general' | 'jd_based' = 'jd_based'): ConfidenceBreakdown {
    const baseConfidence = confidenceCalculator.computeConfidence(features);
    return confidenceCalculator.adjustConfidenceForMode(baseConfidence, mode);
  }

  static context_validator(keyword: string, resumeText: string): KeywordContextResult {
    return keywordContextAnalyzer.analyzeKeywordContext(resumeText, keyword);
  }

  static calculate_proportional_penalty(
    missingSkills: Array<{ skill: string; importance: 'critical' | 'high' | 'medium' | 'low' }>,
    totalSkills: number
  ): { penalties: ProportionalPenalty[]; totalPenalty: number; cappedPenalty: number } {
    const penalties: ProportionalPenalty[] = [];

    for (const { skill, importance } of missingSkills) {
      let penaltyPercentage: number;
      let maxPenalty: number;

      switch (importance) {
        case 'critical':
          penaltyPercentage = 3.0;
          maxPenalty = 15;
          break;
        case 'high':
          penaltyPercentage = 2.0;
          maxPenalty = 12;
          break;
        case 'medium':
          penaltyPercentage = 1.5;
          maxPenalty = 10;
          break;
        case 'low':
          penaltyPercentage = 1.0;
          maxPenalty = 8;
          break;
      }

      const appliedPenalty = Math.min(penaltyPercentage, maxPenalty);

      penalties.push({
        type: importance === 'critical' || importance === 'high'
          ? 'missing_critical_skill'
          : 'missing_optional_skill',
        severity: importance,
        penaltyPercentage,
        maxPenalty,
        appliedPenalty,
        reason: `Missing ${importance} skill: ${skill}`
      });
    }

    const totalPenalty = penalties.reduce((sum, p) => sum + p.appliedPenalty, 0);
    const cappedPenalty = Math.min(totalPenalty, this.MAX_PENALTY_PER_ISSUE * penalties.length);

    return {
      penalties,
      totalPenalty,
      cappedPenalty
    };
  }

  static apply_soft_penalties(
    baseScore: number,
    penalties: ProportionalPenalty[]
  ): { adjustedScore: number; penaltiesApplied: ProportionalPenalty[]; totalReduction: number } {
    let adjustedScore = baseScore;
    const penaltiesApplied: ProportionalPenalty[] = [];
    let totalReduction = 0;

    const sortedPenalties = [...penalties].sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    for (const penalty of sortedPenalties) {
      const reduction = (adjustedScore * penalty.appliedPenalty) / 100;
      adjustedScore = Math.max(0, adjustedScore - reduction);
      totalReduction += reduction;

      penaltiesApplied.push(penalty);

      if (totalReduction >= this.MAX_PENALTY_PER_ISSUE) {
        break;
      }
    }

    return {
      adjustedScore: Math.round(adjustedScore * 10) / 10,
      penaltiesApplied,
      totalReduction: Math.round(totalReduction * 10) / 10
    };
  }

  static validate_date_ranges(
    experiences: Array<{ startDate: string; endDate: string }>
  ): { isValid: boolean; warnings: string[]; penalties: ProportionalPenalty[] } {
    const warnings: string[] = [];
    const penalties: ProportionalPenalty[] = [];

    for (const exp of experiences) {
      const validation = dateNormalizer.validateDateRange(exp.startDate, exp.endDate);

      if (!validation.isValid) {
        warnings.push(...validation.warnings);

        penalties.push({
          type: 'date_issue',
          severity: 'low',
          penaltyPercentage: 1.0,
          maxPenalty: 5,
          appliedPenalty: 1.0,
          reason: `Date range issue: ${validation.warnings.join(', ')}`
        });
      }

      const startParsed = dateNormalizer.parseDateFlexible(exp.startDate);
      const endParsed = dateNormalizer.parseDateFlexible(exp.endDate);

      if (dateNormalizer.shouldPenalizeFutureDate(startParsed)) {
        warnings.push(`Start date is in future without 'expected' keyword: ${exp.startDate}`);
      }

      if (dateNormalizer.shouldPenalizeFutureDate(endParsed)) {
        warnings.push(`End date is in future without 'expected' keyword: ${exp.endDate}`);
      }
    }

    return {
      isValid: penalties.length === 0,
      warnings,
      penalties
    };
  }

  static async analyze_keyword_context_batch(
    resumeText: string,
    keywords: string[]
  ): Promise<{
    results: Map<string, KeywordContextResult>;
    overallQuality: ReturnType<typeof keywordContextAnalyzer.calculateOverallContextQuality>;
    averageWeight: number;
  }> {
    const results = keywordContextAnalyzer.analyzeMultipleKeywords(resumeText, keywords);
    const overallQuality = keywordContextAnalyzer.calculateOverallContextQuality(results);

    const foundResults = Array.from(results.values()).filter(r => r.found);
    const averageWeight = foundResults.length > 0
      ? foundResults.reduce((sum, r) => sum + r.contextWeight, 0) / foundResults.length
      : 0;

    return {
      results,
      overallQuality,
      averageWeight: Math.round(averageWeight * 100) / 100
    };
  }

  static create_penalty_summary(penalties: ProportionalPenalty[]): {
    totalCount: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    totalPenaltyPercentage: number;
    description: string;
  } {
    const bySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    const byType: Record<string, number> = {};

    let totalPenaltyPercentage = 0;

    for (const penalty of penalties) {
      bySeverity[penalty.severity]++;
      byType[penalty.type] = (byType[penalty.type] || 0) + 1;
      totalPenaltyPercentage += penalty.appliedPenalty;
    }

    const cappedPenalty = Math.min(totalPenaltyPercentage, this.MAX_PENALTY_PER_ISSUE);

    const description = `${penalties.length} penalties identified with ${cappedPenalty.toFixed(1)}% total reduction (capped at ${this.MAX_PENALTY_PER_ISSUE}%)`;

    return {
      totalCount: penalties.length,
      bySeverity,
      byType,
      totalPenaltyPercentage: Math.round(cappedPenalty * 10) / 10,
      description
    };
  }
}

export const scoringCore = ScoringCore;
