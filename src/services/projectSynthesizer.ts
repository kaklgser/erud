import { Project } from '../types/resume';

export interface SynthesizedProject extends Project {
  domain: string;
  isGenerated: true;
  confidence: number;
  alignedSkills: string[];
}

export interface SkillGapAnalysis {
  missingSkills: string[];
  partialSkills: string[];
  needsProject: boolean;
  gapPercentage: number;
  criticalGaps: string[];
}

export interface ProjectTemplate {
  title: string;
  description: string;
  bulletTemplates: string[];
  requiredSkills: string[];
  domain: string;
  complexity: 'simple' | 'moderate' | 'complex';
}

export class ProjectSynthesizer {
  private static readonly PROJECT_TEMPLATES: Record<string, ProjectTemplate[]> = {
    fintech: [
      {
        title: 'Payment Processing System',
        description: 'Secure payment gateway integration',
        bulletTemplates: [
          'Built payment processing system handling {scale} transactions using {tech1} and {tech2}',
          'Implemented fraud detection algorithms reducing false positives by {metric}%',
          'Integrated with {payment_provider} API achieving {metric2}% uptime'
        ],
        requiredSkills: ['backend', 'api', 'security'],
        domain: 'fintech',
        complexity: 'moderate'
      },
      {
        title: 'Financial Dashboard Analytics',
        description: 'Real-time financial metrics and reporting',
        bulletTemplates: [
          'Developed real-time financial dashboard using {tech1} visualizing {metric} data points',
          'Implemented data aggregation pipeline processing {scale} records daily',
          'Created custom reporting features reducing manual work by {metric2} hours/week'
        ],
        requiredSkills: ['frontend', 'data visualization', 'backend'],
        domain: 'fintech',
        complexity: 'moderate'
      }
    ],
    ecommerce: [
      {
        title: 'Product Recommendation Engine',
        description: 'ML-powered product recommendations',
        bulletTemplates: [
          'Built recommendation engine using {tech1} increasing conversion by {metric}%',
          'Processed user behavior data for {scale} customers with {tech2}',
          'Implemented A/B testing framework improving click-through rate by {metric2}%'
        ],
        requiredSkills: ['machine learning', 'backend', 'data'],
        domain: 'ecommerce',
        complexity: 'complex'
      },
      {
        title: 'Inventory Management System',
        description: 'Real-time inventory tracking and automation',
        bulletTemplates: [
          'Developed inventory tracking system managing {scale} SKUs using {tech1}',
          'Automated reorder process reducing stockouts by {metric}%',
          'Integrated with {service} improving fulfillment time by {metric2} days'
        ],
        requiredSkills: ['backend', 'database', 'api'],
        domain: 'ecommerce',
        complexity: 'moderate'
      }
    ],
    saas: [
      {
        title: 'Multi-Tenant SaaS Platform',
        description: 'Scalable multi-tenant architecture',
        bulletTemplates: [
          'Architected multi-tenant platform serving {scale} organizations using {tech1}',
          'Implemented tenant isolation and data security with {tech2}',
          'Achieved {metric}% uptime with automated scaling and monitoring'
        ],
        requiredSkills: ['fullstack', 'cloud', 'database'],
        domain: 'saas',
        complexity: 'complex'
      },
      {
        title: 'API Integration Platform',
        description: 'Third-party API integration and management',
        bulletTemplates: [
          'Built API integration platform connecting {metric} third-party services',
          'Implemented webhook system processing {scale} events daily using {tech1}',
          'Created unified API gateway reducing integration time by {metric2}%'
        ],
        requiredSkills: ['backend', 'api', 'microservices'],
        domain: 'saas',
        complexity: 'moderate'
      }
    ],
    healthcare: [
      {
        title: 'Patient Portal System',
        description: 'HIPAA-compliant patient management',
        bulletTemplates: [
          'Developed HIPAA-compliant patient portal serving {scale} users with {tech1}',
          'Implemented secure messaging and appointment scheduling with {tech2}',
          'Achieved {metric}% patient satisfaction through intuitive UX design'
        ],
        requiredSkills: ['fullstack', 'security', 'compliance'],
        domain: 'healthcare',
        complexity: 'complex'
      },
      {
        title: 'Medical Records Integration',
        description: 'EHR system integration and data exchange',
        bulletTemplates: [
          'Integrated with {service} EHR system processing {scale} records using {tech1}',
          'Built HL7/FHIR data pipeline ensuring {metric}% accuracy',
          'Reduced data entry time by {metric2} hours/week through automation'
        ],
        requiredSkills: ['backend', 'api', 'data'],
        domain: 'healthcare',
        complexity: 'complex'
      }
    ],
    ai_ml: [
      {
        title: 'RAG-Powered Chatbot',
        description: 'AI chatbot with retrieval-augmented generation',
        bulletTemplates: [
          'Built RAG chatbot using {tech1} and {tech2} serving {scale} users',
          'Implemented vector search with {vector_db} achieving {metric}% accuracy',
          'Reduced response time to {metric2} seconds through optimization'
        ],
        requiredSkills: ['ai', 'nlp', 'backend', 'vector database'],
        domain: 'ai_ml',
        complexity: 'complex'
      },
      {
        title: 'Computer Vision Pipeline',
        description: 'Image classification and object detection',
        bulletTemplates: [
          'Developed image classification model using {tech1} with {metric}% accuracy',
          'Built data pipeline processing {scale} images daily with {tech2}',
          'Deployed model with {cloud_service} reducing inference time by {metric2}%'
        ],
        requiredSkills: ['machine learning', 'python', 'computer vision'],
        domain: 'ai_ml',
        complexity: 'complex'
      }
    ],
    general: [
      {
        title: 'REST API Microservice',
        description: 'Scalable microservice architecture',
        bulletTemplates: [
          'Built RESTful microservice handling {scale} requests/day using {tech1}',
          'Implemented caching layer with {tech2} reducing latency by {metric}%',
          'Achieved {metric2}% uptime through containerization with Docker'
        ],
        requiredSkills: ['backend', 'api', 'microservices'],
        domain: 'general',
        complexity: 'moderate'
      },
      {
        title: 'Data Analytics Dashboard',
        description: 'Interactive data visualization platform',
        bulletTemplates: [
          'Created analytics dashboard using {tech1} processing {scale} data points',
          'Implemented real-time data streaming with {tech2}',
          'Improved decision-making speed by {metric}% through intuitive visualizations'
        ],
        requiredSkills: ['frontend', 'data visualization', 'backend'],
        domain: 'general',
        complexity: 'moderate'
      }
    ]
  };

