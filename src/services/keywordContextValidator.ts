export interface KeywordContext {
  keyword: string;
  context: string;
  hasActionVerb: boolean;
  hasMetric: boolean;
  contextScore: number;
  isStuffed: boolean;
  position: 'start' | 'middle' | 'end';
}

export interface StuffingDetectionResult {
  isStuffed: boolean;
  stuffingScore: number;
  keywords: KeywordContext[];
  recommendations: string[];
  penaltyScore: number;
}

export class KeywordContextValidator {
  private static readonly MAX_KEYWORDS_PER_BULLET = 2;
  private static readonly STUFFING_THRESHOLD = 0.6;
  private static readonly ACTION_VERBS = new Set([
    'developed', 'implemented', 'architected', 'designed', 'built', 'created',
    'led', 'managed', 'optimized', 'improved', 'reduced', 'increased',
    'achieved', 'delivered', 'established', 'engineered', 'automated',
    'streamlined', 'transformed', 'executed', 'spearheaded', 'coordinated'
  ]);

  static validateKeywordUsage(
    bullet: string,
    jdKeywords: string[],
    originalBullet?: string
  ): StuffingDetectionResult {
    const keywordContexts: KeywordContext[] = [];
    const bulletLower = bullet.toLowerCase();

    jdKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const index = bulletLower.indexOf(keywordLower);

      if (index !== -1) {
        const context = this.extractContext(bullet, index, keyword.length);
        const hasActionVerb = this.hasActionVerb(bullet);
        const hasMetric = this.hasMetric(bullet);
        const position = this.determinePosition(index, bullet.length);
        const contextScore = this.calculateContextScore(bullet, keyword, hasActionVerb, hasMetric);
        const isStuffed = this.isKeywordStuffed(bullet, keyword, position, contextScore);

        keywordContexts.push({
          keyword,
          context,
          hasActionVerb,
          hasMetric,
          contextScore,
          isStuffed,
          position
        });
      }
    });

    const stuffingScore = this.calculateStuffingScore(keywordContexts, bullet);
    const isStuffed = stuffingScore > this.STUFFING_THRESHOLD || keywordContexts.length > this.MAX_KEYWORDS_PER_BULLET;
    const recommendations = this.generateRecommendations(keywordContexts, isStuffed, originalBullet);
    const penaltyScore = this.calculatePenalty(stuffingScore, keywordContexts.length);

    return {
      isStuffed,
      stuffingScore,
      keywords: keywordContexts,
      recommendations,
      penaltyScore
    };
  }

  private static extractContext(text: string, index: number, keywordLength: number): string {
    const contextRadius = 50;
    const start = Math.max(0, index - contextRadius);
    const end = Math.min(text.length, index + keywordLength + contextRadius);
    return text.substring(start, end).trim();
  }

  private static hasActionVerb(bullet: string): boolean {
    const firstWord = bullet.trim().split(/\s+/)[0].toLowerCase();
    return this.ACTION_VERBS.has(firstWord);
  }

  private static hasMetric(bullet: string): boolean {
    const metricPattern = /\d+(?:[.,]\d+)?(?:%|x|K|M|B|\+)?/;
    return metricPattern.test(bullet);
  }

  private static determinePosition(index: number, totalLength: number): 'start' | 'middle' | 'end' {
    const relativePosition = index / totalLength;
    if (relativePosition < 0.2) return 'start';
    if (relativePosition > 0.8) return 'end';
    return 'middle';
  }

  private static calculateContextScore(
    bullet: string,
    keyword: string,
    hasActionVerb: boolean,
    hasMetric: boolean
  ): number {
    let score = 0.5;

    if (hasActionVerb) score += 0.2;
    if (hasMetric) score += 0.2;

    const contextualWords = [
      'using', 'with', 'for', 'in', 'to', 'via', 'through', 'implementing',
      'leveraging', 'utilizing', 'integrating', 'building', 'creating'
    ];

    const bulletLower = bullet.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    const keywordIndex = bulletLower.indexOf(keywordLower);

    if (keywordIndex !== -1) {
      const beforeKeyword = bulletLower.substring(Math.max(0, keywordIndex - 30), keywordIndex);
      const afterKeyword = bulletLower.substring(keywordIndex + keyword.length, keywordIndex + keyword.length + 30);

      const hasContextBefore = contextualWords.some(word => beforeKeyword.includes(word));
      const hasContextAfter = contextualWords.some(word => afterKeyword.includes(word));

      if (hasContextBefore || hasContextAfter) score += 0.1;
    }

    return Math.min(1.0, score);
  }

  private static isKeywordStuffed(
    bullet: string,
    keyword: string,
    position: 'start' | 'middle' | 'end',
    contextScore: number
  ): boolean {
    if (position === 'start' && contextScore < 0.6) return true;

    const escapedKeyword = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const keywordCount = (bullet.toLowerCase().match(new RegExp(escapedKeyword, 'g')) || []).length;
    if (keywordCount > 1) return true;

    const words = bullet.split(/\s+/);
    const keywordWords = keyword.split(/\s+/);
    const keywordDensity = keywordWords.length / words.length;
    if (keywordDensity > 0.15) return true;

    return contextScore < 0.5;
  }

  private static calculateStuffingScore(contexts: KeywordContext[], bullet: string): number {
    if (contexts.length === 0) return 0;

    const stuffedCount = contexts.filter(c => c.isStuffed).length;
    const stuffedRatio = stuffedCount / contexts.length;

    const avgContextScore = contexts.reduce((sum, c) => sum + c.contextScore, 0) / contexts.length;

    const keywordDensity = contexts.length / bullet.split(/\s+/).length;

    const stuffingScore = (stuffedRatio * 0.5) + ((1 - avgContextScore) * 0.3) + (keywordDensity * 0.2);

    return Math.min(1.0, stuffingScore);
  }

  private static generateRecommendations(
    contexts: KeywordContext[],
    isStuffed: boolean,
    originalBullet?: string
  ): string[] {
    const recommendations: string[] = [];

    if (contexts.length > this.MAX_KEYWORDS_PER_BULLET) {
      recommendations.push(
        `Reduce keywords: Found ${contexts.length} keywords, limit to ${this.MAX_KEYWORDS_PER_BULLET} per bullet`
      );
    }

    const startPosition = contexts.filter(c => c.position === 'start');
    if (startPosition.length > 0) {
      recommendations.push(
        'Avoid keyword stuffing at bullet start. Begin with strong action verbs instead.'
      );
    }

    const lowContextKeywords = contexts.filter(c => c.contextScore < 0.6);
    if (lowContextKeywords.length > 0) {
      recommendations.push(
        `Improve context for: ${lowContextKeywords.map(k => k.keyword).join(', ')}. Add contextual words like "using", "with", "for".`
      );
    }

    const noActionVerb = contexts.filter(c => !c.hasActionVerb);
    if (noActionVerb.length === contexts.length && contexts.length > 0) {
      recommendations.push(
        'Add strong action verb at bullet start (Developed, Implemented, Architected, etc.)'
      );
    }

    const noMetrics = contexts.filter(c => !c.hasMetric);
    if (noMetrics.length === contexts.length && contexts.length > 0) {
      recommendations.push(
        'Add quantifiable metrics to demonstrate impact (%, numbers, time saved)'
      );
    }

    const stuffedKeywords = contexts.filter(c => c.isStuffed);
    if (stuffedKeywords.length > 0) {
      recommendations.push(
        `Stuffed keywords detected: ${stuffedKeywords.map(k => k.keyword).join(', ')}. Rewrite to integrate naturally.`
      );
    }

    if (originalBullet && contexts.length > 0) {
      const originalKeywords = contexts.filter(c => originalBullet.toLowerCase().includes(c.keyword.toLowerCase()));
      const insertedKeywords = contexts.filter(c => !originalBullet.toLowerCase().includes(c.keyword.toLowerCase()));

      if (insertedKeywords.length > 2) {
        recommendations.push(
          `Too many new keywords inserted (${insertedKeywords.length}). Only add keywords that fit the semantic context.`
        );
      }
    }

    return recommendations;
  }

  private static calculatePenalty(stuffingScore: number, keywordCount: number): number {
    let penalty = 0;

    if (stuffingScore > this.STUFFING_THRESHOLD) {
      penalty += (stuffingScore - this.STUFFING_THRESHOLD) * 50;
    }

    if (keywordCount > this.MAX_KEYWORDS_PER_BULLET) {
      penalty += (keywordCount - this.MAX_KEYWORDS_PER_BULLET) * 10;
    }

    return Math.round(Math.min(penalty, 50));
  }

  static validateBulletList(
    bullets: string[],
    jdKeywords: string[],
    originalBullets?: string[]
  ): {
    results: StuffingDetectionResult[];
    overallStuffingRate: number;
    totalPenalty: number;
    recommendations: string[];
  } {
    const results: StuffingDetectionResult[] = [];

    bullets.forEach((bullet, index) => {
      const original = originalBullets ? originalBullets[index] : undefined;
      const result = this.validateKeywordUsage(bullet, jdKeywords, original);
      results.push(result);
    });

    const stuffedCount = results.filter(r => r.isStuffed).length;
    const overallStuffingRate = stuffedCount / Math.max(bullets.length, 1);
    const totalPenalty = results.reduce((sum, r) => sum + r.penaltyScore, 0);

    const allRecommendations = new Set<string>();
    results.forEach(r => {
      r.recommendations.forEach(rec => allRecommendations.add(rec));
    });

    return {
      results,
      overallStuffingRate,
      totalPenalty,
      recommendations: Array.from(allRecommendations)
    };
  }

  static isNaturalKeywordUse(
    bullet: string,
    keyword: string
  ): boolean {
    const bulletLower = bullet.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    const index = bulletLower.indexOf(keywordLower);

    if (index === -1) return true;

    const position = this.determinePosition(index, bullet.length);
    const hasActionVerb = this.hasActionVerb(bullet);
    const hasMetric = this.hasMetric(bullet);
    const contextScore = this.calculateContextScore(bullet, keyword, hasActionVerb, hasMetric);

    if (position === 'start') return false;
    if (contextScore < 0.6) return false;
    if (!hasActionVerb) return false;

    return true;
  }

  static generateStuffingReport(result: StuffingDetectionResult): string {
    const report: string[] = [];

    report.push('=== KEYWORD STUFFING ANALYSIS ===');
    report.push(`Stuffing Detected: ${result.isStuffed ? 'YES' : 'NO'}`);
    report.push(`Stuffing Score: ${(result.stuffingScore * 100).toFixed(1)}%`);
    report.push(`Penalty: -${result.penaltyScore} points`);
    report.push('');

    if (result.keywords.length > 0) {
      report.push('KEYWORD ANALYSIS:');
      result.keywords.forEach((kw, i) => {
        report.push(`\n${i + 1}. "${kw.keyword}"`);
        report.push(`   Position: ${kw.position}`);
        report.push(`   Context Score: ${(kw.contextScore * 100).toFixed(1)}%`);
        report.push(`   Has Action Verb: ${kw.hasActionVerb ? 'Yes' : 'No'}`);
        report.push(`   Has Metric: ${kw.hasMetric ? 'Yes' : 'No'}`);
        report.push(`   Stuffed: ${kw.isStuffed ? 'YES' : 'No'}`);
      });
    }

    if (result.recommendations.length > 0) {
      report.push('\n\nRECOMMENDATIONS:');
      result.recommendations.forEach((rec, i) => {
        report.push(`  ${i + 1}. ${rec}`);
      });
    }

    return report.join('\n');
  }
}

export const keywordContextValidator = KeywordContextValidator;
