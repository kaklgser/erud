// src/services/resumeComplianceService.ts
import { ResumeData, UserType } from '../types/resume';

export interface ComplianceIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'section_order' | 'header' | 'metrics' | 'skills' | 'projects' | 'keywords';
  title: string;
  description: string;
  currentValue?: string;
  expectedValue?: string;
  affectedSection?: string;
}

export interface ComplianceReport {
  overallScore: number;
  issues: ComplianceIssue[];
  sectionsAnalyzed: number;
  passedChecks: number;
  totalChecks: number;
  recommendations: string[];
}

export class ResumeComplianceService {
  private static readonly CORRECT_SECTION_ORDER = {
    experienced: ['header', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
    fresher: ['header', 'careerObjective', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements'],
    student: ['header', 'careerObjective', 'education', 'skills', 'projects', 'experience', 'certifications', 'achievements']
  };

  private static readonly MIN_PROJECTS = {
    experienced: 2,
    fresher: 3,
    student: 3
  };

  private static readonly IDEAL_SKILLS_COUNT = { min: 10, max: 15 };
  private static readonly REQUIRED_HEADER_FIELDS = ['name', 'phone', 'email', 'location'];

  static analyzeCompliance(resumeData: ResumeData, userType: UserType, jobDescription?: string): ComplianceReport {
    const issues: ComplianceIssue[] = [];

    // 1. Check section order
    issues.push(...this.checkSectionOrder(resumeData, userType));

    // 2. Check header completeness
    issues.push(...this.checkHeader(resumeData, jobDescription));

    // 3. Check metrics in bullets
    issues.push(...this.checkMetrics(resumeData));

    // 4. Check skills count
    issues.push(...this.checkSkills(resumeData));

    // 5. Check project count
    issues.push(...this.checkProjects(resumeData, userType));

    // 6. Check keyword alignment (if JD provided)
    if (jobDescription) {
      issues.push(...this.checkKeywordAlignment(resumeData, jobDescription));
    }

    const totalChecks = 20;
    const passedChecks = totalChecks - issues.length;
    const overallScore = Math.round((passedChecks / totalChecks) * 100);

    const recommendations = this.generateRecommendations(issues);

    return {
      overallScore,
      issues,
      sectionsAnalyzed: 6,
      passedChecks,
      totalChecks,
      recommendations
    };
  }

  private static checkSectionOrder(resumeData: ResumeData, userType: UserType): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const expectedOrder = this.CORRECT_SECTION_ORDER[userType];
    const actualOrder = this.detectActualOrder(resumeData, userType);

    // Check if Skills comes before Experience
    const skillsIndex = actualOrder.indexOf('skills');
    const experienceIndex = actualOrder.indexOf('experience');

    if (skillsIndex > experienceIndex && skillsIndex !== -1 && experienceIndex !== -1) {
      issues.push({
        id: 'section-order-skills',
        severity: 'high',
        category: 'section_order',
        title: 'Skills section is after Experience',
        description: 'ATS systems prefer Skills section immediately after Summary/Objective for better keyword matching.',
        currentValue: 'Skills after Experience',
        expectedValue: 'Skills before Experience',
        affectedSection: 'skills'
      });
    }

    // Check if Education comes before Projects
    const educationIndex = actualOrder.indexOf('education');
    const projectsIndex = actualOrder.indexOf('projects');

    if (educationIndex < projectsIndex && educationIndex !== -1 && projectsIndex !== -1 && userType !== 'student') {
      issues.push({
        id: 'section-order-education',
        severity: 'medium',
        category: 'section_order',
        title: 'Education section is before Projects',
        description: 'For experienced/fresher candidates, Projects should come before Education to highlight practical experience.',
        currentValue: 'Education before Projects',
        expectedValue: 'Projects before Education',
        affectedSection: 'education'
      });
    }

    return issues;
  }

  private static detectActualOrder(resumeData: ResumeData, userType: UserType): string[] {
    const order: string[] = ['header'];

    if (resumeData.summary) order.push('summary');
    if (resumeData.careerObjective) order.push('careerObjective');
    if (resumeData.education?.length > 0) order.push('education');
    if (resumeData.skills?.length > 0) order.push('skills');
    if (resumeData.workExperience?.length > 0) order.push('experience');
    if (resumeData.projects?.length > 0) order.push('projects');
    if (resumeData.certifications?.length > 0) order.push('certifications');
    if (resumeData.achievements?.length > 0) order.push('achievements');

    return order;
  }

  private static checkHeader(resumeData: ResumeData, jobDescription?: string): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];

    // Check for missing location
    if (!resumeData.location || resumeData.location.trim() === '') {
      const locationRequired = jobDescription?.toLowerCase().includes('mumbai') ||
                              jobDescription?.toLowerCase().includes('location');

      issues.push({
        id: 'header-missing-location',
        severity: locationRequired ? 'critical' : 'high',
        category: 'header',
        title: 'Missing location in header',
        description: locationRequired
          ? 'Job requires specific location (Mumbai). Add "Mumbai, Maharashtra (Open to relocate)" or similar.'
          : 'Location field is empty. Adding location improves ATS matching for location-based roles.',
        currentValue: 'No location',
        expectedValue: 'City, State (Relocation preference)',
        affectedSection: 'header'
      });
    }

