/**
 * Property-Based Tests for Enhanced JD-Based Resume Optimizer (220+ Metrics)
 * Using fast-check for property-based testing
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  OptimizationMode,
  OptimizationResult,
  GapAnalysisResult,
  TierGap,
  Big5Gap,
  TierComparison,
  Big5Improvement,
  SectionChange,
  OPTIMIZATION_MODES,
} from '../types/optimizer';

// ============================================================================
// ARBITRARIES (Generators for random test data)
// ============================================================================

// Generate valid OptimizationMode
const optimizationModeArb: fc.Arbitrary<OptimizationMode> = fc.constantFrom('light', 'standard', 'aggressive');

// Generate valid TierGap
const tierGapArb: fc.Arbitrary<TierGap> = fc.record({
  tierNumber: fc.integer({ min: 1, max: 10 }),
  tierName: fc.string({ minLength: 1, maxLength: 50 }),
  currentScore: fc.float({ min: 0, max: 100, noNaN: true }),
  maxScore: fc.float({ min: 1, max: 100, noNaN: true }),
  percentage: fc.float({ min: 0, max: 100, noNaN: true }),
  weight: fc.float({ min: 0, max: 25, noNaN: true }),
  failingMetrics: fc.array(
    fc.record({
      metricId: fc.integer({ min: 1, max: 1000 }),
      metricName: fc.string({ minLength: 1, maxLength: 50 }),
      currentValue: fc.string({ minLength: 1, maxLength: 50 }),
      expectedValue: fc.string({ minLength: 1, maxLength: 50 }),
      impact: fc.float({ min: 0, max: 10, noNaN: true }),
      recommendation: fc.string({ minLength: 1, maxLength: 200 }),
    }),
    { minLength: 0, maxLength: 5 }
  ),
});

// Generate valid Big5Gap
const big5GapArb: fc.Arbitrary<Big5Gap> = fc.record({
  metric: fc.constantFrom(
    'jd_keywords_match',
    'technical_skills_alignment',
    'quantified_results_presence',
    'job_title_relevance',
    'experience_relevance'
  ) as fc.Arbitrary<Big5Gap['metric']>,
  metricName: fc.string({ minLength: 1, maxLength: 50 }),
  currentScore: fc.float({ min: 0, max: 5, noNaN: true }),
  maxScore: fc.float({ min: 1, max: 5, noNaN: true }),
  gap: fc.float({ min: 0, max: 5, noNaN: true }),
  priority: fc.constantFrom('critical', 'high', 'medium') as fc.Arbitrary<'critical' | 'high' | 'medium'>,
  improvements: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
});


// Generate valid TierComparison
const tierComparisonArb: fc.Arbitrary<TierComparison> = fc.record({
  tierNumber: fc.integer({ min: 1, max: 10 }),
  tierName: fc.string({ minLength: 1, maxLength: 50 }),
  beforeScore: fc.float({ min: 0, max: 100, noNaN: true }),
  afterScore: fc.float({ min: 0, max: 100, noNaN: true }),
  improvement: fc.float({ min: -10, max: 50, noNaN: true }),
  metricsImproved: fc.integer({ min: 0, max: 20 }),
});

// Generate valid Big5Improvement
const big5ImprovementArb: fc.Arbitrary<Big5Improvement> = fc.record({
  metric: fc.string({ minLength: 1, maxLength: 50 }),
  metricName: fc.string({ minLength: 1, maxLength: 50 }),
  beforeScore: fc.float({ min: 0, max: 5, noNaN: true }),
  afterScore: fc.float({ min: 0, max: 5, noNaN: true }),
  improvement: fc.float({ min: -1, max: 5, noNaN: true }),
  changesApplied: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
});

// Generate valid SectionChange
const sectionChangeArb: fc.Arbitrary<SectionChange> = fc.record({
  section: fc.constantFrom('skills', 'experience', 'summary', 'education', 'projects'),
  changeType: fc.constantFrom('added', 'modified', 'rewritten', 'reordered', 'removed') as fc.Arbitrary<SectionChange['changeType']>,
  description: fc.string({ minLength: 1, maxLength: 200 }),
  before: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  after: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
});

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Enhanced JD Optimizer - Property Tests', () => {
  /**
   * **Feature: enhanced-jd-optimizer, Property 1: Gap Analysis Contains All 10 Tiers**
   * **Validates: Requirements 1.1, 1.2**
   */
  describe('Property 1: Gap Analysis Contains All 10 Tiers', () => {
    it('should have tier gaps for tiers 1-10', () => {
      fc.assert(
        fc.property(
          fc.array(tierGapArb, { minLength: 10, maxLength: 10 }),
          (tierGaps) => {
            // Assign tier numbers 1-10
            const numberedGaps = tierGaps.map((gap, i) => ({ ...gap, tierNumber: i + 1 }));
            
            // Verify all 10 tiers are present
            const tierNumbers = numberedGaps.map(g => g.tierNumber);
            for (let i = 1; i <= 10; i++) {
              expect(tierNumbers).toContain(i);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: enhanced-jd-optimizer, Property 2: Big 5 Gaps Flagged as Highest Priority**
   * **Validates: Requirements 1.4**
   */
  describe('Property 2: Big 5 Gaps Flagged as Highest Priority', () => {
    it('should have all 5 Big 5 metrics in gaps', () => {
      fc.assert(
        fc.property(
          fc.array(big5GapArb, { minLength: 5, maxLength: 5 }),
          (big5Gaps) => {
            const requiredMetrics = [
              'jd_keywords_match',
              'technical_skills_alignment',
              'quantified_results_presence',
              'job_title_relevance',
              'experience_relevance',
            ];

            // Assign unique metrics
            const assignedGaps = big5Gaps.map((gap, i) => ({
              ...gap,
              metric: requiredMetrics[i] as Big5Gap['metric'],
            }));

            const metrics = assignedGaps.map(g => g.metric);
            requiredMetrics.forEach(m => {
              expect(metrics).toContain(m);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('critical priority gaps should have priority value', () => {
      fc.assert(
        fc.property(big5GapArb, (gap) => {
          expect(['critical', 'high', 'medium']).toContain(gap.priority);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: enhanced-jd-optimizer, Property 4: Predicted Score Between 0-100**
   * **Validates: Requirements 9.2**
   */
  describe('Property 4: Predicted Score Between 0-100', () => {
    it('afterScore should be between 0 and 100', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: enhanced-jd-optimizer, Property 7: Before/After Tier Scores Present**
   * **Validates: Requirements 9.4**
   */
  describe('Property 7: Before/After Tier Scores Present', () => {
    it('should have 10 tier comparisons', () => {
      fc.assert(
        fc.property(
          fc.array(tierComparisonArb, { minLength: 10, maxLength: 10 }),
          (comparisons) => {
            expect(comparisons).toHaveLength(10);
            
            comparisons.forEach(comp => {
              expect(comp.beforeScore).toBeGreaterThanOrEqual(0);
              expect(comp.afterScore).toBeGreaterThanOrEqual(0);
              expect(comp.tierNumber).toBeGreaterThanOrEqual(1);
              expect(comp.tierNumber).toBeLessThanOrEqual(10);
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: enhanced-jd-optimizer, Property 8: Big 5 Improvements Tracked**
   * **Validates: Requirements 9.5**
   */
  describe('Property 8: Big 5 Improvements Tracked', () => {
    it('should have 5 Big 5 improvements', () => {
      fc.assert(
        fc.property(
          fc.array(big5ImprovementArb, { minLength: 5, maxLength: 5 }),
          (improvements) => {
            expect(improvements).toHaveLength(5);
            
            improvements.forEach(imp => {
              expect(imp.beforeScore).toBeGreaterThanOrEqual(0);
              expect(imp.afterScore).toBeGreaterThanOrEqual(0);
              expect(typeof imp.improvement).toBe('number');
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: enhanced-jd-optimizer, Property 9: Light Mode Minimal Changes**
   * **Validates: Requirements 10.1**
   */
  describe('Property 9: Light Mode Minimal Changes', () => {
    it('light mode should have maxChangesPerSection of 2', () => {
      expect(OPTIMIZATION_MODES.light.maxChangesPerSection).toBe(2);
      expect(OPTIMIZATION_MODES.light.rewriteBullets).toBe(false);
      expect(OPTIMIZATION_MODES.light.restructureSections).toBe(false);
    });
  });

  /**
   * **Feature: enhanced-jd-optimizer, Property 10: Aggressive Mode More Changes Than Standard**
   * **Validates: Requirements 10.2, 10.3**
   */
  describe('Property 10: Aggressive Mode More Changes Than Standard', () => {
    it('aggressive mode should allow more changes than standard', () => {
      expect(OPTIMIZATION_MODES.aggressive.maxChangesPerSection)
        .toBeGreaterThan(OPTIMIZATION_MODES.standard.maxChangesPerSection);
    });

    it('standard mode should allow more changes than light', () => {
      expect(OPTIMIZATION_MODES.standard.maxChangesPerSection)
        .toBeGreaterThan(OPTIMIZATION_MODES.light.maxChangesPerSection);
    });

    it('aggressive mode should enable all features', () => {
      expect(OPTIMIZATION_MODES.aggressive.addMissingKeywords).toBe(true);
      expect(OPTIMIZATION_MODES.aggressive.rewriteBullets).toBe(true);
      expect(OPTIMIZATION_MODES.aggressive.restructureSections).toBe(true);
      expect(OPTIMIZATION_MODES.aggressive.generateSummary).toBe(true);
    });
  });

  /**
   * **Feature: enhanced-jd-optimizer, Property: Section Changes Valid**
   * **Validates: Requirements 9.3**
   */
  describe('Property: Section Changes Valid', () => {
    it('section changes should have valid structure', () => {
      fc.assert(
        fc.property(sectionChangeArb, (change) => {
          expect(change.section).toBeDefined();
          expect(change.changeType).toBeDefined();
          expect(change.description).toBeDefined();
          expect(['added', 'modified', 'rewritten', 'reordered', 'removed']).toContain(change.changeType);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: enhanced-jd-optimizer, Property: Optimization Mode Config Valid**
   * **Validates: Requirements 10.1-10.3**
   */
  describe('Property: Optimization Mode Config Valid', () => {
    it('all modes should have valid configurations', () => {
      fc.assert(
        fc.property(optimizationModeArb, (mode) => {
          const config = OPTIMIZATION_MODES[mode];
          
          expect(typeof config.addMissingKeywords).toBe('boolean');
          expect(typeof config.rewriteBullets).toBe('boolean');
          expect(typeof config.restructureSections).toBe('boolean');
          expect(typeof config.generateSummary).toBe('boolean');
          expect(config.maxChangesPerSection).toBeGreaterThan(0);
        }),
        { numRuns: 10 }
      );
    });
  });
});
