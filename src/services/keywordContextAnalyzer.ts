export interface KeywordContextResult {
  keyword: string;
  found: boolean;
  contextQuality: 'high' | 'medium' | 'low' | 'none';
  contextWeight: number;
  locations: KeywordLocation[];
  hasActionVerb: boolean;
  hasMetric: boolean;
  inSkillListOnly: boolean;
  contextSnippets: string[];
  score: number;
}

export interface KeywordLocation {
  section: 'experience' | 'projects' | 'skills' | 'summary' | 'education' | 'other';
  context: string;
  hasActionVerb: boolean;
  hasMetric: boolean;
  sentenceQuality: number;
}

export class KeywordContextAnalyzer {
  private static readonly ACTION_VERBS = [
    'led', 'developed', 'created', 'built', 'designed', 'implemented', 'architected',
    'managed', 'deployed', 'optimized', 'enhanced', 'improved', 'reduced', 'increased',
    'automated', 'streamlined', 'engineered', 'established', 'launched', 'delivered',
    'collaborated', 'coordinated', 'analyzed', 'researched', 'integrated', 'migrated',
    'configured', 'maintained', 'supported', 'monitored', 'trained', 'mentored',
    'achieved', 'exceeded', 'spearheaded', 'pioneered', 'transformed', 'drove',
    'orchestrated', 'accelerated', 'scaled', 'refactored', 'debugged', 'tested'
  ];

  private static readonly METRIC_PATTERNS = [
    /\d+%/,
    /\d+x/i,
    /\d+\+/,
    /\$\d+/,
    /\d+k\+?/i,
    /\d+\s*million/i,
    /\d+\s*billion/i,
    /\d+\s*(users?|customers?|clients?)/i,
    /\d+\s*(hours?|days?|weeks?|months?)/i,
    /\d+\s*(projects?|features?|applications?)/i,
    /reduced.*by.*\d+/i,
    /increased.*by.*\d+/i,
    /improved.*by.*\d+/i,
    /grew.*to.*\d+/i,
    /achieved.*\d+/i
  ];

  private static readonly CONTEXT_WINDOW = 100;

  static analyzeKeywordContext(resumeText: string, keyword: string): KeywordContextResult {
    const lowerResume = resumeText.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    if (!lowerResume.includes(lowerKeyword)) {
      return this.createNotFoundResult(keyword);
    }

    const locations = this.findKeywordLocations(resumeText, keyword);

    if (locations.length === 0) {
      return this.createNotFoundResult(keyword);
    }

    const inSkillListOnly = locations.every(loc => loc.section === 'skills');
    const hasActionVerb = locations.some(loc => loc.hasActionVerb);
    const hasMetric = locations.some(loc => loc.hasMetric);

    let contextQuality: 'high' | 'medium' | 'low' | 'none';
    let contextWeight: number;

    if (hasActionVerb && hasMetric) {
      contextQuality = 'high';
      contextWeight = 1.0;
    } else if (hasActionVerb || hasMetric) {
      contextQuality = 'medium';
      contextWeight = 0.7;
    } else if (inSkillListOnly) {
      contextQuality = 'low';
      contextWeight = 0.4;
    } else {
      contextQuality = 'low';
      contextWeight = 0.5;
    }

    const contextSnippets = locations
      .slice(0, 3)
      .map(loc => loc.context);

    const score = this.calculateContextScore(locations, inSkillListOnly);

    return {
      keyword,
      found: true,
      contextQuality,
      contextWeight,
      locations,
      hasActionVerb,
      hasMetric,
      inSkillListOnly,
      contextSnippets,
      score
    };
  }

  private static findKeywordLocations(resumeText: string, keyword: string): KeywordLocation[] {
    const locations: KeywordLocation[] = [];
    const lowerResume = resumeText.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    let index = lowerResume.indexOf(lowerKeyword);

    while (index !== -1 && locations.length < 10) {
      const contextStart = Math.max(0, index - this.CONTEXT_WINDOW);
      const contextEnd = Math.min(lowerResume.length, index + keyword.length + this.CONTEXT_WINDOW);
      const context = resumeText.substring(contextStart, contextEnd).trim();

      const section = this.detectSection(resumeText, index);
      const hasActionVerb = this.containsActionVerb(context);
      const hasMetric = this.containsMetric(context);
      const sentenceQuality = this.calculateSentenceQuality(context, hasActionVerb, hasMetric);

      locations.push({
        section,
        context,
        hasActionVerb,
        hasMetric,
        sentenceQuality
      });

      index = lowerResume.indexOf(lowerKeyword, index + 1);
    }

    return locations.sort((a, b) => b.sentenceQuality - a.sentenceQuality);
  }

