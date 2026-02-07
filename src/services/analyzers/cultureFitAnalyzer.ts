/**
 * Tier 9: Culture Fit Analyzer (20 metrics)
 * Analyzes cultural alignment and soft skill indicators
 */

import { ResumeData, TierScore } from '../../types/resume';

export interface CultureFitInput {
  resumeText: string;
  resumeData?: ResumeData;
  jobDescription?: string;
}

export interface CultureFitResult {
  tierScore: TierScore;
  metrics: CultureFitMetrics;
}

interface CultureFitMetrics {
  cultureAlignment: number;
  workStyle: number;
  collaborationIndicators: number;
  learningAgility: number;
  leadershipStyle: number;
  riskTolerance: number;
  communicationStyle: number;
  initiativeIndicators: number;
  feedbackResponse: number;
  valuesAlignment: number;
  remoteCapability: boolean;
  distributedTeamExp: boolean;
  customerMindset: number;
  dataDriven: boolean;
  innovationMindset: number;
  mentoringExp: boolean;
  ethicsIndicators: boolean;
  biasToAction: number;
  continuousImprovement: number;
  resilienceIndicators: number;
}

export class CultureFitAnalyzer {
  static analyze(input: CultureFitInput): CultureFitResult {
    const { resumeText, resumeData, jobDescription } = input;
    const textLower = resumeText.toLowerCase();
    const jdLower = jobDescription?.toLowerCase() || '';

    const metrics = this.analyzeCultureFit(resumeData, textLower, jdLower);
    const score = this.calculateScore(metrics);
    const maxScore = 20;
    const percentage = Math.round((score / maxScore) * 100);

    const topIssues = this.identifyTopIssues(metrics);

    const tierScore: TierScore = {
      tier_number: 10,
      tier_name: 'Culture Fit',
      score: Math.round(score * 100) / 100,
      max_score: maxScore,
      percentage,
      weight: 5,
      weighted_contribution: Math.round((percentage * 5) / 100 * 100) / 100,
      metrics_passed: this.countPassedMetrics(metrics),
      metrics_total: 20,
      top_issues: topIssues,
    };

    return { tierScore, metrics };
  }

  private static analyzeCultureFit(
    resumeData: ResumeData | undefined,
    textLower: string,
    jdLower: string
  ): CultureFitMetrics {
    const allBullets = [
      ...(resumeData?.workExperience?.flatMap(e => e.bullets) || []),
      ...(resumeData?.projects?.flatMap(p => p.bullets) || []),
    ].join(' ').toLowerCase();

    // 1. Culture alignment (based on JD culture keywords)
    const cultureAlignment = this.analyzeCultureAlignment(textLower, jdLower);

    // 2. Work style indicators
    const workStyle = this.analyzeWorkStyle(textLower, jdLower);

    // 3. Collaboration indicators
    const collaborationIndicators = this.analyzeCollaboration(textLower, allBullets);

    // 4. Learning agility
    const learningAgility = this.analyzeLearningAgility(textLower, allBullets);

    // 5. Leadership style
    const leadershipStyle = this.analyzeLeadership(textLower, allBullets);

    // 6. Risk tolerance
    const riskTolerance = this.analyzeRiskTolerance(textLower, allBullets);

    // 7. Communication style
    const communicationStyle = this.analyzeCommunication(textLower, allBullets);

    // 8. Initiative indicators
    const initiativeIndicators = this.analyzeInitiative(textLower, allBullets);

    // 9. Feedback response
    const feedbackResponse = this.analyzeFeedbackResponse(textLower, allBullets);

    // 10. Values alignment
    const valuesAlignment = this.analyzeValues(textLower, jdLower);

    // 11. Remote capability
    const remoteCapability = /\b(remote|distributed|virtual|work from home|wfh|async|asynchronous)\b/i.test(textLower);

    // 12. Distributed team experience
    const distributedTeamExp = /\b(distributed|global team|cross-timezone|international team|remote team)\b/i.test(textLower);

    // 13. Customer mindset
    const customerMindset = this.analyzeCustomerMindset(textLower, allBullets);

    // 14. Data-driven
    const dataDriven = /\b(data-driven|metrics|analytics|kpi|measure|a\/b test|experiment)\b/i.test(textLower);

    // 15. Innovation mindset
    const innovationMindset = this.analyzeInnovation(textLower, allBullets);

    // 16. Mentoring experience
    const mentoringExp = /\b(mentor|coach|train|onboard|guide|develop talent|grow team)\b/i.test(textLower);

    // 17. Ethics indicators
    const ethicsIndicators = /\b(ethics|integrity|compliance|governance|responsible|sustainable)\b/i.test(textLower);

    // 18. Bias to action
    const biasToAction = this.analyzeBiasToAction(textLower, allBullets);

    // 19. Continuous improvement
    const continuousImprovement = this.analyzeContinuousImprovement(textLower, allBullets);

    // 20. Resilience indicators
    const resilienceIndicators = this.analyzeResilience(textLower, allBullets);

    return {
      cultureAlignment,
      workStyle,
      collaborationIndicators,
      learningAgility,
      leadershipStyle,
      riskTolerance,
      communicationStyle,
      initiativeIndicators,
      feedbackResponse,
      valuesAlignment,
      remoteCapability,
      distributedTeamExp,
      customerMindset,
      dataDriven,
      innovationMindset,
      mentoringExp,
      ethicsIndicators,
      biasToAction,
      continuousImprovement,
      resilienceIndicators,
    };
  }

