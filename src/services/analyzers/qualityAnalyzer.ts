// src/services/analyzers/qualityAnalyzer.ts
import { QualityAnalyzerInterface, SectionQualityResult } from '../../types/resume';

/**
 * QualityAnalyzer - Analyzes content quality within resume sections
 * 
 * Handles:
 * - Bullet point clarity and readability evaluation
 * - Metric usage measurement (quantified results detection)
 * - Action verb usage and strength assessment
 * - Tech stack completeness evaluation for technical roles
 * - Grammar issues and inconsistency detection
 * - Date formatting consistency validation
 */
export class QualityAnalyzer implements QualityAnalyzerInterface {
  
  private readonly STRONG_ACTION_VERBS = [
    'achieved', 'accelerated', 'accomplished', 'advanced', 'analyzed', 'architected',
    'built', 'created', 'delivered', 'designed', 'developed', 'drove', 'enhanced',
    'established', 'executed', 'generated', 'implemented', 'improved', 'increased',
    'initiated', 'launched', 'led', 'managed', 'optimized', 'orchestrated',
    'pioneered', 'reduced', 'resolved', 'scaled', 'spearheaded', 'streamlined',
    'transformed', 'upgraded'
  ];

  private readonly WEAK_ACTION_VERBS = [
    'responsible', 'duties', 'worked', 'helped', 'assisted', 'involved',
    'participated', 'contributed', 'supported', 'handled'
  ];

  private readonly TECH_CATEGORIES = {
    programming: ['javascript', 'python', 'java', 'typescript', 'c++', 'c#', 'go', 'rust', 'ruby', 'php'],
    frameworks: ['react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring'],
    databases: ['mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb'],
    cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform'],
    tools: ['git', 'jira', 'jenkins', 'webpack', 'npm', 'yarn']
  };

  /**
   * Analyze section quality across all detected sections
   */
  analyzeSectionQuality(sections: Record<string, string>, targetRole?: string): SectionQualityResult {
    console.log('🔍 QualityAnalyzer: Starting section quality analysis...');
    
    const allContent = Object.values(sections).join('\n');
    
    const result: SectionQualityResult = {
      bullet_clarity_score: this.analyzeBulletClarity(allContent),
      metrics_usage_ratio: this.calculateMetricsUsage(allContent),
      action_verb_ratio: this.calculateActionVerbRatio(allContent),
      tech_stack_completeness: this.analyzeTechStackCompleteness(allContent, targetRole),
      grammar_issues_count: this.detectGrammarIssues(allContent),
      date_format_consistency: this.checkDateFormatConsistency(allContent),
      section_quality_scores: this.calculateSectionScores(sections)
    };

    console.log('📊 Quality Analysis Results:', {
      bullet_clarity: result.bullet_clarity_score,
      metrics_usage: result.metrics_usage_ratio,
      action_verb_ratio: result.action_verb_ratio,
      tech_completeness: result.tech_stack_completeness,
      grammar_issues: result.grammar_issues_count,
      date_consistency: result.date_format_consistency
    });

    return result;
  }

  /**
   * Analyze bullet point clarity and readability
   */
  private analyzeBulletClarity(content: string): number {
    const bullets = this.extractBulletPoints(content);
    if (bullets.length === 0) return 0;
    
    let totalScore = 0;
    
    bullets.forEach(bullet => {
      let bulletScore = 100;
      
      // Length check (ideal: 9-10 words)
      const wordCount = bullet.split(/\s+/).length;
      if (wordCount < 6) bulletScore -= 20; // Too short
      if (wordCount > 12) bulletScore -= 15; // Too long
      
      // Starts with action verb
      const startsWithActionVerb = this.STRONG_ACTION_VERBS.some(verb => 
        bullet.toLowerCase().startsWith(verb.toLowerCase())
      );
      if (!startsWithActionVerb) bulletScore -= 25;
      
      // Contains quantifiable results
      const hasMetrics = /\d+[%$]?|\b(?:increased|decreased|improved|reduced|generated|saved)\b.*?\d+/i.test(bullet);
      if (hasMetrics) bulletScore += 15;
      
      // Avoids weak language
      const hasWeakLanguage = this.WEAK_ACTION_VERBS.some(verb => 
        bullet.toLowerCase().includes(verb.toLowerCase())
      );
      if (hasWeakLanguage) bulletScore -= 20;
      
      // Grammar and clarity
      if (!/^[A-Z]/.test(bullet)) bulletScore -= 10; // Should start with capital
      if (!/[.!]$/.test(bullet.trim())) bulletScore -= 5; // Should end with punctuation
      
      totalScore += Math.max(0, Math.min(100, bulletScore));
    });
    
    return Math.round(totalScore / bullets.length);
  }

