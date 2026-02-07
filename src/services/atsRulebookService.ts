export interface ATSRulebookConfig {
  totalWordCountMin: number;
  totalWordCountMax: number;
  summaryWordCountMin: number;
  summaryWordCountMax: number;
  bulletWordCountMin: number;
  bulletWordCountMax: number;
  minMetricPercentage: number;
  keywordRepetitionMin: number;
  keywordRepetitionMax: number;
}

export interface SectionOrderValidation {
  isValid: boolean;
  expectedOrder: string[];
  actualOrder: string[];
  violations: string[];
}

export interface WordCountValidation {
  isValid: boolean;
  totalWords: number;
  summaryWords: number;
  bulletCounts: { [key: string]: number };
  violations: string[];
}

export interface BulletPatternValidation {
  bulletsAnalyzed: number;
  bulletsWithMetrics: number;
  metricsPercentage: number;
  bulletsWithActionVerbs: number;
  bulletsWithTechSkills: number;
  bulletsMissingPattern: string[];
  isValid: boolean;
}

export interface JobTitleValidation {
  jobTitle: string;
  inHeader: boolean;
  inSummary: boolean;
  inExperience: boolean;
  totalMentions: number;
  isValid: boolean;
}

export interface KeywordFrequencyAnalysis {
  keyword: string;
  frequency: number;
  targetMin: number;
  targetMax: number;
  isOptimal: boolean;
  locations: string[];
}

export interface ATSComplianceResult {
  overallCompliant: boolean;
  complianceScore: number;
  sectionOrder: SectionOrderValidation;
  wordCount: WordCountValidation;
  bulletPattern: BulletPatternValidation;
  jobTitlePlacement: JobTitleValidation;
  keywordFrequencies: KeywordFrequencyAnalysis[];
  recommendations: string[];
}

export class ATSRulebookService {
  private static readonly DEFAULT_CONFIG: ATSRulebookConfig = {
    totalWordCountMin: 400,
    totalWordCountMax: 650,
    summaryWordCountMin: 40,
    summaryWordCountMax: 60,
    bulletWordCountMin: 5,
    bulletWordCountMax: 10,
    minMetricPercentage: 75,
    keywordRepetitionMin: 4,
    keywordRepetitionMax: 6
  };

  private static readonly REQUIRED_SECTION_ORDER = [
    'header',
    'summary',
    'skills',
    'experience',
    'projects',
    'education',
    'certifications'
  ];

  private static readonly ACTION_VERBS = [
    'developed', 'implemented', 'architected', 'optimized', 'engineered',
    'designed', 'led', 'managed', 'created', 'built', 'delivered',
    'achieved', 'increased', 'reduced', 'streamlined', 'automated',
    'transformed', 'executed', 'spearheaded', 'established', 'deployed',
    'migrated', 'scaled', 'improved', 'enhanced', 'integrated'
  ];

  static validateSectionOrder(resumeData: any): SectionOrderValidation {
    const actualOrder: string[] = [];
    const violations: string[] = [];

    if (resumeData.name || resumeData.phone || resumeData.email) {
      actualOrder.push('header');
    }

    if (resumeData.summary || resumeData.careerObjective) {
      actualOrder.push('summary');
    }

    if (resumeData.skills && resumeData.skills.length > 0) {
      actualOrder.push('skills');
    }

    if (resumeData.workExperience && resumeData.workExperience.length > 0) {
      actualOrder.push('experience');
    }

    if (resumeData.projects && resumeData.projects.length > 0) {
      actualOrder.push('projects');
    }

    if (resumeData.education && resumeData.education.length > 0) {
      actualOrder.push('education');
    }

    if (resumeData.certifications && resumeData.certifications.length > 0) {
      actualOrder.push('certifications');
    }

    const expectedSubset = this.REQUIRED_SECTION_ORDER.filter(section =>
      actualOrder.includes(section)
    );

    let isValid = true;
    for (let i = 0; i < actualOrder.length; i++) {
      if (actualOrder[i] !== expectedSubset[i]) {
        isValid = false;
        violations.push(
          `Section '${actualOrder[i]}' at position ${i + 1} should be '${expectedSubset[i]}'`
        );
      }
    }

    if (actualOrder.length < 5) {
      violations.push(`Only ${actualOrder.length} sections present, minimum 5 recommended`);
    }

    return {
      isValid,
      expectedOrder: expectedSubset,
      actualOrder,
      violations
    };
  }

