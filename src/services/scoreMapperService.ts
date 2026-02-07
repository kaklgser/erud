/**
 * ScoreMapper Service - Maps scores to bands, probabilities, and applies penalties
 * Part of the Enhanced ATS Score Checker (220+ Metrics)
 */

import {
  MatchBand,
  TierScores,
  RedFlag,
  TIER_WEIGHTS,
  MATCH_BAND_THRESHOLDS,
  RED_FLAG_PENALTIES,
} from '../types/resume';

// ============================================================================
// TYPES
// ============================================================================

export interface ScoreMapperResult {
  finalScore: number;
  matchBand: MatchBand;
  interviewProbability: string;
  totalPenalty: number;
  autoRejectRisk: boolean;
}

export interface TierWeightedResult {
  weightedScore: number;
  tierContributions: Record<keyof TierScores, number>;
}

// ============================================================================
// SCORE MAPPER SERVICE
// ============================================================================

export class ScoreMapperService {
  /**
   * Get the match band for a given score (0-100)
   * Maps to 9 bands from "Excellent Match" to "Minimal Match"
   * FIXED: Market-aligned thresholds for realistic scoring
   */
  static getMatchBand(score: number): MatchBand {
    if (score >= 90) return 'Excellent Match';
    if (score >= 80) return 'Very Good Match';
    if (score >= 70) return 'Good Match';
    if (score >= 60) return 'Fair Match';
    if (score >= 50) return 'Below Average';
    if (score >= 40) return 'Poor Match';
    if (score >= 30) return 'Very Poor';
    if (score >= 20) return 'Inadequate';
    return 'Minimal Match';
  }

  /**
   * Get interview probability range for a given match band
   */
  static getInterviewProbability(matchBand: MatchBand): string {
    const threshold = MATCH_BAND_THRESHOLDS[matchBand];
    return threshold?.probability || '0%';
  }

  /**
   * Get interview probability range directly from score
   */
  static getInterviewProbabilityFromScore(score: number): string {
    const matchBand = this.getMatchBand(score);
    return this.getInterviewProbability(matchBand);
  }

  /**
   * Calculate total penalty from red flags
   * Returns a negative number (penalty to subtract from score)
   */
  static calculateRedFlagPenalty(redFlags: RedFlag[]): number {
    return redFlags.reduce((total, flag) => total + flag.penalty, 0);
  }

  /**
   * Determine if auto-reject risk is present
   * True if >= 3 critical red flags detected
   */
  static hasAutoRejectRisk(redFlags: RedFlag[]): boolean {
    const criticalFlags = redFlags.filter((flag) => flag.severity === 'critical');
    return criticalFlags.length >= RED_FLAG_PENALTIES.multiple_red_flags_threshold;
  }

  /**
   * Apply penalties to a base score
   * Ensures score stays within 0-100 range
   */
  static applyPenalties(baseScore: number, penalty: number): number {
    const adjustedScore = baseScore + penalty; // penalty is negative
    return Math.max(0, Math.min(100, adjustedScore));
  }

  /**
   * Calculate weighted score from tier scores
   * FIXED: Uses the weight stored in each tier score (dynamically adjusted for candidate level)
   * instead of static TIER_WEIGHTS configuration
   */
  static calculateWeightedScore(tierScores: TierScores): TierWeightedResult {
    const tierContributions: Record<keyof TierScores, number> = {} as Record<keyof TierScores, number>;
    let weightedScore = 0;
    let totalWeight = 0;

    // Calculate contribution from each tier (excluding red_flags which is penalty-based)
    for (const [tierKey, tierScore] of Object.entries(tierScores)) {
      const key = tierKey as keyof TierScores;
      
      // Skip red_flags as it's penalty-based, not weighted
      if (key === 'red_flags') {
        tierContributions[key] = 0;
        continue;
      }
      
      // CRITICAL FIX: Use the weight from the tier score itself (dynamically adjusted)
      // instead of the static TIER_WEIGHTS configuration
      const weight = tierScore?.weight ?? TIER_WEIGHTS[key] ?? 0;
      
      // Validate tier score has required properties
      if (!tierScore || typeof tierScore.percentage !== 'number') {
        console.warn(`[ScoreMapperService] Invalid tier score for ${key}:`, tierScore);
        tierContributions[key] = 0;
        continue;
      }

      // Calculate tier's weighted contribution
      const tierPercentage = tierScore.percentage;
      const contribution = (tierPercentage * weight) / 100;

      tierContributions[key] = contribution;
      weightedScore += contribution;
      totalWeight += weight;
    }

    // Log for debugging
    console.log('[ScoreMapperService] Weighted Score Calculation:', {
      weightedScore: Math.round(weightedScore * 100) / 100,
      totalWeight,
      tierContributions
    });

    return {
      weightedScore: Math.round(weightedScore * 100) / 100,
      tierContributions,
    };
  }

  /**
   * Complete score mapping: calculate final score with penalties and map to band
   */
  static mapScore(tierScores: TierScores, redFlags: RedFlag[]): ScoreMapperResult {
    // Calculate weighted base score from tiers
    const { weightedScore } = this.calculateWeightedScore(tierScores);

    // Calculate penalty from red flags
    const totalPenalty = this.calculateRedFlagPenalty(redFlags);

    // Apply penalties to get final score
    const finalScore = this.applyPenalties(weightedScore, totalPenalty);

    // Map to band and probability
    const matchBand = this.getMatchBand(finalScore);
    const interviewProbability = this.getInterviewProbability(matchBand);

    // Check for auto-reject risk
    const autoRejectRisk = this.hasAutoRejectRisk(redFlags);

    return {
      finalScore,
      matchBand,
      interviewProbability,
      totalPenalty,
      autoRejectRisk,
    };
  }

  /**
   * Get penalty value for specific red flag types
   */
  static getRedFlagPenaltyValue(
    flagType: 'employment_gap_6_months' | 'job_hopping_pattern' | 'title_inflation' | 'keyword_stuffing'
  ): number {
    return RED_FLAG_PENALTIES[flagType];
  }

  /**
   * Validate that tier weights sum to 100 (excluding red_flags)
   */
  static validateTierWeights(): boolean {
    const weightsExcludingRedFlags = Object.entries(TIER_WEIGHTS)
      .filter(([key]) => key !== 'red_flags')
      .reduce((sum, [, weight]) => sum + weight, 0);

    return weightsExcludingRedFlags === 100;
  }

  /**
   * Get band color for UI display
   */
  static getBandColor(matchBand: MatchBand): string {
    switch (matchBand) {
      case 'Excellent Match':
        return 'green';
      case 'Very Good Match':
        return 'emerald';
      case 'Good Match':
        return 'teal';
      case 'Fair Match':
        return 'yellow';
      case 'Below Average':
        return 'orange';
      case 'Poor Match':
        return 'red';
      case 'Very Poor':
        return 'red';
      case 'Inadequate':
        return 'red';
      case 'Minimal Match':
        return 'gray';
      default:
        return 'gray';
    }
  }

  /**
   * Get status text for critical metric score
   */
  static getCriticalMetricStatus(percentage: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'fair';
    return 'poor';
  }
}

export default ScoreMapperService;