  /**
   * Calculate metrics usage ratio (quantified results)
   */
  private calculateMetricsUsage(content: string): number {
    const bullets = this.extractBulletPoints(content);
    if (bullets.length === 0) return 0;
    
    const bulletsWithMetrics = bullets.filter(bullet => {
      // Look for numbers, percentages, dollar amounts, time periods
      const hasNumbers = /\d+/.test(bullet);
      const hasPercentage = /%/.test(bullet);
      const hasCurrency = /\$|USD|revenue|cost|budget/i.test(bullet);
      const hasTimeMetrics = /\b(?:days?|weeks?|months?|years?|hours?)\b/i.test(bullet);
      const hasQuantifiers = /\b(?:increased|decreased|improved|reduced|generated|saved|grew|boosted)\b.*?\d+/i.test(bullet);
      
      return hasNumbers || hasPercentage || hasCurrency || hasTimeMetrics || hasQuantifiers;
    });
    
    return bulletsWithMetrics.length / bullets.length;
  }

  /**
   * Calculate action verb usage ratio
   */
  private calculateActionVerbRatio(content: string): number {
    const bullets = this.extractBulletPoints(content);
    if (bullets.length === 0) return 0;
    
    const bulletsWithStrongVerbs = bullets.filter(bullet => {
      const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase();
      return this.STRONG_ACTION_VERBS.includes(firstWord);
    });
    
    return bulletsWithStrongVerbs.length / bullets.length;
  }

  /**
   * Analyze tech stack completeness for technical roles
   */
  private analyzeTechStackCompleteness(content: string, targetRole?: string): number {
    const contentLower = content.toLowerCase();
    
    // If not a technical role, return high score
    if (targetRole && !this.isTechnicalRole(targetRole)) {
      return 85; // Good baseline for non-technical roles
    }
    
    let completenessScore = 0;
    let maxPossibleScore = 0;
    
    // Check each tech category
    Object.entries(this.TECH_CATEGORIES).forEach(([category, technologies]) => {
      const categoryWeight = this.getCategoryWeight(category);
      maxPossibleScore += categoryWeight;
      
      const foundTechs = technologies.filter(tech => 
        contentLower.includes(tech.toLowerCase())
      );
      
      if (foundTechs.length > 0) {
        // Score based on coverage within category
        const coverageRatio = Math.min(foundTechs.length / 3, 1); // Cap at 3 techs per category
        completenessScore += categoryWeight * coverageRatio;
      }
    });
    
    return maxPossibleScore > 0 ? Math.round((completenessScore / maxPossibleScore) * 100) : 0;
  }

