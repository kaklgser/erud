/**
 * Tier 10: Qualitative Analyzer (10 metrics)
 * Analyzes narrative quality, authenticity, and overall presentation
 */

import { ResumeData, TierScore } from '../../types/resume';

export interface QualitativeInput {
  resumeText: string;
  resumeData?: ResumeData;
  jobDescription?: string;
}

export interface QualitativeResult {
  tierScore: TierScore;
  metrics: QualitativeMetrics;
}

interface QualitativeMetrics {
  narrativeCoherence: number;
  authenticity: number;
  achievementDensity: number;
  communicationQuality: number;
  presentationPolish: number;
  specificity: number;
  jdRelevance: number;
  motivationClarity: number;
  insiderKnowledge: number;
  futurePotential: number;
}

export class QualitativeAnalyzer {
  static analyze(input: QualitativeInput): QualitativeResult {
    const { resumeText, resumeData, jobDescription } = input;
    const textLower = resumeText.toLowerCase();
    const jdLower = jobDescription?.toLowerCase() || '';

    const metrics = this.analyzeQualitative(resumeData, textLower, jdLower, resumeText);
    const score = this.calculateScore(metrics);
    const maxScore = 10;
    const percentage = Math.round((score / maxScore) * 100);

    const topIssues = this.identifyTopIssues(metrics);

    const tierScore: TierScore = {
      tier_number: 11,
      tier_name: 'Qualitative',
      score: Math.round(score * 100) / 100,
      max_score: maxScore,
      percentage,
      weight: 5,
      weighted_contribution: Math.round((percentage * 5) / 100 * 100) / 100,
      metrics_passed: this.countPassedMetrics(metrics),
      metrics_total: 10,
      top_issues: topIssues,
    };

    return { tierScore, metrics };
  }

  private static analyzeQualitative(
    resumeData: ResumeData | undefined,
    textLower: string,
    jdLower: string,
    originalText: string
  ): QualitativeMetrics {
    const allBullets = [
      ...(resumeData?.workExperience?.flatMap(e => e.bullets) || []),
      ...(resumeData?.projects?.flatMap(p => p.bullets) || []),
    ];

    // 1. Narrative coherence (story flow)
    const narrativeCoherence = this.analyzeNarrativeCoherence(resumeData, textLower);

    // 2. Authenticity (specific vs generic)
    const authenticity = this.analyzeAuthenticity(allBullets, textLower);

    // 3. Achievement density
    const achievementDensity = this.analyzeAchievementDensity(allBullets);

    // 4. Communication quality (grammar, clarity)
    const communicationQuality = this.analyzeCommunicationQuality(originalText, allBullets);

    // 5. Presentation polish
    const presentationPolish = this.analyzePresentationPolish(originalText, resumeData);

    // 6. Specificity (concrete details)
    const specificity = this.analyzeSpecificity(allBullets, textLower);

    // 7. JD relevance (overall alignment)
    const jdRelevance = this.analyzeJdRelevance(textLower, jdLower);

    // 8. Motivation clarity
    const motivationClarity = this.analyzeMotivationClarity(resumeData, textLower);

    // 9. Insider knowledge (domain expertise)
    const insiderKnowledge = this.analyzeInsiderKnowledge(textLower, jdLower);

    // 10. Future potential
    const futurePotential = this.analyzeFuturePotential(resumeData, textLower);

    return {
      narrativeCoherence,
      authenticity,
      achievementDensity,
      communicationQuality,
      presentationPolish,
      specificity,
      jdRelevance,
      motivationClarity,
      insiderKnowledge,
      futurePotential,
    };
  }

  private static analyzeNarrativeCoherence(resumeData: ResumeData | undefined, textLower: string): number {
    let score = 50;

    // Check for career progression story
    const workExp = resumeData?.workExperience || [];
    if (workExp.length >= 2) {
      score += 15;
      
      // Check for logical progression
      const hasProgression = workExp.some((exp, i) => {
        if (i === 0) return false;
        const prevRole = workExp[i - 1].role.toLowerCase();
        const currRole = exp.role.toLowerCase();
        return currRole.includes('senior') || currRole.includes('lead') || 
               currRole.includes('manager') || prevRole.includes('junior');
      });
      if (hasProgression) score += 15;
    }

    // Check for summary that ties things together
    if (resumeData?.summary || resumeData?.careerObjective) {
      score += 10;
    }

    // Check for consistent theme
    const themeKeywords = ['software', 'data', 'product', 'design', 'engineering', 'development'];
    const hasConsistentTheme = themeKeywords.some(theme => {
      const count = (textLower.match(new RegExp(theme, 'g')) || []).length;
      return count >= 3;
    });
    if (hasConsistentTheme) score += 10;

    return Math.min(100, score);
  }

