import { semanticMatchingService } from './semanticMatchingService';
import { metricPreserver } from './metricPreserver';
import { rewriteValidator } from './rewriteValidator';

export interface QualityScore {
  overall: number;
  breakdown: {
    semanticRetention: number;
    metricPreservation: number;
    actionVerbStrength: number;
    keywordNaturalness: number;
    atsClarity: number;
  };
  grade: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
  strengths: string[];
}

export interface BulletQualityAnalysis {
  score: QualityScore;
  originalBullet: string;
  rewrittenBullet: string;
  recommendations: string[];
}

export class RewriteQualityScorer {
  private static readonly STRONG_ACTION_VERBS = new Set([
    'architected', 'engineered', 'spearheaded', 'pioneered', 'orchestrated',
    'established', 'transformed', 'optimized', 'streamlined', 'modernized',
    'delivered', 'achieved', 'increased', 'reduced', 'improved', 'enhanced',
    'developed', 'implemented', 'designed', 'built', 'created', 'led',
    'managed', 'directed', 'executed', 'deployed', 'launched', 'scaled'
  ]);

  private static readonly WEAK_ACTION_VERBS = new Set([
    'helped', 'assisted', 'worked on', 'participated', 'involved in',
    'responsible for', 'contributed to', 'worked with', 'supported',
    'was part of', 'engaged in', 'tried to', 'attempted'
  ]);

  private static readonly ATS_PROBLEMATIC_PATTERNS = [
    { pattern: /[""'']/g, issue: 'Smart quotes' },
    { pattern: /[—–]/g, issue: 'Em/En dashes' },
    { pattern: /[^\x00-\x7F]/g, issue: 'Non-ASCII characters' },
    { pattern: /\t/g, issue: 'Tab characters' },
    { pattern: /\s{2,}/g, issue: 'Multiple spaces' }
  ];

  static async scoreBulletRewrite(
    originalBullet: string,
    rewrittenBullet: string,
    jobDescriptionKeywords: string[],
    allowedTerms: Set<string>
  ): Promise<BulletQualityAnalysis> {
    const breakdown = {
      semanticRetention: 0,
      metricPreservation: 0,
      actionVerbStrength: 0,
      keywordNaturalness: 0,
      atsClarity: 0
    };

    const issues: string[] = [];
    const strengths: string[] = [];
    const recommendations: string[] = [];

    const semanticScore = await this.evaluateSemanticRetention(originalBullet, rewrittenBullet);
    breakdown.semanticRetention = semanticScore.score;
    if (semanticScore.score >= 80) {
      strengths.push('Excellent semantic similarity maintained');
    } else if (semanticScore.score < 70) {
      issues.push('Semantic drift detected - meaning has changed significantly');
      recommendations.push('Rewrite to stay closer to original meaning and context');
    }

    const metricScore = this.evaluateMetricPreservation(originalBullet, rewrittenBullet);
    breakdown.metricPreservation = metricScore.score;
    if (metricScore.score === 100) {
      strengths.push('All metrics preserved perfectly');
    } else if (metricScore.score < 100) {
      issues.push(`Missing metrics: ${metricScore.missingMetrics.join(', ')}`);
      recommendations.push('Ensure all quantifiable metrics from original are included');
    }

    const verbScore = this.evaluateActionVerbStrength(rewrittenBullet);
    breakdown.actionVerbStrength = verbScore.score;
    if (verbScore.score >= 90) {
      strengths.push(`Strong action verb: "${verbScore.verb}"`);
    } else if (verbScore.score < 60) {
      issues.push(`Weak action verb: "${verbScore.verb}"`);
      recommendations.push(`Replace "${verbScore.verb}" with stronger verbs like: ${verbScore.suggestions.join(', ')}`);
    }

    const keywordScore = this.evaluateKeywordNaturalness(
      rewrittenBullet,
      jobDescriptionKeywords,
      originalBullet
    );
    breakdown.keywordNaturalness = keywordScore.score;
    if (keywordScore.score >= 85) {
      strengths.push('Keywords integrated naturally');
    } else if (keywordScore.score < 60) {
      issues.push('Keyword stuffing detected or unnatural integration');
      recommendations.push('Integrate keywords more naturally within context');
    }
    if (keywordScore.forcedKeywords.length > 0) {
      issues.push(`Forced keywords: ${keywordScore.forcedKeywords.join(', ')}`);
    }

    const atsScore = this.evaluateATSClarity(rewrittenBullet);
    breakdown.atsClarity = atsScore.score;
    if (atsScore.score === 100) {
      strengths.push('Perfect ATS compatibility');
    } else if (atsScore.problems.length > 0) {
      issues.push(`ATS issues: ${atsScore.problems.join(', ')}`);
      recommendations.push('Fix ATS compatibility issues (remove special characters, simplify formatting)');
    }

    const validation = await rewriteValidator.validateBulletRewrite(
      originalBullet,
      rewrittenBullet,
      allowedTerms
    );

    if (validation.hasHallucination) {
      breakdown.semanticRetention -= 20;
      issues.push(`Hallucinated terms: ${validation.hallucinatedTerms.join(', ')}`);
      recommendations.push('Remove terms not found in original resume or job description');
    }

    const overall = this.calculateOverallScore(breakdown);
    const grade = this.determineGrade(overall);

    return {
      score: {
        overall,
        breakdown,
        grade,
        issues,
        strengths
      },
      originalBullet,
      rewrittenBullet,
      recommendations
    };
  }

