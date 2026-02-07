// src/services/resumeComparisonService.ts
import { ResumeData, UserType } from '../types/resume';
import { ComplianceIssue } from './resumeComplianceService';

export interface BeforeAfterExample {
  issueId: string;
  issueTitle: string;
  category: string;
  before: string;
  after: string;
  explanation: string;
  impactLevel: 'critical' | 'high' | 'medium' | 'low';
}

export interface ComparisonReport {
  examples: BeforeAfterExample[];
  summary: string;
  estimatedImpact: string;
}

export class ResumeComparisonService {

  static generateBeforeAfterExamples(
    resumeData: ResumeData,
    issues: ComplianceIssue[],
    userType: UserType,
    jobDescription?: string
  ): ComparisonReport {
    const examples: BeforeAfterExample[] = [];

    // Group issues by category
    const issuesByCategory = this.groupIssuesByCategory(issues);

    // Generate examples for each category
    if (issuesByCategory.header.length > 0) {
      examples.push(...this.generateHeaderExamples(resumeData, issuesByCategory.header, jobDescription));
    }

    if (issuesByCategory.section_order.length > 0) {
      examples.push(...this.generateSectionOrderExamples(resumeData, issuesByCategory.section_order, userType));
    }

    if (issuesByCategory.metrics.length > 0) {
      examples.push(...this.generateMetricsExamples(resumeData, issuesByCategory.metrics));
    }

    if (issuesByCategory.skills.length > 0) {
      examples.push(...this.generateSkillsExamples(resumeData, issuesByCategory.skills));
    }

    if (issuesByCategory.projects.length > 0) {
      examples.push(...this.generateProjectsExamples(resumeData, issuesByCategory.projects, userType));
    }

    if (issuesByCategory.keywords.length > 0 && jobDescription) {
      examples.push(...this.generateKeywordExamples(resumeData, issuesByCategory.keywords, jobDescription));
    }

    const summary = this.generateSummary(examples, issues.length);
    const estimatedImpact = this.calculateEstimatedImpact(issues);

    return {
      examples,
      summary,
      estimatedImpact
    };
  }

  private static groupIssuesByCategory(issues: ComplianceIssue[]): Record<string, ComplianceIssue[]> {
    return {
      header: issues.filter(i => i.category === 'header'),
      section_order: issues.filter(i => i.category === 'section_order'),
      metrics: issues.filter(i => i.category === 'metrics'),
      skills: issues.filter(i => i.category === 'skills'),
      projects: issues.filter(i => i.category === 'projects'),
      keywords: issues.filter(i => i.category === 'keywords')
    };
  }

  private static generateHeaderExamples(
    resumeData: ResumeData,
    issues: ComplianceIssue[],
    jobDescription?: string
  ): BeforeAfterExample[] {
    const examples: BeforeAfterExample[] = [];

    const locationIssue = issues.find(i => i.id === 'header-missing-location');
    const linkedinIssue = issues.find(i => i.id === 'header-linkedin-mismatch');

    if (locationIssue || linkedinIssue) {
      const currentHeader = this.buildCurrentHeader(resumeData);
      const fixedHeader = this.buildFixedHeader(resumeData, jobDescription);

      examples.push({
        issueId: 'header-fixes',
        issueTitle: 'Header Missing Location and/or Incorrect LinkedIn',
        category: 'header',
        before: currentHeader,
        after: fixedHeader,
        explanation: 'Added location field (required for location-specific roles like Mumbai jobs) and corrected LinkedIn URL to match candidate name. This prevents recruiter confusion and improves ATS matching.',
        impactLevel: locationIssue?.severity || linkedinIssue?.severity || 'high'
      });
    }

    return examples;
  }

  private static buildCurrentHeader(resumeData: ResumeData): string {
    const parts = [resumeData.name];

    if (resumeData.phone) parts.push(`Phone: ${resumeData.phone}`);
    if (resumeData.email) parts.push(`Email: ${resumeData.email}`);
    if (resumeData.linkedin) parts.push(`LinkedIn: ${resumeData.linkedin}`);
    if (resumeData.location) parts.push(`Location: ${resumeData.location}`);

    return parts.join('\n');
  }

