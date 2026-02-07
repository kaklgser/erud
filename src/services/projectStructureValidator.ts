export interface ProjectValidationResult {
  isCompliant: boolean;
  projectTitle: string;
  hasProblemStatement: boolean;
  hasImpactBullets: boolean;
  hasTechUsedLine: boolean;
  impactBulletsCount: number;
  techStackComplete: boolean;
  missingComponents: string[];
  recommendations: string[];
  score: number;
}

export interface TechStackAnalysis {
  languages: string[];
  frameworks: string[];
  databases: string[];
  infrastructure: string[];
  architectureTerms: string[];
  isComplete: boolean;
  missingCategories: string[];
}

export interface ProjectStructureRequirements {
  requireProblemStatement: boolean;
  minImpactBullets: number;
  maxImpactBullets: number;
  requireTechUsedLine: boolean;
  requiredTechCategories: string[];
}

export class ProjectStructureValidator {
  private static readonly DEFAULT_REQUIREMENTS: ProjectStructureRequirements = {
    requireProblemStatement: true,
    minImpactBullets: 2,
    maxImpactBullets: 3,
    requireTechUsedLine: true,
    requiredTechCategories: ['languages', 'frameworks', 'infrastructure']
  };

  private static readonly ACTION_VERBS = [
    'built', 'developed', 'implemented', 'created', 'designed', 'architected',
    'optimized', 'engineered', 'deployed', 'integrated', 'migrated', 'scaled'
  ];

  private static readonly TECH_KEYWORDS = {
    languages: [
      'java', 'python', 'javascript', 'typescript', 'go', 'rust', 'c\\+\\+', 'c#',
      'ruby', 'php', 'swift', 'kotlin', 'scala'
    ],
    frameworks: [
      'react', 'angular', 'vue', 'next\\.js', 'express', 'nestjs', 'spring boot',
      'spring', 'django', 'flask', 'fastapi', 'laravel', 'rails', '\\.net'
    ],
    databases: [
      'mysql', 'postgresql', 'mongodb', 'redis', 'cassandra', 'dynamodb',
      'elasticsearch', 'sql server', 'oracle'
    ],
    infrastructure: [
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins',
      'github actions', 'gitlab ci', 'ec2', 's3', 'lambda', 'cloudformation'
    ],
    architecture: [
      'microservices', 'rest api', 'restful', 'graphql', 'event-driven',
      'kafka', 'rabbitmq', 'api gateway', 'load balancer', 'caching', 'cdn'
    ]
  };

  static validateProject(
    projectTitle: string,
    projectBullets: string[],
    requirements: Partial<ProjectStructureRequirements> = {}
  ): ProjectValidationResult {
    const config = { ...this.DEFAULT_REQUIREMENTS, ...requirements };
    const missingComponents: string[] = [];
    const recommendations: string[] = [];

    const hasProblemStatement = this.detectProblemStatement(projectBullets);
    if (config.requireProblemStatement && !hasProblemStatement) {
      missingComponents.push('Problem statement or context');
      recommendations.push('Add a one-line problem statement at the beginning');
    }

    const impactBullets = this.filterImpactBullets(projectBullets);
    const impactBulletsCount = impactBullets.length;
    const hasImpactBullets = impactBulletsCount >= config.minImpactBullets;

    if (!hasImpactBullets) {
      missingComponents.push(`Impact bullets (need ${config.minImpactBullets - impactBulletsCount} more)`);
      recommendations.push(
        `Add ${config.minImpactBullets - impactBulletsCount} more bullet(s) with VERB + TECH + IMPACT + METRIC pattern`
      );
    }

    if (impactBulletsCount > config.maxImpactBullets) {
      recommendations.push(
        `Reduce to ${config.maxImpactBullets} bullets maximum (currently ${impactBulletsCount})`
      );
    }

    const techUsedLine = this.findTechUsedLine(projectBullets);
    const hasTechUsedLine = techUsedLine !== null;

    if (config.requireTechUsedLine && !hasTechUsedLine) {
      missingComponents.push('Tech Used line');
      recommendations.push('Add a "Tech Used:" bullet listing all technologies');
    }

    const techStackAnalysis = this.analyzeTechStack(projectBullets, techUsedLine);
    const techStackComplete = this.isTechStackComplete(
      techStackAnalysis,
      config.requiredTechCategories
    );

    if (!techStackComplete) {
      missingComponents.push(`Tech stack categories: ${techStackAnalysis.missingCategories.join(', ')}`);
      recommendations.push(
        `Include technologies from: ${techStackAnalysis.missingCategories.join(', ')}`
      );
    }

    let score = 100;

    if (!hasProblemStatement && config.requireProblemStatement) score -= 15;
    if (!hasImpactBullets) score -= 25;
    if (!hasTechUsedLine && config.requireTechUsedLine) score -= 20;
    if (!techStackComplete) score -= 15;
    if (impactBulletsCount > config.maxImpactBullets) score -= 10;

    const isCompliant = score >= 80;

    return {
      isCompliant,
      projectTitle,
      hasProblemStatement,
      hasImpactBullets,
      hasTechUsedLine,
      impactBulletsCount,
      techStackComplete,
      missingComponents,
      recommendations,
      score: Math.max(0, score)
    };
  }

