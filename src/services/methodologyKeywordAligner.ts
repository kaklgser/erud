import { ResumeData } from '../types/resume';

export interface MethodologyKeyword {
  keyword: string;
  category: 'dev-process' | 'tools' | 'framework' | 'deployment' | 'quality';
  relatedTerms: string[];
  priority: 'must-have' | 'nice-to-have';
  insertPattern: string;
}

export interface EvidenceResult {
  hasEvidence: boolean;
  evidenceSnippet: string;
  confidence: number;
  relatedTermsFound: string[];
  location: string;
}

export interface InsertionResult {
  inserted: boolean;
  keyword: string;
  location: string;
  beforeText: string;
  afterText: string;
  evidence: string;
  confidence: number;
}

export interface Suggestion {
  keyword: string;
  reason: string;
  suggestedLocation: string;
  exampleText: string;
}

export interface AlignmentResult {
  jdMethodologies: MethodologyKeyword[];
  resumeMethodologies: string[];
  inserted: InsertionResult[];
  suggested: Suggestion[];
  coverageScore: number;
  missingCritical: string[];
}

export class MethodologyKeywordAligner {
  private static readonly METHODOLOGY_DICTIONARY: Record<string, Omit<MethodologyKeyword, 'priority'>> = {
    'Agile': {
      keyword: 'Agile',
      category: 'dev-process',
      relatedTerms: ['sprint', 'scrum', 'standup', 'backlog', 'user stories', 'retrospective', 'iteration'],
      insertPattern: 'following Agile methodologies'
    },
    'SDLC': {
      keyword: 'SDLC',
      category: 'dev-process',
      relatedTerms: ['requirements', 'design', 'development', 'testing', 'deployment', 'maintenance', 'lifecycle'],
      insertPattern: 'throughout SDLC phases'
    },
    'CI/CD': {
      keyword: 'CI/CD',
      category: 'deployment',
      relatedTerms: ['jenkins', 'pipeline', 'automation', 'gitlab', 'github actions', 'continuous integration', 'continuous deployment'],
      insertPattern: 'using CI/CD pipelines'
    },
    'Scrum': {
      keyword: 'Scrum',
      category: 'dev-process',
      relatedTerms: ['sprint planning', 'daily standup', 'retrospective', 'scrum master', 'product owner', 'backlog grooming'],
      insertPattern: 'in Scrum framework'
    },
    'Kanban': {
      keyword: 'Kanban',
      category: 'dev-process',
      relatedTerms: ['kanban board', 'wip limits', 'flow', 'pull system', 'continuous delivery'],
      insertPattern: 'using Kanban methodology'
    },
    'Waterfall': {
      keyword: 'Waterfall',
      category: 'dev-process',
      relatedTerms: ['sequential', 'phases', 'requirements analysis', 'system design', 'implementation'],
      insertPattern: 'following Waterfall model'
    },
    'DevOps': {
      keyword: 'DevOps',
      category: 'deployment',
      relatedTerms: ['infrastructure', 'automation', 'monitoring', 'cloud', 'containerization', 'orchestration'],
      insertPattern: 'implementing DevOps practices'
    },
    'TDD': {
      keyword: 'TDD',
      category: 'quality',
      relatedTerms: ['test-driven', 'unit tests', 'red-green-refactor', 'test coverage', 'automated testing'],
      insertPattern: 'using TDD approach'
    },
    'BDD': {
      keyword: 'BDD',
      category: 'quality',
      relatedTerms: ['behavior-driven', 'cucumber', 'gherkin', 'acceptance tests', 'scenarios'],
      insertPattern: 'following BDD practices'
    },
    'Jira': {
      keyword: 'Jira',
      category: 'tools',
      relatedTerms: ['tickets', 'epics', 'stories', 'bug tracking', 'project management'],
      insertPattern: 'tracked in Jira'
    },
    'Git': {
      keyword: 'Git',
      category: 'tools',
      relatedTerms: ['version control', 'repository', 'branches', 'merge', 'pull request', 'commit'],
      insertPattern: 'using Git version control'
    }
  };

  private static readonly CONFIDENCE_THRESHOLD = 0.6;
  private static readonly MIN_RELATED_TERMS = 2;