  static analyzeSkillGap(
    resumeProjects: Project[],
    jdRequirements: string[],
    jdText: string
  ): SkillGapAnalysis {
    const resumeSkills = new Set<string>();

    for (const project of resumeProjects) {
      const projectText = `${project.title} ${project.bullets.join(' ')}`.toLowerCase();

      for (const req of jdRequirements) {
        if (projectText.includes(req.toLowerCase())) {
          resumeSkills.add(req.toLowerCase());
        }
      }
    }

    const jdSkillsLower = jdRequirements.map(s => s.toLowerCase());
    const missingSkills: string[] = [];
    const partialSkills: string[] = [];

    for (const jdSkill of jdSkillsLower) {
      if (!resumeSkills.has(jdSkill)) {
        if (this.hasPartialMatch(jdSkill, Array.from(resumeSkills))) {
          partialSkills.push(jdSkill);
        } else {
          missingSkills.push(jdSkill);
        }
      }
    }

    const gapPercentage = (missingSkills.length / jdRequirements.length) * 100;
    const needsProject = gapPercentage > 30;

    const criticalSkills = ['backend', 'frontend', 'cloud', 'database', 'api', 'machine learning', 'ai'];
    const criticalGaps = missingSkills.filter(skill =>
      criticalSkills.some(critical => skill.includes(critical))
    );

    return {
      missingSkills,
      partialSkills,
      needsProject,
      gapPercentage,
      criticalGaps
    };
  }

  private static hasPartialMatch(skill: string, existingSkills: string[]): boolean {
    const skillWords = skill.split(/\s+/);

    for (const existing of existingSkills) {
      const matchCount = skillWords.filter(word =>
        existing.includes(word) && word.length > 3
      ).length;

      if (matchCount >= skillWords.length / 2) {
        return true;
      }
    }

    return false;
  }