  private static buildFixedHeader(resumeData: ResumeData, jobDescription?: string): string {
    const parts = [`${resumeData.name} | Associate Software Engineer`];

    // Add location based on JD
    const isMumbai = jobDescription?.toLowerCase().includes('mumbai');
    const location = isMumbai
      ? 'Mumbai, Maharashtra (Willing to work from Andheri office)'
      : resumeData.location || 'Bangalore, Karnataka (Open to relocation)';

    parts.push(location);

    if (resumeData.phone) parts.push(`Phone: ${resumeData.phone}`);
    if (resumeData.email) parts.push(`Email: ${resumeData.email}`);

    // Fix LinkedIn URL
    const nameParts = resumeData.name.toLowerCase().split(' ');
    const suggestedLinkedIn = `linkedin.com/in/${nameParts.join('-')}`;
    parts.push(`LinkedIn: ${suggestedLinkedIn}`);

    if (resumeData.github) parts.push(`GitHub: ${resumeData.github}`);

    return parts.join('\n');
  }

  private static generateSectionOrderExamples(
    resumeData: ResumeData,
    issues: ComplianceIssue[],
    userType: UserType
  ): BeforeAfterExample[] {
    const examples: BeforeAfterExample[] = [];

    const skillsIssue = issues.find(i => i.id === 'section-order-skills');
    const educationIssue = issues.find(i => i.id === 'section-order-education');

    if (skillsIssue || educationIssue) {
      const currentOrder = this.getCurrentSectionOrder(resumeData, userType);
      const correctOrder = this.getCorrectSectionOrder(userType);

      examples.push({
        issueId: 'section-order',
        issueTitle: 'Section Order Does Not Match ATS Standards',
        category: 'section_order',
        before: `Current section order:\n${currentOrder}`,
        after: `Correct ATS section order:\n${correctOrder}`,
        explanation: `ATS systems scan resumes in a specific order. Skills should come right after Summary for better keyword matching. ${userType === 'student' ? 'For students, Education can stay near the top.' : 'For experienced/fresher candidates, Projects and Experience should come before Education to highlight practical skills.'}`,
        impactLevel: skillsIssue?.severity || educationIssue?.severity || 'high'
      });
    }

    return examples;
  }

  private static getCurrentSectionOrder(resumeData: ResumeData, userType: UserType): string {
    const order: string[] = ['1. HEADER (Name, Contact Info)'];

    if (resumeData.careerObjective) order.push('2. CAREER OBJECTIVE');
    if (resumeData.summary) order.push('2. PROFESSIONAL SUMMARY');
    if (resumeData.education?.length) order.push(`${order.length + 1}. EDUCATION`);
    if (resumeData.workExperience?.length) order.push(`${order.length + 1}. WORK EXPERIENCE`);
    if (resumeData.projects?.length) order.push(`${order.length + 1}. PROJECTS`);
    if (resumeData.skills?.length) order.push(`${order.length + 1}. SKILLS`);
    if (resumeData.certifications?.length) order.push(`${order.length + 1}. CERTIFICATIONS`);
    if (resumeData.achievements?.length) order.push(`${order.length + 1}. ACHIEVEMENTS`);

    return order.join('\n');
  }

  private static getCorrectSectionOrder(userType: UserType): string {
    const orders = {
      experienced: [
        '1. HEADER (Name, Location, Contact Info)',
        '2. PROFESSIONAL SUMMARY',
        '3. SKILLS',
        '4. WORK EXPERIENCE',
        '5. PROJECTS',
        '6. EDUCATION',
        '7. CERTIFICATIONS'
      ],
      fresher: [
        '1. HEADER (Name, Location, Contact Info)',
        '2. CAREER OBJECTIVE / PROFESSIONAL SUMMARY',
        '3. SKILLS',
        '4. WORK EXPERIENCE',
        '5. PROJECTS',
        '6. EDUCATION',
        '7. CERTIFICATIONS',
        '8. ACHIEVEMENTS (optional)'
      ],
      student: [
        '1. HEADER (Name, Location, Contact Info)',
        '2. CAREER OBJECTIVE',
        '3. EDUCATION',
        '4. SKILLS',
        '5. PROJECTS',
        '6. WORK EXPERIENCE / INTERNSHIPS',
        '7. CERTIFICATIONS',
        '8. ACHIEVEMENTS (optional)'
      ]
    };

    return orders[userType].join('\n');
  }

