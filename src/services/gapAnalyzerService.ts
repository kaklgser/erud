/**
 * Gap Analyzer Service
 * Integrates with 220+ metrics Score Checker to identify gaps and prioritize improvements
 */

import {
  ResumeData,
  TierScores,
  CriticalMetrics,
} from '../types/resume';

import {
  GapAnalysisResult,
  TierGap,
  Big5Gap,
  Improvement,
  FailingMetric,
} from '../types/optimizer';

import { EnhancedScoringService, EnhancedScoringInput } from './enhancedScoringService';

// ============================================================================
// GAP ANALYZER SERVICE
// ============================================================================

export class GapAnalyzerService {
  /**
   * Analyze gaps between current resume and JD requirements
   * Uses the 220+ metrics framework
   */
  static async analyzeGaps(
    resumeData: ResumeData,
    resumeText: string,
    jobDescription: string
  ): Promise<GapAnalysisResult> {
    // Get comprehensive score using 220+ metrics
    const scoringInput: EnhancedScoringInput = {
      resumeText,
      resumeData,
      jobDescription,
      extractionMode: 'TEXT',
    };

    const beforeScore = await EnhancedScoringService.calculateScore(scoringInput);

    // Analyze tier gaps
    const tierGaps = this.analyzeTierGaps(beforeScore.tier_scores);

    // Analyze Big 5 gaps
    const big5Gaps = this.analyzeBig5Gaps(beforeScore.critical_metrics);

    // Prioritize improvements
    const prioritizedImprovements = this.prioritizeImprovements(tierGaps, big5Gaps);

    return {
      beforeScore,
      tierGaps,
      big5Gaps,
      prioritizedImprovements,
      redFlags: beforeScore.red_flags,
      missingKeywords: beforeScore.missing_keywords_enhanced,
    };
  }


