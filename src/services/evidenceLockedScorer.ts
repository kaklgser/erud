import { hybridMatcher, HybridMatch } from './hybridMatcher';
import { roleClassifier, RoleClassification } from './roleClassifier';

export interface EvidenceSource {
  type: 'resume' | 'jd' | 'semantic_match';
  snippet: string;
  location?: string;
  confidence: number;
}

export interface ScoredComponent {
  name: string;
  score: number;
  maxScore: number;
  evidence: EvidenceSource[];
  explanation: string;
  hasEvidence: boolean;
}

export interface EvidenceLockedScore {
  overall: number;
  components: ScoredComponent[];
  evidenceSummary: {
    totalEvidence: number;
    resumeEvidence: number;
    jdEvidence: number;
    semanticEvidence: number;
  };
  blockedScores: string[];
  grade: 'excellent' | 'good' | 'fair' | 'poor';
}

export class EvidenceLockedScorer {
  private static readonly ROLE_WEIGHT_MATRIX = {
    'ops-data-entry': {
      'MS Office': 1.5,
      'Accuracy': 1.4,
      'SLAs': 1.3,
      'Documentation': 1.2,
      'Data Entry': 1.5,
      'Technical Skills': 0.6
    },
    'software-dev': {
      'Technical Skills': 1.4,
      'APIs': 1.3,
      'System Design': 1.3,
      'Code Quality': 1.2,
      'MS Office': 0.7,
      'Data Entry': 0.5
    },
    'data-analytics': {
      'SQL': 1.4,
      'Data Analysis': 1.4,
      'Visualization': 1.3,
      'Statistics': 1.2,
      'Python/R': 1.3
    },
    'ai-ml': {
      'ML Models': 1.5,
      'Python': 1.4,
      'Data Science': 1.4,
      'Algorithms': 1.3,
      'Research': 1.2
    },
    'devops-cloud': {
      'CI/CD': 1.5,
      'Cloud': 1.4,
      'Infrastructure': 1.3,
      'Automation': 1.3,
      'Monitoring': 1.2
    }
  };

  static async scoreWithEvidence(
    resumeText: string,
    jobDescription: string,
    roleClassification?: RoleClassification
  ): Promise<EvidenceLockedScore> {
    const components: ScoredComponent[] = [];
    const blockedScores: string[] = [];

    const matchingResult = await hybridMatcher.matchJDToResume(jobDescription, resumeText);

    const role = roleClassification || roleClassifier.classifyRole(jobDescription);
    const roleType = this.mapToRoleType(role.roleType);
    const weights = this.ROLE_WEIGHT_MATRIX[roleType] || {};

    const technicalScore = await this.scoreTechnicalSkills(
      resumeText,
      jobDescription,
      matchingResult.matches,
      weights
    );
    if (technicalScore.hasEvidence) {
      components.push(technicalScore);
    } else {
      blockedScores.push('Technical Skills (no evidence)');
    }

    const experienceScore = this.scoreExperience(
      resumeText,
      jobDescription,
      matchingResult.matches
    );
    if (experienceScore.hasEvidence) {
      components.push(experienceScore);
    } else {
      blockedScores.push('Experience (no evidence)');
    }

    const quantificationScore = this.scoreQuantification(
      resumeText,
      matchingResult.matches
    );
    if (quantificationScore.hasEvidence) {
      components.push(quantificationScore);
    } else {
      blockedScores.push('Quantified Achievements (no evidence)');
    }

    const keywordScore = this.scoreKeywords(
      resumeText,
      jobDescription,
      matchingResult.matches,
      weights
    );
    if (keywordScore.hasEvidence) {
      components.push(keywordScore);
    } else {
      blockedScores.push('Keywords (no evidence)');
    }

    const formattingScore = this.scoreFormatting(resumeText);
    if (formattingScore.hasEvidence) {
      components.push(formattingScore);
    } else {
      blockedScores.push('Formatting (no evidence)');
    }

    const evidenceSummary = this.calculateEvidenceSummary(components);
    const overall = this.calculateOverallScore(components);
    const grade = this.determineGrade(overall);

    return {
      overall,
      components,
      evidenceSummary,
      blockedScores,
      grade
    };
  }

  private static mapToRoleType(roleType: string): keyof typeof EvidenceLockedScorer.ROLE_WEIGHT_MATRIX {
    if (['backend', 'frontend', 'fullstack', 'mobile'].includes(roleType)) {
      return 'software-dev';
    }
    if (roleType === 'devops') {
      return 'devops-cloud';
    }
    if (roleType === 'data') {
      return 'data-analytics';
    }
    if (roleType === 'ai-ml') {
      return 'ai-ml';
    }
    return 'ops-data-entry';
  }