  private static async evaluateSemanticRetention(
    original: string,
    rewritten: string
  ): Promise<{ score: number; similarity: number }> {
    try {
      await semanticMatchingService.initialize();

      const originalEmbedding = await semanticMatchingService.generateEmbedding(original);
      const rewrittenEmbedding = await semanticMatchingService.generateEmbedding(rewritten);

      const similarity = semanticMatchingService.cosineSimilarity(
        originalEmbedding,
        rewrittenEmbedding
      );

      const score = Math.round(similarity * 100);

      return { score, similarity };
    } catch (error) {
      console.error('Error calculating semantic retention:', error);
      return { score: 70, similarity: 0.70 };
    }
  }

  private static evaluateMetricPreservation(
    original: string,
    rewritten: string
  ): { score: number; missingMetrics: string[] } {
    const originalMetrics = metricPreserver.extractMetrics(original);
    const rewrittenMetrics = metricPreserver.extractMetrics(rewritten);

    if (originalMetrics.length === 0) {
      return { score: 100, missingMetrics: [] };
    }

    const validation = metricPreserver.validateMetricsInRewrite(originalMetrics, rewritten);

    if (validation.allPreserved) {
      return { score: 100, missingMetrics: [] };
    }

    const preservedCount = originalMetrics.length - validation.lost.length;
    const preservationRate = preservedCount / originalMetrics.length;
    const score = Math.round(preservationRate * 100);

    const missingMetrics = validation.lost.map(m => m.value);

    return { score, missingMetrics };
  }

  private static evaluateActionVerbStrength(
    bullet: string
  ): { score: number; verb: string; suggestions: string[] } {
    const firstWord = bullet.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');

    let score = 50;
    const suggestions: string[] = [];

    if (this.STRONG_ACTION_VERBS.has(firstWord)) {
      score = 100;
    } else if (this.WEAK_ACTION_VERBS.has(firstWord)) {
      score = 30;
      suggestions.push('Architected', 'Engineered', 'Implemented', 'Developed', 'Built');
    } else {
      const startsWithVerb = /^[a-z]+ed\b/i.test(bullet.trim());
      if (startsWithVerb) {
        score = 70;
        suggestions.push('Optimized', 'Streamlined', 'Enhanced');
      } else {
        score = 40;
        suggestions.push('Developed', 'Implemented', 'Built', 'Created');
      }
    }

    return { score, verb: firstWord, suggestions };
  }

