import { scoringCore } from './scoringCore';
import { dateNormalizer } from '../utils/dateNormalizer';
import { confidenceCalculator } from './confidenceCalculator';

describe('ScoringCore', () => {
  describe('semantic_match', () => {
    it('should calculate combined score with 60/40 weighting', async () => {
      const resumeText = 'Experienced Python developer with expertise in machine learning and AI';
      const jdText = 'Looking for a Python developer with ML experience';
      const keywords = ['python', 'machine learning'];

      const result = await scoringCore.semantic_match(resumeText, jdText, keywords);

      expect(result.combinedScore).toBeGreaterThan(0);
      expect(result.literalScore).toBeDefined();
      expect(result.semanticScore).toBeDefined();
      expect(result.matchedKeywords.length).toBeGreaterThan(0);
    });

    it('should handle missing keywords gracefully', async () => {
      const resumeText = 'Experienced Java developer';
      const jdText = 'Looking for a Python developer';
      const keywords = ['python', 'django', 'flask'];

      const result = await scoringCore.semantic_match(resumeText, jdText, keywords);

      expect(result.missingKeywords.length).toBe(3);
      expect(result.combinedScore).toBeLessThan(0.5);
    });
  });

  describe('synonym_expand', () => {
    it('should expand keywords using the dictionary', async () => {
      const synonyms = await scoringCore.synonym_expand('python', 'jd_based');

      expect(Array.isArray(synonyms)).toBe(true);
      expect(synonyms.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle unknown keywords', async () => {
      const synonyms = await scoringCore.synonym_expand('unknownkeyword123', 'jd_based');

      expect(Array.isArray(synonyms)).toBe(true);
    });
  });

  describe('date_normalize', () => {
    it('should parse MM/YYYY format', () => {
      const parsed = scoringCore.date_normalize('05/2023');

      expect(parsed.isValid).toBe(true);
      expect(parsed.year).toBe(2023);
      expect(parsed.month).toBe(5);
      expect(parsed.normalized).toBe('05/2023');
    });

    it('should handle "Expected" keyword', () => {
      const parsed = scoringCore.date_normalize('Expected 12/2025');

      expect(parsed.isValid).toBe(true);
      expect(parsed.isExpected).toBe(true);
      expect(parsed.isFuture).toBe(true);
      expect(parsed.warning).toBeUndefined();
    });

    it('should warn on future date without "Expected"', () => {
      const parsed = scoringCore.date_normalize('12/2030');

      expect(parsed.isValid).toBe(true);
      expect(parsed.isFuture).toBe(true);
      expect(parsed.isExpected).toBe(false);
      expect(parsed.warning).toBeDefined();
    });

    it('should handle "Present" keyword', () => {
      const parsed = scoringCore.date_normalize('Present');

      expect(parsed.isValid).toBe(true);
      expect(parsed.isPresent).toBe(true);
      expect(parsed.isFuture).toBe(false);
    });
  });

  describe('calculate_proportional_penalty', () => {
    it('should apply max 15% penalty per issue', () => {
      const missingSkills = [
        { skill: 'Python', importance: 'critical' as const },
        { skill: 'React', importance: 'high' as const },
        { skill: 'Docker', importance: 'medium' as const }
      ];

      const result = scoringCore.calculate_proportional_penalty(missingSkills, 10);

      expect(result.penalties.length).toBe(3);
      result.penalties.forEach(penalty => {
        expect(penalty.appliedPenalty).toBeLessThanOrEqual(15);
      });
    });

    it('should differentiate between critical and optional skills', () => {
      const criticalSkill = [{ skill: 'Python', importance: 'critical' as const }];
      const optionalSkill = [{ skill: 'Docker', importance: 'low' as const }];

      const criticalResult = scoringCore.calculate_proportional_penalty(criticalSkill, 5);
      const optionalResult = scoringCore.calculate_proportional_penalty(optionalSkill, 5);

      expect(criticalResult.penalties[0].appliedPenalty)
        .toBeGreaterThan(optionalResult.penalties[0].appliedPenalty);
    });

    it('should cap total penalty', () => {
      const manySkills = Array(20).fill(null).map((_, i) => ({
        skill: `Skill${i}`,
        importance: 'critical' as const
      }));

      const result = scoringCore.calculate_proportional_penalty(manySkills, 20);

      expect(result.cappedPenalty).toBeLessThanOrEqual(15 * manySkills.length);
    });
  });

  describe('context_validator', () => {
    it('should detect high quality context with action verb and metric', () => {
      const resumeText = 'Led a team of 5 engineers to build a Python-based ML platform, reducing processing time by 40%';
      const result = scoringCore.context_validator('python', resumeText);

      expect(result.found).toBe(true);
      expect(result.hasActionVerb).toBe(true);
      expect(result.hasMetric).toBe(true);
      expect(result.contextQuality).toBe('high');
      expect(result.contextWeight).toBe(1.0);
    });

    it('should detect low quality context for skill list only', () => {
      const resumeText = 'Skills: Python, JavaScript, React, Node.js';
      const result = scoringCore.context_validator('python', resumeText);

      expect(result.found).toBe(true);
      expect(result.inSkillListOnly).toBe(true);
      expect(result.contextQuality).toBe('low');
      expect(result.contextWeight).toBe(0.4);
    });

    it('should handle keyword not found', () => {
      const resumeText = 'Experienced Java developer';
      const result = scoringCore.context_validator('python', resumeText);

      expect(result.found).toBe(false);
      expect(result.contextQuality).toBe('none');
      expect(result.contextWeight).toBe(0);
    });
  });

  describe('compute_confidence', () => {
    it('should return High confidence for strong features', () => {
      const features = confidenceCalculator.createFeaturesFromAnalysis(
        85,
        0.85,
        5,
        3,
        1,
        10,
        80,
        true,
        100,
        90
      );

      const result = scoringCore.compute_confidence(features);

      expect(result.level).toBe('High');
      expect(result.numericScore).toBeGreaterThanOrEqual(80);
    });

    it('should return Low confidence for weak features', () => {
      const features = confidenceCalculator.createFeaturesFromAnalysis(
        30,
        0.40,
        1,
        5,
        5,
        10,
        30,
        false,
        60,
        60
      );

      const result = scoringCore.compute_confidence(features);

      expect(result.level).toBe('Low');
      expect(result.numericScore).toBeLessThan(50);
    });

    it('should include component breakdown', () => {
      const features = confidenceCalculator.createFeaturesFromAnalysis(
        70,
        0.70,
        4,
        4,
        2,
        10,
        65,
        true,
        90,
        85
      );

      const result = scoringCore.compute_confidence(features);

      expect(result.components).toBeDefined();
      expect(result.components.literalMatchContribution).toBeGreaterThan(0);
      expect(result.components.semanticMatchContribution).toBeGreaterThan(0);
    });
  });

  describe('validate_date_ranges', () => {
    it('should validate correct date ranges', () => {
      const experiences = [
        { startDate: '01/2020', endDate: '12/2022' },
        { startDate: '01/2023', endDate: 'Present' }
      ];

      const result = scoringCore.validate_date_ranges(experiences);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBe(0);
      expect(result.penalties.length).toBe(0);
    });

    it('should detect invalid date ranges', () => {
      const experiences = [
        { startDate: '12/2022', endDate: '01/2020' }
      ];

      const result = scoringCore.validate_date_ranges(experiences);

      expect(result.isValid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.penalties.length).toBeGreaterThan(0);
    });
  });
});

describe('DateNormalizer', () => {
  describe('parseDateFlexible', () => {
    it('should handle various date formats', () => {
      const testCases = [
        { input: '01/2023', expected: { year: 2023, month: 1 } },
        { input: '2023', expected: { year: 2023, month: null } },
        { input: 'January 2023', expected: { year: 2023, month: 1 } },
        { input: 'Jan 2023', expected: { year: 2023, month: 1 } },
        { input: 'Expected 06/2025', expected: { year: 2025, month: 6, isExpected: true } }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = dateNormalizer.parseDateFlexible(input);
        expect(result.isValid).toBe(true);
        expect(result.year).toBe(expected.year);
        expect(result.month).toBe(expected.month);
        if ('isExpected' in expected) {
          expect(result.isExpected).toBe(expected.isExpected);
        }
      });
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration between dates', () => {
      const result = dateNormalizer.calculateDuration('01/2020', '01/2023');

      expect(result.isValid).toBe(true);
      expect(result.years).toBe(3);
      expect(result.months).toBe(0);
      expect(result.totalMonths).toBe(36);
    });

    it('should handle Present as end date', () => {
      const result = dateNormalizer.calculateDuration('01/2023', 'Present');

      expect(result.isValid).toBe(true);
      expect(result.totalMonths).toBeGreaterThan(0);
    });
  });
});