  private static async scoreTechnicalSkills(
    resume: string,
    jd: string,
    matches: HybridMatch[],
    weights: Record<string, number>
  ): Promise<ScoredComponent> {
    const evidence: EvidenceSource[] = [];
    const technicalMatches = matches.filter(m =>
      m.requirement.category === 'technical' && m.matchType !== 'none'
    );

    let totalWeight = 0;
    let weightedScore = 0;

    technicalMatches.forEach(match => {
      const weight = this.getSkillWeight(match.requirement.keywords, weights);
      totalWeight += weight;
      weightedScore += match.hybridScore * weight;

      evidence.push({
        type: match.matchType === 'semantic' ? 'semantic_match' : 'resume',
        snippet: match.evidence,
        location: match.matchedBullet?.section,
        confidence: match.confidence
      });
    });

    const score = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
    const hasEvidence = evidence.length > 0;

    const explanation = hasEvidence
      ? `Found ${technicalMatches.length} technical skill matches with ${evidence.filter(e => e.type === 'semantic_match').length} semantic matches`
      : 'No technical skills evidence found in resume';

    return {
      name: 'Technical Skills',
      score: Math.round(score),
      maxScore: 100,
      evidence,
      explanation,
      hasEvidence
    };
  }

  private static getSkillWeight(keywords: string[], weights: Record<string, number>): number {
    let maxWeight = 1.0;

    keywords.forEach(keyword => {
      Object.entries(weights).forEach(([skill, weight]) => {
        if (keyword.toLowerCase().includes(skill.toLowerCase())) {
          maxWeight = Math.max(maxWeight, weight);
        }
      });
    });

    return maxWeight;
  }

  private static scoreExperience(
    resume: string,
    jd: string,
    matches: HybridMatch[]
  ): ScoredComponent {
    const evidence: EvidenceSource[] = [];
    const experienceMatches = matches.filter(m =>
      m.requirement.category === 'experience' && m.matchType !== 'none'
    );

    const yearsPattern = /(\d+)\+?\s*(?:years?|yrs?)/gi;
    const jdYears = this.extractYears(jd);
    const resumeYears = this.extractYears(resume);

    if (resumeYears.length > 0) {
      evidence.push({
        type: 'resume',
        snippet: `${resumeYears.length} experience entries with years mentioned`,
        confidence: 0.9
      });
    }

    experienceMatches.forEach(match => {
      evidence.push({
        type: 'resume',
        snippet: match.evidence,
        location: match.matchedBullet?.section,
        confidence: match.confidence
      });
    });

    const score = Math.min(100, (experienceMatches.length / Math.max(1, jdYears.length)) * 100);
    const hasEvidence = evidence.length > 0;

    const explanation = hasEvidence
      ? `Found ${experienceMatches.length} experience matches`
      : 'No experience evidence found';

    return {
      name: 'Experience Match',
      score: Math.round(score),
      maxScore: 100,
      evidence,
      explanation,
      hasEvidence
    };
  }

  private static extractYears(text: string): number[] {
    const years: number[] = [];
    const pattern = /(\d+)\+?\s*(?:years?|yrs?)/gi;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      years.push(parseInt(match[1]));
    }