  private static evaluateKeywordNaturalness(
    rewritten: string,
    jdKeywords: string[],
    original: string
  ): { score: number; forcedKeywords: string[] } {
    const rewrittenLower = rewritten.toLowerCase();
    const originalLower = original.toLowerCase();

    const insertedKeywords: string[] = [];
    const forcedKeywords: string[] = [];

    jdKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (rewrittenLower.includes(keywordLower) && !originalLower.includes(keywordLower)) {
        insertedKeywords.push(keyword);

        const isAtStart = rewrittenLower.indexOf(keywordLower) < 20;
        const hasContext = this.hasNaturalContext(rewritten, keyword);

        if (isAtStart || !hasContext) {
          forcedKeywords.push(keyword);
        }
      }
    });

    if (insertedKeywords.length === 0) {
      return { score: 100, forcedKeywords: [] };
    }

    if (insertedKeywords.length > 3) {
      return { score: 40, forcedKeywords };
    }

    if (forcedKeywords.length > 0) {
      const score = Math.max(50, 90 - (forcedKeywords.length * 15));
      return { score, forcedKeywords };
    }

    return { score: 95, forcedKeywords: [] };
  }

  private static hasNaturalContext(text: string, keyword: string): boolean {
    const keywordIndex = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (keywordIndex === -1) return false;

    const before = text.substring(Math.max(0, keywordIndex - 30), keywordIndex);
    const after = text.substring(keywordIndex + keyword.length, keywordIndex + keyword.length + 30);

    const contextWords = `${before} ${after}`.toLowerCase().split(/\s+/);

    const technicalContext = ['using', 'with', 'for', 'in', 'to', 'on', 'via', 'through', 'implementing'];
    const hasContext = contextWords.some(word => technicalContext.includes(word));

    return hasContext;
  }

  private static evaluateATSClarity(
    bullet: string
  ): { score: number; problems: string[] } {
    const problems: string[] = [];
    let score = 100;

    this.ATS_PROBLEMATIC_PATTERNS.forEach(({ pattern, issue }) => {
      if (pattern.test(bullet)) {
        problems.push(issue);
        score -= 10;
      }
    });

    if (bullet.length > 200) {
      problems.push('Bullet too long (>200 chars)');
      score -= 10;
    }

    if (!/^[A-Z]/.test(bullet.trim())) {
      problems.push('Should start with capital letter');
      score -= 5;
    }

    if (!/\.$/.test(bullet.trim())) {
      problems.push('Should end with period');
      score -= 5;
    }

    return { score: Math.max(0, score), problems };
  }

  private static calculateOverallScore(breakdown: {
    semanticRetention: number;
    metricPreservation: number;
    actionVerbStrength: number;
    keywordNaturalness: number;
    atsClarity: number;
  }): number {
    const weights = {
      semanticRetention: 0.30,
      metricPreservation: 0.25,
      actionVerbStrength: 0.20,
      keywordNaturalness: 0.15,
      atsClarity: 0.10
    };

    const overall =
      breakdown.semanticRetention * weights.semanticRetention +
      breakdown.metricPreservation * weights.metricPreservation +
      breakdown.actionVerbStrength * weights.actionVerbStrength +
      breakdown.keywordNaturalness * weights.keywordNaturalness +
      breakdown.atsClarity * weights.atsClarity;

    return Math.round(Math.max(0, Math.min(100, overall)));
  }

  private static determineGrade(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  static async scoreEntireResume(
    originalBullets: string[],
    rewrittenBullets: string[],
    jdKeywords: string[],
    allowedTerms: Set<string>
  ): Promise<{
    overallScore: number;
    bulletScores: BulletQualityAnalysis[];
    summary: string;
  }> {
    const bulletScores: BulletQualityAnalysis[] = [];

    for (let i = 0; i < Math.min(originalBullets.length, rewrittenBullets.length); i++) {
      const analysis = await this.scoreBulletRewrite(
        originalBullets[i],
        rewrittenBullets[i],
        jdKeywords,
        allowedTerms
      );
      bulletScores.push(analysis);
    }

    const overallScore = Math.round(
      bulletScores.reduce((sum, b) => sum + b.score.overall, 0) / bulletScores.length
    );

    const excellentCount = bulletScores.filter(b => b.score.grade === 'excellent').length;
    const goodCount = bulletScores.filter(b => b.score.grade === 'good').length;
    const fairCount = bulletScores.filter(b => b.score.grade === 'fair').length;
    const poorCount = bulletScores.filter(b => b.score.grade === 'poor').length;

    const summary = `Overall Quality: ${overallScore}/100
Excellent: ${excellentCount} | Good: ${goodCount} | Fair: ${fairCount} | Poor: ${poorCount}`;

    return {
      overallScore,
      bulletScores,
      summary
    };
  }

  static generateQualityReport(analysis: BulletQualityAnalysis): string {
    const report: string[] = [];

    report.push('=== BULLET QUALITY REPORT ===');
    report.push(`Overall Score: ${analysis.score.overall}/100 (${analysis.score.grade.toUpperCase()})`);
    report.push('');

    report.push('BREAKDOWN:');
    report.push(`  Semantic Retention:    ${analysis.score.breakdown.semanticRetention}/100`);
    report.push(`  Metric Preservation:   ${analysis.score.breakdown.metricPreservation}/100`);
    report.push(`  Action Verb Strength:  ${analysis.score.breakdown.actionVerbStrength}/100`);
    report.push(`  Keyword Naturalness:   ${analysis.score.breakdown.keywordNaturalness}/100`);
    report.push(`  ATS Clarity:           ${analysis.score.breakdown.atsClarity}/100`);
    report.push('');

    if (analysis.score.strengths.length > 0) {
      report.push('✅ STRENGTHS:');
      analysis.score.strengths.forEach(strength => {
        report.push(`  - ${strength}`);
      });
      report.push('');
    }

    if (analysis.score.issues.length > 0) {
      report.push('⚠️ ISSUES:');
      analysis.score.issues.forEach(issue => {
        report.push(`  - ${issue}`);
      });
      report.push('');
    }

    if (analysis.recommendations.length > 0) {
      report.push('💡 RECOMMENDATIONS:');
      analysis.recommendations.forEach((rec, i) => {
        report.push(`  ${i + 1}. ${rec}`);
      });
    }

    return report.join('\n');
  }

  static getScoreInterpretation(score: number): string {
    if (score >= 90) {
      return 'Excellent rewrite! This bullet is highly optimized and ready for submission.';
    } else if (score >= 75) {
      return 'Good rewrite with minor improvements possible. Consider addressing recommendations.';
    } else if (score >= 60) {
      return 'Fair rewrite but needs improvement. Review issues and apply recommendations.';
    } else {
      return 'Poor rewrite quality. Significant revisions needed. Consider starting over with validation.';
    }
  }
}

export const rewriteQualityScorer = RewriteQualityScorer;