  /**
   * Detect grammar issues and inconsistencies
   */
  private detectGrammarIssues(content: string): number {
    let issueCount = 0;
    
    // Common grammar issues
    const grammarPatterns = [
      /\bi\s/gi, // First person (should be avoided)
      /\bme\s/gi, // First person
      /\bmy\s/gi, // First person
      /\s{2,}/g, // Multiple spaces
      /[.]{2,}/g, // Multiple periods
      /[,]{2,}/g, // Multiple commas
      /\s[.]/g, // Space before period
      /[a-z][A-Z]/g, // Missing space between sentences
    ];
    
    grammarPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        issueCount += matches.length;
      }
    });
    
    // Check for inconsistent tense usage
    const pastTenseVerbs = content.match(/\b\w+ed\b/g) || [];
    const presentTenseVerbs = content.match(/\b(?:manage|develop|create|lead|work|handle)s?\b/gi) || [];
    
    // If both past and present tense are used significantly, it's inconsistent
    if (pastTenseVerbs.length > 5 && presentTenseVerbs.length > 5) {
      issueCount += 5; // Penalty for tense inconsistency
    }
    
    return issueCount;
  }

  /**
   * Check date formatting consistency
   */
  private checkDateFormatConsistency(content: string): boolean {
    const datePatterns = [
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/g, // Jan 2023
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // 01/2023 or 1/23
      /\b\d{4}-\d{2}-\d{2}\b/g, // 2023-01-01
      /\b\d{4}\s*-\s*\d{4}\b/g, // 2020 - 2023
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/g // January 2023
    ];
    
    const foundFormats: string[] = [];
    
    datePatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        foundFormats.push(`format_${index}`);
      }
    });
    
    // Consistent if only one format is used, or if very few dates are present
    return foundFormats.length <= 1;
  }

  /**
   * Calculate quality scores for individual sections
   */
  private calculateSectionScores(sections: Record<string, string>): Record<string, number> {
    const scores: Record<string, number> = {};
    
    Object.entries(sections).forEach(([sectionName, content]) => {
      let sectionScore = 100;
      
      // Content length appropriateness
      const wordCount = this.countWords(content);
      if (sectionName === 'summary' && (wordCount < 20 || wordCount > 100)) {
        sectionScore -= 15;
      }
      if (sectionName === 'experience' && wordCount < 50) {
        sectionScore -= 25;
      }
      
      // Bullet point usage where appropriate
      const bulletCount = this.extractBulletPoints(content).length;
      if (['experience', 'projects'].includes(sectionName) && bulletCount === 0) {
        sectionScore -= 30;
      }
      
      // Section-specific quality checks
      if (sectionName === 'skills') {
        const hasCategories = /(?:programming|technical|languages|frameworks|tools|databases)/i.test(content);
        if (!hasCategories) sectionScore -= 10;
      }
      
      scores[sectionName] = Math.max(0, sectionScore);
    });
    
    return scores;
  }

  /**
   * Extract bullet points from content
   */
  private extractBulletPoints(content: string): string[] {
    const bulletPatterns = [
      /^[\s]*[-•*]\s+(.+)/gm,
      /^[\s]*[▪▫■□]\s+(.+)/gm,
      /^[\s]*[►▶]\s+(.+)/gm,
      /^[\s]*\d+\.\s+(.+)/gm,
    ];
    
    const bullets: string[] = [];
    const processedLines = new Set<string>();
    
    bulletPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const bulletText = match.replace(/^[\s]*[-•*▪▫■□►▶\d.]\s*/, '').trim();
          if (!processedLines.has(bulletText) && bulletText.length > 10) {
            processedLines.add(bulletText);
            bullets.push(bulletText);
          }
        });
      }
    });
    
    return bullets;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    if (!text || text.trim().length === 0) return 0;
    
    const cleanText = text
      .replace(/[^\w\s'-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleanText.length === 0) return 0;
    
    return cleanText.split(' ').filter(word => 
      word.length > 0 && /[a-zA-Z]/.test(word)
    ).length;
  }

  /**
   * Check if role is technical
   */
  private isTechnicalRole(role: string): boolean {
    const technicalKeywords = [
      'engineer', 'developer', 'programmer', 'architect', 'devops',
      'software', 'frontend', 'backend', 'fullstack', 'data scientist',
      'analyst', 'qa', 'sre', 'technical', 'it'
    ];
    
    return technicalKeywords.some(keyword => 
      role.toLowerCase().includes(keyword)
    );
  }

  /**
   * Get weight for tech category
   */
  private getCategoryWeight(category: string): number {
    const weights = {
      programming: 30,
      frameworks: 25,
      databases: 20,
      cloud: 15,
      tools: 10
    };
    
    return weights[category as keyof typeof weights] || 10;
  }

  /**
   * Get quality insights
   */
  getQualityInsights(result: SectionQualityResult): string[] {
    const insights: string[] = [];
    
    if (result.bullet_clarity_score < 70) {
      insights.push('Improve bullet point clarity by starting with strong action verbs and including quantified results');
    }
    
    if (result.metrics_usage_ratio < 0.5) {
      insights.push('Add more quantified achievements (numbers, percentages, dollar amounts) to demonstrate impact');
    }
    
    if (result.action_verb_ratio < 0.7) {
      insights.push('Replace weak verbs (responsible, duties, worked) with strong action verbs (achieved, developed, led)');
    }
    
    if (result.tech_stack_completeness < 60) {
      insights.push('Include more relevant technical skills and technologies for your target role');
    }
    
    if (result.grammar_issues_count > 5) {
      insights.push('Review for grammar issues, avoid first-person language, and ensure consistent verb tense');
    }
    
    if (!result.date_format_consistency) {
      insights.push('Use consistent date formatting throughout your resume (e.g., "Jan 2023" or "January 2023")');
    }
    
    return insights;
  }
}

// Export singleton instance
export const qualityAnalyzer = new QualityAnalyzer();