  static validateWordCounts(
    resumeData: any,
    config: Partial<ATSRulebookConfig> = {}
  ): WordCountValidation {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const violations: string[] = [];
    const bulletCounts: { [key: string]: number } = {};

    const totalWords = this.countTotalWords(resumeData);
    const summaryWords = this.countSummaryWords(resumeData);

    if (totalWords < finalConfig.totalWordCountMin) {
      violations.push(
        `Total word count ${totalWords} is below minimum ${finalConfig.totalWordCountMin}`
      );
    }

    if (totalWords > finalConfig.totalWordCountMax) {
      violations.push(
        `Total word count ${totalWords} exceeds maximum ${finalConfig.totalWordCountMax}`
      );
    }

    if (summaryWords < finalConfig.summaryWordCountMin) {
      violations.push(
        `Summary word count ${summaryWords} is below minimum ${finalConfig.summaryWordCountMin}`
      );
    }

    if (summaryWords > finalConfig.summaryWordCountMax) {
      violations.push(
        `Summary word count ${summaryWords} exceeds maximum ${finalConfig.summaryWordCountMax}`
      );
    }

    const allBullets = this.extractAllBullets(resumeData);
    for (const bullet of allBullets) {
      const words = this.countWords(bullet.text);
      bulletCounts[bullet.section] = (bulletCounts[bullet.section] || 0) + 1;

      if (words < finalConfig.bulletWordCountMin || words > finalConfig.bulletWordCountMax) {
        violations.push(
          `${bullet.section} bullet "${bullet.text.substring(0, 30)}..." has ${words} words (target: ${finalConfig.bulletWordCountMin}-${finalConfig.bulletWordCountMax})`
        );
      }
    }

    return {
      isValid: violations.length === 0,
      totalWords,
      summaryWords,
      bulletCounts,
      violations
    };
  }

  static validateBulletPatterns(
    resumeData: any,
    config: Partial<ATSRulebookConfig> = {}
  ): BulletPatternValidation {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const allBullets = this.extractAllBullets(resumeData);

    let bulletsWithMetrics = 0;
    let bulletsWithActionVerbs = 0;
    let bulletsWithTechSkills = 0;
    const bulletsMissingPattern: string[] = [];

    for (const bullet of allBullets) {
      const hasMetric = this.hasMetric(bullet.text);
      const hasActionVerb = this.startsWithActionVerb(bullet.text);
      const hasTechSkill = this.containsTechSkill(bullet.text);

      if (hasMetric) bulletsWithMetrics++;
      if (hasActionVerb) bulletsWithActionVerbs++;
      if (hasTechSkill) bulletsWithTechSkills++;

      if (!hasMetric || !hasActionVerb || !hasTechSkill) {
        bulletsMissingPattern.push(
          `${bullet.section}: "${bullet.text.substring(0, 50)}..." (Missing: ${!hasActionVerb ? 'VERB ' : ''}${!hasTechSkill ? 'TECH ' : ''}${!hasMetric ? 'METRIC' : ''})`
        );
      }
    }

    const metricsPercentage = (bulletsWithMetrics / allBullets.length) * 100;
    const isValid = metricsPercentage >= finalConfig.minMetricPercentage;

    return {
      bulletsAnalyzed: allBullets.length,
      bulletsWithMetrics,
      metricsPercentage,
      bulletsWithActionVerbs,
      bulletsWithTechSkills,
      bulletsMissingPattern,
      isValid
    };
  }

  static validateJobTitlePlacement(
    resumeData: any,
    jobTitle: string
  ): JobTitleValidation {
    const jobTitleLower = jobTitle.toLowerCase();
    let totalMentions = 0;

    const inHeader = this.containsJobTitle(resumeData.targetRole || '', jobTitleLower);
    if (inHeader) totalMentions++;

    const summaryText = resumeData.summary || resumeData.careerObjective || '';
    const inSummary = this.containsJobTitle(summaryText, jobTitleLower);
    if (inSummary) totalMentions++;

    let inExperience = false;
    if (resumeData.workExperience) {
      for (const exp of resumeData.workExperience) {
        const expText = `${exp.role || ''} ${exp.bullets?.join(' ') || ''}`;
        if (this.containsJobTitle(expText, jobTitleLower)) {
          inExperience = true;
          totalMentions++;
          break;
        }
      }
    }

    if (!inExperience && resumeData.projects) {
      for (const project of resumeData.projects) {
        const projectText = `${project.title || ''} ${project.bullets?.join(' ') || ''}`;
        if (this.containsJobTitle(projectText, jobTitleLower)) {
          inExperience = true;
          totalMentions++;
          break;
        }
      }
    }

    const isValid = inHeader && inSummary && totalMentions >= 2;

    return {
      jobTitle,
      inHeader,
      inSummary,
      inExperience,
      totalMentions,
      isValid
    };
  }