  private static generateMetricsExamples(
    resumeData: ResumeData,
    issues: ComplianceIssue[]
  ): BeforeAfterExample[] {
    const examples: BeforeAfterExample[] = [];

    // Find bullets without metrics
    const bulletExamples = this.findBulletsWithoutMetrics(resumeData);

    if (bulletExamples.length > 0) {
      bulletExamples.slice(0, 3).forEach((example, index) => {
        examples.push({
          issueId: `metrics-${index}`,
          issueTitle: 'Bullet Points Lack Quantifiable Metrics',
          category: 'metrics',
          before: example.before,
          after: example.after,
          explanation: 'Added metric placeholders ([X%], [Y users], etc.) to demonstrate impact. Replace these with actual numbers from your experience to show measurable results.',
          impactLevel: 'critical'
        });
      });
    }

    return examples;
  }

  private static findBulletsWithoutMetrics(resumeData: ResumeData): Array<{ before: string; after: string }> {
    const examples: Array<{ before: string; after: string }> = [];

    // Check work experience
    if (resumeData.workExperience) {
      resumeData.workExperience.forEach(job => {
        if (job.bullets) {
          job.bullets.forEach(bullet => {
            if (!this.hasMetric(bullet)) {
              examples.push({
                before: bullet,
                after: this.addMetricPlaceholder(bullet)
              });
            }
          });
        }
      });
    }

    // Check projects
    if (resumeData.projects) {
      resumeData.projects.forEach(project => {
        if (project.bullets) {
          project.bullets.forEach(bullet => {
            if (!this.hasMetric(bullet)) {
              examples.push({
                before: bullet,
                after: this.addMetricPlaceholder(bullet)
              });
            }
          });
        }
      });
    }

    return examples;
  }

  private static hasMetric(bullet: string): boolean {
    const metricPatterns = [
      /\d+%/,
      /\d+x/i,
      /\$\d+/,
      /\d+(?:,\d{3})+/,
      /\d+\+/,
      /\d+\s*(?:users|transactions|requests|ms|seconds|hours|days)/i,
      /\[\w+%?\]/
    ];

    return metricPatterns.some(pattern => pattern.test(bullet));
  }

  private static addMetricPlaceholder(bullet: string): string {
    const lowerBullet = bullet.toLowerCase();

    // Pattern matching for different types of improvements
    if (lowerBullet.includes('develop') || lowerBullet.includes('built') || lowerBullet.includes('created')) {
      if (lowerBullet.includes('user') || lowerBullet.includes('portal') || lowerBullet.includes('platform')) {
        return `${bullet} serving [X] daily users`;
      }
      if (lowerBullet.includes('api') || lowerBullet.includes('service')) {
        return `${bullet} handling [X] requests/day with [Y]ms response time`;
      }
      return `${bullet} reducing processing time by [X%]`;
    }

    if (lowerBullet.includes('improv') || lowerBullet.includes('enhanc') || lowerBullet.includes('optim')) {
      return `${bullet} by [X%]`;
    }

    if (lowerBullet.includes('reduc') || lowerBullet.includes('decreas')) {
      return `${bullet} by [X%]`;
    }

    if (lowerBullet.includes('increas') || lowerBullet.includes('boost')) {
      return `${bullet} by [X%]`;
    }

    if (lowerBullet.includes('implement') || lowerBullet.includes('deploy')) {
      return `${bullet} impacting [X] users`;
    }

    // Default: add generic metric
    return `${bullet} with [X%] improvement`;
  }

  private static generateSkillsExamples(
    resumeData: ResumeData,
    issues: ComplianceIssue[]
  ): BeforeAfterExample[] {
    const examples: BeforeAfterExample[] = [];

    const skillsIssue = issues.find(i => i.id === 'skills-too-many' || i.id === 'skills-too-few');

    if (skillsIssue) {
      const currentSkills = this.getCurrentSkillsList(resumeData);
      const optimizedSkills = this.getOptimizedSkillsList(resumeData);

      examples.push({
        issueId: 'skills-optimization',
        issueTitle: skillsIssue.title,
        category: 'skills',
        before: `Current skills (${this.countTotalSkills(resumeData)} total):\n${currentSkills}`,
        after: `Optimized skills (10-15 focused skills):\n${optimizedSkills}`,
        explanation: 'Trimmed skills list to 10-15 most relevant technical skills, grouped into clear categories. This improves ATS readability and focuses on your strongest competencies.',
        impactLevel: skillsIssue.severity
      });
    }

    return examples;
  }

  private static getCurrentSkillsList(resumeData: ResumeData): string {
    if (!resumeData.skills || resumeData.skills.length === 0) return 'No skills listed';

    return resumeData.skills.map(cat =>
      `${cat.category}: ${cat.list?.join(', ') || ''}`
    ).join('\n');
  }