  /**
   * Analyze gaps for all 10 tiers
   */
  private static analyzeTierGaps(tierScores: TierScores): TierGap[] {
    const gaps: TierGap[] = [];

    const tierEntries: [keyof TierScores, number][] = [
      ['basic_structure', 1],
      ['content_structure', 2],
      ['experience', 3],
      ['education', 4],
      ['certifications', 5],
      ['skills_keywords', 6],
      ['projects', 7],
      ['red_flags', 7],
      ['competitive', 8],
      ['culture_fit', 9],
      ['qualitative', 10],
    ];

    for (const [tierKey, tierNumber] of tierEntries) {
      const tier = tierScores[tierKey];
      
      // Only include tiers with room for improvement
      if (tier.percentage < 100) {
        const failingMetrics = this.extractFailingMetrics(tier, tierNumber);
        
        gaps.push({
          tierNumber,
          tierName: tier.tier_name,
          currentScore: tier.score,
          maxScore: tier.max_score,
          percentage: tier.percentage,
          weight: tier.weight,
          failingMetrics,
        });
      }
    }

    // Sort by weight (highest impact first)
    return gaps.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Extract failing metrics from tier issues
   */
  private static extractFailingMetrics(tier: TierScores[keyof TierScores], tierNumber: number): FailingMetric[] {
    const failingMetrics: FailingMetric[] = [];

    tier.top_issues.forEach((issue, index) => {
      failingMetrics.push({
        metricId: tierNumber * 100 + index + 1,
        metricName: `${tier.tier_name} Issue ${index + 1}`,
        currentValue: 'Below threshold',
        expectedValue: 'Pass',
        impact: tier.weight / tier.top_issues.length,
        recommendation: issue,
      });
    });

    return failingMetrics;
  }

  /**
   * Analyze Big 5 critical metric gaps
   */
  private static analyzeBig5Gaps(criticalMetrics: CriticalMetrics): Big5Gap[] {
    const gaps: Big5Gap[] = [];

    // JD Keywords Match (5 points max)
    const jdKeywords = criticalMetrics.jd_keywords_match;
    if (jdKeywords.percentage < 100) {
      gaps.push({
        metric: 'jd_keywords_match',
        metricName: 'JD Keywords Match',
        currentScore: jdKeywords.score,
        maxScore: jdKeywords.max_score,
        gap: jdKeywords.max_score - jdKeywords.score,
        priority: jdKeywords.percentage < 50 ? 'critical' : jdKeywords.percentage < 70 ? 'high' : 'medium',
        improvements: [
          'Add missing JD keywords to skills section',
          'Include keywords in experience bullet points',
          'Use exact terminology from job description',
        ],
      });
    }

    // Technical Skills Alignment (5 points max)
    const techSkills = criticalMetrics.technical_skills_alignment;
    if (techSkills.percentage < 100) {
      gaps.push({
        metric: 'technical_skills_alignment',
        metricName: 'Technical Skills Alignment',
        currentScore: techSkills.score,
        maxScore: techSkills.max_score,
        gap: techSkills.max_score - techSkills.score,
        priority: techSkills.percentage < 50 ? 'critical' : techSkills.percentage < 70 ? 'high' : 'medium',
        improvements: [
          'Add missing technical skills from JD',
          'Categorize skills by type (languages, frameworks, tools)',
          'Demonstrate skills in project descriptions',
        ],
      });
    }

    // Quantified Results (3 points max)
    const quantified = criticalMetrics.quantified_results_presence;
    if (quantified.percentage < 100) {
      gaps.push({
        metric: 'quantified_results_presence',
        metricName: 'Quantified Results',
        currentScore: quantified.score,
        maxScore: quantified.max_score,
        gap: quantified.max_score - quantified.score,
        priority: quantified.percentage < 50 ? 'critical' : quantified.percentage < 70 ? 'high' : 'medium',
        improvements: [
          'Add percentages to achievements (e.g., "increased by 25%")',
          'Include dollar amounts where applicable',
          'Quantify team sizes, user counts, or project scale',
        ],
      });
    }

    // Job Title Relevance (3 points max)
    const titleRelevance = criticalMetrics.job_title_relevance;
    if (titleRelevance.percentage < 100) {
      gaps.push({
        metric: 'job_title_relevance',
        metricName: 'Job Title Relevance',
        currentScore: titleRelevance.score,
        maxScore: titleRelevance.max_score,
        gap: titleRelevance.max_score - titleRelevance.score,
        priority: titleRelevance.percentage < 50 ? 'critical' : titleRelevance.percentage < 70 ? 'high' : 'medium',
        improvements: [
          'Align job titles with target role terminology',
          'Highlight relevant title keywords',
          'Add target role to professional summary',
        ],
      });
    }

    // Experience Relevance (3 points max)
    const expRelevance = criticalMetrics.experience_relevance;
    if (expRelevance.percentage < 100) {
      gaps.push({
        metric: 'experience_relevance',
        metricName: 'Experience Relevance',
        currentScore: expRelevance.score,
        maxScore: expRelevance.max_score,
        gap: expRelevance.max_score - expRelevance.score,
        priority: expRelevance.percentage < 50 ? 'critical' : expRelevance.percentage < 70 ? 'high' : 'medium',
        improvements: [
          'Rewrite bullets to emphasize JD-relevant experience',
          'Highlight transferable skills',
          'Add context connecting experience to target role',
        ],
      });
    }

    // Sort by priority (critical first)
    const priorityOrder = { critical: 0, high: 1, medium: 2 };
    return gaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  /**
   * Prioritize all improvements by impact
   */
  private static prioritizeImprovements(tierGaps: TierGap[], big5Gaps: Big5Gap[]): Improvement[] {
    const improvements: Improvement[] = [];

    // Add Big 5 improvements first (highest priority)
    big5Gaps.forEach((gap, index) => {
      gap.improvements.forEach((rec, recIndex) => {
        improvements.push({
          priority: index * 10 + recIndex,
          tier: 0, // Big 5 are cross-tier
          tierName: 'Big 5 Critical',
          metricName: gap.metricName,
          impact: gap.gap * 2, // Big 5 have 2x impact
          recommendation: rec,
          isBig5: true,
        });
      });
    });

    // Add tier-specific improvements
    tierGaps.forEach((gap) => {
      gap.failingMetrics.forEach((metric, index) => {
        improvements.push({
          priority: 100 + gap.tierNumber * 10 + index,
          tier: gap.tierNumber,
          tierName: gap.tierName,
          metricName: metric.metricName,
          impact: metric.impact,
          recommendation: metric.recommendation,
          isBig5: false,
        });
      });
    });

    // Sort by impact (highest first), then by priority
    return improvements.sort((a, b) => {
      if (a.isBig5 !== b.isBig5) return a.isBig5 ? -1 : 1;
      if (b.impact !== a.impact) return b.impact - a.impact;
      return a.priority - b.priority;
    });
  }

  /**
   * Get improvement summary for display
   */
  static getImprovementSummary(gapAnalysis: GapAnalysisResult): string {
    const { tierGaps, big5Gaps, prioritizedImprovements } = gapAnalysis;

    const criticalBig5 = big5Gaps.filter(g => g.priority === 'critical').length;
    const lowTiers = tierGaps.filter(g => g.percentage < 60).length;
    const totalImprovements = prioritizedImprovements.length;

    let summary = `Found ${totalImprovements} potential improvements. `;
    
    if (criticalBig5 > 0) {
      summary += `${criticalBig5} critical Big 5 metric(s) need attention. `;
    }
    
    if (lowTiers > 0) {
      summary += `${lowTiers} tier(s) scoring below 60%. `;
    }

    return summary;
  }
}

export default GapAnalyzerService;
