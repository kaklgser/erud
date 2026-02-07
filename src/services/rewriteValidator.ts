import { semanticMatchingService } from './semanticMatchingService';

export interface RewriteValidationResult {
  isValid: boolean;
  semanticSimilarity: number;
  hasHallucination: boolean;
  hallucinatedTerms: string[];
  metricsPreserved: boolean;
  missingMetrics: string[];
  recommendation: 'accept' | 'retry' | 'reject';
  reason?: string;
  retryAttempt?: number;
  retryPrompt?: string;
}

export interface RetryResult {
  success: boolean;
  finalBullet: string;
  attempts: number;
  validationHistory: RewriteValidationResult[];
  reason: string;
}

export interface ValidationConfig {
  semanticThreshold: number;
  allowHallucination: boolean;
  requireMetricPreservation: boolean;
}

export class RewriteValidator {
  private static readonly DEFAULT_THRESHOLD = 0.70;
  private static readonly MAX_RETRY_ATTEMPTS = 2;
  private static readonly STRICT_RETRY_THRESHOLD = 0.75;
  private static readonly TECHNICAL_TERMS_PATTERNS = [
    /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g,
    /\b[a-z]+\.[a-z]+(?:\.[a-z]+)*\b/gi,
    /\b(?:v|version)\s*\d+(?:\.\d+)*\b/gi,
    /\b\w+\d+\b/g
  ];

  static async validateBulletRewrite(
    originalBullet: string,
    rewrittenBullet: string,
    allowedTerms: Set<string>,
    config: Partial<ValidationConfig> = {}
  ): Promise<RewriteValidationResult> {
    const threshold = config.semanticThreshold || this.DEFAULT_THRESHOLD;

    try {
      await semanticMatchingService.initialize();

      const originalEmbedding = await semanticMatchingService.generateEmbedding(originalBullet);
      const rewrittenEmbedding = await semanticMatchingService.generateEmbedding(rewrittenBullet);

      const semanticSimilarity = semanticMatchingService.cosineSimilarity(
        originalEmbedding,
        rewrittenEmbedding
      );

      const originalMetrics = this.extractMetrics(originalBullet);
      const metricsInRewrite = this.extractMetrics(rewrittenBullet);

      const metricsPreserved = this.validateMetricsPreserved(
        originalMetrics,
        metricsInRewrite
      );

      const missingMetrics = originalMetrics.filter(
        metric => !metricsInRewrite.includes(metric)
      );

      const hallucinationCheck = this.detectHallucination(
        rewrittenBullet,
        allowedTerms
      );

      const hasSemanticIssue = semanticSimilarity < threshold;
      const hasMetricIssue = !metricsPreserved && originalMetrics.length > 0;
      const hasHallucinationIssue = hallucinationCheck.hasHallucination;

      let recommendation: 'accept' | 'retry' | 'reject';
      let reason: string | undefined;

      if (hasHallucinationIssue) {
        recommendation = 'retry';
        reason = `Hallucinated terms detected: ${hallucinationCheck.terms.join(', ')}`;
      } else if (hasSemanticIssue && hasMetricIssue) {
        recommendation = 'retry';
        reason = `Low semantic similarity (${semanticSimilarity.toFixed(2)}) and missing metrics: ${missingMetrics.join(', ')}`;
      } else if (hasSemanticIssue) {
        recommendation = 'retry';
        reason = `Semantic similarity too low: ${semanticSimilarity.toFixed(2)} < ${threshold}`;
      } else if (hasMetricIssue) {
        recommendation = 'retry';
        reason = `Missing metrics: ${missingMetrics.join(', ')}`;
      } else {
        recommendation = 'accept';
      }

      const isValid = recommendation === 'accept';

      return {
        isValid,
        semanticSimilarity,
        hasHallucination: hallucinationCheck.hasHallucination,
        hallucinatedTerms: hallucinationCheck.terms,
        metricsPreserved,
        missingMetrics,
        recommendation,
        reason
      };
    } catch (error) {
      console.error('Error validating rewrite:', error);
      return {
        isValid: false,
        semanticSimilarity: 0,
        hasHallucination: false,
        hallucinatedTerms: [],
        metricsPreserved: false,
        missingMetrics: [],
        recommendation: 'reject',
        reason: 'Validation error occurred'
      };
    }
  }

  static detectHallucination(
    rewrittenText: string,
    allowedTerms: Set<string>
  ): { hasHallucination: boolean; terms: string[] } {
    const rewrittenLower = rewrittenText.toLowerCase();
    const allowedLower = new Set(
      Array.from(allowedTerms).map(term => term.toLowerCase())
    );

    const technicalTerms = this.extractTechnicalTerms(rewrittenText);
    const hallucinatedTerms: string[] = [];

    for (const term of technicalTerms) {
      const termLower = term.toLowerCase();

      const isAllowed = allowedLower.has(termLower);
      const isPartialMatch = Array.from(allowedLower).some(allowed =>
        allowed.includes(termLower) || termLower.includes(allowed)
      );
      const isCommonTerm = this.isCommonTechnicalTerm(termLower);

      if (!isAllowed && !isPartialMatch && !isCommonTerm) {
        hallucinatedTerms.push(term);
      }
    }

    return {
      hasHallucination: hallucinatedTerms.length > 0,
      terms: hallucinatedTerms
    };
  }