  static validateMultipleProjects(
    projects: Array<{ title: string; bullets: string[] }>,
    requirements: Partial<ProjectStructureRequirements> = {}
  ): {
    results: ProjectValidationResult[];
    overallCompliant: boolean;
    averageScore: number;
    nonCompliantProjects: string[];
  } {
    const results = projects.map(project =>
      this.validateProject(project.title, project.bullets, requirements)
    );

    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const overallCompliant = results.every(r => r.isCompliant);
    const nonCompliantProjects = results
      .filter(r => !r.isCompliant)
      .map(r => r.projectTitle);

    return {
      results,
      overallCompliant,
      averageScore,
      nonCompliantProjects
    };
  }

  static generateTechUsedLine(projectBullets: string[]): string {
    const techStack = this.analyzeTechStack(projectBullets, null);

    const parts: string[] = [];

    if (techStack.languages.length > 0) {
      parts.push(techStack.languages.join(', '));
    }

    if (techStack.frameworks.length > 0) {
      parts.push(techStack.frameworks.join(', '));
    }

    if (techStack.databases.length > 0) {
      parts.push(techStack.databases.join(', '));
    }

    if (techStack.infrastructure.length > 0) {
      parts.push(techStack.infrastructure.join(', '));
    }

    if (techStack.architectureTerms.length > 0) {
      parts.push(techStack.architectureTerms.join(', '));
    }

    return `Tech Used: ${parts.join(', ')}`;
  }

  static enhanceProjectWithStructure(
    projectTitle: string,
    projectBullets: string[],
    problemStatement?: string
  ): string[] {
    const enhancedBullets: string[] = [];

    if (problemStatement) {
      enhancedBullets.push(problemStatement);
    } else {
      const detected = this.detectProblemStatement(projectBullets);
      if (!detected && projectBullets.length > 0) {
        const firstBullet = projectBullets[0];
        if (!this.startsWithActionVerb(firstBullet)) {
          enhancedBullets.push(firstBullet);
          projectBullets = projectBullets.slice(1);
        }
      }
    }

    const impactBullets = projectBullets.filter(bullet =>
      !this.isTechUsedLine(bullet) && this.startsWithActionVerb(bullet)
    ).slice(0, 3);

    enhancedBullets.push(...impactBullets);

    const existingTechLine = this.findTechUsedLine(projectBullets);
    if (existingTechLine) {
      enhancedBullets.push(existingTechLine);
    } else {
      const generatedTechLine = this.generateTechUsedLine(projectBullets);
      enhancedBullets.push(generatedTechLine);
    }

    return enhancedBullets;
  }

  static analyzeTechStack(projectBullets: string[], techUsedLine: string | null): TechStackAnalysis {
    const combined = techUsedLine
      ? `${projectBullets.join(' ')} ${techUsedLine}`
      : projectBullets.join(' ');

    const combinedLower = combined.toLowerCase();

    const extractTech = (category: keyof typeof ProjectStructureValidator.TECH_KEYWORDS): string[] => {
      const keywords = this.TECH_KEYWORDS[category];
      const found: string[] = [];

      for (const keyword of keywords) {
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
        const match = combinedLower.match(regex);
        if (match) {
          found.push(this.capitalizeTech(keyword));
        }
      }

      return [...new Set(found)];
    };

    const languages = extractTech('languages');
    const frameworks = extractTech('frameworks');
    const databases = extractTech('databases');
    const infrastructure = extractTech('infrastructure');
    const architectureTerms = extractTech('architecture');

    const missingCategories: string[] = [];
    if (languages.length === 0) missingCategories.push('Languages');
    if (frameworks.length === 0) missingCategories.push('Frameworks');
    if (databases.length === 0) missingCategories.push('Databases');
    if (infrastructure.length === 0) missingCategories.push('Infrastructure/Cloud');

    const isComplete = missingCategories.length <= 1;

    return {
      languages,
      frameworks,
      databases,
      infrastructure,
      architectureTerms,
      isComplete,
      missingCategories
    };
  }