  static extractMethodologyKeywords(jd: string): MethodologyKeyword[] {
    const keywords: MethodologyKeyword[] = [];
    const jdLower = jd.toLowerCase();

    for (const [key, config] of Object.entries(this.METHODOLOGY_DICTIONARY)) {
      const keywordLower = key.toLowerCase();

      if (jdLower.includes(keywordLower)) {
        const priority = this.determinePriority(jd, key);
        keywords.push({
          ...config,
          priority
        });
      } else {
        const relatedFound = config.relatedTerms.filter(term =>
          jdLower.includes(term.toLowerCase())
        );

        if (relatedFound.length >= 2) {
          keywords.push({
            ...config,
            priority: 'nice-to-have'
          });
        }
      }
    }

    return keywords;
  }

  private static determinePriority(jd: string, keyword: string): 'must-have' | 'nice-to-have' {
    const jdLower = jd.toLowerCase();
    const keywordLower = keyword.toLowerCase();

    const mustHavePatterns = [
      `must have ${keywordLower}`,
      `required ${keywordLower}`,
      `essential ${keywordLower}`,
      `${keywordLower} experience required`,
      `strong ${keywordLower}`,
      `proficient in ${keywordLower}`
    ];

    return mustHavePatterns.some(pattern => jdLower.includes(pattern))
      ? 'must-have'
      : 'nice-to-have';
  }

  static checkResumeEvidence(resumeText: string, keyword: MethodologyKeyword): EvidenceResult {
    const resumeLower = resumeText.toLowerCase();
    const keywordLower = keyword.keyword.toLowerCase();

    if (resumeLower.includes(keywordLower)) {
      const index = resumeLower.indexOf(keywordLower);
      const snippet = this.extractSnippet(resumeText, index, 100);

      return {
        hasEvidence: true,
        evidenceSnippet: snippet,
        confidence: 1.0,
        relatedTermsFound: [keyword.keyword],
        location: this.findLocation(resumeText, index)
      };
    }

    const relatedFound = keyword.relatedTerms.filter(term =>
      resumeLower.includes(term.toLowerCase())
    );

    if (relatedFound.length >= this.MIN_RELATED_TERMS) {
      const firstTermIndex = resumeLower.indexOf(relatedFound[0].toLowerCase());
      const snippet = this.extractSnippet(resumeText, firstTermIndex, 100);
      const confidence = Math.min(relatedFound.length / keyword.relatedTerms.length, 0.95);

      return {
        hasEvidence: true,
        evidenceSnippet: snippet,
        confidence,
        relatedTermsFound: relatedFound,
        location: this.findLocation(resumeText, firstTermIndex)
      };
    }

    return {
      hasEvidence: false,
      evidenceSnippet: '',
      confidence: 0,
      relatedTermsFound: [],
      location: ''
    };
  }