  private static extractTechnicalTerms(text: string): string[] {
    const terms = new Set<string>();

    for (const pattern of this.TECHNICAL_TERMS_PATTERNS) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[0].length > 2) {
          terms.add(match[0]);
        }
      }
    }

    const words = text.split(/\s+/);
    for (const word of words) {
      const cleaned = word.replace(/[^\w.-]/g, '');
      if (cleaned.length > 2 && /[A-Z]/.test(cleaned)) {
        terms.add(cleaned);
      }
    }

    return Array.from(terms);
  }

  private static isCommonTechnicalTerm(term: string): boolean {
    const commonTerms = new Set([
      'api', 'ui', 'ux', 'sql', 'rest', 'http', 'https', 'json', 'xml',
      'html', 'css', 'git', 'ci', 'cd', 'aws', 'azure', 'gcp', 'ide',
      'cli', 'sdk', 'framework', 'library', 'database', 'server', 'client',
      'frontend', 'backend', 'fullstack', 'devops', 'agile', 'scrum',
      'tdd', 'bdd', 'mvc', 'mvvm', 'orm', 'crud', 'jwt', 'oauth',
      'saas', 'paas', 'iaas', 'ml', 'ai', 'nlp', 'iot', 'ar', 'vr'
    ]);

    return commonTerms.has(term.toLowerCase());
  }

  static extractMetrics(text: string): string[] {
    const metricPatterns = [
      /\d+(?:\.\d+)?%/g,
      /\d+x(?:\s+faster|\s+more|\s+increase)?/gi,
      /\$\d+(?:,\d{3})*(?:\.\d+)?(?:\s*[KMB])?/gi,
      /\d+(?:,\d{3})+(?:\+)?(?:\s+users?|\s+customers?|\s+clients?|\s+engineers?|\s+developers?|\s+teams?)?/gi,
      /\d+\+(?:\s+\w+)?/g,
      /(?:reduced|increased|improved|grew|achieved|saved|generated)(?:\s+\w+){0,3}\s+(?:by|to|from)\s+\d+/gi,
      /\d+(?:\s+hours?|\s+days?|\s+weeks?|\s+months?|\s+years?)/gi,
      /\d+(?:\s+projects?|\s+features?|\s+applications?|\s+systems?)/gi
    ];

    const metrics = new Set<string>();

    for (const pattern of metricPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        metrics.add(match[0].trim());
      }
    }

    return Array.from(metrics);
  }

  static validateMetricsPreserved(
    originalMetrics: string[],
    rewrittenMetrics: string[]
  ): boolean {
    if (originalMetrics.length === 0) {
      return true;
    }

    const normalizedOriginal = originalMetrics.map(m => this.normalizeMetric(m));
    const normalizedRewritten = rewrittenMetrics.map(m => this.normalizeMetric(m));

    for (const originalMetric of normalizedOriginal) {
      const found = normalizedRewritten.some(rewrittenMetric =>
        this.metricsMatch(originalMetric, rewrittenMetric)
      );

      if (!found) {
        return false;
      }
    }

    return true;
  }

  private static normalizeMetric(metric: string): string {
    return metric
      .toLowerCase()
      .replace(/[,\s]/g, '')
      .replace(/\b(users?|customers?|clients?|engineers?|developers?|teams?|projects?|features?|applications?|systems?)\b/gi, '');
  }

  private static metricsMatch(metric1: string, metric2: string): boolean {
    if (metric1 === metric2) return true;

    const num1 = metric1.match(/\d+(?:\.\d+)?/);
    const num2 = metric2.match(/\d+(?:\.\d+)?/);

    if (num1 && num2) {
      return num1[0] === num2[0];
    }

    return false;
  }

  static async validateMultipleBullets(
    originalBullets: string[],
    rewrittenBullets: string[],
    allowedTerms: Set<string>,
    config: Partial<ValidationConfig> = {}
  ): Promise<Map<number, RewriteValidationResult>> {
    const results = new Map<number, RewriteValidationResult>();

    for (let i = 0; i < Math.min(originalBullets.length, rewrittenBullets.length); i++) {
      const result = await this.validateBulletRewrite(
        originalBullets[i],
        rewrittenBullets[i],
        allowedTerms,
        config
      );
      results.set(i, result);
    }

    return results;
  }

  static generateRetryPrompt(
    validationResult: RewriteValidationResult,
    originalBullet: string
  ): string {
    const issues: string[] = [];

    if (validationResult.hasHallucination) {
      issues.push(`Remove hallucinated terms: ${validationResult.hallucinatedTerms.join(', ')}`);
    }

    if (!validationResult.metricsPreserved && validationResult.missingMetrics.length > 0) {
      issues.push(`MUST preserve these metrics: ${validationResult.missingMetrics.join(', ')}`);
    }

    if (validationResult.semanticSimilarity < 0.70) {
      issues.push('Stay closer to the original meaning and content');
    }

    return `
Original bullet: "${originalBullet}"

CRITICAL ISSUES TO FIX:
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

Requirements:
- Maintain semantic similarity to original
- Preserve ALL numeric metrics exactly
- Only use terms from the job description or original resume
- Use strong action verbs and STAR format
- Keep to 2 sentences maximum

Rewrite this bullet addressing the issues above:
`.trim();
  }

  static createAllowedTermsSet(resumeText: string, jobDescription: string): Set<string> {
    const allText = `${resumeText}\n${jobDescription}`;
    const words = allText
      .toLowerCase()
      .replace(/[^\w\s.-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const technicalTerms = this.extractTechnicalTerms(allText);

    return new Set([...words, ...technicalTerms.map(t => t.toLowerCase())]);
  }

  static getValidationSummary(results: Map<number, RewriteValidationResult>): {
    totalBullets: number;
    validBullets: number;
    needsRetry: number;
    rejected: number;
    averageSemanticSimilarity: number;
    metricsPreservedCount: number;
    hallucinationCount: number;
  } {
    const totalBullets = results.size;
    let validBullets = 0;
    let needsRetry = 0;
    let rejected = 0;
    let totalSimilarity = 0;
    let metricsPreservedCount = 0;
    let hallucinationCount = 0;

    for (const result of results.values()) {
      if (result.recommendation === 'accept') validBullets++;
      if (result.recommendation === 'retry') needsRetry++;
      if (result.recommendation === 'reject') rejected++;
      totalSimilarity += result.semanticSimilarity;
      if (result.metricsPreserved) metricsPreservedCount++;
      if (result.hasHallucination) hallucinationCount++;
    }

    return {
      totalBullets,
      validBullets,
      needsRetry,
      rejected,
      averageSemanticSimilarity: totalBullets > 0 ? totalSimilarity / totalBullets : 0,
      metricsPreservedCount,
      hallucinationCount
    };
  }

  static async validateWithRetry(
    originalBullet: string,
    rewriteFunction: (prompt: string, attempt: number) => Promise<string>,
    allowedTerms: Set<string>,
    config: Partial<ValidationConfig> = {}
  ): Promise<RetryResult> {
    const validationHistory: RewriteValidationResult[] = [];
    let currentBullet = await rewriteFunction('', 0);
    let attempts = 0;

    while (attempts < this.MAX_RETRY_ATTEMPTS) {
      attempts++;

      const validation = await this.validateBulletRewrite(
        originalBullet,
        currentBullet,
        allowedTerms,
        {
          ...config,
          semanticThreshold: attempts > 0 ? this.STRICT_RETRY_THRESHOLD : this.DEFAULT_THRESHOLD
        }
      );

      validation.retryAttempt = attempts;
      validationHistory.push(validation);

      if (validation.recommendation === 'accept') {
        return {
          success: true,
          finalBullet: currentBullet,
          attempts,
          validationHistory,
          reason: 'Validation passed'
        };
      }

      if (validation.recommendation === 'reject') {
        return {
          success: false,
          finalBullet: originalBullet,
          attempts,
          validationHistory,
          reason: validation.reason || 'Validation rejected, using original bullet'
        };
      }

      if (attempts < this.MAX_RETRY_ATTEMPTS) {
        const retryPrompt = this.generateRetryPrompt(validation, originalBullet);
        validation.retryPrompt = retryPrompt;

        currentBullet = await rewriteFunction(retryPrompt, attempts);
      }
    }

    return {
      success: false,
      finalBullet: validationHistory[validationHistory.length - 1].recommendation === 'retry'
        ? currentBullet
        : originalBullet,
      attempts,
      validationHistory,
      reason: `Failed after ${attempts} attempts, using ${validationHistory[validationHistory.length - 1].recommendation === 'retry' ? 'last attempt' : 'original'}`
    };
  }

  static async validateBatch(
    bullets: Array<{ original: string; rewritten: string }>,
    allowedTerms: Set<string>,
    config: Partial<ValidationConfig> = {}
  ): Promise<{
    results: RewriteValidationResult[];
    summary: ReturnType<typeof RewriteValidator.getValidationSummary>;
  }> {
    const results: RewriteValidationResult[] = [];

    for (const { original, rewritten } of bullets) {
      const validation = await this.validateBulletRewrite(
        original,
        rewritten,
        allowedTerms,
        config
      );
      results.push(validation);
    }

    const resultsMap = new Map(results.map((r, i) => [i, r]));
    const summary = this.getValidationSummary(resultsMap);

    return { results, summary };
  }

  static shouldRetry(validation: RewriteValidationResult, attemptNumber: number): boolean {
    if (attemptNumber >= this.MAX_RETRY_ATTEMPTS) {
      return false;
    }

    if (validation.recommendation === 'reject') {
      return false;
    }

    if (validation.recommendation === 'retry') {
      return true;
    }

    return false;
  }
}

export const rewriteValidator = RewriteValidator;