  static selectBestTemplate(
    missingSkills: string[],
    domain: string,
    roleType: string
  ): ProjectTemplate | null {
    const domainTemplates = this.PROJECT_TEMPLATES[domain] || this.PROJECT_TEMPLATES.general;

    let bestTemplate: ProjectTemplate | null = null;
    let bestScore = 0;

    for (const template of domainTemplates) {
      let score = 0;

      for (const requiredSkill of template.requiredSkills) {
        for (const missing of missingSkills) {
          if (missing.toLowerCase().includes(requiredSkill.toLowerCase()) ||
              requiredSkill.toLowerCase().includes(missing.toLowerCase())) {
            score += 2;
          }
        }
      }

      if (roleType.includes('senior') && template.complexity === 'complex') {
        score += 1;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTemplate = template;
      }
    }

    return bestTemplate;
  }

  static async generateProject(
    missingSkills: string[],
    domain: string,
    roleType: string,
    availableTech: string[]
  ): Promise<SynthesizedProject | null> {
    const template = this.selectBestTemplate(missingSkills, domain, roleType);

    if (!template) {
      return null;
    }

    const bullets = this.generateBulletsFromTemplate(
      template,
      missingSkills,
      availableTech
    );

    const confidence = this.calculateProjectConfidence(
      template,
      missingSkills,
      availableTech
    );

    return {
      title: template.title,
      bullets,
      githubUrl: '',
      domain: template.domain,
      isGenerated: true,
      confidence,
      alignedSkills: missingSkills.slice(0, 5)
    };
  }

  private static generateBulletsFromTemplate(
    template: ProjectTemplate,
    missingSkills: string[],
    availableTech: string[]
  ): string[] {
    const bullets: string[] = [];

    for (const bulletTemplate of template.bulletTemplates) {
      let bullet = bulletTemplate;

      bullet = bullet.replace(/{tech1}/g, this.selectTech(availableTech, missingSkills, 0));
      bullet = bullet.replace(/{tech2}/g, this.selectTech(availableTech, missingSkills, 1));
      bullet = bullet.replace(/{vector_db}/g, this.selectVectorDB());
      bullet = bullet.replace(/{cloud_service}/g, this.selectCloudService(availableTech));
      bullet = bullet.replace(/{service}/g, this.selectService(template.domain));
      bullet = bullet.replace(/{payment_provider}/g, 'Stripe');

      bullet = bullet.replace(/{scale}/g, this.generateScale(template.complexity));
      bullet = bullet.replace(/{metric}/g, this.generateMetric('percentage'));
      bullet = bullet.replace(/{metric2}/g, this.generateMetric('time'));

      bullets.push(bullet);
    }

    return bullets;
  }

  private static selectTech(availableTech: string[], missingSkills: string[], index: number): string {
    const relevantTech = availableTech.filter(tech =>
      missingSkills.some(skill => skill.toLowerCase().includes(tech.toLowerCase()))
    );

    if (relevantTech.length > index) {
      return relevantTech[index];
    }

    if (availableTech.length > index) {
      return availableTech[index];
    }

    const defaultTech = ['React', 'Node.js', 'Python', 'TypeScript', 'PostgreSQL', 'MongoDB', 'AWS'];
    return defaultTech[index % defaultTech.length];
  }

  private static selectVectorDB(): string {
    const vectorDBs = ['Pinecone', 'Weaviate', 'ChromaDB', 'Qdrant'];
    return vectorDBs[Math.floor(Math.random() * vectorDBs.length)];
  }

  private static selectCloudService(availableTech: string[]): string {
    const hasAWS = availableTech.some(t => t.toLowerCase().includes('aws'));
    const hasAzure = availableTech.some(t => t.toLowerCase().includes('azure'));
    const hasGCP = availableTech.some(t => t.toLowerCase().includes('gcp'));

    if (hasAWS) return 'AWS Lambda';
    if (hasAzure) return 'Azure Functions';
    if (hasGCP) return 'Google Cloud Run';
    return 'AWS';
  }

  private static selectService(domain: string): string {
    const services: Record<string, string[]> = {
      ecommerce: ['Shopify', 'WooCommerce', 'Magento'],
      healthcare: ['Epic', 'Cerner', 'Allscripts'],
      fintech: ['Plaid', 'Stripe', 'Square'],
      saas: ['Salesforce', 'HubSpot', 'Zendesk'],
      general: ['third-party']
    };

    const domainServices = services[domain] || services.general;
    return domainServices[Math.floor(Math.random() * domainServices.length)];
  }