    return years;
  }

  private static scoreQuantification(
    resume: string,
    matches: HybridMatch[]
  ): ScoredComponent {
    const evidence: EvidenceSource[] = [];
    const metricPattern = /\b(\d+[\d,]*(?:\.\d+)?(?:%|x|K|M|B)?)\b/g;

    const bullets = resume.split(/\n+/).filter(line =>
      /^[•\-–—►▸]\s+/.test(line.trim()) || /^[A-Z][a-z]+ed\s+/.test(line.trim())
    );

    bullets.forEach(bullet => {
      const metrics = bullet.match(metricPattern);
      if (metrics && metrics.length > 0) {
        evidence.push({
          type: 'resume',
          snippet: bullet.trim().substring(0, 100),
          confidence: 0.95
        });
      }
    });

    const score = Math.min(100, (evidence.length / Math.max(bullets.length, 1)) * 200);
    const hasEvidence = evidence.length > 0;

    const explanation = hasEvidence
      ? `Found ${evidence.length} quantified achievements in ${bullets.length} bullets`
      : 'No quantified metrics found in resume';

    return {
      name: 'Quantified Achievements',
      score: Math.round(score),
      maxScore: 100,
      evidence,
      explanation,
      hasEvidence
    };
  }

  private static scoreKeywords(
    resume: string,
    jd: string,
    matches: HybridMatch[],
    weights: Record<string, number>
  ): ScoredComponent {
    const evidence: EvidenceSource[] = [];
    const keywordMatches = matches.filter(m => m.matchType !== 'none');

    const contextValidated = keywordMatches.filter(match => {
      if (!match.matchedBullet) return false;

      const hasActionVerb = /^[A-Z][a-z]+ed\s+/.test(match.matchedBullet.text);
      const hasMetric = /\d+/.test(match.matchedBullet.text);

      return hasActionVerb && match.matchedBullet.text.length > 30;
    });

    contextValidated.forEach(match => {
      const weight = this.getSkillWeight(match.requirement.keywords, weights);
      evidence.push({
        type: match.matchType === 'semantic' ? 'semantic_match' : 'resume',
        snippet: match.evidence,
        location: match.matchedBullet?.section,
        confidence: match.confidence * weight
      });
    });

    const totalPossible = Math.max(1, matches.filter(m => m.requirement.priority === 'must-have').length);
    const score = Math.min(100, (contextValidated.length / totalPossible) * 100);
    const hasEvidence = evidence.length > 0;

    const explanation = hasEvidence
      ? `Found ${contextValidated.length} contextually valid keyword matches`
      : 'No keyword evidence with proper context found';

    return {
      name: 'Keyword Match',
      score: Math.round(score),
      maxScore: 100,
      evidence,
      explanation,
      hasEvidence
    };
  }

  private static scoreFormatting(resume: string): ScoredComponent {
    const evidence: EvidenceSource[] = [];
    let score = 100;

    const hasHeaders = /^[A-Z\s]{3,}$/m.test(resume);
    if (hasHeaders) {
      evidence.push({
        type: 'resume',
        snippet: 'Section headers detected in ALL CAPS format',
        confidence: 1.0
      });
    } else {
      score -= 30;
    }

    const datePattern = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*[-–—]\s*(?:Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})\b/g;
    const dateMatches = resume.match(datePattern);
    if (dateMatches && dateMatches.length > 0) {
      evidence.push({
        type: 'resume',
        snippet: `${dateMatches.length} properly formatted dates found`,
        confidence: 0.95
      });
    } else {
      score -= 20;
    }

    const hasBullets = /^[•\-–—►▸]\s+/m.test(resume);
    if (hasBullets) {
      evidence.push({
        type: 'resume',
        snippet: 'Bullet points detected with consistent formatting',
        confidence: 0.9
      });
    } else {
      score -= 25;
    }

    const hasEvidence = evidence.length > 0;
    const explanation = hasEvidence
      ? `Formatting validated: ${evidence.length} formatting elements found`
      : 'No proper formatting evidence found';

    return {
      name: 'Formatting',
      score: Math.max(0, score),
      maxScore: 100,
      evidence,
      explanation,
      hasEvidence
    };
  }

  private static calculateEvidenceSummary(components: ScoredComponent[]) {
    let totalEvidence = 0;
    let resumeEvidence = 0;
    let jdEvidence = 0;
    let semanticEvidence = 0;

    components.forEach(component => {
      component.evidence.forEach(evidence => {
        totalEvidence++;
        if (evidence.type === 'resume') resumeEvidence++;
        if (evidence.type === 'jd') jdEvidence++;
        if (evidence.type === 'semantic_match') semanticEvidence++;
      });
    });

    return {
      totalEvidence,
      resumeEvidence,
      jdEvidence,
      semanticEvidence
    };
  }

  private static calculateOverallScore(components: ScoredComponent[]): number {
    if (components.length === 0) return 0;

    const totalScore = components.reduce((sum, c) => sum + c.score, 0);
    const totalMax = components.reduce((sum, c) => sum + c.maxScore, 0);

    return Math.round((totalScore / totalMax) * 100);
  }

  private static determineGrade(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  static generateEvidenceReport(result: EvidenceLockedScore): string {
    const report: string[] = [];

    report.push('=== EVIDENCE-LOCKED SCORING REPORT ===');
    report.push(`Overall Score: ${result.overall}/100 (${result.grade.toUpperCase()})`);
    report.push('');

    report.push('EVIDENCE SUMMARY:');
    report.push(`  Total Evidence: ${result.evidenceSummary.totalEvidence}`);
    report.push(`  Resume Evidence: ${result.evidenceSummary.resumeEvidence}`);
    report.push(`  JD Evidence: ${result.evidenceSummary.jdEvidence}`);
    report.push(`  Semantic Matches: ${result.evidenceSummary.semanticEvidence}`);
    report.push('');

    report.push('COMPONENT SCORES:');
    result.components.forEach(component => {
      report.push(`\n${component.name}: ${component.score}/${component.maxScore}`);
      report.push(`  ${component.explanation}`);
      if (component.evidence.length > 0) {
        report.push(`  Evidence (${component.evidence.length} items):`);
        component.evidence.slice(0, 3).forEach((e, i) => {
          report.push(`    ${i + 1}. [${e.type}] ${e.snippet.substring(0, 60)}...`);
        });
      }
    });

    if (result.blockedScores.length > 0) {
      report.push('\n⚠️ BLOCKED SCORES (No Evidence):');
      result.blockedScores.forEach(blocked => {
        report.push(`  - ${blocked}`);
      });
    }

    return report.join('\n');
  }
}

export const evidenceLockedScorer = EvidenceLockedScorer;