  static analyzeKeywordFrequency(
    resumeData: any,
    topKeywords: string[],
    config: Partial<ATSRulebookConfig> = {}
  ): KeywordFrequencyAnalysis[] {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const resumeText = this.extractFullText(resumeData).toLowerCase();
    const results: KeywordFrequencyAnalysis[] = [];

    for (const keyword of topKeywords) {
      const keywordLower = keyword.toLowerCase();
      const regex = new RegExp(`\\b${this.escapeRegex(keywordLower)}\\b`, 'gi');
      const matches = resumeText.match(regex) || [];
      const frequency = matches.length;

      const locations: string[] = [];
      if ((resumeData.summary || resumeData.careerObjective || '').toLowerCase().includes(keywordLower)) {
        locations.push('summary');
      }
      if (resumeData.skills?.some((s: any) => s.list?.join(' ').toLowerCase().includes(keywordLower))) {
        locations.push('skills');
      }
      if (this.sectionContainsKeyword(resumeData.workExperience, keywordLower)) {
        locations.push('experience');
      }
      if (this.sectionContainsKeyword(resumeData.projects, keywordLower)) {
        locations.push('projects');
      }

      const isOptimal = frequency >= finalConfig.keywordRepetitionMin &&
                       frequency <= finalConfig.keywordRepetitionMax;

      results.push({
        keyword,
        frequency,
        targetMin: finalConfig.keywordRepetitionMin,
        targetMax: finalConfig.keywordRepetitionMax,
        isOptimal,
        locations
      });
    }

    return results;
  }

  static validateFullCompliance(
    resumeData: any,
    jobDescription: string,
    topKeywords: string[],
    config: Partial<ATSRulebookConfig> = {}
  ): ATSComplianceResult {
    const jobTitle = this.extractJobTitle(jobDescription);

    const sectionOrder = this.validateSectionOrder(resumeData);
    const wordCount = this.validateWordCounts(resumeData, config);
    const bulletPattern = this.validateBulletPatterns(resumeData, config);
    const jobTitlePlacement = this.validateJobTitlePlacement(resumeData, jobTitle);
    const keywordFrequencies = this.analyzeKeywordFrequency(resumeData, topKeywords, config);

    const scores = {
      sectionOrder: sectionOrder.isValid ? 100 : Math.max(0, 100 - (sectionOrder.violations.length * 15)),
      wordCount: wordCount.isValid ? 100 : Math.max(0, 100 - (wordCount.violations.length * 10)),
      bulletPattern: bulletPattern.isValid ? 100 : Math.round(bulletPattern.metricsPercentage),
      jobTitlePlacement: jobTitlePlacement.isValid ? 100 : (jobTitlePlacement.totalMentions * 33),
      keywordOptimization: Math.round(
        (keywordFrequencies.filter(k => k.isOptimal).length / keywordFrequencies.length) * 100
      )
    };

    const complianceScore = Math.round(
      (scores.sectionOrder * 0.2 +
       scores.wordCount * 0.15 +
       scores.bulletPattern * 0.25 +
       scores.jobTitlePlacement * 0.2 +
       scores.keywordOptimization * 0.2)
    );

    const recommendations: string[] = [];

    if (!sectionOrder.isValid) {
      recommendations.push(`Fix section order: ${sectionOrder.violations.join('; ')}`);
    }

    if (!wordCount.isValid) {
      recommendations.push(`Adjust word counts: ${wordCount.violations.slice(0, 3).join('; ')}`);
    }

    if (bulletPattern.metricsPercentage < 75) {
      recommendations.push(`Add quantifiable metrics to ${Math.ceil((0.75 - bulletPattern.metricsPercentage / 100) * bulletPattern.bulletsAnalyzed)} more bullets`);
    }

    if (!jobTitlePlacement.isValid) {
      recommendations.push(`Add job title "${jobTitle}" to: ${!jobTitlePlacement.inHeader ? 'Header ' : ''}${!jobTitlePlacement.inSummary ? 'Summary ' : ''}${!jobTitlePlacement.inExperience ? 'Experience/Projects' : ''}`);
    }

    const suboptimalKeywords = keywordFrequencies.filter(k => !k.isOptimal);
    if (suboptimalKeywords.length > 0) {
      recommendations.push(`Optimize keyword frequency for: ${suboptimalKeywords.slice(0, 3).map(k => `${k.keyword} (${k.frequency} times)`).join(', ')}`);
    }

    return {
      overallCompliant: complianceScore >= 80,
      complianceScore,
      sectionOrder,
      wordCount,
      bulletPattern,
      jobTitlePlacement,
      keywordFrequencies,
      recommendations
    };
  }

