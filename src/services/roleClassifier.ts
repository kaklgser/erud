export type RoleType = 'backend' | 'frontend' | 'fullstack' | 'mobile' | 'devops' | 'data' | 'ai-ml' | 'qa' | 'security' | 'embedded' | 'general';

export type DomainType = 'fintech' | 'healthcare' | 'ecommerce' | 'saas' | 'gaming' | 'social' | 'education' | 'enterprise' | 'startup' | 'general';

export type SeniorityLevel = 'intern' | 'fresher' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'architect';

export interface RoleClassification {
  roleType: RoleType;
  confidence: number;
  secondaryRoles: RoleType[];
  domainType: DomainType;
  domainConfidence: number;
  seniority: SeniorityLevel;
  seniorityConfidence: number;
  keywords: string[];
  tone: 'formal' | 'balanced' | 'casual';
  focusAreas: string[];
}

export class RoleClassifier {
  private static readonly ROLE_KEYWORDS = {
    backend: {
      keywords: ['backend', 'api', 'rest', 'graphql', 'microservices', 'server', 'node.js', 'python', 'java', 'go', 'spring', 'django', 'flask', 'express', 'database', 'sql', 'postgresql', 'mongodb', 'redis', 'kafka', 'rabbitmq', 'architecture', 'scalability'],
      weight: 1.0
    },
    frontend: {
      keywords: ['frontend', 'react', 'angular', 'vue', 'javascript', 'typescript', 'html', 'css', 'ui', 'ux', 'responsive', 'web', 'component', 'redux', 'next.js', 'webpack', 'vite', 'tailwind', 'bootstrap', 'sass', 'accessibility'],
      weight: 1.0
    },
    fullstack: {
      keywords: ['fullstack', 'full-stack', 'full stack', 'mern', 'mean', 'end-to-end', 'frontend and backend', 'web application'],
      weight: 1.0
    },
    mobile: {
      keywords: ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin', 'xamarin', 'app development', 'mobile app'],
      weight: 1.0
    },
    devops: {
      keywords: ['devops', 'ci/cd', 'jenkins', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ansible', 'pipeline', 'deployment', 'infrastructure', 'cloud', 'monitoring', 'prometheus', 'grafana'],
      weight: 1.0
    },
    data: {
      keywords: ['data engineer', 'data analyst', 'etl', 'data pipeline', 'spark', 'hadoop', 'airflow', 'snowflake', 'bigquery', 'data warehouse', 'analytics', 'tableau', 'power bi', 'sql', 'data modeling'],
      weight: 1.0
    },
    'ai-ml': {
      keywords: ['machine learning', 'ai', 'ml', 'deep learning', 'tensorflow', 'pytorch', 'nlp', 'computer vision', 'neural network', 'model', 'data science', 'scikit-learn', 'keras', 'transformers', 'llm'],
      weight: 1.0
    },
    qa: {
      keywords: ['qa', 'quality assurance', 'testing', 'automation', 'selenium', 'cypress', 'jest', 'test', 'bug', 'quality'],
      weight: 1.0
    },
    security: {
      keywords: ['security', 'cybersecurity', 'penetration', 'vulnerability', 'encryption', 'authentication', 'authorization', 'owasp', 'soc', 'siem'],
      weight: 1.0
    },
    embedded: {
      keywords: ['embedded', 'firmware', 'iot', 'microcontroller', 'rtos', 'c', 'c++', 'hardware', 'arduino', 'raspberry pi'],
      weight: 1.0
    },
    general: {
      keywords: ['software engineer', 'software developer', 'developer', 'engineer', 'programmer'],
      weight: 0.5
    }
  };

  private static readonly DOMAIN_KEYWORDS = {
    fintech: {
      keywords: ['fintech', 'financial', 'banking', 'payment', 'trading', 'blockchain', 'cryptocurrency', 'wallet', 'fraud', 'compliance', 'stripe', 'plaid'],
      indicators: ['bank', 'capital', 'securities', 'insurance', 'credit']
    },
    healthcare: {
      keywords: ['healthcare', 'medical', 'health', 'patient', 'hospital', 'clinic', 'pharma', 'hipaa', 'hl7', 'fhir', 'telehealth', 'ehr', 'emr'],
      indicators: ['care', 'med', 'health', 'bio']
    },
    ecommerce: {
      keywords: ['ecommerce', 'e-commerce', 'retail', 'shopping', 'cart', 'checkout', 'inventory', 'marketplace', 'shopify', 'magento', 'woocommerce', 'product catalog'],
      indicators: ['shop', 'store', 'retail', 'marketplace']
    },
    saas: {
      keywords: ['saas', 'b2b', 'subscription', 'multi-tenant', 'cloud platform', 'api platform', 'enterprise software'],
      indicators: ['software as a service', 'subscription', 'tenant']
    },
    gaming: {
      keywords: ['gaming', 'game', 'unity', 'unreal', 'multiplayer', 'esports', 'gamedev'],
      indicators: ['game', 'play', 'gaming']
    },
    social: {
      keywords: ['social media', 'social network', 'community', 'messaging', 'chat', 'content', 'feed', 'newsfeed'],
      indicators: ['social', 'community', 'network']
    },
    education: {
      keywords: ['education', 'edtech', 'learning', 'lms', 'course', 'student', 'teacher', 'classroom', 'e-learning'],
      indicators: ['edu', 'learn', 'school', 'university']
    },
    enterprise: {
      keywords: ['enterprise', 'erp', 'crm', 'enterprise software', 'b2b', 'sap', 'salesforce', 'oracle'],
      indicators: ['enterprise', 'business']
    },
    startup: {
      keywords: ['startup', 'seed', 'series a', 'venture', 'mvp', 'early-stage'],
      indicators: ['startup', 'founding']
    },
    general: {
      keywords: ['technology', 'software', 'digital', 'tech'],
      indicators: []
    }
  };

  private static readonly SENIORITY_KEYWORDS = {
    intern: {
      keywords: ['intern', 'internship', 'trainee', 'co-op'],
      yearRange: [0, 0],
      responsibilities: ['assist', 'support', 'learn']
    },
    fresher: {
      keywords: ['fresher', 'entry-level', 'graduate', 'junior developer', 'associate'],
      yearRange: [0, 1],
      responsibilities: ['develop', 'implement', 'contribute']
    },
    junior: {
      keywords: ['junior', 'jr.', 'associate'],
      yearRange: [1, 3],
      responsibilities: ['build', 'develop', 'maintain', 'debug']
    },
    mid: {
      keywords: ['software engineer', 'developer', 'engineer'],
      yearRange: [3, 6],
      responsibilities: ['design', 'architect', 'optimize', 'mentor']
    },
    senior: {
      keywords: ['senior', 'sr.', 'lead engineer'],
      yearRange: [6, 10],
      responsibilities: ['lead', 'architect', 'design', 'mentor', 'drive', 'establish']
    },
    lead: {
      keywords: ['lead', 'team lead', 'tech lead', 'engineering lead'],
      yearRange: [8, 15],
      responsibilities: ['lead', 'manage', 'guide', 'mentor', 'strategize', 'define']
    },
    principal: {
      keywords: ['principal', 'staff engineer', 'distinguished'],
      yearRange: [10, 20],
      responsibilities: ['define', 'establish', 'influence', 'drive strategy', 'mentor teams']
    },
    architect: {
      keywords: ['architect', 'chief', 'principal architect', 'solutions architect'],
      yearRange: [10, 25],
      responsibilities: ['architect', 'define architecture', 'strategic', 'enterprise-wide']
    }
  };

  static classifyRole(jobDescription: string, companyName?: string): RoleClassification {
    const jdLower = jobDescription.toLowerCase();

    const roleScores = this.calculateRoleScores(jdLower);
    const roleType = this.selectPrimaryRole(roleScores);
    const roleConfidence = roleScores[roleType] || 0;
    const secondaryRoles = this.selectSecondaryRoles(roleScores, roleType);

    const domainScores = this.calculateDomainScores(jdLower, companyName);
    const domainType = this.selectPrimaryDomain(domainScores);
    const domainConfidence = domainScores[domainType] || 0;

    const { seniority, confidence: seniorityConfidence } = this.classifySeniority(jdLower);

    const keywords = this.extractRoleKeywords(jdLower, roleType);
    const tone = this.determineTone(seniority, domainType);
    const focusAreas = this.determineFocusAreas(roleType, domainType, seniority);

    return {
      roleType,
      confidence: roleConfidence,
      secondaryRoles,
      domainType,
      domainConfidence,
      seniority,
      seniorityConfidence,
      keywords,
      tone,
      focusAreas
    };
  }

  private static calculateRoleScores(jdLower: string): Record<RoleType, number> {
    const scores: Partial<Record<RoleType, number>> = {};

    Object.entries(this.ROLE_KEYWORDS).forEach(([role, config]) => {
      let score = 0;
      config.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = jdLower.match(regex);
        if (matches) {
          score += matches.length * config.weight;
        }
      });
      scores[role as RoleType] = score;
    });