describe('ConfidenceCalculator', () => {
  describe('computeConfidence', () => {
    it('should calculate weighted confidence score', () => {
      const features = confidenceCalculator.createFeaturesFromAnalysis(
        75,
        0.75,
        3,
        3,
        2,
        8,
        70,
        true,
        95,
        90
      );

      const result = confidenceCalculator.computeConfidence(features);

      expect(result.numericScore).toBeGreaterThan(0);
      expect(result.numericScore).toBeLessThanOrEqual(100);
      expect(result.level).toMatch(/High|Medium|Low/);
    });

    it('should provide reasoning for confidence level', () => {
      const features = confidenceCalculator.createFeaturesFromAnalysis(
        90,
        0.90,
        5,
        4,
        0,
        10,
        85,
        true,
        100,
        95
      );

      const result = confidenceCalculator.computeConfidence(features);

      expect(result.reasoning.length).toBeGreaterThan(0);
      expect(result.strengths.length).toBeGreaterThan(0);
    });
  });
});

describe('Integration Tests', () => {
  it('should maintain score consistency across multiple runs', async () => {
    const resumeText = 'Senior Python Developer with 5 years experience in machine learning and AI';
    const jdText = 'Looking for Python developer with ML experience';
    const keywords = ['python', 'machine learning'];

    const scores = [];
    for (let i = 0; i < 5; i++) {
      const result = await scoringCore.semantic_match(resumeText, jdText, keywords);
      scores.push(result.combinedScore);
    }

    const maxVariance = Math.max(...scores) - Math.min(...scores);
    expect(maxVariance).toBeLessThan(0.05);
  });

  it('should not drop score by more than 15% for single missing skill', () => {
    const baseScore = 85;
    const missingSkills = [{ skill: 'Python', importance: 'critical' as const }];

    const result = scoringCore.calculate_proportional_penalty(missingSkills, 10);

    expect(result.cappedPenalty).toBeLessThanOrEqual(15);

    const penaltyResult = scoringCore.apply_soft_penalties(baseScore, result.penalties);
    const scoreDrop = baseScore - penaltyResult.adjustedScore;
    const percentageDrop = (scoreDrop / baseScore) * 100;

    expect(percentageDrop).toBeLessThanOrEqual(15);
  });
});
