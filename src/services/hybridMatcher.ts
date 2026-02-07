import { semanticMatchingService } from './semanticMatchingService';

export interface JDRequirement {
  id: string;
  text: string;
  category: 'technical' | 'experience' | 'soft-skill' | 'domain' | 'general';
  keywords: string[];
  priority: 'must-have' | 'nice-to-have';
}

export interface ResumeBullet {
  text: string;
  section: string;
  index: number;
}

export interface HybridMatch {
  requirement: JDRequirement;
  matchedBullet: ResumeBullet | null;
  semanticScore: number;
  literalScore: number;
  hybridScore: number;
  evidence: string;
  matchType: 'semantic' | 'literal' | 'hybrid' | 'none';
  confidence: number;
}

export interface MatchingResult {
  matches: HybridMatch[];
  overallCoverage: number;
  unmatchedRequirements: JDRequirement[];
  matchingSummary: {
    totalRequirements: number;
    matched: number;
    unmatched: number;
    semanticMatches: number;
    literalMatches: number;
    hybridMatches: number;
  };
}

export class HybridMatcher {
  private static readonly SEMANTIC_WEIGHT = 0.6;
  private static readonly LITERAL_WEIGHT = 0.4;
  private static readonly HYBRID_THRESHOLD = 0.65;
  private static readonly SEMANTIC_THRESHOLD = 0.70;
  private static readonly LITERAL_THRESHOLD = 0.5;

  static async matchJDToResume(
    jobDescription: string,
    resumeText: string
  ): Promise<MatchingResult> {
    await semanticMatchingService.initialize();

    const requirements = this.extractRequirements(jobDescription);
    const bullets = this.extractResumeBullets(resumeText);

    const matches: HybridMatch[] = [];

    for (const requirement of requirements) {
      const match = await this.findBestMatch(requirement, bullets);
      matches.push(match);
    }

    const matchingSummary = this.generateSummary(matches);
    const overallCoverage = matchingSummary.matched / matchingSummary.totalRequirements;
    const unmatchedRequirements = matches
      .filter(m => m.matchType === 'none')
      .map(m => m.requirement);

    return {
      matches,
      overallCoverage,
      unmatchedRequirements,
      matchingSummary
    };
  }

  private static extractRequirements(jd: string): JDRequirement[] {
    const requirements: JDRequirement[] = [];
    const lines = jd.split(/\n+/);

    const technicalPatterns = [
      /\b(?:experience|proficiency|knowledge|skills?)\s+(?:in|with|of)\s+(.+)/gi,
      /\b(?:must|should)\s+(?:have|know|understand)\s+(.+)/gi,
      /\b(?:required|preferred)\s*:\s*(.+)/gi,
      /\b(\w+(?:\.\w+|\/\w+)*(?:\s+\d+)?)\s+(?:experience|proficiency|knowledge)/gi
    ];

    const experiencePatterns = [
      /(\d+\+?)\s*(?:years?|yrs?)\s+(?:of\s+)?experience/gi,
      /experience\s+(?:in|with)\s+(.+?)(?:\.|,|\n|$)/gi
    ];

    const softSkillPatterns = [
      /\b(leadership|communication|collaboration|problem[- ]solving|teamwork|adaptability)\b/gi,
      /\b(?:strong|excellent|good)\s+(communication|analytical|interpersonal)\s+skills/gi
    ];

    lines.forEach((line, index) => {
      const lineText = line.trim();
      if (lineText.length < 10) return;

      let category: JDRequirement['category'] = 'general';
      let priority: JDRequirement['priority'] = 'nice-to-have';

      if (/\b(?:must|required|essential|critical)\b/i.test(lineText)) {
        priority = 'must-have';
      }

      const techMatch = technicalPatterns.some(pattern => pattern.test(lineText));
      const expMatch = experiencePatterns.some(pattern => pattern.test(lineText));
      const softMatch = softSkillPatterns.some(pattern => pattern.test(lineText));

      if (techMatch) {
        category = 'technical';
      } else if (expMatch) {
        category = 'experience';
      } else if (softMatch) {
        category = 'soft-skill';
      }

      const keywords = this.extractKeywords(lineText);

      if (keywords.length > 0 || lineText.length > 20) {
        requirements.push({
          id: `req-${index}`,
          text: lineText,
          category,
          keywords,
          priority
        });
      }
    });

    return requirements.slice(0, 50);
  }