    if (scores.fullstack && scores.fullstack > 0) {
      scores.fullstack = (scores.fullstack || 0) + ((scores.backend || 0) + (scores.frontend || 0)) * 0.3;
    }

    return scores as Record<RoleType, number>;
  }

  private static selectPrimaryRole(scores: Record<RoleType, number>): RoleType {
    let maxScore = 0;
    let primaryRole: RoleType = 'general';

    Object.entries(scores).forEach(([role, score]) => {
      if (score > maxScore && role !== 'general') {
        maxScore = score;
        primaryRole = role as RoleType;
      }
    });

    return primaryRole;
  }

  private static selectSecondaryRoles(scores: Record<RoleType, number>, primaryRole: RoleType): RoleType[] {
    const sortedRoles = Object.entries(scores)
      .filter(([role]) => role !== primaryRole && role !== 'general')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .filter(([, score]) => score > 2)
      .map(([role]) => role as RoleType);

    return sortedRoles;
  }

  private static calculateDomainScores(jdLower: string, companyName?: string): Record<DomainType, number> {
    const scores: Partial<Record<DomainType, number>> = {};

    Object.entries(this.DOMAIN_KEYWORDS).forEach(([domain, config]) => {
      let score = 0;

      config.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = jdLower.match(regex);
        if (matches) {
          score += matches.length * 2;
        }
      });

      if (companyName) {
        const companyLower = companyName.toLowerCase();
        config.indicators.forEach(indicator => {
          if (companyLower.includes(indicator)) {
            score += 5;
          }
        });
      }

      scores[domain as DomainType] = score;
    });

    return scores as Record<DomainType, number>;
  }

  private static selectPrimaryDomain(scores: Record<DomainType, number>): DomainType {
    let maxScore = 0;
    let primaryDomain: DomainType = 'general';

    Object.entries(scores).forEach(([domain, score]) => {
      if (score > maxScore && domain !== 'general') {
        maxScore = score;
        primaryDomain = domain as DomainType;
      }
    });

    return primaryDomain;
  }

  private static classifySeniority(jdLower: string): { seniority: SeniorityLevel; confidence: number } {
    const scores: Partial<Record<SeniorityLevel, number>> = {};

    Object.entries(this.SENIORITY_KEYWORDS).forEach(([level, config]) => {
      let score = 0;

      config.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = jdLower.match(regex);
        if (matches) {
          score += matches.length * 5;
        }
      });

      config.responsibilities.forEach(resp => {
        const regex = new RegExp(`\\b${resp}\\b`, 'gi');
        const matches = jdLower.match(regex);
        if (matches) {
          score += matches.length * 2;
        }
      });

      const yearMatch = jdLower.match(/(\d+)\+?\s*years?/gi);
      if (yearMatch) {
        yearMatch.forEach(match => {
          const years = parseInt(match.match(/\d+/)?.[0] || '0');
          if (years >= config.yearRange[0] && years <= config.yearRange[1]) {
            score += 10;
          }
        });
      }

      scores[level as SeniorityLevel] = score;
    });

    let maxScore = 0;
    let seniority: SeniorityLevel = 'mid';

    Object.entries(scores).forEach(([level, score]) => {
      if (score > maxScore) {
        maxScore = score;
        seniority = level as SeniorityLevel;
      }
    });

    const confidence = Math.min(maxScore / 20, 1.0);

    return { seniority, confidence };
  }

  private static extractRoleKeywords(jdLower: string, roleType: RoleType): string[] {
    const keywords: string[] = [];
    const roleConfig = this.ROLE_KEYWORDS[roleType];

    if (roleConfig) {
      roleConfig.keywords.forEach(keyword => {
        if (jdLower.includes(keyword.toLowerCase())) {
          keywords.push(keyword);
        }
      });
    }

    return keywords.slice(0, 10);
  }

  private static determineTone(seniority: SeniorityLevel, domain: DomainType): 'formal' | 'balanced' | 'casual' {
    if (['intern', 'fresher', 'junior'].includes(seniority)) {
      return 'balanced';
    }

    if (['principal', 'architect', 'lead'].includes(seniority)) {
      return 'formal';
    }

    if (['fintech', 'healthcare', 'enterprise'].includes(domain)) {
      return 'formal';
    }

    if (['gaming', 'startup', 'social'].includes(domain)) {
      return 'casual';
    }

    return 'balanced';
  }

  private static determineFocusAreas(roleType: RoleType, domain: DomainType, seniority: SeniorityLevel): string[] {
    const areas: string[] = [];

    if (['senior', 'lead', 'principal', 'architect'].includes(seniority)) {
      areas.push('Architecture & Design', 'Technical Leadership', 'Mentorship');
    } else if (['mid'].includes(seniority)) {
      areas.push('Development & Implementation', 'Code Quality', 'Collaboration');
    } else {
      areas.push('Learning & Growth', 'Implementation', 'Best Practices');
    }

    if (roleType === 'backend') {
      areas.push('Scalability', 'Performance', 'System Design');
    } else if (roleType === 'frontend') {
      areas.push('User Experience', 'Responsive Design', 'Accessibility');
    } else if (roleType === 'fullstack') {
      areas.push('End-to-End Development', 'API Design', 'System Integration');
    } else if (roleType === 'devops') {
      areas.push('CI/CD', 'Infrastructure', 'Automation');
    } else if (roleType === 'ai-ml') {
      areas.push('Model Development', 'Data Processing', 'Algorithm Optimization');
    }

    if (domain === 'fintech') {
      areas.push('Security & Compliance', 'Fraud Prevention');
    } else if (domain === 'healthcare') {
      areas.push('HIPAA Compliance', 'Data Privacy');
    } else if (domain === 'ecommerce') {
      areas.push('Inventory Management', 'Payment Integration');
    }

    return areas.slice(0, 6);
  }

  static getOptimizationStrategy(classification: RoleClassification): {
    keywordWeight: number;
    metricEmphasis: string;
    actionVerbStyle: string[];
    projectFocus: string[];
  } {
    const { roleType, seniority, domainType } = classification;

    let keywordWeight = 1.0;
    let metricEmphasis = 'performance';
    let actionVerbStyle: string[] = ['Developed', 'Implemented', 'Built'];
    let projectFocus: string[] = [];

    if (['senior', 'lead', 'principal', 'architect'].includes(seniority)) {
      actionVerbStyle = ['Architected', 'Led', 'Established', 'Drove', 'Defined', 'Spearheaded'];
      metricEmphasis = 'leadership';
    } else if (seniority === 'mid') {
      actionVerbStyle = ['Designed', 'Implemented', 'Optimized', 'Engineered'];
      metricEmphasis = 'impact';
    }

    if (roleType === 'backend') {
      projectFocus = ['APIs', 'Microservices', 'Databases', 'Scalability'];
      keywordWeight = 1.2;
    } else if (roleType === 'frontend') {
      projectFocus = ['UI Components', 'Responsive Design', 'User Experience', 'Accessibility'];
    } else if (roleType === 'fullstack') {
      projectFocus = ['End-to-End Features', 'API Integration', 'Full-Stack Applications'];
    } else if (roleType === 'devops') {
      projectFocus = ['CI/CD Pipelines', 'Infrastructure', 'Automation', 'Monitoring'];
    } else if (roleType === 'ai-ml') {
      projectFocus = ['ML Models', 'Data Pipelines', 'Algorithm Optimization'];
    }

    if (domainType === 'fintech') {
      projectFocus.push('Payment Systems', 'Fraud Detection');
    } else if (domainType === 'healthcare') {
      projectFocus.push('Patient Data Systems', 'Compliance');
    }

    return {
      keywordWeight,
      metricEmphasis,
      actionVerbStyle,
      projectFocus
    };
  }
}

export const roleClassifier = RoleClassifier;