  private static generateScale(complexity: string): string {
    const scales = {
      simple: ['1,000+', '5,000+', '10,000+'],
      moderate: ['50,000+', '100,000+', '500,000+'],
      complex: ['1M+', '5M+', '10M+']
    };

    const scaleOptions = scales[complexity as keyof typeof scales] || scales.moderate;
    return scaleOptions[Math.floor(Math.random() * scaleOptions.length)];
  }

  private static generateMetric(type: 'percentage' | 'time'): string {
    if (type === 'percentage') {
      const values = [25, 30, 35, 40, 45, 50, 60, 70, 80];
      return values[Math.floor(Math.random() * values.length)].toString();
    } else {
      const values = [2, 3, 5, 8, 10, 15];
      return values[Math.floor(Math.random() * values.length)].toString();
    }
  }

  private static calculateProjectConfidence(
    template: ProjectTemplate,
    missingSkills: string[],
    availableTech: string[]
  ): number {
    let confidence = 0.6;

    const skillMatch = template.requiredSkills.filter(req =>
      missingSkills.some(skill => skill.toLowerCase().includes(req.toLowerCase()))
    ).length;

    confidence += (skillMatch / template.requiredSkills.length) * 0.2;

    const techMatch = availableTech.filter(tech =>
      template.requiredSkills.some(skill => tech.toLowerCase().includes(skill.toLowerCase()))
    ).length;

    if (techMatch > 0) {
      confidence += 0.1;
    }

    if (template.complexity === 'complex') {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  static validateProjectRealism(project: SynthesizedProject): {
    isRealistic: boolean;
    issues: string[];
    score: number;
  } {
    const issues: string[] = [];
    let score = 100;

    if (project.bullets.length < 2) {
      issues.push('Project should have at least 2 bullets');
      score -= 20;
    }

    for (const bullet of project.bullets) {
      const metrics = bullet.match(/\d+/g);
      if (!metrics || metrics.length === 0) {
        issues.push('Bullets should contain quantifiable metrics');
        score -= 10;
      }

      const actionVerbs = ['built', 'developed', 'implemented', 'created', 'designed', 'architected'];
      const hasActionVerb = actionVerbs.some(verb => bullet.toLowerCase().includes(verb));

      if (!hasActionVerb) {
        issues.push('Bullets should start with strong action verbs');
        score -= 10;
      }
    }

    if (project.confidence < 0.5) {
      issues.push('Low confidence in project relevance');
      score -= 15;
    }

    return {
      isRealistic: score >= 70,
      issues,
      score: Math.max(0, score)
    };
  }

  static inferDomainFromJD(jdText: string, companyName?: string): string {
    const domainKeywords: Record<string, string[]> = {
      fintech: ['payment', 'finance', 'banking', 'trading', 'blockchain', 'crypto', 'wallet'],
      ecommerce: ['ecommerce', 'e-commerce', 'retail', 'shop', 'cart', 'inventory', 'product catalog'],
      healthcare: ['healthcare', 'medical', 'patient', 'hospital', 'clinic', 'health', 'hipaa'],
      saas: ['saas', 'platform', 'subscription', 'multi-tenant', 'api', 'cloud'],
      ai_ml: ['ai', 'machine learning', 'ml', 'deep learning', 'nlp', 'computer vision', 'llm', 'rag']
    };

    const jdLower = jdText.toLowerCase();
    const companyLower = companyName?.toLowerCase() || '';

    let bestDomain = 'general';
    let bestScore = 0;

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      let score = 0;

      for (const keyword of keywords) {
        if (jdLower.includes(keyword)) score += 2;
        if (companyLower.includes(keyword)) score += 3;
      }

      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain;
      }
    }

    return bestDomain;
  }

  static extractAvailableTech(resumeText: string, jdText: string): string[] {
    const techKeywords = [
      'React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java', 'TypeScript',
      'JavaScript', 'Go', 'Rust', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin',
      'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Elasticsearch',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
      'TensorFlow', 'PyTorch', 'scikit-learn', 'Pandas', 'NumPy',
      'LangChain', 'LlamaIndex', 'HuggingFace'
    ];

    const combinedText = `${resumeText} ${jdText}`.toLowerCase();
    const foundTech = new Set<string>();

    for (const tech of techKeywords) {
      if (combinedText.includes(tech.toLowerCase())) {
        foundTech.add(tech);
      }
    }

    return Array.from(foundTech);
  }
}

export const projectSynthesizer = ProjectSynthesizer;