  private static getOptimizedSkillsList(resumeData: ResumeData): string {
    // This is a simplified version - the actual optimization happens in skillsOptimizerService
    return `Programming Languages: JavaScript, Java, SQL
Frameworks & Libraries: React.js, Spring Boot, Node.js, Express
Databases: MySQL, PostgreSQL
Tools & Platforms: Git, REST API, Agile/SDLC`;
  }

  private static countTotalSkills(resumeData: ResumeData): number {
    if (!resumeData.skills) return 0;
    return resumeData.skills.reduce((sum, cat) => sum + (cat.list?.length || 0), 0);
  }

  private static generateProjectsExamples(
    resumeData: ResumeData,
    issues: ComplianceIssue[],
    userType: UserType
  ): BeforeAfterExample[] {
    const examples: BeforeAfterExample[] = [];

    const projectsIssue = issues.find(i => i.id === 'projects-count-low');

    if (projectsIssue) {
      const currentCount = resumeData.projects?.length || 0;
      const minRequired = userType === 'experienced' ? 2 : 3;

      examples.push({
        issueId: 'projects-count',
        issueTitle: `Need ${minRequired - currentCount} More Project(s)`,
        category: 'projects',
        before: `Current projects: ${currentCount}\n\n${this.listProjects(resumeData)}`,
        after: `Recommended: ${minRequired}-5 projects\n\nConsider adding projects like:\n- Full-stack E-commerce Platform (MERN/MEAN)\n- Real-time Chat Application (WebSockets + Node.js)\n- Task Management Dashboard (React + REST API)\n- Social Media Analytics Tool (Data visualization)`,
        explanation: `For ${userType} candidates, ${minRequired}-5 projects demonstrate practical experience and technical versatility. Choose projects that showcase your strongest skills and match the job requirements.`,
        impactLevel: projectsIssue.severity
      });
    }

    return examples;
  }

  private static listProjects(resumeData: ResumeData): string {
    if (!resumeData.projects || resumeData.projects.length === 0) return 'No projects listed';

    return resumeData.projects.map((proj, idx) =>
      `${idx + 1}. ${proj.title}`
    ).join('\n');
  }

  private static generateKeywordExamples(
    resumeData: ResumeData,
    issues: ComplianceIssue[],
    jobDescription: string
  ): BeforeAfterExample[] {
    const examples: BeforeAfterExample[] = [];

    const keywordIssue = issues.find(i => i.id === 'keywords-missing');

    if (keywordIssue && keywordIssue.currentValue) {
      examples.push({
        issueId: 'keywords-alignment',
        issueTitle: 'Missing Key Job Description Keywords',
        category: 'keywords',
        before: `Resume missing these JD keywords:\n${keywordIssue.currentValue}`,
        after: `Add these keywords naturally to:\n- Skills section (if you have experience)\n- Project descriptions (if you used these technologies)\n- Work experience bullets (if applicable)\n\nExample: "Developed Angular 2+ components with TypeScript" instead of "Developed frontend components"`,
        explanation: 'ATS systems match resumes to job descriptions by keywords. Adding relevant technical keywords (that you actually know) significantly improves your ATS score.',
        impactLevel: keywordIssue.severity
      });
    }

    return examples;
  }

  private static generateSummary(examples: BeforeAfterExample[], totalIssues: number): string {
    if (examples.length === 0) {
      return 'Your resume is highly ATS-compliant! No major issues found.';
    }

    const critical = examples.filter(e => e.impactLevel === 'critical').length;
    const high = examples.filter(e => e.impactLevel === 'high').length;

    return `Found ${totalIssues} ATS compliance issues. ${critical > 0 ? `${critical} critical` : ''} ${high > 0 ? `${high} high-priority` : ''} improvements identified. Review the Before → After examples below to optimize your resume.`;
  }

  private static calculateEstimatedImpact(issues: ComplianceIssue[]): string {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;

    if (criticalCount >= 2) {
      return 'High Impact: Fixing these issues could increase your ATS score by 30-40% and significantly improve recruiter response rates.';
    } else if (criticalCount === 1 || highCount >= 2) {
      return 'Medium-High Impact: These improvements could increase your ATS score by 20-30%.';
    } else if (highCount === 1) {
      return 'Medium Impact: These optimizations could increase your ATS score by 10-20%.';
    } else {
      return 'Low-Medium Impact: Minor optimizations that polish your resume for better ATS performance.';
    }
  }
}

export const resumeComparisonService = ResumeComparisonService;