  private static detectSection(resumeText: string, position: number): KeywordLocation['section'] {
    const textBeforeKeyword = resumeText.substring(0, position).toLowerCase();

    const lastExperienceIndex = textBeforeKeyword.lastIndexOf('experience');
    const lastProjectsIndex = textBeforeKeyword.lastIndexOf('project');
    const lastSkillsIndex = textBeforeKeyword.lastIndexOf('skill');
    const lastSummaryIndex = textBeforeKeyword.lastIndexOf('summary');
    const lastEducationIndex = textBeforeKeyword.lastIndexOf('education');

    const maxIndex = Math.max(
      lastExperienceIndex,
      lastProjectsIndex,
      lastSkillsIndex,
      lastSummaryIndex,
      lastEducationIndex
    );

    if (maxIndex === lastExperienceIndex) return 'experience';
    if (maxIndex === lastProjectsIndex) return 'projects';
    if (maxIndex === lastSkillsIndex) return 'skills';
    if (maxIndex === lastSummaryIndex) return 'summary';
    if (maxIndex === lastEducationIndex) return 'education';

    return 'other';
  }

  private static containsActionVerb(context: string): boolean {
    const lowerContext = context.toLowerCase();
    return this.ACTION_VERBS.some(verb => {
      const verbPattern = new RegExp(`\\b${verb}\\w*\\b`, 'i');
      return verbPattern.test(lowerContext);
    });
  }

  private static containsMetric(context: string): boolean {
    return this.METRIC_PATTERNS.some(pattern => pattern.test(context));
  }

  private static calculateSentenceQuality(
    context: string,
    hasActionVerb: boolean,
    hasMetric: boolean
  ): number {
    let quality = 50;

    if (hasActionVerb) quality += 25;
    if (hasMetric) quality += 25;

    const wordCount = context.split(/\s+/).length;
    if (wordCount >= 10 && wordCount <= 30) {
      quality += 10;
    } else if (wordCount < 5) {
      quality -= 20;
    }

    const hasProfessionalTerms = /\b(team|project|system|application|solution|platform|service)\b/i.test(context);
    if (hasProfessionalTerms) quality += 5;

    return Math.min(100, Math.max(0, quality));
  }

  private static calculateContextScore(locations: KeywordLocation[], inSkillListOnly: boolean): number {
    if (locations.length === 0) return 0;
    if (inSkillListOnly) return 40;

    const avgQuality = locations.reduce((sum, loc) => sum + loc.sentenceQuality, 0) / locations.length;

    const hasHighQualityContext = locations.some(loc => loc.sentenceQuality >= 80);
    const bonus = hasHighQualityContext ? 10 : 0;

    return Math.min(100, avgQuality + bonus);
  }

  private static createNotFoundResult(keyword: string): KeywordContextResult {
    return {
      keyword,
      found: false,
      contextQuality: 'none',
      contextWeight: 0,
      locations: [],
      hasActionVerb: false,
      hasMetric: false,
      inSkillListOnly: false,
      contextSnippets: [],
      score: 0
    };
  }

  static analyzeMultipleKeywords(resumeText: string, keywords: string[]): Map<string, KeywordContextResult> {
    const results = new Map<string, KeywordContextResult>();

    for (const keyword of keywords) {
      const result = this.analyzeKeywordContext(resumeText, keyword);
      results.set(keyword, result);
    }

    return results;
  }

  static calculateOverallContextQuality(results: Map<string, KeywordContextResult>): {
    averageScore: number;
    highQualityCount: number;
    mediumQualityCount: number;
    lowQualityCount: number;
    skillListOnlyCount: number;
    overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const allResults = Array.from(results.values()).filter(r => r.found);

    if (allResults.length === 0) {
      return {
        averageScore: 0,
        highQualityCount: 0,
        mediumQualityCount: 0,
        lowQualityCount: 0,
        skillListOnlyCount: 0,
        overallQuality: 'poor'
      };
    }

    const averageScore = allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length;
    const highQualityCount = allResults.filter(r => r.contextQuality === 'high').length;
    const mediumQualityCount = allResults.filter(r => r.contextQuality === 'medium').length;
    const lowQualityCount = allResults.filter(r => r.contextQuality === 'low').length;
    const skillListOnlyCount = allResults.filter(r => r.inSkillListOnly).length;

    let overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
    if (averageScore >= 80) {
      overallQuality = 'excellent';
    } else if (averageScore >= 60) {
      overallQuality = 'good';
    } else if (averageScore >= 40) {
      overallQuality = 'fair';
    } else {
      overallQuality = 'poor';
    }

    return {
      averageScore: Math.round(averageScore),
      highQualityCount,
      mediumQualityCount,
      lowQualityCount,
      skillListOnlyCount,
      overallQuality
    };
  }

  static getRecommendationsForKeyword(result: KeywordContextResult): string[] {
    const recommendations: string[] = [];

    if (!result.found) {
      recommendations.push(`Add "${result.keyword}" to your resume in a meaningful context`);
      return recommendations;
    }

    if (result.inSkillListOnly) {
      recommendations.push(`Demonstrate "${result.keyword}" in experience or projects section with action verbs`);
    }

    if (!result.hasActionVerb) {
      recommendations.push(`Use action verbs when mentioning "${result.keyword}" (e.g., "Built", "Developed", "Led")`);
    }

    if (!result.hasMetric) {
      recommendations.push(`Add measurable impact when discussing "${result.keyword}" (e.g., percentages, numbers, scale)`);
    }

    if (result.contextQuality === 'low') {
      recommendations.push(`Improve context around "${result.keyword}" with specific achievements and outcomes`);
    }

    return recommendations;
  }
}

export const keywordContextAnalyzer = KeywordContextAnalyzer;
