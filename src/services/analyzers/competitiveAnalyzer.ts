/**
 * Tier 8: Competitive Analyzer (15 metrics)
 * Analyzes competitive positioning and market fit
 */

import { ResumeData, TierScore } from '../../types/resume';

export interface CompetitiveInput {
  resumeText: string;
  resumeData?: ResumeData;
  jobDescription?: string;
}

export interface CompetitiveResult {
  tierScore: TierScore;
  metrics: CompetitiveMetrics;
}

interface CompetitiveMetrics {
  yearsMatch: number;
  salaryAlignment: number;
  careerTrajectory: number;
  specializationDepth: number;
  competitiveAdvantage: number;
  uniqueValueProp: boolean;
  trendAlignment: number;
  marketFit: number;
  compensationFit: number;
  geographicFlexibility: boolean;
  availabilityIndicated: boolean;
  contractExperience: boolean;
  internationalExperience: boolean;
  diversityIndicators: boolean;
  referralStrength: number;
}

export class CompetitiveAnalyzer {
  static analyze(input: CompetitiveInput): CompetitiveResult {
    const { resumeText, resumeData, jobDescription } = input;
    const textLower = resumeText.toLowerCase();
    const jdLower = jobDescription?.toLowerCase() || '';

    const metrics = this.analyzeCompetitive(resumeData, textLower, jdLower);
    const score = this.calculateScore(metrics);
    const maxScore = 15;
    const percentage = Math.round((score / maxScore) * 100);

    const topIssues = this.identifyTopIssues(metrics);

    const tierScore: TierScore = {
      tier_number: 9,
      tier_name: 'Competitive',
      score: Math.round(score * 100) / 100,
      max_score: maxScore,
      percentage,
      weight: 6,
      weighted_contribution: Math.round((percentage * 6) / 100 * 100) / 100,
      metrics_passed: this.countPassedMetrics(metrics),
      metrics_total: 15,
      top_issues: topIssues,
    };

    return { tierScore, metrics };
  }

  private static analyzeCompetitive(
    resumeData: ResumeData | undefined,
    textLower: string,
    jdLower: string
  ): CompetitiveMetrics {
    const workExp = resumeData?.workExperience || [];

    // 1. Years of experience match
    const yearsMatch = this.calculateYearsMatch(workExp, jdLower);

    // 2. Salary alignment (inferred from seniority)
    const salaryAlignment = this.inferSalaryAlignment(workExp, jdLower);

    // 3. Career trajectory (progression)
    const careerTrajectory = this.analyzeCareerTrajectory(workExp);

    // 4. Specialization depth
    const specializationDepth = this.analyzeSpecialization(textLower, jdLower);

    // 5. Competitive advantage
    const competitiveAdvantage = this.analyzeCompetitiveAdvantage(textLower, jdLower);

    // 6. Unique value proposition
    const uniqueValueProp = /\b(unique|specialized|expert|pioneer|innovator|leader in|only|first)\b/i.test(textLower);

    // 7. Trend alignment (modern tech/practices)
    const trendAlignment = this.analyzeTrendAlignment(textLower);

    // 8. Market fit
    const marketFit = this.analyzeMarketFit(textLower, jdLower);

    // 9. Compensation fit (inferred)
    const compensationFit = salaryAlignment;

    // 10. Geographic flexibility
    const geographicFlexibility = /\b(remote|hybrid|relocate|willing to travel|flexible location|work from anywhere)\b/i.test(textLower);

    // 11. Availability indicated
    const availabilityIndicated = /\b(available|immediate|notice period|start date|currently available)\b/i.test(textLower);

    // 12. Contract experience
    const contractExperience = /\b(contract|freelance|consultant|consulting|independent)\b/i.test(textLower);

    // 13. International experience
    const internationalExperience = /\b(international|global|multinational|overseas|abroad|cross-border)\b/i.test(textLower);

    // 14. Diversity indicators
    const diversityIndicators = /\b(diversity|inclusion|dei|equity|belonging|underrepresented|erg|employee resource)\b/i.test(textLower);

    // 15. Referral strength (network indicators)
    const referralStrength = this.analyzeReferralStrength(textLower);

    return {
      yearsMatch,
      salaryAlignment,
      careerTrajectory,
      specializationDepth,
      competitiveAdvantage,
      uniqueValueProp,
      trendAlignment,
      marketFit,
      compensationFit,
      geographicFlexibility,
      availabilityIndicated,
      contractExperience,
      internationalExperience,
      diversityIndicators,
      referralStrength,
    };
  }