  private static analyzeAuthenticity(bullets: string[], textLower: string): number {
    let score = 50;

    // Check for specific company/product names
    const hasSpecificNames = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/.test(bullets.join(' '));
    if (hasSpecificNames) score += 15;

    // Check for specific numbers and metrics
    const hasMetrics = bullets.filter(b => /\d+%|\$\d+|\d+\s*(users?|customers?|projects?)/.test(b)).length;
    score += Math.min(20, hasMetrics * 5);

    // Penalize generic phrases
    const genericPhrases = [
      'responsible for', 'worked on', 'helped with', 'assisted in',
      'various', 'multiple', 'several', 'many'
    ];
    const genericCount = genericPhrases.filter(p => textLower.includes(p)).length;
    score -= genericCount * 3;

    return Math.max(20, Math.min(100, score));
  }

  private static analyzeAchievementDensity(bullets: string[]): number {
    if (bullets.length === 0) return 30;

    const achievementIndicators = [
      /\d+%/, /\$\d+/, /increased/, /decreased/, /reduced/, /improved/,
      /saved/, /generated/, /achieved/, /exceeded/, /delivered/, /launched/
    ];

    const achievementBullets = bullets.filter(b => 
      achievementIndicators.some(pattern => pattern.test(b.toLowerCase()))
    ).length;

    const density = (achievementBullets / bullets.length) * 100;
    return Math.min(100, density + 20);
  }

  private static analyzeCommunicationQuality(originalText: string, bullets: string[]): number {
    let score = 70;

    // Check for proper capitalization
    const properCaps = /^[A-Z]/.test(originalText);
    if (properCaps) score += 5;

    // Check for consistent bullet structure
    const bulletStarts = bullets.map(b => b.charAt(0));
    const allCaps = bulletStarts.every(c => c === c.toUpperCase());
    if (allCaps) score += 10;

    // Check for action verb starts
    const actionVerbs = ['led', 'developed', 'created', 'managed', 'designed', 'built', 'implemented'];
    const actionStarts = bullets.filter(b => 
      actionVerbs.some(v => b.toLowerCase().startsWith(v))
    ).length;
    score += Math.min(15, (actionStarts / Math.max(1, bullets.length)) * 20);

    return Math.min(100, score);
  }

  private static analyzePresentationPolish(originalText: string, resumeData: ResumeData | undefined): number {
    let score = 60;

    // Check for complete contact info
    if (resumeData?.email) score += 5;
    if (resumeData?.phone) score += 5;
    if (resumeData?.linkedin) score += 5;

    // Check for proper sections
    if (resumeData?.workExperience && resumeData.workExperience.length > 0) score += 5;
    if (resumeData?.education && resumeData.education.length > 0) score += 5;
    if (resumeData?.skills && resumeData.skills.length > 0) score += 5;

    // Check for summary
    if (resumeData?.summary) score += 5;

    // Check text length (not too short, not too long)
    const wordCount = originalText.split(/\s+/).length;
    if (wordCount >= 300 && wordCount <= 800) score += 5;

    return Math.min(100, score);
  }

  private static analyzeSpecificity(bullets: string[], textLower: string): number {
    let score = 40;

    // Check for specific technologies
    const techPattern = /\b(react|angular|vue|python|java|aws|docker|kubernetes|sql|mongodb)\b/i;
    const hasTech = techPattern.test(textLower);
    if (hasTech) score += 15;

    // Check for specific numbers
    const numberPattern = /\b\d+\b/;
    const bulletsWithNumbers = bullets.filter(b => numberPattern.test(b)).length;
    score += Math.min(25, bulletsWithNumbers * 5);

    // Check for specific outcomes
    const outcomePattern = /resulted in|leading to|which|enabling|allowing/i;
    const bulletsWithOutcomes = bullets.filter(b => outcomePattern.test(b)).length;
    score += Math.min(20, bulletsWithOutcomes * 5);

    return Math.min(100, score);
  }

  private static analyzeJdRelevance(textLower: string, jdLower: string): number {
    if (!jdLower) return 70;

    // Extract significant words from JD
    const jdWords = jdLower.split(/\s+/)
      .filter(w => w.length > 4)
      .filter(w => !['about', 'their', 'would', 'should', 'could', 'which', 'where'].includes(w));

    const uniqueJdWords = [...new Set(jdWords)];
    const matches = uniqueJdWords.filter(w => textLower.includes(w)).length;

    const relevance = uniqueJdWords.length > 0 
      ? (matches / uniqueJdWords.length) * 100 
      : 50;

    return Math.min(100, relevance + 10);
  }