  static formatProjectForATS(
    projectTitle: string,
    projectBullets: string[],
    roleType?: string
  ): string[] {
    const formatted: string[] = [];

    const validation = this.validateProject(projectTitle, projectBullets);

    if (!validation.hasProblemStatement) {
      formatted.push(`Context: ${projectTitle} project for ${roleType || 'development'}`);
    }

    const impactBullets = this.filterImpactBullets(projectBullets).slice(0, 3);
    formatted.push(...impactBullets);

    if (!validation.hasTechUsedLine) {
      const techLine = this.generateTechUsedLine(projectBullets);
      formatted.push(techLine);
    } else {
      const existingTechLine = this.findTechUsedLine(projectBullets);
      if (existingTechLine) {
        formatted.push(existingTechLine);
      }
    }

    return formatted;
  }

  private static detectProblemStatement(bullets: string[]): boolean {
    if (bullets.length === 0) return false;

    const firstBullet = bullets[0].toLowerCase();

    const problemIndicators = [
      'context:', 'overview:', 'background:', 'problem:', 'challenge:',
      'project involved', 'system designed', 'platform built'
    ];

    for (const indicator of problemIndicators) {
      if (firstBullet.includes(indicator)) {
        return true;
      }
    }

    return !this.startsWithActionVerb(bullets[0]);
  }

  private static filterImpactBullets(bullets: string[]): string[] {
    return bullets.filter(bullet => {
      if (this.isTechUsedLine(bullet)) return false;

      return this.startsWithActionVerb(bullet) && this.hasMetric(bullet);
    });
  }

  private static findTechUsedLine(bullets: string[]): string | null {
    for (const bullet of bullets) {
      if (this.isTechUsedLine(bullet)) {
        return bullet;
      }
    }
    return null;
  }

  private static isTechUsedLine(bullet: string): boolean {
    const techPrefixes = [
      /^tech(?:nologies)?\s*used:/i,
      /^stack:/i,
      /^tools:/i,
      /^built with:/i,
      /^technologies:/i
    ];

    return techPrefixes.some(pattern => pattern.test(bullet.trim()));
  }

  private static startsWithActionVerb(bullet: string): boolean {
    const firstWord = bullet.trim().split(/\s+/)[0].toLowerCase().replace(/[^\w]/g, '');
    return this.ACTION_VERBS.includes(firstWord);
  }

  private static hasMetric(bullet: string): boolean {
    const metricPatterns = [
      /\d+(?:\.\d+)?%/,
      /\d+x/i,
      /\$\d+/,
      /\d+(?:,\d{3})+/,
      /\d+\+/
    ];

    return metricPatterns.some(pattern => pattern.test(bullet));
  }

  private static isTechStackComplete(
    analysis: TechStackAnalysis,
    requiredCategories: string[]
  ): boolean {
    const categoryMap: { [key: string]: boolean } = {
      'languages': analysis.languages.length > 0,
      'frameworks': analysis.frameworks.length > 0,
      'databases': analysis.databases.length > 0,
      'infrastructure': analysis.infrastructure.length > 0,
      'architecture': analysis.architectureTerms.length > 0
    };

    for (const category of requiredCategories) {
      if (!categoryMap[category]) {
        return false;
      }
    }

    return true;
  }

  private static capitalizeTech(tech: string): string {
    const specialCases: { [key: string]: string } = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'nodejs': 'Node.js',
      'nextjs': 'Next.js',
      'mongodb': 'MongoDB',
      'postgresql': 'PostgreSQL',
      'mysql': 'MySQL',
      'aws': 'AWS',
      'gcp': 'GCP',
      'graphql': 'GraphQL',
      'restful': 'RESTful'
    };

    const normalized = tech.toLowerCase().replace(/\\b|\\\.|\\\+/g, '');

    return specialCases[normalized] || tech
      .split(/[\s-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

export const projectStructureValidator = ProjectStructureValidator;