    // Check LinkedIn URL validity
    if (resumeData.linkedin) {
      const linkedInUrl = resumeData.linkedin.toLowerCase();
      const name = resumeData.name.toLowerCase().replace(/\s+/g, '-');

      if (!linkedInUrl.includes(name.split('-')[0]) && !linkedInUrl.includes(name.split('-')[1])) {
        issues.push({
          id: 'header-linkedin-mismatch',
          severity: 'critical',
          category: 'header',
          title: 'LinkedIn URL may not match your profile',
          description: 'The LinkedIn URL appears to point to someone else\'s profile. This is a major red flag for recruiters.',
          currentValue: resumeData.linkedin,
          expectedValue: `linkedin.com/in/${name}`,
          affectedSection: 'header'
        });
      }
    }

    // Check for missing phone
    if (!resumeData.phone || resumeData.phone.trim() === '') {
      issues.push({
        id: 'header-missing-phone',
        severity: 'medium',
        category: 'header',
        title: 'Missing phone number',
        description: 'Phone number is a standard resume field expected by recruiters.',
        affectedSection: 'header'
      });
    }

    return issues;
  }

  private static checkMetrics(resumeData: ResumeData): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    let totalBullets = 0;
    let bulletsWithMetrics = 0;

    // Check work experience bullets
    if (resumeData.workExperience) {
      resumeData.workExperience.forEach(job => {
        if (job.bullets) {
          job.bullets.forEach(bullet => {
            totalBullets++;
            if (this.hasMetric(bullet)) {
              bulletsWithMetrics++;
            }
          });
        }
      });
    }

    // Check project bullets
    if (resumeData.projects) {
      resumeData.projects.forEach(project => {
        if (project.bullets) {
          project.bullets.forEach(bullet => {
            totalBullets++;
            if (this.hasMetric(bullet)) {
              bulletsWithMetrics++;
            }
          });
        }
      });
    }

    const metricsPercentage = totalBullets > 0 ? (bulletsWithMetrics / totalBullets) * 100 : 0;

    if (metricsPercentage < 50) {
      issues.push({
        id: 'metrics-missing',
        severity: 'critical',
        category: 'metrics',
        title: 'Most bullets lack quantifiable metrics',
        description: `Only ${Math.round(metricsPercentage)}% of bullets contain numbers/metrics. ATS rulebook requires metrics in most bullets to demonstrate impact.`,
        currentValue: `${bulletsWithMetrics} out of ${totalBullets} bullets have metrics`,
        expectedValue: 'At least 70% of bullets should include metrics (%, numbers, time, scale)',
        affectedSection: 'experience/projects'
      });
    }

    return issues;
  }

  private static hasMetric(bullet: string): boolean {
    const metricPatterns = [
      /\d+%/,                    // Percentage
      /\d+x/i,                   // Multiplier
      /\$\d+/,                   // Currency
      /\d+(?:,\d{3})+/,          // Large numbers with commas
      /\d+\+/,                   // Numbers with plus
      /\d+\s*(?:users|transactions|requests|ms|seconds|hours|days|weeks)/i, // Scale/time
      /reduced.*?\d+/i,          // Reduction with number
      /increased.*?\d+/i,        // Increase with number
      /improved.*?\d+/i,         // Improvement with number
      /\[\w+%?\]/                // Placeholder metrics like [X%]
    ];

    return metricPatterns.some(pattern => pattern.test(bullet));
  }

  private static checkSkills(resumeData: ResumeData): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];

    if (!resumeData.skills || resumeData.skills.length === 0) {
      issues.push({
        id: 'skills-missing',
        severity: 'critical',
        category: 'skills',
        title: 'No skills section found',
        description: 'Skills section is mandatory for ATS optimization.',
        affectedSection: 'skills'
      });
      return issues;
    }

    // Count total unique skills
    const totalSkills = resumeData.skills.reduce((sum, category) => {
      return sum + (category.list?.length || 0);
    }, 0);

    if (totalSkills < this.IDEAL_SKILLS_COUNT.min) {
      issues.push({
        id: 'skills-too-few',
        severity: 'high',
        category: 'skills',
        title: 'Too few skills listed',
        description: `You have ${totalSkills} skills. ATS rulebook recommends ${this.IDEAL_SKILLS_COUNT.min}-${this.IDEAL_SKILLS_COUNT.max} focused technical skills.`,
        currentValue: `${totalSkills} skills`,
        expectedValue: `${this.IDEAL_SKILLS_COUNT.min}-${this.IDEAL_SKILLS_COUNT.max} skills`,
        affectedSection: 'skills'
      });
    } else if (totalSkills > this.IDEAL_SKILLS_COUNT.max + 5) {
      issues.push({
        id: 'skills-too-many',
        severity: 'medium',
        category: 'skills',
        title: 'Skills list is too long',
        description: `You have ${totalSkills} skills. ATS rulebook recommends ${this.IDEAL_SKILLS_COUNT.min}-${this.IDEAL_SKILLS_COUNT.max} focused technical skills for better impact.`,
        currentValue: `${totalSkills} skills`,
        expectedValue: `${this.IDEAL_SKILLS_COUNT.min}-${this.IDEAL_SKILLS_COUNT.max} skills`,
        affectedSection: 'skills'
      });
    }

    return issues;
  }

  private static checkProjects(resumeData: ResumeData, userType: UserType): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    const projectCount = resumeData.projects?.length || 0;
    const minRequired = this.MIN_PROJECTS[userType];

    if (projectCount < minRequired) {
      issues.push({
        id: 'projects-count-low',
        severity: 'high',
        category: 'projects',
        title: `Not enough projects for ${userType}`,
        description: `You have ${projectCount} project(s). ATS rulebook recommends ${minRequired}-5 projects for ${userType} candidates to demonstrate practical experience.`,
        currentValue: `${projectCount} projects`,
        expectedValue: `${minRequired}-5 projects`,
        affectedSection: 'projects'
      });
    }

    return issues;
  }

  private static checkKeywordAlignment(resumeData: ResumeData, jobDescription: string): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];

    // Extract key technical skills from JD
    const jdKeywords = this.extractKeywords(jobDescription);
    const resumeText = this.extractResumeText(resumeData);

    const missingKeywords = jdKeywords.filter(keyword =>
      !resumeText.toLowerCase().includes(keyword.toLowerCase())
    );

    if (missingKeywords.length > 0) {
      issues.push({
        id: 'keywords-missing',
        severity: 'high',
        category: 'keywords',
        title: 'Missing key JD keywords',
        description: `Your resume is missing ${missingKeywords.length} important keywords from the job description: ${missingKeywords.slice(0, 5).join(', ')}.`,
        currentValue: `Missing: ${missingKeywords.join(', ')}`,
        expectedValue: 'Include relevant JD keywords in Skills, Experience, or Projects',
        affectedSection: 'skills/experience'
      });
    }

    return issues;
  }

  private static extractKeywords(jobDescription: string): string[] {
    const commonTechKeywords = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot',
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQL',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
      'Git', 'CI/CD', 'Agile', 'REST API', 'GraphQL',
      'HTML', 'CSS', 'HTML5', 'CSS3'
    ];

    const foundKeywords = commonTechKeywords.filter(keyword =>
      jobDescription.toLowerCase().includes(keyword.toLowerCase())
    );

    return foundKeywords;
  }

  private static extractResumeText(resumeData: ResumeData): string {
    const parts: string[] = [];

    if (resumeData.summary) parts.push(resumeData.summary);
    if (resumeData.careerObjective) parts.push(resumeData.careerObjective);

    if (resumeData.skills) {
      resumeData.skills.forEach(cat => {
        if (cat.list) parts.push(...cat.list);
      });
    }

    if (resumeData.workExperience) {
      resumeData.workExperience.forEach(job => {
        parts.push(job.role);
        if (job.bullets) parts.push(...job.bullets);
      });
    }

    if (resumeData.projects) {
      resumeData.projects.forEach(proj => {
        parts.push(proj.title);
        if (proj.bullets) parts.push(...proj.bullets);
      });
    }

    return parts.join(' ');
  }

  private static generateRecommendations(issues: ComplianceIssue[]): string[] {
    const recommendations: string[] = [];

    // Prioritize by severity
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');

    if (criticalIssues.length > 0) {
      recommendations.push(`Fix ${criticalIssues.length} critical issue(s) first: ${criticalIssues.map(i => i.title).join(', ')}`);
    }

    if (highIssues.length > 0) {
      recommendations.push(`Address ${highIssues.length} high-priority issue(s): ${highIssues.map(i => i.title).join(', ')}`);
    }

    // Add specific actionable recommendations
    const hasMetricsIssue = issues.some(i => i.id === 'metrics-missing');
    if (hasMetricsIssue) {
      recommendations.push('Add quantifiable metrics to your bullets: Use numbers, percentages, time saved, or scale (e.g., "Reduced load time by 40%", "Served 10,000+ users")');
    }

    const hasSectionOrderIssue = issues.some(i => i.category === 'section_order');
    if (hasSectionOrderIssue) {
      recommendations.push('Reorder sections to match ATS standards: Summary → Skills → Experience → Projects → Education → Certifications');
    }

    const hasSkillsIssue = issues.some(i => i.category === 'skills');
    if (hasSkillsIssue) {
      recommendations.push('Optimize your Skills section: Keep 10-15 focused technical skills grouped into categories (Languages, Frameworks, Databases, Tools)');
    }

    return recommendations;
  }
}

export const resumeComplianceService = ResumeComplianceService;
