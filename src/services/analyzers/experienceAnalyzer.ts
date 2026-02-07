// src/services/analyzers/experienceAnalyzer.ts
import { ExperienceAnalyzerInterface, ExperienceAnalysisResult, ResumeData } from '../../types/resume';

/**
 * ExperienceAnalyzer - Analyzes work experience quality and presentation
 * 
 * Handles:
 * - Impact vs responsibility analysis for bullet points
 * - Achievement versus basic job responsibility ratio measurement
 * - Quantified metrics percentage calculation
 * - Action verb usage and variety evaluation
 * - Experience quality issue identification
 */
export class ExperienceAnalyzer implements ExperienceAnalyzerInterface {
  
  private readonly STRONG_ACTION_VERBS = [
    'achieved', 'accelerated', 'accomplished', 'advanced', 'analyzed', 'architected',
    'built', 'created', 'delivered', 'designed', 'developed', 'drove', 'enhanced',
    'established', 'executed', 'generated', 'implemented', 'improved', 'increased',
    'initiated', 'launched', 'led', 'managed', 'optimized', 'orchestrated',
    'pioneered', 'reduced', 'resolved', 'scaled', 'spearheaded', 'streamlined',
    'transformed', 'upgraded', 'automated', 'collaborated', 'coordinated',
    'facilitated', 'mentored', 'negotiated', 'presented', 'supervised'
  ];

  private readonly WEAK_VERBS = [
    'responsible', 'duties', 'worked', 'helped', 'assisted', 'involved',
    'participated', 'contributed', 'supported', 'handled', 'performed',
    'maintained', 'operated', 'utilized', 'used', 'did', 'was', 'were'
  ];

  private readonly RESPONSIBILITY_INDICATORS = [
    'responsible for', 'duties included', 'tasks involved', 'job responsibilities',
    'daily tasks', 'routine work', 'assigned to', 'required to', 'expected to'
  ];

  private readonly ACHIEVEMENT_INDICATORS = [
    'achieved', 'accomplished', 'delivered', 'exceeded', 'improved', 'increased',
    'reduced', 'saved', 'generated', 'won', 'earned', 'awarded', 'recognized',
    'promoted', 'selected', 'chosen', 'resulted in', 'led to', 'contributed to'
  ];

  private readonly METRIC_PATTERNS = [
    /\d+%/g,                           // Percentages
    /\$[\d,]+/g,                       // Dollar amounts
    /\d+[kK]\+?/g,                     // Thousands (10k, 5K+)
    /\d+[mM]\+?/g,                     // Millions (2M, 1m+)
    /\d+\s*(?:hours?|days?|weeks?|months?|years?)/gi, // Time periods
    /\d+\s*(?:people|users|customers|clients|employees|team members?)/gi, // People counts
    /\d+\s*(?:projects?|applications?|systems?|features?)/gi, // Project counts
    /(?:increased|improved|reduced|decreased|grew|boosted|enhanced)\s+(?:by\s+)?\d+/gi, // Impact metrics
  ];

  /**
   * Static analyze method for compatibility with enhanced scoring service
   */
  static analyze(input: { resumeText: string; resumeData?: ResumeData; jobDescription?: string; targetRole?: string }) {
    const analyzer = new ExperienceAnalyzer();
    const result = analyzer.analyzeExperience(input.resumeText);
    
    // Convert to the expected tier score format
    const score = (result.impact_strength_score + (result.metrics_usage_ratio * 100) + (result.action_verb_ratio * 100)) / 3;
    const maxScore = 100;
    const percentage = score;
    const weight = 15; // Experience tier weight
    const weightedContribution = (percentage * weight) / 100;
    
    const tierScore = {
      tier_number: 3,
      tier_name: 'Experience',
      score: Math.round(score * 100) / 100,
      max_score: maxScore,
      percentage: Math.round(percentage * 100) / 100,
      weight,
      weighted_contribution: Math.round(weightedContribution * 100) / 100,
      metrics_passed: result.experience_quality_issues.length === 0 ? 1 : 0,
      metrics_total: 1,
      top_issues: result.experience_quality_issues.slice(0, 5)
    };
    
    return {
      tierScore,
      analysisResult: result
    };
  }

  /**
   * Analyze work experience quality and presentation
   */
  analyzeExperience(resumeText: string): ExperienceAnalysisResult {
    console.log('💼 ExperienceAnalyzer: Starting experience analysis...');
    
    const experienceSection = this.extractExperienceSection(resumeText);
    const bullets = this.extractBulletPoints(experienceSection || resumeText);
    
    const result: ExperienceAnalysisResult = {
      impact_strength_score: this.calculateImpactStrength(bullets),
      metrics_usage_ratio: this.calculateMetricsUsageRatio(bullets),
      action_verb_ratio: this.calculateActionVerbRatio(bullets),
      achievement_vs_responsibility_ratio: this.calculateAchievementRatio(bullets),
      quantified_bullets_percentage: this.calculateQuantifiedBulletsPercentage(bullets),
      strong_action_verbs_count: this.countStrongActionVerbs(bullets),
      experience_quality_issues: this.identifyQualityIssues(bullets)
    };

    console.log('📊 Experience Analysis Results:', {
      impact_strength: result.impact_strength_score,
      metrics_usage: result.metrics_usage_ratio,
      action_verb_ratio: result.action_verb_ratio,
      achievement_ratio: result.achievement_vs_responsibility_ratio,
      quantified_percentage: result.quantified_bullets_percentage,
      strong_verbs: result.strong_action_verbs_count,
      quality_issues: result.experience_quality_issues.length
    });

    return result;
  }