  private static extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const techKeywords = [
      'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue', 'node.js',
      'express', 'django', 'flask', 'spring', 'aws', 'azure', 'gcp', 'docker', 'kubernetes',
      'postgresql', 'mongodb', 'mysql', 'redis', 'kafka', 'rabbitmq', 'microservices',
      'rest', 'graphql', 'api', 'ci/cd', 'jenkins', 'git', 'agile', 'scrum'
    ];

    const textLower = text.toLowerCase();
    techKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        keywords.push(keyword);
      }
    });

    const words = text.match(/\b[A-Za-z][A-Za-z0-9.+#-]*\b/g) || [];
    words.forEach(word => {
      if (word.length >= 4 && /^[A-Z]/.test(word) && !keywords.includes(word.toLowerCase())) {
        keywords.push(word);
      }
    });

    return [...new Set(keywords)].slice(0, 10);
  }

  private static extractResumeBullets(resumeText: string): ResumeBullet[] {
    const bullets: ResumeBullet[] = [];
    const lines = resumeText.split(/\n+/);

    let currentSection = 'general';
    let bulletIndex = 0;

    lines.forEach(line => {
      const trimmed = line.trim();

      if (/^[A-Z\s]{3,}$/.test(trimmed) && trimmed.length < 50) {
        currentSection = trimmed.toLowerCase();
        return;
      }

      if (/^[•\-–—►▸]\s+/.test(trimmed) || /^[A-Z][a-z]+ed\s+/.test(trimmed)) {
        bullets.push({
          text: trimmed.replace(/^[•\-–—►▸]\s+/, ''),
          section: currentSection,
          index: bulletIndex++
        });
      } else if (trimmed.length > 30 && /[a-z]/.test(trimmed)) {
        bullets.push({
          text: trimmed,
          section: currentSection,
          index: bulletIndex++
        });
      }
    });

    return bullets;
  }

  private static async findBestMatch(
    requirement: JDRequirement,
    bullets: ResumeBullet[]
  ): Promise<HybridMatch> {
    let bestMatch: HybridMatch = {
      requirement,
      matchedBullet: null,
      semanticScore: 0,
      literalScore: 0,
      hybridScore: 0,
      evidence: '',
      matchType: 'none',
      confidence: 0
    };

    for (const bullet of bullets) {
      const semanticScore = await this.calculateSemanticScore(requirement.text, bullet.text);
      const literalScore = this.calculateLiteralScore(requirement.keywords, bullet.text);
      const hybridScore = (semanticScore * this.SEMANTIC_WEIGHT) + (literalScore * this.LITERAL_WEIGHT);

      if (hybridScore > bestMatch.hybridScore) {
        const matchType = this.determineMatchType(semanticScore, literalScore, hybridScore);

        bestMatch = {
          requirement,
          matchedBullet: bullet,
          semanticScore,
          literalScore,
          hybridScore,
          evidence: bullet.text,
          matchType,
          confidence: hybridScore
        };
      }
    }

    return bestMatch;
  }

  private static async calculateSemanticScore(reqText: string, bulletText: string): Promise<number> {
    try {
      const reqEmbedding = await semanticMatchingService.generateEmbedding(reqText);
      const bulletEmbedding = await semanticMatchingService.generateEmbedding(bulletText);
      const similarity = semanticMatchingService.cosineSimilarity(reqEmbedding, bulletEmbedding);
      return Math.max(0, Math.min(1, similarity));
    } catch (error) {
      console.error('Semantic score calculation error:', error);
      return 0;
    }
  }

  private static calculateLiteralScore(keywords: string[], bulletText: string): number {
    if (keywords.length === 0) return 0;

    const bulletLower = bulletText.toLowerCase();
    let matchCount = 0;

    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (bulletLower.includes(keywordLower)) {
        matchCount++;
      }
    });

    return matchCount / keywords.length;
  }

  private static determineMatchType(
    semanticScore: number,
    literalScore: number,
    hybridScore: number
  ): 'semantic' | 'literal' | 'hybrid' | 'none' {
    if (hybridScore < this.HYBRID_THRESHOLD) {
      return 'none';
    }

    if (semanticScore >= this.SEMANTIC_THRESHOLD && literalScore < this.LITERAL_THRESHOLD) {
      return 'semantic';
    }

    if (literalScore >= this.LITERAL_THRESHOLD && semanticScore < this.SEMANTIC_THRESHOLD) {
      return 'literal';
    }

    if (semanticScore >= this.SEMANTIC_THRESHOLD && literalScore >= this.LITERAL_THRESHOLD) {
      return 'hybrid';
    }

    return 'none';
  }

  private static generateSummary(matches: HybridMatch[]) {
    const totalRequirements = matches.length;
    const matched = matches.filter(m => m.matchType !== 'none').length;
    const unmatched = totalRequirements - matched;
    const semanticMatches = matches.filter(m => m.matchType === 'semantic').length;
    const literalMatches = matches.filter(m => m.matchType === 'literal').length;
    const hybridMatches = matches.filter(m => m.matchType === 'hybrid').length;

    return {
      totalRequirements,
      matched,
      unmatched,
      semanticMatches,
      literalMatches,
      hybridMatches
    };
  }

  static generateMatchReport(result: MatchingResult): string {
    const report: string[] = [];

    report.push('=== HYBRID MATCHING REPORT ===');
    report.push(`Coverage: ${(result.overallCoverage * 100).toFixed(1)}%`);
    report.push('');

    report.push('SUMMARY:');
    report.push(`  Total Requirements: ${result.matchingSummary.totalRequirements}`);
    report.push(`  Matched: ${result.matchingSummary.matched}`);
    report.push(`  Unmatched: ${result.matchingSummary.unmatched}`);
    report.push(`  Semantic Matches: ${result.matchingSummary.semanticMatches}`);
    report.push(`  Literal Matches: ${result.matchingSummary.literalMatches}`);
    report.push(`  Hybrid Matches: ${result.matchingSummary.hybridMatches}`);
    report.push('');

    if (result.matches.length > 0) {
      report.push('TOP MATCHES:');
      result.matches
        .filter(m => m.matchType !== 'none')
        .sort((a, b) => b.hybridScore - a.hybridScore)
        .slice(0, 10)
        .forEach((match, i) => {
          report.push(`\n${i + 1}. [${match.matchType.toUpperCase()}] ${match.requirement.text.substring(0, 60)}...`);
          report.push(`   Hybrid: ${(match.hybridScore * 100).toFixed(1)}% | Semantic: ${(match.semanticScore * 100).toFixed(1)}% | Literal: ${(match.literalScore * 100).toFixed(1)}%`);
          report.push(`   Evidence: ${match.evidence.substring(0, 80)}...`);
        });
    }

    if (result.unmatchedRequirements.length > 0) {
      report.push('\n\nUNMATCHED REQUIREMENTS:');
      result.unmatchedRequirements.slice(0, 5).forEach((req, i) => {
        report.push(`  ${i + 1}. ${req.text.substring(0, 80)}...`);
      });
    }

    return report.join('\n');
  }

  static getRequirementMatchPairs(result: MatchingResult): Array<{
    requirement: string;
    bullet: string | null;
    score: number;
    evidence: string;
  }> {
    return result.matches
      .filter(m => m.matchType !== 'none')
      .map(match => ({
        requirement: match.requirement.text,
        bullet: match.matchedBullet?.text || null,
        score: match.hybridScore,
        evidence: match.evidence
      }));
  }

  static identifySkillGaps(result: MatchingResult): {
    criticalGaps: JDRequirement[];
    niceToHaveGaps: JDRequirement[];
    gapPercentage: number;
  } {
    const criticalGaps = result.unmatchedRequirements.filter(r => r.priority === 'must-have');
    const niceToHaveGaps = result.unmatchedRequirements.filter(r => r.priority === 'nice-to-have');
    const totalMustHave = result.matches.filter(m => m.requirement.priority === 'must-have').length;
    const gapPercentage = totalMustHave > 0 ? (criticalGaps.length / totalMustHave) : 0;

    return {
      criticalGaps,
      niceToHaveGaps,
      gapPercentage
    };
  }
}

export const hybridMatcher = HybridMatcher;
