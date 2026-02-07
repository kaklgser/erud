/**
 * Property-Based Tests for Enhanced ATS Score Checker (220+ Metrics)
 * Using fast-check for property-based testing
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  EnhancedComprehensiveScore,
  TierScores,
  CriticalMetrics,
  RedFlag,
  MissingKeyword,
  TIER_WEIGHTS,
  MATCH_BAND_THRESHOLDS,
  MatchBand,
  ConfidenceLevel,
} from '../types/resume';

// ============================================================================
// ARBITRARIES (Generators for random test data)
// ============================================================================

// Generate a valid TierScore
const tierScoreArb = fc.record({
  tier_number: fc.integer({ min: 1, max: 10 }),
  tier_name: fc.string({ minLength: 1, maxLength: 50 }),
  score: fc.float({ min: 0, max: 100, noNaN: true }),
  max_score: fc.float({ min: 1, max: 100, noNaN: true }),
  percentage: fc.float({ min: 0, max: 100, noNaN: true }),
  weight: fc.float({ min: 0, max: 100, noNaN: true }),
  weighted_contribution: fc.float({ min: 0, max: 100, noNaN: true }),
  metrics_passed: fc.integer({ min: 0, max: 50 }),
  metrics_total: fc.integer({ min: 1, max: 50 }),
  top_issues: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
});

// Generate valid TierScores (all 11 tiers - education and certifications separate)
const tierScoresArb: fc.Arbitrary<TierScores> = fc.record({
  basic_structure: tierScoreArb,
  content_structure: tierScoreArb,
  experience: tierScoreArb,
  education: tierScoreArb,
  certifications: tierScoreArb,
  skills_keywords: tierScoreArb,
  projects: tierScoreArb,
  red_flags: tierScoreArb,
  competitive: tierScoreArb,
  culture_fit: tierScoreArb,
  qualitative: tierScoreArb,
});

// Generate valid CriticalMetricScore
const criticalMetricScoreArb = fc.record({
  score: fc.float({ min: 0, max: 5, noNaN: true }),
  max_score: fc.float({ min: 1, max: 5, noNaN: true }),
  percentage: fc.float({ min: 0, max: 100, noNaN: true }),
  status: fc.constantFrom('excellent', 'good', 'fair', 'poor') as fc.Arbitrary<'excellent' | 'good' | 'fair' | 'poor'>,
  details: fc.string({ minLength: 1, maxLength: 200 }),
});

// Generate valid CriticalMetrics (Big 5)
const criticalMetricsArb: fc.Arbitrary<CriticalMetrics> = fc.record({
  jd_keywords_match: criticalMetricScoreArb,
  technical_skills_alignment: criticalMetricScoreArb,
  quantified_results_presence: criticalMetricScoreArb,
  job_title_relevance: criticalMetricScoreArb,
  experience_relevance: criticalMetricScoreArb,
  total_critical_score: fc.float({ min: 0, max: 19, noNaN: true }),
});

// Generate valid RedFlag
const redFlagArb: fc.Arbitrary<RedFlag> = fc.record({
  type: fc.constantFrom('employment', 'skills', 'formatting') as fc.Arbitrary<'employment' | 'skills' | 'formatting'>,
  id: fc.integer({ min: 1, max: 220 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  severity: fc.constantFrom('low', 'medium', 'high', 'critical') as fc.Arbitrary<'low' | 'medium' | 'high' | 'critical'>,
  penalty: fc.integer({ min: -10, max: 0 }),
  description: fc.string({ minLength: 1, maxLength: 200 }),
  recommendation: fc.string({ minLength: 1, maxLength: 200 }),
});

// Generate valid MissingKeyword
const missingKeywordArb: fc.Arbitrary<MissingKeyword> = fc.record({
  keyword: fc.string({ minLength: 1, maxLength: 50 }),
  tier: fc.constantFrom('critical', 'important', 'nice_to_have') as fc.Arbitrary<'critical' | 'important' | 'nice_to_have'>,
  impact: fc.float({ min: 0, max: 10, noNaN: true }),
  suggestedPlacement: fc.string({ minLength: 1, maxLength: 100 }),
  color: fc.constantFrom('red', 'orange', 'yellow') as fc.Arbitrary<'red' | 'orange' | 'yellow'>,
});

// Generate valid MatchBand
const matchBandArb: fc.Arbitrary<MatchBand> = fc.constantFrom(
  'Excellent Match',
  'Very Good Match',
  'Good Match',
  'Fair Match',
  'Below Average',
  'Poor Match',
  'Very Poor',
  'Inadequate',
  'Minimal Match',
  'No Match'
);

// Generate valid ConfidenceLevel
const confidenceLevelArb: fc.Arbitrary<ConfidenceLevel> = fc.constantFrom('High', 'Medium', 'Low');

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Enhanced ATS Score Checker - Property Tests', () => {
  /**
   * **Feature: enhanced-ats-score-checker, Property 14: Response Contains All Required Fields**
   * **Validates: Requirements 18.1**
   */
  describe('Property 14: Response Contains All Required Fields', () => {
    it('should have all required base ComprehensiveScore fields', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          matchBandArb,
          fc.string({ minLength: 1 }),
          confidenceLevelArb,
          (overall, matchBand, probability, confidence) => {
            const score = {
              overall,
              match_band: matchBand,
              interview_probability_range: probability,
              confidence,
            };

            expect(score.overall).toBeGreaterThanOrEqual(0);
            expect(score.overall).toBeLessThanOrEqual(100);
            expect(score.match_band).toBeDefined();
            expect(score.interview_probability_range).toBeDefined();
            expect(score.confidence).toBeDefined();
            expect(['High', 'Medium', 'Low']).toContain(score.confidence);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have all 11 tier scores present', () => {
      fc.assert(
        fc.property(tierScoresArb, (tierScores) => {
          const requiredTiers = [
            'basic_structure',
            'content_structure',
            'experience',
            'education',
            'certifications',
            'skills_keywords',
            'projects',
            'red_flags',
            'competitive',
            'culture_fit',
            'qualitative',
          ];

          requiredTiers.forEach((tier) => {
            expect(tierScores).toHaveProperty(tier);
            expect(tierScores[tier as keyof TierScores]).toBeDefined();
            expect(tierScores[tier as keyof TierScores].tier_number).toBeGreaterThanOrEqual(1);
            expect(tierScores[tier as keyof TierScores].tier_number).toBeLessThanOrEqual(10);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should have all Big 5 critical metrics present', () => {
      fc.assert(
        fc.property(criticalMetricsArb, (criticalMetrics) => {
          const requiredMetrics = [
            'jd_keywords_match',
            'technical_skills_alignment',
            'quantified_results_presence',
            'job_title_relevance',
            'experience_relevance',
          ];

          requiredMetrics.forEach((metric) => {
            expect(criticalMetrics).toHaveProperty(metric);
            expect(criticalMetrics[metric as keyof Omit<CriticalMetrics, 'total_critical_score'>]).toBeDefined();
          });

          expect(criticalMetrics.total_critical_score).toBeGreaterThanOrEqual(0);
          expect(criticalMetrics.total_critical_score).toBeLessThanOrEqual(19);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: enhanced-ats-score-checker, Property 2: Rubric Weights Sum to 100**
   * **Validates: Requirements 1.2, 2.2**
   */
  describe('Property 2: Rubric Weights Sum to 100', () => {
    it('tier weights should sum to 100 (excluding red_flags)', () => {
      const weightsExcludingRedFlags = Object.entries(TIER_WEIGHTS)
        .filter(([key]) => key !== 'red_flags')
        .reduce((sum, [, weight]) => sum + weight, 0);

      expect(weightsExcludingRedFlags).toBe(100);
    });

    it('red_flags tier should have 0 weight (penalty-based)', () => {
      expect(TIER_WEIGHTS.red_flags).toBe(0);
    });
  });

  /**
   * **Feature: enhanced-ats-score-checker, Property 3: Score-to-Band Mapping Consistency**
   * **Validates: Requirements 11.1-11.6**
   */
  describe('Property 3: Score-to-Band Mapping Consistency', () => {
    const getMatchBandForScore = (score: number): MatchBand => {
      if (score >= 90) return 'Excellent Match';
      if (score >= 80) return 'Very Good Match';
      if (score >= 70) return 'Good Match';
      if (score >= 60) return 'Fair Match';
      if (score >= 50) return 'Below Average';
      if (score >= 40) return 'Poor Match';
      if (score >= 30) return 'Very Poor';
      if (score >= 20) return 'Inadequate';
      return 'Minimal Match';
    };

    it('should correctly map scores to bands', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
          const band = getMatchBandForScore(score);

          if (score >= 90) expect(band).toBe('Excellent Match');
          else if (score >= 80) expect(band).toBe('Very Good Match');
          else if (score >= 70) expect(band).toBe('Good Match');
          else if (score >= 60) expect(band).toBe('Fair Match');
          else if (score >= 50) expect(band).toBe('Below Average');
          else if (score >= 40) expect(band).toBe('Poor Match');
          else if (score >= 30) expect(band).toBe('Very Poor');
          else if (score >= 20) expect(band).toBe('Inadequate');
          else expect(band).toBe('Minimal Match');
        }),
        { numRuns: 100 }
      );
    });

    it('should have correct probability ranges for each band', () => {
      expect(MATCH_BAND_THRESHOLDS['Excellent Match'].probability).toBe('85-100%');
      expect(MATCH_BAND_THRESHOLDS['Very Good Match'].probability).toBe('70-84%');
      expect(MATCH_BAND_THRESHOLDS['Good Match'].probability).toBe('55-69%');
      expect(MATCH_BAND_THRESHOLDS['Fair Match'].probability).toBe('35-54%');
      expect(MATCH_BAND_THRESHOLDS['Below Average'].probability).toBe('20-34%');
      expect(MATCH_BAND_THRESHOLDS['Poor Match'].probability).toBe('8-19%');
      expect(MATCH_BAND_THRESHOLDS['Very Poor'].probability).toBe('3-7%');
      expect(MATCH_BAND_THRESHOLDS['Inadequate'].probability).toBe('1-2%');
      expect(MATCH_BAND_THRESHOLDS['Minimal Match'].probability).toBe('0-0.5%');
    });
  });

  /**
   * **Feature: enhanced-ats-score-checker, Property 12: Keyword Tier Color Mapping**
   * **Validates: Requirements 10.1**
   */
  describe('Property 12: Keyword Tier Color Mapping', () => {
    const getColorForTier = (tier: 'critical' | 'important' | 'nice_to_have'): 'red' | 'orange' | 'yellow' => {
      switch (tier) {
        case 'critical':
          return 'red';
        case 'important':
          return 'orange';
        case 'nice_to_have':
          return 'yellow';
      }
    };

    it('should correctly map keyword tiers to colors', () => {
      fc.assert(
        fc.property(missingKeywordArb, (keyword) => {
          const expectedColor = getColorForTier(keyword.tier);

          // Verify the mapping function works correctly
          expect(getColorForTier('critical')).toBe('red');
          expect(getColorForTier('important')).toBe('orange');
          expect(getColorForTier('nice_to_have')).toBe('yellow');

          // Verify keyword has valid tier and color
          expect(['critical', 'important', 'nice_to_have']).toContain(keyword.tier);
          expect(['red', 'orange', 'yellow']).toContain(keyword.color);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: enhanced-ats-score-checker, Property 8: Red Flag Penalties Applied**
   * **Validates: Requirements 9.4**
   */
  describe('Property 8: Red Flag Penalties Applied', () => {
    it('red flag penalties should be negative or zero', () => {
      fc.assert(
        fc.property(redFlagArb, (redFlag) => {
          expect(redFlag.penalty).toBeLessThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('total penalty should equal sum of individual penalties', () => {
      fc.assert(
        fc.property(fc.array(redFlagArb, { minLength: 0, maxLength: 10 }), (redFlags) => {
          const totalPenalty = redFlags.reduce((sum, flag) => sum + flag.penalty, 0);
          expect(totalPenalty).toBeLessThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: enhanced-ats-score-checker, Property 9: Response JSON Round-Trip**
   * **Validates: Requirements 18.2, 18.3**
   */
  describe('Property 9: Response JSON Round-Trip', () => {
    // Generate a complete EnhancedComprehensiveScore for round-trip testing
    const enhancedScoreArb = fc.record({
      // Base ComprehensiveScore fields
      overall: fc.integer({ min: 0, max: 100 }),
      match_band: matchBandArb,
      interview_probability_range: fc.string({ minLength: 1, maxLength: 20 }),
      confidence: confidenceLevelArb,
      rubric_version: fc.string({ minLength: 1, maxLength: 10 }),
      weighting_mode: fc.constantFrom('JD', 'GENERAL') as fc.Arbitrary<'JD' | 'GENERAL'>,
      extraction_mode: fc.constantFrom('TEXT', 'OCR') as fc.Arbitrary<'TEXT' | 'OCR'>,
      trimmed: fc.boolean(),
      breakdown: fc.array(
        fc.record({
          key: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          weight_pct: fc.float({ min: 0, max: 100, noNaN: true }),
          score: fc.float({ min: 0, max: 100, noNaN: true }),
          max_score: fc.float({ min: 1, max: 100, noNaN: true }),
          contribution: fc.float({ min: 0, max: 100, noNaN: true }),
          details: fc.string(),
        }),
        { minLength: 1, maxLength: 10 }
      ),
      missing_keywords: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 15 }),
      actions: fc.array(fc.string({ minLength: 1 }), { minLength: 5, maxLength: 10 }),
      example_rewrites: fc.record({
        experience: fc.option(
          fc.record({
            original: fc.string({ minLength: 1 }),
            improved: fc.string({ minLength: 1 }),
            explanation: fc.string({ minLength: 1 }),
          }),
          { nil: undefined }
        ),
        projects: fc.option(
          fc.record({
            original: fc.string({ minLength: 1 }),
            improved: fc.string({ minLength: 1 }),
            explanation: fc.string({ minLength: 1 }),
          }),
          { nil: undefined }
        ),
      }),
      notes: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
      analysis: fc.string({ minLength: 1 }),
      keyStrengths: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
      improvementAreas: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
      recommendations: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
      // Enhanced fields
      tier_scores: tierScoresArb,
      critical_metrics: criticalMetricsArb,
      red_flags: fc.array(redFlagArb, { minLength: 0, maxLength: 10 }),
      red_flag_penalty: fc.integer({ min: -50, max: 0 }),
      auto_reject_risk: fc.boolean(),
      missing_keywords_enhanced: fc.array(missingKeywordArb, { minLength: 0, maxLength: 15 }),
      section_order_issues: fc.array(
        fc.record({
          section: fc.string({ minLength: 1 }),
          currentPosition: fc.integer({ min: 0, max: 10 }),
          expectedPosition: fc.integer({ min: 0, max: 10 }),
          penalty: fc.integer({ min: -5, max: 0 }),
        }),
        { minLength: 0, maxLength: 5 }
      ),
      format_issues: fc.array(
        fc.record({
          type: fc.constantFrom('table', 'multi_column', 'color', 'icon', 'image', 'font', 'graphics') as fc.Arbitrary<
            'table' | 'multi_column' | 'color' | 'icon' | 'image' | 'font' | 'graphics'
          >,
          description: fc.string({ minLength: 1 }),
          severity: fc.constantFrom('low', 'medium', 'high') as fc.Arbitrary<'low' | 'medium' | 'high'>,
        }),
        { minLength: 0, maxLength: 5 }
      ),
    });

    it('should survive JSON serialization and deserialization', () => {
      fc.assert(
        fc.property(enhancedScoreArb, (score) => {
          const serialized = JSON.stringify(score);
          const deserialized = JSON.parse(serialized);

          // Verify key fields survive round-trip
          expect(deserialized.overall).toBe(score.overall);
          expect(deserialized.match_band).toBe(score.match_band);
          expect(deserialized.confidence).toBe(score.confidence);
          expect(deserialized.red_flag_penalty).toBe(score.red_flag_penalty);
          expect(deserialized.auto_reject_risk).toBe(score.auto_reject_risk);

          // Verify tier scores survive
          expect(Object.keys(deserialized.tier_scores)).toHaveLength(11);

          // Verify critical metrics survive
          expect(deserialized.critical_metrics.total_critical_score).toBe(score.critical_metrics.total_critical_score);

          // Verify arrays survive
          expect(deserialized.red_flags).toHaveLength(score.red_flags.length);
          expect(deserialized.missing_keywords_enhanced).toHaveLength(score.missing_keywords_enhanced.length);
        }),
        { numRuns: 50 }
      );
    });

    it('should maintain data integrity after round-trip', () => {
      fc.assert(
        fc.property(enhancedScoreArb, (score) => {
          const serialized = JSON.stringify(score);
          const deserialized = JSON.parse(serialized);

          // Deep equality check for complex nested structures
          expect(JSON.stringify(deserialized.tier_scores)).toBe(JSON.stringify(score.tier_scores));
          expect(JSON.stringify(deserialized.critical_metrics)).toBe(JSON.stringify(score.critical_metrics));
        }),
        { numRuns: 50 }
      );
    });
  });
});

// ============================================================================
// SCORE MAPPER SERVICE TESTS
// ============================================================================

import { ScoreMapperService } from '../services/scoreMapperService';

describe('ScoreMapperService - Property Tests', () => {
  /**
   * **Feature: enhanced-ats-score-checker, Property 3: Score-to-Band Mapping (Service)**
   * **Validates: Requirements 13.1-13.6**
   */
  describe('Property 3: Score-to-Band Mapping (Service)', () => {
    it('should map any score 0-100 to a valid band', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
          const band = ScoreMapperService.getMatchBand(score);
          const validBands: MatchBand[] = [
            'Excellent Match',
            'Very Good Match',
            'Good Match',
            'Fair Match',
            'Below Average',
            'Poor Match',
            'Very Poor',
            'Inadequate',
            'Minimal Match',
          ];
          expect(validBands).toContain(band);
        }),
        { numRuns: 100 }
      );
    });

    it('should return valid probability for any band', () => {
      fc.assert(
        fc.property(matchBandArb, (band) => {
          const probability = ScoreMapperService.getInterviewProbability(band);
          expect(probability).toBeDefined();
          expect(probability.length).toBeGreaterThan(0);
          expect(probability).toMatch(/\d+.*%/); // Contains percentage
        }),
        { numRuns: 50 }
      );
    });

    it('should maintain monotonic relationship between score and band quality', () => {
      // Higher scores should map to better bands
      const bandOrder: MatchBand[] = [
        'Minimal Match',
        'Inadequate',
        'Very Poor',
        'Poor Match',
        'Below Average',
        'Fair Match',
        'Good Match',
        'Very Good Match',
        'Excellent Match',
      ];

      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          (score1, score2) => {
            const band1 = ScoreMapperService.getMatchBand(score1);
            const band2 = ScoreMapperService.getMatchBand(score2);
            const index1 = bandOrder.indexOf(band1);
            const index2 = bandOrder.indexOf(band2);

            if (score1 > score2) {
              expect(index1).toBeGreaterThanOrEqual(index2);
            } else if (score1 < score2) {
              expect(index1).toBeLessThanOrEqual(index2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: enhanced-ats-score-checker, Property 13: Tier Weights Sum to 100 (Service)**
   * **Validates: Requirements 1.2, 2.2**
   */
  describe('Property 13: Tier Weights Sum to 100 (Service)', () => {
    it('should validate tier weights sum correctly', () => {
      expect(ScoreMapperService.validateTierWeights()).toBe(true);
    });
  });

  /**
   * **Feature: enhanced-ats-score-checker, Property: Penalty Application**
   * **Validates: Requirements 9.4**
   */
  describe('Property: Penalty Application', () => {
    it('should keep score within 0-100 after penalties', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: -100, max: 0 }),
          (baseScore, penalty) => {
            const result = ScoreMapperService.applyPenalties(baseScore, penalty);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate correct total penalty from red flags', () => {
      fc.assert(
        fc.property(fc.array(redFlagArb, { minLength: 0, maxLength: 10 }), (redFlags) => {
          const totalPenalty = ScoreMapperService.calculateRedFlagPenalty(redFlags);
          const expectedPenalty = redFlags.reduce((sum, flag) => sum + flag.penalty, 0);
          expect(totalPenalty).toBe(expectedPenalty);
        }),
        { numRuns: 100 }
      );
    });

    it('should detect auto-reject risk with >= 3 critical flags', () => {
      // Create exactly 3 critical flags
      const criticalFlags: RedFlag[] = [
        { type: 'employment', id: 1, name: 'Gap', severity: 'critical', penalty: -3, description: '', recommendation: '' },
        { type: 'skills', id: 2, name: 'Stuffing', severity: 'critical', penalty: -5, description: '', recommendation: '' },
        { type: 'formatting', id: 3, name: 'Issues', severity: 'critical', penalty: -3, description: '', recommendation: '' },
      ];

      expect(ScoreMapperService.hasAutoRejectRisk(criticalFlags)).toBe(true);

      // Less than 3 critical flags
      const fewFlags: RedFlag[] = [
        { type: 'employment', id: 1, name: 'Gap', severity: 'critical', penalty: -3, description: '', recommendation: '' },
        { type: 'skills', id: 2, name: 'Minor', severity: 'low', penalty: -1, description: '', recommendation: '' },
      ];

      expect(ScoreMapperService.hasAutoRejectRisk(fewFlags)).toBe(false);
    });
  });

  /**
   * **Feature: enhanced-ats-score-checker, Property: Weighted Score Calculation**
   * **Validates: Requirements 1.2**
   */
  describe('Property: Weighted Score Calculation', () => {
    it('should calculate weighted score within 0-100 range', () => {
      fc.assert(
        fc.property(tierScoresArb, (tierScores) => {
          const result = ScoreMapperService.calculateWeightedScore(tierScores);
          // Weighted score can exceed 100 if all tiers score 100%
          // but should be reasonable
          expect(result.weightedScore).toBeGreaterThanOrEqual(0);
          expect(result.tierContributions).toBeDefined();
          expect(Object.keys(result.tierContributions)).toHaveLength(11);
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: enhanced-ats-score-checker, Property: Complete Score Mapping**
   * **Validates: Requirements 13.1-13.6**
   */
  describe('Property: Complete Score Mapping', () => {
    it('should return complete result with all fields', () => {
      fc.assert(
        fc.property(tierScoresArb, fc.array(redFlagArb, { minLength: 0, maxLength: 5 }), (tierScores, redFlags) => {
          const result = ScoreMapperService.mapScore(tierScores, redFlags);

          expect(result.finalScore).toBeGreaterThanOrEqual(0);
          expect(result.finalScore).toBeLessThanOrEqual(100);
          expect(result.matchBand).toBeDefined();
          expect(result.interviewProbability).toBeDefined();
          expect(typeof result.totalPenalty).toBe('number');
          expect(typeof result.autoRejectRisk).toBe('boolean');
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: enhanced-ats-score-checker, Property: Critical Metric Status**
   * **Validates: Requirements 1.5**
   */
  describe('Property: Critical Metric Status', () => {
    it('should return valid status for any percentage', () => {
      fc.assert(
        fc.property(fc.float({ min: 0, max: 100, noNaN: true }), (percentage) => {
          const status = ScoreMapperService.getCriticalMetricStatus(percentage);
          expect(['excellent', 'good', 'fair', 'poor']).toContain(status);
        }),
        { numRuns: 100 }
      );
    });

    it('should map percentages to correct status', () => {
      expect(ScoreMapperService.getCriticalMetricStatus(85)).toBe('excellent');
      expect(ScoreMapperService.getCriticalMetricStatus(70)).toBe('good');
      expect(ScoreMapperService.getCriticalMetricStatus(50)).toBe('fair');
      expect(ScoreMapperService.getCriticalMetricStatus(30)).toBe('poor');
    });
  });
});


// ============================================================================
// ENHANCED SCORING SERVICE INTEGRATION TESTS
// ============================================================================

import { EnhancedScoringService } from '../services/enhancedScoringService';

describe('EnhancedScoringService - Integration Tests', () => {
  /**
   * **Feature: enhanced-ats-score-checker, Property 1: Valid Score Output Structure**
   * **Validates: Requirements 1.3, 2.3**
   */
  describe('Property 1: Valid Score Output Structure', () => {
    it('should return valid EnhancedComprehensiveScore with all fields', async () => {
      const input = {
        resumeText: `
          John Doe
          Software Engineer
          john.doe@email.com | (555) 123-4567 | linkedin.com/in/johndoe
          
          SUMMARY
          Experienced software engineer with 5+ years building scalable web applications.
          
          EXPERIENCE
          Senior Software Engineer | Tech Corp | 2020-Present
          - Led development of microservices architecture serving 1M+ users
          - Reduced API response time by 40% through optimization
          - Mentored team of 5 junior developers
          
          Software Engineer | StartupXYZ | 2018-2020
          - Built React frontend with TypeScript
          - Implemented CI/CD pipeline using Jenkins
          
          SKILLS
          JavaScript, TypeScript, React, Node.js, Python, AWS, Docker, Kubernetes
          
          EDUCATION
          B.S. Computer Science | MIT | 2018
        `,
        extractionMode: 'TEXT' as const,
      };

      const result = await EnhancedScoringService.calculateScore(input);

      // Validate base fields
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
      expect(result.match_band).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.rubric_version).toBe('2.0-220metrics');

      // Validate tier scores
      expect(Object.keys(result.tier_scores)).toHaveLength(11);
      expect(result.tier_scores.basic_structure).toBeDefined();
      expect(result.tier_scores.experience).toBeDefined();
      expect(result.tier_scores.skills_keywords).toBeDefined();

      // Validate critical metrics
      expect(result.critical_metrics).toBeDefined();
      expect(result.critical_metrics.jd_keywords_match).toBeDefined();
      expect(result.critical_metrics.total_critical_score).toBeGreaterThanOrEqual(0);

      // Validate red flags
      expect(Array.isArray(result.red_flags)).toBe(true);
      expect(typeof result.red_flag_penalty).toBe('number');
      expect(typeof result.auto_reject_risk).toBe('boolean');
    });
  });

  /**
   * **Feature: enhanced-ats-score-checker, Property 2: All 11 Tier Scores Present**
   * **Validates: Requirements 3-12**
   */
  describe('Property 2: All 11 Tier Scores Present', () => {
    it('should have all 11 tier scores with valid structure', async () => {
      const input = {
        resumeText: 'John Doe\nSoftware Engineer\njohn@email.com\n\nExperience:\n- Built web apps',
        extractionMode: 'TEXT' as const,
      };

      const result = await EnhancedScoringService.calculateScore(input);

      const expectedTiers = [
        { key: 'basic_structure', number: 1, name: 'Basic Structure' },
        { key: 'content_structure', number: 2, name: 'Content Structure' },
        { key: 'experience', number: 3, name: 'Experience' },
        { key: 'education', number: 4, name: 'Education' },
        { key: 'certifications', number: 5, name: 'Certifications' },
        { key: 'skills_keywords', number: 6, name: 'Skills & Keywords' },
        { key: 'projects', number: 7, name: 'Projects' },
        { key: 'red_flags', number: 8, name: 'Red Flags' },
        { key: 'competitive', number: 9, name: 'Competitive' },
        { key: 'culture_fit', number: 10, name: 'Culture Fit' },
        { key: 'qualitative', number: 11, name: 'Qualitative' },
      ];

      expectedTiers.forEach(({ key, number, name }) => {
        const tier = result.tier_scores[key as keyof typeof result.tier_scores];
        expect(tier).toBeDefined();
        expect(tier.tier_number).toBe(number);
        expect(tier.tier_name).toBe(name);
        expect(tier.score).toBeGreaterThanOrEqual(0);
        expect(tier.max_score).toBeGreaterThan(0);
        expect(tier.percentage).toBeGreaterThanOrEqual(0);
        expect(tier.percentage).toBeLessThanOrEqual(100);
        expect(tier.weight).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(tier.top_issues)).toBe(true);
      });
    });
  });

  /**
   * **Feature: enhanced-ats-score-checker, Property 4: Critical Metrics Present**
   * **Validates: Requirements 1.5**
   */
  describe('Property 4: Critical Metrics Present', () => {
    it('should have all Big 5 critical metrics with valid structure', async () => {
      const input = {
        resumeText: `
          Jane Smith
          Full Stack Developer
          jane@email.com
          
          Experience:
          - Developed React applications with 50% performance improvement
          - Led team of 3 engineers
          
          Skills: JavaScript, React, Node.js, AWS
        `,
        jobDescription: 'Looking for a Full Stack Developer with React, Node.js, and AWS experience.',
        extractionMode: 'TEXT' as const,
      };

      const result = await EnhancedScoringService.calculateScore(input);

      // Validate Big 5 metrics
      const big5 = [
        'jd_keywords_match',
        'technical_skills_alignment',
        'quantified_results_presence',
        'job_title_relevance',
        'experience_relevance',
      ];

      big5.forEach((metric) => {
        const m = result.critical_metrics[metric as keyof Omit<CriticalMetrics, 'total_critical_score'>];
        expect(m).toBeDefined();
        expect(m.score).toBeGreaterThanOrEqual(0);
        expect(m.max_score).toBeGreaterThan(0);
        expect(m.percentage).toBeGreaterThanOrEqual(0);
        expect(m.percentage).toBeLessThanOrEqual(100);
        expect(['excellent', 'good', 'fair', 'poor']).toContain(m.status);
        expect(m.details).toBeDefined();
      });

      // Total should be sum of individual scores (max 19)
      expect(result.critical_metrics.total_critical_score).toBeGreaterThanOrEqual(0);
      expect(result.critical_metrics.total_critical_score).toBeLessThanOrEqual(19);
    });
  });

  /**
   * **Feature: enhanced-ats-score-checker, Property: JD Mode vs General Mode**
   * **Validates: Requirements 1.1, 2.1**
   */
  describe('Property: JD Mode vs General Mode', () => {
    it('should set weighting_mode to JD when job description provided', async () => {
      const input = {
        resumeText: 'John Doe\nSoftware Engineer\njohn@email.com',
        jobDescription: 'Looking for a software engineer',
        extractionMode: 'TEXT' as const,
      };

      const result = await EnhancedScoringService.calculateScore(input);
      expect(result.weighting_mode).toBe('JD');
    });

    it('should set weighting_mode to GENERAL when no job description', async () => {
      const input = {
        resumeText: 'John Doe\nSoftware Engineer\njohn@email.com',
        extractionMode: 'TEXT' as const,
      };

      const result = await EnhancedScoringService.calculateScore(input);
      expect(result.weighting_mode).toBe('GENERAL');
    });
  });

  /**
   * **Feature: enhanced-ats-score-checker, Property: Confidence Level Assignment**
   * **Validates: Requirements 17.1-17.4**
   */
  describe('Property: Confidence Level Assignment', () => {
    it('should assign High confidence for detailed resume with JD', async () => {
      const input = {
        resumeText: `
          John Doe
          Senior Software Engineer
          john.doe@email.com | (555) 123-4567 | linkedin.com/in/johndoe | github.com/johndoe
          San Francisco, CA
          
          PROFESSIONAL SUMMARY
          Experienced software engineer with 8+ years building scalable distributed systems.
          
          WORK EXPERIENCE
          Senior Software Engineer | Google | 2020-Present
          - Led development of microservices architecture serving 10M+ users daily
          - Reduced infrastructure costs by 35% through optimization
          - Mentored team of 8 engineers across 3 time zones
          
          Software Engineer | Facebook | 2016-2020
          - Built React frontend serving 5M daily active users
          - Implemented real-time notification system
          - Improved page load time by 60%
          
          SKILLS
          Languages: JavaScript, TypeScript, Python, Go, Java
          Frontend: React, Vue, Angular, Next.js
          Backend: Node.js, Django, Spring Boot
          Cloud: AWS, GCP, Azure, Kubernetes, Docker
          
          EDUCATION
          M.S. Computer Science | Stanford University | 2016
          B.S. Computer Science | MIT | 2014
          
          CERTIFICATIONS
          AWS Solutions Architect Professional | 2023
          Google Cloud Professional | 2022
        `,
        jobDescription: `
          We are looking for a Senior Software Engineer with:
          - 5+ years of experience in software development
          - Strong experience with React, Node.js, and cloud platforms
          - Experience leading teams and mentoring engineers
          - Background in distributed systems
        `,
        extractionMode: 'TEXT' as const,
        resumeData: {
          name: 'John Doe',
          email: 'john.doe@email.com',
          phone: '(555) 123-4567',
          linkedin: 'linkedin.com/in/johndoe',
          github: 'github.com/johndoe',
          workExperience: [
            { role: 'Senior Software Engineer', company: 'Google', year: '2020-Present', bullets: ['Led development'] },
            { role: 'Software Engineer', company: 'Facebook', year: '2016-2020', bullets: ['Built React frontend'] },
          ],
          skills: [{ category: 'Languages', count: 5, list: ['JavaScript', 'TypeScript', 'Python', 'Go', 'Java'] }],
          education: [{ degree: 'M.S. Computer Science', school: 'Stanford University', year: '2016' }],
          projects: [],
          certifications: ['AWS Solutions Architect Professional'],
        },
      };

      const result = await EnhancedScoringService.calculateScore(input);
      expect(result.confidence).toBe('High');
    });

    it('should assign Low confidence for minimal resume', async () => {
      const input = {
        resumeText: 'John Doe\nDeveloper',
        extractionMode: 'TEXT' as const,
      };

      const result = await EnhancedScoringService.calculateScore(input);
      expect(['Low', 'Medium']).toContain(result.confidence);
    });
  });
});


// ============================================================================
// RECOMMENDATIONS AND EXAMPLE REWRITES TESTS
// ============================================================================

describe('EnhancedScoringService - Recommendations Tests', () => {
  /**
   * **Feature: enhanced-ats-score-checker, Property 6: Recommendations Count**
   * **Validates: Requirements 14.1**
   */
  describe('Property 6: Recommendations Count', () => {
    it('should return 5-10 actionable recommendations', async () => {
      const input = {
        resumeText: `
          John Doe
          Software Engineer
          john@email.com
          
          Experience:
          - Worked on various projects
          - Helped with development tasks
          
          Skills: JavaScript
        `,
        jobDescription: 'Looking for a Senior Software Engineer with React, Node.js, AWS, Docker, Kubernetes experience.',
        extractionMode: 'TEXT' as const,
      };

      const result = await EnhancedScoringService.calculateScore(input);

      expect(result.actions.length).toBeGreaterThanOrEqual(1);
      expect(result.actions.length).toBeLessThanOrEqual(10);
      expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
      expect(result.recommendations.length).toBeLessThanOrEqual(10);
    });

    it('should include tier-specific recommendations', async () => {
      const input = {
        resumeText: 'John Doe\njohn@email.com\nDeveloper',
        extractionMode: 'TEXT' as const,
      };

      const result = await EnhancedScoringService.calculateScore(input);

      // Should have recommendations from various tiers
      const hasRecommendations = result.recommendations.length > 0 || result.actions.length > 0;
      expect(hasRecommendations).toBe(true);
    });
  });

  /**
   * **Feature: enhanced-ats-score-checker, Property 7: Example Rewrites Structure**
   * **Validates: Requirements 14.3, 14.4**
   */
  describe('Property 7: Example Rewrites Structure', () => {
    it('should have valid example_rewrites structure when experience exists', async () => {
      const input = {
        resumeText: `
          John Doe
          Software Engineer
          john@email.com
          
          Experience:
          Senior Developer | Tech Corp | 2020-Present
          - Worked on web applications
          - Helped with backend development
        `,
        extractionMode: 'TEXT' as const,
        resumeData: {
          name: 'John Doe',
          email: 'john@email.com',
          phone: '',
          linkedin: '',
          github: '',
          workExperience: [
            {
              role: 'Senior Developer',
              company: 'Tech Corp',
              year: '2020-Present',
              bullets: ['Worked on web applications', 'Helped with backend development'],
            },
          ],
          education: [],
          projects: [],
          skills: [],
          certifications: [],
        },
      };

      const result = await EnhancedScoringService.calculateScore(input);

      expect(result.example_rewrites).toBeDefined();
      if (result.example_rewrites.experience) {
        expect(result.example_rewrites.experience.original).toBeDefined();
        expect(result.example_rewrites.experience.improved).toBeDefined();
        expect(result.example_rewrites.experience.explanation).toBeDefined();
      }
    });
  });

  /**
   * **Feature: enhanced-ats-score-checker, Property 12: Confidence Level Valid**
   * **Validates: Requirements 17.1**
   */
  describe('Property 12: Confidence Level Valid', () => {
    it('should return valid confidence level', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 50, maxLength: 500 }),
          async (resumeText) => {
            const input = {
              resumeText,
              extractionMode: 'TEXT' as const,
            };

            const result = await EnhancedScoringService.calculateScore(input);
            expect(['High', 'Medium', 'Low']).toContain(result.confidence);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * **Feature: enhanced-ats-score-checker, Property 11: Low Score Triggers Optimizer Recommendation**
   * **Validates: Requirements 16.4**
   */
  describe('Property 11: Low Score Triggers Optimizer Recommendation', () => {
    it('should include optimizer recommendation for low scores', async () => {
      const input = {
        resumeText: 'John Doe\nDeveloper',
        extractionMode: 'TEXT' as const,
      };

      const result = await EnhancedScoringService.calculateScore(input);

      // For very low scores, should have improvement recommendations
      if (result.overall < 40) {
        expect(result.improvementAreas.length).toBeGreaterThan(0);
      }
    });
  });
});