  private static extractSnippet(text: string, index: number, radius: number): string {
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + radius);
    return text.substring(start, end).trim();
  }

  private static findLocation(text: string, index: number): string {
    const beforeText = text.substring(0, index);
    const lines = beforeText.split('\n');

    const sectionHeaders = ['EXPERIENCE', 'PROJECTS', 'SKILLS', 'WORK EXPERIENCE', 'PROFESSIONAL EXPERIENCE'];

    for (let i = lines.length - 1; i >= 0; i--) {
      const lineTrimmed = lines[i].trim().toUpperCase();
      for (const header of sectionHeaders) {
        if (lineTrimmed.includes(header)) {
          return header;
        }
      }
    }

    return 'GENERAL';
  }

  static insertMethodology(
    resumeData: ResumeData,
    keyword: MethodologyKeyword,
    evidence: EvidenceResult
  ): InsertionResult | null {
    if (!evidence.hasEvidence || evidence.confidence < this.CONFIDENCE_THRESHOLD) {
      return null;
    }

    const insertionPattern = keyword.insertPattern;

    const experienceResult = this.tryInsertInExperience(resumeData, keyword, evidence, insertionPattern);
    if (experienceResult) return experienceResult;

    const projectResult = this.tryInsertInProjects(resumeData, keyword, evidence, insertionPattern);
    if (projectResult) return projectResult;

    const skillsResult = this.tryInsertInSkills(resumeData, keyword);
    if (skillsResult) return skillsResult;

    return null;
  }

  private static tryInsertInExperience(
    resumeData: ResumeData,
    keyword: MethodologyKeyword,
    evidence: EvidenceResult,
    pattern: string
  ): InsertionResult | null {
    const workExperience = resumeData.workExperience || [];

    for (let i = 0; i < workExperience.length; i++) {
      const experience = workExperience[i];
      const bullets = experience.bullets || [];

      for (let j = 0; j < bullets.length; j++) {
        const bullet = bullets[j];
        const bulletLower = bullet.toLowerCase();

        const hasRelated = evidence.relatedTermsFound.some(term =>
          bulletLower.includes(term.toLowerCase())
        );

        if (hasRelated && !bulletLower.includes(keyword.keyword.toLowerCase())) {
          const modifiedBullet = this.insertKeywordInBullet(bullet, pattern);

          if (modifiedBullet !== bullet && modifiedBullet.length <= 120) {
            return {
              inserted: true,
              keyword: keyword.keyword,
              location: `workExperience[${i}].bullets[${j}]`,
              beforeText: bullet,
              afterText: modifiedBullet,
              evidence: evidence.evidenceSnippet,
              confidence: evidence.confidence
            };
          }
        }
      }
    }

    return null;
  }

  private static tryInsertInProjects(
    resumeData: ResumeData,
    keyword: MethodologyKeyword,
    evidence: EvidenceResult,
    pattern: string
  ): InsertionResult | null {
    const projects = resumeData.projects || [];

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const description = project.description || [];

      for (let j = 0; j < description.length; j++) {
        const bullet = description[j];
        const bulletLower = bullet.toLowerCase();

        const hasRelated = evidence.relatedTermsFound.some(term =>
          bulletLower.includes(term.toLowerCase())
        );

        if (hasRelated && !bulletLower.includes(keyword.keyword.toLowerCase())) {
          const modifiedBullet = this.insertKeywordInBullet(bullet, pattern);

          if (modifiedBullet !== bullet && modifiedBullet.length <= 120) {
            return {
              inserted: true,
              keyword: keyword.keyword,
              location: `projects[${i}].description[${j}]`,
              beforeText: bullet,
              afterText: modifiedBullet,
              evidence: evidence.evidenceSnippet,
              confidence: evidence.confidence
            };
          }
        }
      }
    }

    return null;
  }

  private static tryInsertInSkills(
    resumeData: ResumeData,
    keyword: MethodologyKeyword
  ): InsertionResult | null {
    const skills = resumeData.skills || [];

    for (let i = 0; i < skills.length; i++) {
      const skillCategory = skills[i];
      if (skillCategory.category.toLowerCase().includes('method') ||
          skillCategory.category.toLowerCase().includes('process') ||
          skillCategory.category.toLowerCase().includes('tool')) {

        const skillsList = skillCategory.skills || [];
        if (!skillsList.includes(keyword.keyword)) {
          return {
            inserted: true,
            keyword: keyword.keyword,
            location: `skills[${i}].skills[]`,
            beforeText: skillsList.join(', '),
            afterText: [...skillsList, keyword.keyword].join(', '),
            evidence: 'Added to skills section',
            confidence: 0.7
          };
        }
      }
    }

    return null;
  }

  private static insertKeywordInBullet(bullet: string, pattern: string): string {
    const sentences = bullet.split(/\.\s+/);

    if (sentences.length >= 2) {
      return `${sentences[0]} ${pattern}. ${sentences.slice(1).join('. ')}`;
    }

    const insertionPoints = [
      { regex: /,\s+(?:using|with|via|through)/i, prepend: true },
      { regex: /\s+(?:to|for)\s+/i, prepend: false },
      { regex: /,\s*$/i, prepend: false }
    ];

    for (const point of insertionPoints) {
      const match = bullet.match(point.regex);
      if (match && match.index !== undefined) {
        const insertPos = point.prepend ? match.index : match.index + match[0].length;
        return bullet.substring(0, insertPos) + ' ' + pattern + bullet.substring(insertPos);
      }
    }

    if (bullet.endsWith('.')) {
      return bullet.slice(0, -1) + ` ${pattern}.`;
    }

    return `${bullet} ${pattern}`;
  }

  static align(resumeData: ResumeData, jobDescription: string): AlignmentResult {
    const resumeText = JSON.stringify(resumeData);

    const jdMethodologies = this.extractMethodologyKeywords(jobDescription);

    const resumeMethodologies: string[] = [];
    jdMethodologies.forEach(methodology => {
      if (resumeText.toLowerCase().includes(methodology.keyword.toLowerCase())) {
        resumeMethodologies.push(methodology.keyword);
      }
    });

    const inserted: InsertionResult[] = [];
    const suggested: Suggestion[] = [];
    const missingCritical: string[] = [];

    jdMethodologies.forEach(methodology => {
      if (resumeMethodologies.includes(methodology.keyword)) {
        return;
      }

      const evidence = this.checkResumeEvidence(resumeText, methodology);

      if (evidence.hasEvidence && evidence.confidence >= this.CONFIDENCE_THRESHOLD) {
        const insertion = this.insertMethodology(resumeData, methodology, evidence);
        if (insertion) {
          inserted.push(insertion);
        }
      } else {
        const suggestion: Suggestion = {
          keyword: methodology.keyword,
          reason: evidence.relatedTermsFound.length > 0
            ? `Found related terms: ${evidence.relatedTermsFound.join(', ')}`
            : 'No evidence found in resume',
          suggestedLocation: evidence.location || 'Skills section',
          exampleText: `Add "${methodology.insertPattern}" to relevant bullets`
        };
        suggested.push(suggestion);

        if (methodology.priority === 'must-have') {
          missingCritical.push(methodology.keyword);
        }
      }
    });

    const coverageScore = jdMethodologies.length > 0
      ? (resumeMethodologies.length + inserted.length) / jdMethodologies.length
      : 1.0;

    return {
      jdMethodologies,
      resumeMethodologies,
      inserted,
      suggested,
      coverageScore,
      missingCritical
    };
  }

  static applyInsertions(resumeData: ResumeData, alignmentResult: AlignmentResult): ResumeData {
    const modifiedData = JSON.parse(JSON.stringify(resumeData));

    alignmentResult.inserted.forEach(insertion => {
      const pathMatch = insertion.location.match(/(\w+)\[(\d+)\]\.(\w+)\[(\d+)\]/);

      if (pathMatch) {
        const [, section, sectionIndex, bulletKey, bulletIndex] = pathMatch;
        const sectionArray = modifiedData[section as keyof ResumeData] as any[];

        if (sectionArray && sectionArray[parseInt(sectionIndex)]) {
          const item = sectionArray[parseInt(sectionIndex)];
          const bullets = item[bulletKey];

          if (bullets && bullets[parseInt(bulletIndex)] !== undefined) {
            bullets[parseInt(bulletIndex)] = insertion.afterText;
          }
        }
      } else if (insertion.location.includes('skills')) {
        const skillsMatch = insertion.location.match(/skills\[(\d+)\]\.skills\[\]/);
        if (skillsMatch && modifiedData.skills) {
          const skillIndex = parseInt(skillsMatch[1]);
          if (modifiedData.skills[skillIndex]) {
            const currentSkills = modifiedData.skills[skillIndex].skills || [];
            if (!currentSkills.includes(insertion.keyword)) {
              modifiedData.skills[skillIndex].skills = [...currentSkills, insertion.keyword];
            }
          }
        }
      }
    });

    return modifiedData;
  }

  static generateAlignmentReport(result: AlignmentResult): string {
    const report: string[] = [];

    report.push('=== METHODOLOGY KEYWORD ALIGNMENT ===');
    report.push(`JD Methodologies: ${result.jdMethodologies.length}`);
    report.push(`Resume Methodologies: ${result.resumeMethodologies.length}`);
    report.push(`Coverage Score: ${(result.coverageScore * 100).toFixed(1)}%`);
    report.push('');

    if (result.inserted.length > 0) {
      report.push('✅ INSERTED:');
      result.inserted.forEach((insertion, i) => {
        report.push(`\n${i + 1}. ${insertion.keyword}`);
        report.push(`   Location: ${insertion.location}`);
        report.push(`   Confidence: ${(insertion.confidence * 100).toFixed(1)}%`);
        report.push(`   Before: ${insertion.beforeText.substring(0, 60)}...`);
        report.push(`   After: ${insertion.afterText.substring(0, 60)}...`);
      });
      report.push('');
    }

    if (result.suggested.length > 0) {
      report.push('💡 SUGGESTED (if applicable):');
      result.suggested.forEach((suggestion, i) => {
        report.push(`\n${i + 1}. ${suggestion.keyword}`);
        report.push(`   Reason: ${suggestion.reason}`);
        report.push(`   Location: ${suggestion.suggestedLocation}`);
        report.push(`   Example: ${suggestion.exampleText}`);
      });
      report.push('');
    }

    if (result.missingCritical.length > 0) {
      report.push('⚠️ MISSING CRITICAL:');
      result.missingCritical.forEach(keyword => {
        report.push(`  - ${keyword}`);
      });
    }

    return report.join('\n');
  }
}

export const methodologyKeywordAligner = MethodologyKeywordAligner;
