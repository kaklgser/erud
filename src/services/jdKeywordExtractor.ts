export interface ExtractedKeyword {
  keyword: string;
  category: 'technical_skill' | 'framework' | 'tool' | 'domain' | 'methodology' | 'soft_skill';
  importance: 'critical' | 'high' | 'medium' | 'low';
  context: string[];
}

export interface JDAnalysisResult {
  jobTitle: string;
  topTechnicalSkills: string[];
  frameworks: string[];
  databases: string[];
  cloudTools: string[];
  devopsTools: string[];
  domainKeywords: string[];
  architectureTerms: string[];
  allKeywords: ExtractedKeyword[];
  requiredSkillsCount: number;
  seniority: 'intern' | 'junior' | 'mid' | 'senior' | 'lead';
}

export class JDKeywordExtractor {
  private static readonly TECHNICAL_SKILLS = [
    'java', 'python', 'javascript', 'typescript', 'c\\+\\+', 'c#', 'go', 'rust', 'ruby', 'php',
    'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'html', 'css', 'sql'
  ];

  private static readonly FRAMEWORKS = [
    'react', 'angular', 'vue', 'svelte', 'next\\.js', 'nuxt', 'gatsby',
    'redux', 'mobx', 'zustand', 'recoil', 'context api',
    'spring boot', 'spring', 'django', 'flask', 'fastapi', 'express', 'nestjs',
    'laravel', 'rails', 'asp\\.net', '\\.net core', 'tensorflow', 'pytorch',
    'scikit-learn', 'pandas', 'numpy', 'hadoop', 'spark',
    'jest', 'mocha', 'cypress', 'playwright', 'react testing library', 'vitest',
    'webpack', 'vite', 'rollup', 'parcel', 'esbuild', 'babel',
    'tailwind', 'bootstrap', 'material ui', 'chakra ui', 'ant design',
    'sass', 'scss', 'less', 'styled-components', 'emotion'
  ];

  private static readonly DATABASES = [
    'mysql', 'postgresql', 'mongodb', 'redis', 'cassandra', 'dynamodb',
    'elasticsearch', 'oracle', 'sql server', 'mariadb', 'couchdb', 'neo4j'
  ];

  private static readonly CLOUD_PLATFORMS = [
    'aws', 'azure', 'gcp', 'google cloud', 'amazon web services', 'microsoft azure',
    'ec2', 's3', 'lambda', 'rds', 'eks', 'ecs', 'cloudformation',
    'azure functions', 'app service', 'blob storage',
    'compute engine', 'cloud run', 'cloud functions', 'gke'
  ];

  private static readonly DEVOPS_TOOLS = [
    'docker', 'kubernetes', 'jenkins', 'gitlab ci', 'github actions',
    'terraform', 'ansible', 'puppet', 'chef', 'circleci', 'travis ci',
    'helm', 'prometheus', 'grafana', 'elk', 'datadog', 'new relic'
  ];

  private static readonly ARCHITECTURE_TERMS = [
    'microservices', 'rest api', 'restful', 'graphql', 'grpc',
    'event-driven', 'message queue', 'kafka', 'rabbitmq', 'pub/sub',
    'api gateway', 'load balancer', 'caching', 'cdn',
    'serverless', 'containers', 'orchestration', 'ci/cd',
    'scalability', 'high availability', 'fault tolerance',
    'authentication', 'authorization', 'oauth', 'jwt', 'saml'
  ];

  private static readonly DOMAIN_KEYWORDS = [
    'fintech', 'healthcare', 'e-commerce', 'saas', 'edtech',
    'payment', 'trading', 'banking', 'insurance', 'blockchain',
    'machine learning', 'artificial intelligence', 'nlp', 'computer vision',
    'data science', 'analytics', 'big data', 'iot'
  ];

  private static readonly SOFT_SKILLS = [
    'leadership', 'communication', 'collaboration', 'problem solving',
    'analytical', 'teamwork', 'agile', 'scrum', 'mentoring',
    'cross-functional', 'stakeholder management'
  ];