  private static calculateYearsMatch(workExp: ResumeData['workExperience'], jdLower: string): number {
    // Extract required years from JD
    const yearsMatch = jdLower.match(/(\d+)\+?\s*years?/i);
    const requiredYears = yearsMatch ? parseInt(yearsMatch[1]) : 3;

    // Estimate candidate years from work experience
    const candidateYears = workExp.length * 2; // Rough estimate

    if (candidateYears >= requiredYears) return 100;
    if (candidateYears >= requiredYears * 0.7) return 70;
    if (candidateYears >= requiredYears * 0.5) return 50;
    return 30;
  }

  private static inferSalaryAlignment(workExp: ResumeData['workExperience'], jdLower: string): number {
    // Infer from job titles and seniority
    const seniorTitles = workExp.filter(e => 
      /\b(senior|lead|principal|staff|director|manager|head|vp|chief)\b/i.test(e.role)
    ).length;

    const jdSeniority = /\b(senior|lead|principal|staff|director|manager)\b/i.test(jdLower);

    if (jdSeniority && seniorTitles > 0) return 85;
    if (!jdSeniority && seniorTitles === 0) return 80;
    if (seniorTitles > 0) return 70;
    return 60;
  }

  private static analyzeCareerTrajectory(workExp: ResumeData['workExperience']): number {
    if (workExp.length < 2) return 50;

    // Check for progression in titles
    const titles = workExp.map(e => e.role.toLowerCase());
    const progressionIndicators = ['junior', 'mid', 'senior', 'lead', 'principal', 'staff', 'manager', 'director'];
    
    let progressionScore = 50;
    for (let i = 1; i < titles.length; i++) {
      const prevLevel = progressionIndicators.findIndex(p => titles[i].includes(p));
      const currLevel = progressionIndicators.findIndex(p => titles[i-1].includes(p));
      if (currLevel > prevLevel && prevLevel >= 0) progressionScore += 15;
    }

    return Math.min(100, progressionScore);
  }

  private static analyzeSpecialization(textLower: string, jdLower: string): number {
    const specializations = [
      'frontend', 'backend', 'fullstack', 'devops', 'data', 'machine learning',
      'security', 'mobile', 'cloud', 'infrastructure', 'platform', 'embedded'
    ];

    const resumeSpecs = specializations.filter(s => textLower.includes(s));
    const jdSpecs = specializations.filter(s => jdLower.includes(s));

    if (jdSpecs.length === 0) return 70;
    const matches = jdSpecs.filter(s => resumeSpecs.includes(s)).length;
    return Math.min(100, (matches / jdSpecs.length) * 100 + 20);
  }

  private static analyzeCompetitiveAdvantage(textLower: string, jdLower: string): number {
    const advantages = [
      'patent', 'published', 'speaker', 'conference', 'award', 'recognition',
      'top performer', 'exceeded', 'promoted', 'fast-track', 'high performer',
      // Added more common achievement indicators
      'achieved', 'delivered', 'improved', 'increased', 'reduced', 'optimized',
      'led', 'managed', 'built', 'developed', 'implemented', 'launched',
      'spearheaded', 'drove', 'transformed', 'scaled', 'automated'
    ];

    const found = advantages.filter(a => textLower.includes(a)).length;
    // More generous base score + bonus for achievements
    return Math.min(100, found * 10 + 40);
  }

  private static analyzeTrendAlignment(textLower: string): number {
    const modernTech = [
      'kubernetes', 'docker', 'terraform', 'aws', 'azure', 'gcp', 'microservices',
      'graphql', 'typescript', 'react', 'vue', 'next.js', 'rust', 'go', 'ai', 'ml',
      'ci/cd', 'devops', 'agile', 'scrum', 'cloud-native', 'serverless',
      // Added more common modern tech
      'python', 'java', 'javascript', 'node', 'spring', 'django', 'flask',
      'mongodb', 'postgresql', 'redis', 'elasticsearch', 'kafka', 'spark',
      'jenkins', 'github', 'gitlab', 'api', 'rest', 'sql', 'nosql',
      'machine learning', 'deep learning', 'data science', 'analytics'
    ];

    const found = modernTech.filter(t => textLower.includes(t)).length;
    // More generous scoring - base 30 + 6 per tech found
    return Math.min(100, found * 6 + 30);
  }