  private static analyzeMotivationClarity(resumeData: ResumeData | undefined, textLower: string): number {
    let score = 50;

    // Check for career objective or summary
    if (resumeData?.careerObjective || resumeData?.summary) {
      score += 20;
    }

    // Check for passion indicators
    const passionKeywords = ['passionate', 'driven', 'dedicated', 'committed', 'enthusiastic', 'love'];
    const hasPassion = passionKeywords.some(k => textLower.includes(k));
    if (hasPassion) score += 15;

    // Check for goal indicators
    const goalKeywords = ['seeking', 'looking for', 'goal', 'aspire', 'aim', 'objective'];
    const hasGoals = goalKeywords.some(k => textLower.includes(k));
    if (hasGoals) score += 15;

    return Math.min(100, score);
  }

  private static analyzeInsiderKnowledge(textLower: string, jdLower: string): number {
    let score = 50;

    // Check for industry-specific terminology
    const industryTerms = [
      'sprint', 'agile', 'scrum', 'kanban', 'ci/cd', 'devops', 'microservices',
      'api', 'rest', 'graphql', 'saas', 'b2b', 'b2c', 'mvp', 'kpi', 'okr'
    ];

    const termsUsed = industryTerms.filter(t => textLower.includes(t)).length;
    score += Math.min(30, termsUsed * 5);

    // Check for domain expertise alignment with JD
    if (jdLower) {
      const domainTerms = industryTerms.filter(t => jdLower.includes(t));
      const matches = domainTerms.filter(t => textLower.includes(t)).length;
      if (domainTerms.length > 0) {
        score += (matches / domainTerms.length) * 20;
      }
    }

    return Math.min(100, score);
  }

  private static analyzeFuturePotential(resumeData: ResumeData | undefined, textLower: string): number {
    let score = 50;

    // Check for growth trajectory
    const workExp = resumeData?.workExperience || [];
    if (workExp.length >= 2) {
      score += 10;
    }

    // Check for learning indicators
    const learningKeywords = ['learning', 'growing', 'developing', 'expanding', 'certification'];
    const hasLearning = learningKeywords.some(k => textLower.includes(k));
    if (hasLearning) score += 15;

    // Check for leadership potential
    const leadershipKeywords = ['led', 'managed', 'mentored', 'coached', 'trained'];
    const hasLeadership = leadershipKeywords.some(k => textLower.includes(k));
    if (hasLeadership) score += 15;

    // Check for recent activity
    const currentYear = new Date().getFullYear();
    const recentYears = [currentYear, currentYear - 1].map(String);
    const hasRecent = recentYears.some(y => textLower.includes(y));
    if (hasRecent) score += 10;

    return Math.min(100, score);
  }

  private static calculateScore(metrics: QualitativeMetrics): number {
    let score = 0;

    score += (metrics.narrativeCoherence / 100) * 1.5;
    score += (metrics.authenticity / 100) * 1.5;
    score += (metrics.achievementDensity / 100) * 1;
    score += (metrics.communicationQuality / 100) * 1;
    score += (metrics.presentationPolish / 100) * 1;
    score += (metrics.specificity / 100) * 1;
    score += (metrics.jdRelevance / 100) * 1;
    score += (metrics.motivationClarity / 100) * 0.5;
    score += (metrics.insiderKnowledge / 100) * 1;
    score += (metrics.futurePotential / 100) * 0.5;

    return Math.min(10, score);
  }

  private static countPassedMetrics(metrics: QualitativeMetrics): number {
    let passed = 0;

    if (metrics.narrativeCoherence >= 60) passed++;
    if (metrics.authenticity >= 60) passed++;
    if (metrics.achievementDensity >= 50) passed++;
    if (metrics.communicationQuality >= 70) passed++;
    if (metrics.presentationPolish >= 70) passed++;
    if (metrics.specificity >= 60) passed++;
    if (metrics.jdRelevance >= 60) passed++;
    if (metrics.motivationClarity >= 50) passed++;
    if (metrics.insiderKnowledge >= 50) passed++;
    if (metrics.futurePotential >= 50) passed++;

    return passed;
  }

  private static identifyTopIssues(metrics: QualitativeMetrics): string[] {
    const issues: string[] = [];

    if (metrics.authenticity < 60) issues.push('Add more specific, authentic details');
    if (metrics.achievementDensity < 50) issues.push('Include more quantified achievements');
    if (metrics.specificity < 60) issues.push('Be more specific with technologies and outcomes');
    if (metrics.narrativeCoherence < 60) issues.push('Create a clearer career narrative');
    if (metrics.jdRelevance < 60) issues.push('Align content more closely with job requirements');
    if (metrics.communicationQuality < 70) issues.push('Improve writing clarity and consistency');

    return issues.slice(0, 3);
  }
}

export default QualitativeAnalyzer;