  private static analyzeCultureAlignment(textLower: string, jdLower: string): number {
    const cultureKeywords = [
      'collaborative', 'innovative', 'fast-paced', 'startup', 'agile', 'dynamic',
      'inclusive', 'diverse', 'growth', 'learning', 'ownership', 'autonomy'
    ];

    const jdCulture = cultureKeywords.filter(k => jdLower.includes(k));
    const resumeCulture = cultureKeywords.filter(k => textLower.includes(k));

    if (jdCulture.length === 0) return 70;
    const matches = jdCulture.filter(k => resumeCulture.includes(k)).length;
    return Math.min(100, (matches / jdCulture.length) * 100 + 20);
  }

  private static analyzeWorkStyle(textLower: string, jdLower: string): number {
    const workStyles = {
      independent: ['independent', 'self-directed', 'autonomous', 'self-starter'],
      collaborative: ['team', 'collaborative', 'cross-functional', 'partnership'],
      structured: ['process', 'methodology', 'framework', 'systematic'],
      flexible: ['agile', 'adaptive', 'flexible', 'dynamic']
    };

    let score = 50;
    Object.values(workStyles).forEach(keywords => {
      if (keywords.some(k => textLower.includes(k))) score += 12;
    });

    return Math.min(100, score);
  }

  private static analyzeCollaboration(textLower: string, bullets: string): number {
    const collabKeywords = [
      'collaborated', 'partnered', 'worked with', 'cross-functional', 'team',
      'stakeholder', 'coordinated', 'aligned', 'facilitated', 'together',
      // Added more common collaboration indicators
      'with', 'alongside', 'supported', 'assisted', 'contributed', 'joined',
      'engineers', 'developers', 'designers', 'managers', 'clients', 'customers'
    ];

    const found = collabKeywords.filter(k => textLower.includes(k) || bullets.includes(k)).length;
    // More generous base score
    return Math.min(100, found * 8 + 35);
  }

  private static analyzeLearningAgility(textLower: string, bullets: string): number {
    const learningKeywords = [
      'learned', 'self-taught', 'certification', 'course', 'training', 'upskill',
      'new technology', 'adopted', 'mastered', 'quickly', 'fast learner'
    ];

    const found = learningKeywords.filter(k => textLower.includes(k) || bullets.includes(k)).length;
    return Math.min(100, found * 12 + 20);
  }

  private static analyzeLeadership(textLower: string, bullets: string): number {
    const leadershipKeywords = [
      'led', 'managed', 'directed', 'supervised', 'mentored', 'coached',
      'spearheaded', 'drove', 'championed', 'owned', 'responsible for',
      // Added more common leadership indicators
      'oversaw', 'guided', 'coordinated', 'organized', 'planned', 'executed',
      'delivered', 'achieved', 'accomplished', 'completed', 'built', 'developed'
    ];

    const found = leadershipKeywords.filter(k => textLower.includes(k) || bullets.includes(k)).length;
    // More generous base score
    return Math.min(100, found * 8 + 35);
  }