  private static analyzeMarketFit(textLower: string, jdLower: string): number {
    // Check industry alignment
    const industries = [
      'fintech', 'healthcare', 'e-commerce', 'saas', 'startup', 'enterprise',
      'banking', 'insurance', 'retail', 'media', 'gaming', 'education'
    ];

    const resumeIndustries = industries.filter(i => textLower.includes(i));
    const jdIndustries = industries.filter(i => jdLower.includes(i));

    if (jdIndustries.length === 0) return 70;
    const matches = jdIndustries.filter(i => resumeIndustries.includes(i)).length;
    return Math.min(100, (matches / jdIndustries.length) * 100 + 30);
  }

  private static analyzeReferralStrength(textLower: string): number {
    const networkIndicators = [
      'linkedin', 'network', 'community', 'mentor', 'mentee', 'volunteer',
      'speaker', 'organizer', 'contributor', 'member', 'association'
    ];

    const found = networkIndicators.filter(n => textLower.includes(n)).length;
    return Math.min(100, found * 12 + 20);
  }

  private static calculateScore(metrics: CompetitiveMetrics): number {
    let score = 0;

    // Core competitive metrics (weighted higher)
    score += (metrics.yearsMatch / 100) * 2.5;
    score += (metrics.salaryAlignment / 100) * 1.5;
    score += (metrics.careerTrajectory / 100) * 2;
    score += (metrics.specializationDepth / 100) * 2;
    score += (metrics.competitiveAdvantage / 100) * 1.5;
    if (metrics.uniqueValueProp) score += 1;
    score += (metrics.trendAlignment / 100) * 2;
    score += (metrics.marketFit / 100) * 1.5;
    
    // Optional/bonus metrics (lower weight - not everyone has these)
    score += (metrics.compensationFit / 100) * 0.25;
    if (metrics.geographicFlexibility) score += 0.25;
    if (metrics.availabilityIndicated) score += 0.25;
    if (metrics.contractExperience) score += 0.25;
    if (metrics.internationalExperience) score += 0.25;
    if (metrics.diversityIndicators) score += 0.1;
    score += (metrics.referralStrength / 100) * 0.25;

    return Math.min(15, score);
  }

  private static countPassedMetrics(metrics: CompetitiveMetrics): number {
    let passed = 0;

    if (metrics.yearsMatch >= 70) passed++;
    if (metrics.salaryAlignment >= 70) passed++;
    if (metrics.careerTrajectory >= 60) passed++;
    if (metrics.specializationDepth >= 60) passed++;
    if (metrics.competitiveAdvantage >= 50) passed++;
    if (metrics.uniqueValueProp) passed++;
    if (metrics.trendAlignment >= 60) passed++;
    if (metrics.marketFit >= 60) passed++;
    if (metrics.compensationFit >= 70) passed++;
    if (metrics.geographicFlexibility) passed++;
    if (metrics.availabilityIndicated) passed++;
    if (metrics.contractExperience) passed++;
    if (metrics.internationalExperience) passed++;
    if (metrics.diversityIndicators) passed++;
    if (metrics.referralStrength >= 50) passed++;

    return passed;
  }

  private static identifyTopIssues(metrics: CompetitiveMetrics): string[] {
    const issues: string[] = [];

    if (metrics.yearsMatch < 70) issues.push('Experience level may not match JD requirements');
    if (metrics.careerTrajectory < 60) issues.push('Show clearer career progression');
    if (metrics.specializationDepth < 60) issues.push('Highlight specialization relevant to role');
    if (metrics.trendAlignment < 60) issues.push('Add modern technologies and practices');
    if (metrics.marketFit < 60) issues.push('Emphasize industry-relevant experience');
    if (!metrics.uniqueValueProp) issues.push('Add unique value proposition or differentiators');

    return issues.slice(0, 3);
  }
}

export default CompetitiveAnalyzer;