  /**
   * Extract experience section from resume
   */
  private extractExperienceSection(resumeText: string): string | null {
    const experiencePattern = /\b(?:work\s+experience|professional\s+experience|experience|employment|career\s+history)\b[\s\S]*?(?=\b(?:education|projects?|skills|certifications?|achievements?|references?)\b|$)/i;
    const match = resumeText.match(experiencePattern);
    return match ? match[0] : null;
  }

  /**
   * Extract bullet points from text
   */
  private extractBulletPoints(text: string): string[] {
    const bulletPatterns = [
      /^[\s]*[-•*]\s+(.+)/gm,
      /^[\s]*[▪▫■□]\s+(.+)/gm,
      /^[\s]*[►▶]\s+(.+)/gm,
      /^[\s]*\d+\.\s+(.+)/gm,
    ];
    
    const bullets: string[] = [];
    const processedLines = new Set<string>();
    
    bulletPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const bulletText = match.replace(/^[\s]*[-•*▪▫■□►▶\d.]\s*/, '').trim();
          if (!processedLines.has(bulletText) && bulletText.length > 15) {
            processedLines.add(bulletText);
            bullets.push(bulletText);
          }
        });
      }
    });
    
    return bullets;
  }

  /**
   * Calculate impact strength score
   */
  private calculateImpactStrength(bullets: string[]): number {
    if (bullets.length === 0) return 0;
    
    let totalImpactScore = 0;
    
    bullets.forEach(bullet => {
      let impactScore = 0;
      
      // Strong action verb at start (+30 points)
      const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase();
      if (this.STRONG_ACTION_VERBS.includes(firstWord)) {
        impactScore += 30;
      }
      
      // Contains quantified results (+25 points)
      if (this.METRIC_PATTERNS.some(pattern => pattern.test(bullet))) {
        impactScore += 25;
      }
      
      // Achievement-oriented language (+20 points)
      if (this.ACHIEVEMENT_INDICATORS.some(indicator => 
        bullet.toLowerCase().includes(indicator.toLowerCase())
      )) {
        impactScore += 20;
      }
      
      // Avoid responsibility language (+15 points if avoided)
      const hasResponsibilityLanguage = this.RESPONSIBILITY_INDICATORS.some(indicator =>
        bullet.toLowerCase().includes(indicator.toLowerCase())
      );
      if (!hasResponsibilityLanguage) {
        impactScore += 15;
      }
      
      // Business impact keywords (+10 points)
      const businessImpactKeywords = ['revenue', 'profit', 'efficiency', 'productivity', 'quality', 'customer satisfaction', 'cost reduction'];
      if (businessImpactKeywords.some(keyword => 
        bullet.toLowerCase().includes(keyword.toLowerCase())
      )) {
        impactScore += 10;
      }
      
      totalImpactScore += Math.min(100, impactScore);
    });
    
    return Math.round(totalImpactScore / bullets.length);
  }

  /**
   * Calculate metrics usage ratio
   */
  private calculateMetricsUsageRatio(bullets: string[]): number {
    if (bullets.length === 0) return 0;
    
    const bulletsWithMetrics = bullets.filter(bullet => 
      this.METRIC_PATTERNS.some(pattern => pattern.test(bullet))
    );
    
    return bulletsWithMetrics.length / bullets.length;
  }

  /**
   * Calculate action verb ratio
   */
  private calculateActionVerbRatio(bullets: string[]): number {
    if (bullets.length === 0) return 0;
    
    const bulletsWithStrongVerbs = bullets.filter(bullet => {
      const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase();
      return this.STRONG_ACTION_VERBS.includes(firstWord);
    });
    
    return bulletsWithStrongVerbs.length / bullets.length;
  }

  /**
   * Calculate achievement vs responsibility ratio
   */
  private calculateAchievementRatio(bullets: string[]): number {
    if (bullets.length === 0) return 0;
    
    let achievementBullets = 0;
    let responsibilityBullets = 0;
    
    bullets.forEach(bullet => {
      const bulletLower = bullet.toLowerCase();
      
      const isAchievement = this.ACHIEVEMENT_INDICATORS.some(indicator =>
        bulletLower.includes(indicator.toLowerCase())
      ) || this.METRIC_PATTERNS.some(pattern => pattern.test(bullet));
      
      const isResponsibility = this.RESPONSIBILITY_INDICATORS.some(indicator =>
        bulletLower.includes(indicator.toLowerCase())
      ) || this.WEAK_VERBS.some(verb => bulletLower.startsWith(verb));
      
      if (isAchievement) {
        achievementBullets++;
      } else if (isResponsibility) {
        responsibilityBullets++;
      }
    });
    
    const totalCategorized = achievementBullets + responsibilityBullets;
    return totalCategorized > 0 ? achievementBullets / totalCategorized : 0.5;
  }

  /**
   * Calculate percentage of bullets with quantified results
   */
  private calculateQuantifiedBulletsPercentage(bullets: string[]): number {
    return this.calculateMetricsUsageRatio(bullets);
  }

  /**
   * Count strong action verbs
   */
  private countStrongActionVerbs(bullets: string[]): number {
    let count = 0;
    const usedVerbs = new Set<string>();
    
    bullets.forEach(bullet => {
      const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase();
      if (this.STRONG_ACTION_VERBS.includes(firstWord)) {
        usedVerbs.add(firstWord);
        count++;
      }
    });
    
    return count;
  }

  /**
   * Identify experience quality issues
   */
  private identifyQualityIssues(bullets: string[]): string[] {
    const issues: string[] = [];
    
    if (bullets.length === 0) {
      issues.push('No bullet points found in experience section');
      return issues;
    }
    
    if (bullets.length < 3) {
      issues.push('Too few bullet points - aim for 3-5 per role');
    }
    
    const metricsRatio = this.calculateMetricsUsageRatio(bullets);
    if (metricsRatio < 0.3) {
      issues.push('Less than 30% of bullets contain quantified results');
    }
    
    const actionVerbRatio = this.calculateActionVerbRatio(bullets);
    if (actionVerbRatio < 0.5) {
      issues.push('Less than 50% of bullets start with strong action verbs');
    }
    
    const achievementRatio = this.calculateAchievementRatio(bullets);
    if (achievementRatio < 0.6) {
      issues.push('Too many responsibility-focused bullets - focus more on achievements');
    }
    
    // Check for common weak patterns
    const weakPatterns = [
      { pattern: /^responsible for/i, issue: 'Avoid starting bullets with "Responsible for"' },
      { pattern: /^duties included/i, issue: 'Avoid starting bullets with "Duties included"' },
      { pattern: /^worked on/i, issue: 'Replace "Worked on" with specific action verbs' },
      { pattern: /^helped/i, issue: 'Replace "Helped" with specific contributions' },
      { pattern: /^assisted/i, issue: 'Replace "Assisted" with specific actions taken' },
    ];
    
    weakPatterns.forEach(({ pattern, issue }) => {
      const matchingBullets = bullets.filter(bullet => pattern.test(bullet));
      if (matchingBullets.length > 0) {
        issues.push(`${issue} (found in ${matchingBullets.length} bullets)`);
      }
    });
    
    return issues;
  }

  /**
   * Get experience improvement suggestions
   */
  getExperienceInsights(result: ExperienceAnalysisResult): string[] {
    const insights: string[] = [];
    
    if (result.impact_strength_score < 60) {
      insights.push('Focus on impact and achievements rather than job duties. Start bullets with strong action verbs.');
    }
    
    if (result.metrics_usage_ratio < 0.4) {
      insights.push('Add quantified results to more bullets (percentages, dollar amounts, time saved, etc.)');
    }
    
    if (result.action_verb_ratio < 0.6) {
      insights.push('Replace weak verbs (responsible, worked, helped) with strong action verbs (achieved, developed, led)');
    }
    
    if (result.achievement_vs_responsibility_ratio < 0.7) {
      insights.push('Shift focus from responsibilities to achievements and results you delivered');
    }
    
    if (result.strong_action_verbs_count < 5) {
      insights.push('Use more variety in your action verbs to demonstrate diverse capabilities');
    }
    
    // Add specific issue-based insights
    result.experience_quality_issues.forEach(issue => {
      insights.push(issue);
    });
    
    return insights;
  }

  /**
   * Suggest bullet point improvements
   */
  suggestBulletImprovements(bullets: string[]): Array<{original: string, improved: string, explanation: string}> {
    const improvements: Array<{original: string, improved: string, explanation: string}> = [];
    
    bullets.forEach(bullet => {
      const bulletLower = bullet.toLowerCase();
      
      // Identify weak patterns and suggest improvements
      if (bulletLower.startsWith('responsible for')) {
        const task = bullet.substring('responsible for'.length).trim();
        improvements.push({
          original: bullet,
          improved: `Managed ${task} resulting in [specific outcome/metric]`,
          explanation: 'Replaced passive responsibility language with active management and added space for quantified results'
        });
      } else if (bulletLower.startsWith('worked on')) {
        const project = bullet.substring('worked on'.length).trim();
        improvements.push({
          original: bullet,
          improved: `Developed ${project} that [specific impact/result]`,
          explanation: 'Replaced vague "worked on" with specific action verb and outcome focus'
        });
      } else if (bulletLower.startsWith('helped')) {
        const task = bullet.substring('helped'.length).trim();
        improvements.push({
          original: bullet,
          improved: `Collaborated to ${task}, achieving [specific result]`,
          explanation: 'Replaced "helped" with specific collaboration action and measurable outcome'
        });
      }
    });
    
    return improvements.slice(0, 3); // Return top 3 suggestions
  }
}

// Export singleton instance
export const experienceAnalyzer = new ExperienceAnalyzer();