  private static analyzeRiskTolerance(textLower: string, bullets: string): number {
    const riskKeywords = [
      'startup', 'early-stage', 'greenfield', 'new initiative', 'pioneered',
      'first', 'experimental', 'prototype', 'mvp', 'innovation'
    ];

    const found = riskKeywords.filter(k => textLower.includes(k) || bullets.includes(k)).length;
    return Math.min(100, found * 12 + 30);
  }

  private static analyzeCommunication(textLower: string, bullets: string): number {
    const commKeywords = [
      'presented', 'communicated', 'documented', 'wrote', 'published',
      'stakeholder', 'client-facing', 'executive', 'report', 'proposal'
    ];

    const found = commKeywords.filter(k => textLower.includes(k) || bullets.includes(k)).length;
    return Math.min(100, found * 10 + 20);
  }

  private static analyzeInitiative(textLower: string, bullets: string): number {
    const initiativeKeywords = [
      'initiated', 'proposed', 'identified', 'proactively', 'volunteered',
      'self-directed', 'took ownership', 'drove', 'launched', 'started'
    ];

    const found = initiativeKeywords.filter(k => textLower.includes(k) || bullets.includes(k)).length;
    return Math.min(100, found * 12 + 20);
  }

  private static analyzeFeedbackResponse(textLower: string, bullets: string): number {
    const feedbackKeywords = [
      'feedback', 'improved', 'iterated', 'refined', 'adapted', 'adjusted',
      'responsive', 'incorporated', 'learned from', 'retrospective'
    ];

    const found = feedbackKeywords.filter(k => textLower.includes(k) || bullets.includes(k)).length;
    return Math.min(100, found * 12 + 30);
  }

  private static analyzeValues(textLower: string, jdLower: string): number {
    const valueKeywords = [
      'integrity', 'excellence', 'quality', 'customer', 'impact', 'growth',
      'innovation', 'collaboration', 'respect', 'accountability'
    ];

    const jdValues = valueKeywords.filter(v => jdLower.includes(v));
    const resumeValues = valueKeywords.filter(v => textLower.includes(v));

    if (jdValues.length === 0) return 70;
    const matches = jdValues.filter(v => resumeValues.includes(v)).length;
    return Math.min(100, (matches / jdValues.length) * 100 + 20);
  }

  private static analyzeCustomerMindset(textLower: string, bullets: string): number {
    const customerKeywords = [
      'customer', 'client', 'user', 'stakeholder', 'end-user', 'ux',
      'user experience', 'satisfaction', 'feedback', 'support'
    ];

    const found = customerKeywords.filter(k => textLower.includes(k) || bullets.includes(k)).length;
    return Math.min(100, found * 10 + 20);
  }

  private static analyzeInnovation(textLower: string, bullets: string): number {
    const innovationKeywords = [
      'innovated', 'created', 'designed', 'invented', 'developed', 'built',
      'new', 'novel', 'improved', 'optimized', 'automated', 'streamlined',
      // Added more common innovation indicators
      'implemented', 'introduced', 'pioneered', 'transformed', 'modernized',
      'solution', 'architecture', 'system', 'platform', 'framework', 'tool'
    ];

    const found = innovationKeywords.filter(k => textLower.includes(k) || bullets.includes(k)).length;
    // More generous base score
    return Math.min(100, found * 7 + 35);
  }

  private static analyzeBiasToAction(textLower: string, bullets: string): number {
    const actionKeywords = [
      'delivered', 'shipped', 'launched', 'completed', 'achieved', 'executed',
      'implemented', 'deployed', 'released', 'accomplished',
      // Added more common action verbs
      'built', 'created', 'developed', 'designed', 'engineered', 'automated',
      'optimized', 'improved', 'enhanced', 'reduced', 'increased', 'streamlined'
    ];

    const found = actionKeywords.filter(k => textLower.includes(k) || bullets.includes(k)).length;
    // More generous base score
    return Math.min(100, found * 8 + 35);
  }