  private static extractJobTitle(jobDescription: string): string {
    const lines = jobDescription.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 100) {
        return firstLine.replace(/^(job title|position|role):\s*/i, '').trim();
      }
    }

    const titlePatterns = [
      /(?:looking for|seeking|hiring)\s+(?:a|an)?\s*([a-z\s]+?)(?:\s+to|\s+who|\s+with|\.)/i,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+[-–—]/,
      /position:\s*([^\n]+)/i
    ];

    for (const pattern of titlePatterns) {
      const match = jobDescription.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return 'Software Engineer';
  }

  private static countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private static countTotalWords(resumeData: any): number {
    const text = this.extractFullText(resumeData);
    return this.countWords(text);
  }

  private static countSummaryWords(resumeData: any): number {
    const summary = resumeData.summary || resumeData.careerObjective || '';
    return this.countWords(summary);
  }

  private static extractFullText(resumeData: any): string {
    const parts: string[] = [];

    if (resumeData.summary) parts.push(resumeData.summary);
    if (resumeData.careerObjective) parts.push(resumeData.careerObjective);

    if (resumeData.workExperience) {
      for (const exp of resumeData.workExperience) {
        if (exp.bullets) parts.push(...exp.bullets);
      }
    }

    if (resumeData.projects) {
      for (const project of resumeData.projects) {
        if (project.bullets) parts.push(...project.bullets);
      }
    }

    return parts.join(' ');
  }

  private static extractAllBullets(resumeData: any): Array<{ section: string; text: string }> {
    const bullets: Array<{ section: string; text: string }> = [];

    if (resumeData.workExperience) {
      for (const exp of resumeData.workExperience) {
        if (exp.bullets) {
          for (const bullet of exp.bullets) {
            bullets.push({ section: 'Experience', text: bullet });
          }
        }
      }
    }

    if (resumeData.projects) {
      for (const project of resumeData.projects) {
        if (project.bullets) {
          for (const bullet of project.bullets) {
            bullets.push({ section: 'Projects', text: bullet });
          }
        }
      }
    }

    return bullets;
  }

  private static hasMetric(text: string): boolean {
    const metricPatterns = [
      /\d+(?:\.\d+)?%/,
      /\d+x/i,
      /\$\d+/,
      /\d+(?:,\d{3})+/,
      /\d+\+/,
      /(?:reduced|increased|improved|grew|achieved|saved)\s+.*?\d+/i
    ];

    return metricPatterns.some(pattern => pattern.test(text));
  }

  private static startsWithActionVerb(text: string): boolean {
    const firstWord = text.trim().split(/\s+/)[0].toLowerCase().replace(/[^\w]/g, '');
    return this.ACTION_VERBS.includes(firstWord);
  }

  private static containsTechSkill(text: string): boolean {
    const techPatterns = [
      /\b(?:java|python|javascript|react|node|angular|vue|spring|django|flask)\b/i,
      /\b(?:aws|azure|gcp|docker|kubernetes|terraform)\b/i,
      /\b(?:sql|mysql|postgresql|mongodb|redis)\b/i,
      /\b(?:rest|api|microservices|ci\/cd|devops)\b/i,
      /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/
    ];

    return techPatterns.some(pattern => pattern.test(text));
  }

  private static containsJobTitle(text: string, jobTitle: string): boolean {
    const textLower = text.toLowerCase();
    const titleWords = jobTitle.toLowerCase().split(/\s+/);

    if (textLower.includes(jobTitle.toLowerCase())) {
      return true;
    }

    const matchedWords = titleWords.filter(word =>
      word.length > 3 && textLower.includes(word)
    );

    return matchedWords.length >= Math.ceil(titleWords.length * 0.7);
  }

  private static sectionContainsKeyword(section: any[] | undefined, keyword: string): boolean {
    if (!section) return false;

    for (const item of section) {
      const text = JSON.stringify(item).toLowerCase();
      if (text.includes(keyword)) {
        return true;
      }
    }

    return false;
  }

  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export const atsRulebookService = ATSRulebookService;