  static extractJobTitle(jdText: string): string {
    const lines = jdText.split('\n').filter(l => l.trim());

    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 100 && !firstLine.includes('.')) {
        return firstLine
          .replace(/^(job title|position|role|hiring for):\s*/i, '')
          .replace(/\s*[-–—]\s*.*$/, '')
          .trim();
      }
    }

    const titlePatterns = [
      /(?:position|role|job):\s*([^\n]+)/i,
      /(?:looking for|seeking|hiring)\s+(?:a|an)?\s*([a-z\s]+(?:engineer|developer|architect|manager|analyst|designer))/i,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Engineer|Developer|Architect|Manager|Analyst|Designer))/m
    ];

    for (const pattern of titlePatterns) {
      const match = jdText.match(pattern);
      if (match && match[1]) {
        return match[1].trim().split(/\s*[-–—]\s*/)[0].trim();
      }
    }

    return 'Software Engineer';
  }

  static extractTopSkills(jdText: string, count: number = 10): string[] {
    const jdLower = jdText.toLowerCase();
    const skillFrequency = new Map<string, number>();

    const allSkillPatterns = [
      ...this.TECHNICAL_SKILLS,
      ...this.FRAMEWORKS,
      ...this.DATABASES,
      ...this.CLOUD_PLATFORMS,
      ...this.DEVOPS_TOOLS
    ];

    for (const skill of allSkillPatterns) {
      const regex = new RegExp(`\\b${skill}\\b`, 'gi');
      const matches = jdLower.match(regex);
      if (matches) {
        const normalizedSkill = skill.replace(/\\b|\\\./g, '');
        skillFrequency.set(normalizedSkill, matches.length);
      }
    }

    const sorted = Array.from(skillFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count);

    return sorted.map(([skill]) => this.capitalizeSkill(skill));
  }

  static determineSkillCategory(keyword: string): ExtractedKeyword['category'] {
    const keywordLower = keyword.toLowerCase();

    if (this.TECHNICAL_SKILLS.some(s => keywordLower.includes(s.replace(/\\b|\\\+/g, '')))) {
      return 'technical_skill';
    }

    if (this.FRAMEWORKS.some(f => keywordLower.includes(f.replace(/\\b|\\\./g, '')))) {
      return 'framework';
    }

    if (this.DEVOPS_TOOLS.some(t => keywordLower.includes(t))) {
      return 'tool';
    }

    if (this.DOMAIN_KEYWORDS.some(d => keywordLower.includes(d))) {
      return 'domain';
    }

    if (this.ARCHITECTURE_TERMS.some(a => keywordLower.includes(a))) {
      return 'methodology';
    }

    return 'soft_skill';
  }

  static determineImportance(
    keyword: string,
    frequency: number,
    jdText: string
  ): ExtractedKeyword['importance'] {
    const jdLower = jdText.toLowerCase();
    const keywordLower = keyword.toLowerCase();

    const criticalPatterns = [
      /(?:required|must have|essential|critical|mandatory)[\s\S]{0,100}/i,
      /(?:minimum|at least)[\s\S]{0,50}(?:years?|experience)/i
    ];

    const highPatterns = [
      /(?:strong|proficient|expert|experienced|advanced)[\s\S]{0,50}/i,
      /(?:preferred|nice to have|desired)[\s\S]{0,100}/i
    ];

    const contextWindow = 150;
    const keywordIndex = jdLower.indexOf(keywordLower);

    if (keywordIndex !== -1) {
      const contextStart = Math.max(0, keywordIndex - contextWindow);
      const contextEnd = Math.min(jdLower.length, keywordIndex + keywordLower.length + contextWindow);
      const context = jdLower.substring(contextStart, contextEnd);

      for (const pattern of criticalPatterns) {
        if (pattern.test(context)) {
          return 'critical';
        }
      }

      for (const pattern of highPatterns) {
        if (pattern.test(context)) {
          return 'high';
        }
      }
    }

    if (frequency >= 5) return 'critical';
    if (frequency >= 3) return 'high';
    if (frequency >= 2) return 'medium';
    return 'low';
  }

  static determineSeniority(jdText: string): JDAnalysisResult['seniority'] {
    const jdLower = jdText.toLowerCase();

    if (/\b(senior|lead|principal|staff|architect)\b/i.test(jdLower)) {
      return 'senior';
    }

    if (/\b(mid[\s-]?level|intermediate|3[\s-]5\s+years?)\b/i.test(jdLower)) {
      return 'mid';
    }

    if (/\b(junior|entry[\s-]?level|1[\s-]2\s+years?|graduate)\b/i.test(jdLower)) {
      return 'junior';
    }

    if (/\b(intern|internship|co[\s-]?op|trainee)\b/i.test(jdLower)) {
      return 'intern';
    }

    if (/\b(director|vp|cto|head of|10\+\s+years?)\b/i.test(jdLower)) {
      return 'lead';
    }

    return 'mid';
  }

  static extractContextForKeyword(jdText: string, keyword: string): string[] {
    const contexts: string[] = [];
    const sentences = jdText.split(/[.!?]+/);
    const keywordLower = keyword.toLowerCase();

    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(keywordLower)) {
        contexts.push(sentence.trim());
        if (contexts.length >= 3) break;
      }
    }

    return contexts;
  }

  static analyzeJobDescription(jdText: string): JDAnalysisResult {
    const jobTitle = this.extractJobTitle(jdText);
    const jdLower = jdText.toLowerCase();
    const allKeywords: ExtractedKeyword[] = [];

    const extractKeywordsByPattern = (
      patterns: string[],
      category: ExtractedKeyword['category']
    ): string[] => {
      const found: string[] = [];

      for (const pattern of patterns) {
        const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
        const matches = jdLower.match(regex);

        if (matches) {
          const normalized = pattern.replace(/\\b|\\\.|\\\/|\\\+/g, '');
          const capitalized = this.capitalizeSkill(normalized);

          if (!found.includes(capitalized)) {
            found.push(capitalized);

            const frequency = matches.length;
            const importance = this.determineImportance(capitalized, frequency, jdText);
            const context = this.extractContextForKeyword(jdText, normalized);

            allKeywords.push({
              keyword: capitalized,
              category,
              importance,
              context
            });
          }
        }
      }

      return found;
    };

    const topTechnicalSkills = extractKeywordsByPattern(this.TECHNICAL_SKILLS, 'technical_skill');
    const frameworks = extractKeywordsByPattern(this.FRAMEWORKS, 'framework');
    const databases = extractKeywordsByPattern(this.DATABASES, 'technical_skill');
    const cloudTools = extractKeywordsByPattern(this.CLOUD_PLATFORMS, 'tool');
    const devopsTools = extractKeywordsByPattern(this.DEVOPS_TOOLS, 'tool');
    const architectureTerms = extractKeywordsByPattern(this.ARCHITECTURE_TERMS, 'methodology');
    const domainKeywords = extractKeywordsByPattern(this.DOMAIN_KEYWORDS, 'domain');

    const criticalKeywords = allKeywords.filter(k => k.importance === 'critical');
    const topSkillsWithFrequency = this.extractTopSkills(jdText, 10);

    const finalTopSkills = [
      ...new Set([
        ...criticalKeywords.slice(0, 5).map(k => k.keyword),
        ...topSkillsWithFrequency.slice(0, 10)
      ])
    ].slice(0, 10);

    const seniority = this.determineSeniority(jdText);

    return {
      jobTitle,
      topTechnicalSkills: finalTopSkills,
      frameworks,
      databases,
      cloudTools,
      devopsTools,
      domainKeywords,
      architectureTerms,
      allKeywords: allKeywords.sort((a, b) => {
        const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return importanceOrder[a.importance] - importanceOrder[b.importance];
      }),
      requiredSkillsCount: allKeywords.filter(k => k.importance === 'critical').length,
      seniority
    };
  }

  static generateKeywordInsertionMap(
    jdAnalysis: JDAnalysisResult,
    resumeText: string
  ): Map<string, string[]> {
    const map = new Map<string, string[]>();
    const resumeLower = resumeText.toLowerCase();

    const sections = [
      'backend',
      'frontend',
      'database',
      'cloud',
      'devops',
      'architecture',
      'general'
    ];

    for (const section of sections) {
      const relevantKeywords: string[] = [];

      for (const keyword of jdAnalysis.allKeywords) {
        if (keyword.importance === 'low') continue;

        const keywordLower = keyword.keyword.toLowerCase();
        const alreadyInResume = resumeLower.includes(keywordLower);

        if (alreadyInResume) continue;

        const shouldAdd = this.keywordMatchesSection(keyword, section);

        if (shouldAdd) {
          relevantKeywords.push(keyword.keyword);
        }
      }

      if (relevantKeywords.length > 0) {
        map.set(section, relevantKeywords.slice(0, 5));
      }
    }

    return map;
  }

  private static keywordMatchesSection(keyword: ExtractedKeyword, section: string): boolean {
    const keywordLower = keyword.keyword.toLowerCase();

    switch (section) {
      case 'backend':
        return /java|python|node|spring|django|flask|express|api|microservices/.test(keywordLower);
      case 'frontend':
        return /react|angular|vue|javascript|typescript|html|css/.test(keywordLower);
      case 'database':
        return /sql|mysql|postgresql|mongodb|redis|database/.test(keywordLower);
      case 'cloud':
        return /aws|azure|gcp|cloud|s3|lambda|ec2/.test(keywordLower);
      case 'devops':
        return /docker|kubernetes|jenkins|ci\/cd|terraform|ansible/.test(keywordLower);
      case 'architecture':
        return /microservices|rest|graphql|event-driven|scalability/.test(keywordLower);
      default:
        return true;
    }
  }

  private static capitalizeSkill(skill: string): string {
    const specialCases: { [key: string]: string } = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'nodejs': 'Node.js',
      'nextjs': 'Next.js',
      'nestjs': 'NestJS',
      'mongodb': 'MongoDB',
      'postgresql': 'PostgreSQL',
      'mysql': 'MySQL',
      'graphql': 'GraphQL',
      'aws': 'AWS',
      'gcp': 'GCP',
      'html': 'HTML',
      'css': 'CSS',
      'sql': 'SQL',
      'restful': 'RESTful',
      'api': 'API',
      'cicd': 'CI/CD',
      'devops': 'DevOps',
      'oauth': 'OAuth',
      'jwt': 'JWT',
      'iot': 'IoT',
      'nlp': 'NLP',
      'ml': 'ML',
      'ai': 'AI'
    };

    const normalized = skill.toLowerCase().replace(/\s+/g, '');

    if (specialCases[normalized]) {
      return specialCases[normalized];
    }

    return skill
      .split(/[\s-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

export const jdKeywordExtractor = JDKeywordExtractor;