  private static analyzeContinuousImprovement(textLower: string, bullets: string): number {
    const improvementKeywords = [
      'improved', 'optimized', 'enhanced', 'reduced', 'increased', 'streamlined',
      'automated', 'refactored', 'upgraded', 'modernized',
      // Added more common improvement indicators
      'faster', 'better', 'efficient', 'performance', 'scalable', 'reliable',
      'quality', 'accuracy', 'productivity', 'cost', 'time', 'savings'
    ];

    const found = improvementKeywords.filter(k => textLower.includes(k) || bullets.includes(k)).length;
    // More generous base score
    return Math.min(100, found * 8 + 35);
  }

  private static analyzeResilience(textLower: string, bullets: string): number {
    const resilienceKeywords = [
      'challenge', 'overcome', 'resolved', 'troubleshoot', 'debug', 'fixed',
      'recovered', 'adapted', 'pivoted', 'crisis', 'pressure', 'deadline'
    ];

    const found = resilienceKeywords.filter(k => textLower.includes(k) || bullets.includes(k)).length;
    return Math.min(100, found * 10 + 30);
  }


  private static calculateScore(metrics: CultureFitMetrics): number {
    let score = 0;

    // Core culture fit metrics (weighted higher - these are common in good resumes)
    score += (metrics.cultureAlignment / 100) * 1.5;
    score += (metrics.workStyle / 100) * 1.5;
    score += (metrics.collaborationIndicators / 100) * 2;
    score += (metrics.learningAgility / 100) * 1.5;
    score += (metrics.leadershipStyle / 100) * 2;
    score += (metrics.communicationStyle / 100) * 2;
    score += (metrics.initiativeIndicators / 100) * 2;
    score += (metrics.biasToAction / 100) * 2;
    score += (metrics.continuousImprovement / 100) * 2;
    score += (metrics.innovationMindset / 100) * 1.5;
    score += (metrics.customerMindset / 100) * 1;
    
    // Optional/bonus metrics (lower weight - not everyone has these explicitly)
    score += (metrics.riskTolerance / 100) * 0.25;
    score += (metrics.feedbackResponse / 100) * 0.5;
    score += (metrics.valuesAlignment / 100) * 0.5;
    if (metrics.remoteCapability) score += 0.25;
    if (metrics.distributedTeamExp) score += 0.25;
    if (metrics.dataDriven) score += 0.25;
    if (metrics.mentoringExp) score += 0.25;
    if (metrics.ethicsIndicators) score += 0.1;
    score += (metrics.resilienceIndicators / 100) * 0.5;

    return Math.min(20, score);
  }

  private static countPassedMetrics(metrics: CultureFitMetrics): number {
    let passed = 0;

    if (metrics.cultureAlignment >= 60) passed++;
    if (metrics.workStyle >= 60) passed++;
    if (metrics.collaborationIndicators >= 60) passed++;
    if (metrics.learningAgility >= 60) passed++;
    if (metrics.leadershipStyle >= 50) passed++;
    if (metrics.riskTolerance >= 50) passed++;
    if (metrics.communicationStyle >= 60) passed++;
    if (metrics.initiativeIndicators >= 60) passed++;
    if (metrics.feedbackResponse >= 50) passed++;
    if (metrics.valuesAlignment >= 60) passed++;
    if (metrics.remoteCapability) passed++;
    if (metrics.distributedTeamExp) passed++;
    if (metrics.customerMindset >= 50) passed++;
    if (metrics.dataDriven) passed++;
    if (metrics.innovationMindset >= 60) passed++;
    if (metrics.mentoringExp) passed++;
    if (metrics.ethicsIndicators) passed++;
    if (metrics.biasToAction >= 60) passed++;
    if (metrics.continuousImprovement >= 60) passed++;
    if (metrics.resilienceIndicators >= 50) passed++;

    return passed;
  }

  private static identifyTopIssues(metrics: CultureFitMetrics): string[] {
    const issues: string[] = [];

    if (metrics.collaborationIndicators < 60) issues.push('Add more collaboration examples');
    if (metrics.leadershipStyle < 50) issues.push('Highlight leadership experiences');
    if (metrics.communicationStyle < 60) issues.push('Show communication skills');
    if (metrics.initiativeIndicators < 60) issues.push('Demonstrate initiative and ownership');
    if (metrics.learningAgility < 60) issues.push('Show continuous learning');
    if (metrics.biasToAction < 60) issues.push('Emphasize delivery and results');

    return issues.slice(0, 3);
  }
}

export default CultureFitAnalyzer;
