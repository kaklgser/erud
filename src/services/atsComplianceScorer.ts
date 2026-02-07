import { atsRulebookService, ATSComplianceResult } from './atsRulebookService';
import { jdKeywordExtractor, JDAnalysisResult } from './jdKeywordExtractor';
import { projectStructureValidator } from './projectStructureValidator';
import { certificationExpander } from './certificationExpander';
import { metricPreserver } from './metricPreserver';

export interface ATSScores {
  ats_formatting: number;
  technical_impact: number;
  keyword_optimization: number;
  jd_alignment: number;
  project_structuring: number;
  certifications_quality: number;
  overall_score: number;
}

export interface ATSAnalysis {
  section_order_ok: boolean;
  missing_sections: string[];
  summary_word_count: number;
  total_word_count: number;
  keyword_frequency: { [keyword: string]: number };
  job_title_mentions: {
    header: boolean;
    summary: boolean;
    experience: boolean;
  };
  bullets_with_no_metrics_count: number;
  non_compliant_projects: string[];
  certifications_needing_fix: string[];
  notes_for_candidate: string[];
}

export interface OptimizedResumeOutput {
  optimized_resume: string;
  scores: ATSScores;
  analysis: ATSAnalysis;
}

export class ATSComplianceScorer {
  static calculateATSFormatting(
    resumeData: any,
    complianceResult: ATSComplianceResult
  ): number {
    let score = 100;

    if (!complianceResult.sectionOrder.isValid) {
      score -= complianceResult.sectionOrder.violations.length * 15;
    }

    if (!complianceResult.wordCount.isValid) {
      score -= Math.min(20, complianceResult.wordCount.violations.length * 5);
    }

    if (complianceResult.sectionOrder.actualOrder.length < 5) {
      score -= 10;
    }

    const hasContactInfo = resumeData.name && resumeData.email && resumeData.phone;
    if (!hasContactInfo) {
      score -= 15;
    }

    const hasRequiredSections = resumeData.skills && resumeData.education;
    if (!hasRequiredSections) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  static calculateTechnicalImpact(
    resumeData: any,
    bulletPattern: any,
    jdAnalysis: JDAnalysisResult
  ): number {
    let score = 0;

    const metricsScore = Math.min(40, Math.round(bulletPattern.metricsPercentage * 0.4));
    score += metricsScore;

    const actionVerbsPercentage = (bulletPattern.bulletsWithActionVerbs / bulletPattern.bulletsAnalyzed) * 100;
    const verbsScore = Math.min(30, Math.round(actionVerbsPercentage * 0.3));
    score += verbsScore;

    const techSkillsPercentage = (bulletPattern.bulletsWithTechSkills / bulletPattern.bulletsAnalyzed) * 100;
    const techScore = Math.min(30, Math.round(techSkillsPercentage * 0.3));
    score += techScore;

    return Math.max(0, Math.min(100, score));
  }

  static calculateKeywordOptimization(
    resumeData: any,
    jdAnalysis: JDAnalysisResult,
    keywordFrequencies: any[]
  ): number {
    const optimalKeywords = keywordFrequencies.filter(k => k.isOptimal).length;
    const totalKeywords = keywordFrequencies.length;

    if (totalKeywords === 0) return 50;

    const optimizationRate = (optimalKeywords / totalKeywords) * 100;

    let score = optimizationRate;

    const underused = keywordFrequencies.filter(k => k.frequency < k.targetMin).length;
    const overused = keywordFrequencies.filter(k => k.frequency > k.targetMax).length;

    if (underused > totalKeywords * 0.3) {
      score -= 10;
    }

    if (overused > totalKeywords * 0.2) {
      score -= 15;
    }

    const topKeywordsPresent = jdAnalysis.topTechnicalSkills
      .slice(0, 5)
      .filter(skill => {
        const resumeText = JSON.stringify(resumeData).toLowerCase();
        return resumeText.includes(skill.toLowerCase());
      }).length;

    const topKeywordsBonus = (topKeywordsPresent / 5) * 10;
    score += topKeywordsBonus;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  static calculateJDAlignment(
    resumeData: any,
    jdAnalysis: JDAnalysisResult,
    jobTitlePlacement: any
  ): number {
    let score = 0;

    if (jobTitlePlacement.isValid) {
      score += 30;
    } else {
      score += jobTitlePlacement.totalMentions * 10;
    }

    const resumeText = JSON.stringify(resumeData).toLowerCase();

    const criticalSkillsPresent = jdAnalysis.allKeywords
      .filter(k => k.importance === 'critical')
      .filter(k => resumeText.includes(k.keyword.toLowerCase()))
      .length;

    const totalCriticalSkills = jdAnalysis.allKeywords.filter(k => k.importance === 'critical').length;

    if (totalCriticalSkills > 0) {
      score += (criticalSkillsPresent / totalCriticalSkills) * 40;
    } else {
      score += 20;
    }

    const domainMatch = jdAnalysis.domainKeywords.some(domain =>
      resumeText.includes(domain.toLowerCase())
    );

    if (domainMatch) {
      score += 15;
    }

    const architectureMatch = jdAnalysis.architectureTerms.filter(term =>
      resumeText.includes(term.toLowerCase())
    ).length;

    score += Math.min(15, architectureMatch * 3);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  static calculateProjectStructuring(resumeData: any): number {
    if (!resumeData.projects || resumeData.projects.length === 0) {
      return 50;
    }

    const projectsToValidate = resumeData.projects.map((p: any) => ({
      title: p.title || 'Untitled Project',
      bullets: p.bullets || []
    }));

    const validation = projectStructureValidator.validateMultipleProjects(projectsToValidate);

    return Math.round(validation.averageScore);
  }

  static calculateCertificationsQuality(resumeData: any): number {
    if (!resumeData.certifications || resumeData.certifications.length === 0) {
      return 70;
    }

    let score = 0;
    let totalCerts = 0;

    for (const cert of resumeData.certifications) {
      totalCerts++;
      const certName = typeof cert === 'string' ? cert : cert.title || cert.name || '';

      const validation = certificationExpander.validateCertificationFormat(certName);

      if (validation.isValid) {
        score += 100;
      } else {
        score += Math.max(0, 100 - (validation.issues.length * 20));
      }
    }

    const avgScore = totalCerts > 0 ? score / totalCerts : 70;

    if (totalCerts >= 3) {
      return Math.min(100, avgScore + 10);
    }

    return Math.round(avgScore);
  }

  static generateATSScores(
    resumeData: any,
    jobDescription: string,
    jdAnalysis: JDAnalysisResult
  ): ATSScores {
    const topKeywords = jdAnalysis.topTechnicalSkills.slice(0, 10);

    const complianceResult = atsRulebookService.validateFullCompliance(
      resumeData,
      jobDescription,
      topKeywords
    );

    const ats_formatting = this.calculateATSFormatting(resumeData, complianceResult);
    const technical_impact = this.calculateTechnicalImpact(
      resumeData,
      complianceResult.bulletPattern,
      jdAnalysis
    );
    const keyword_optimization = this.calculateKeywordOptimization(
      resumeData,
      jdAnalysis,
      complianceResult.keywordFrequencies
    );
    const jd_alignment = this.calculateJDAlignment(
      resumeData,
      jdAnalysis,
      complianceResult.jobTitlePlacement
    );
    const project_structuring = this.calculateProjectStructuring(resumeData);
    const certifications_quality = this.calculateCertificationsQuality(resumeData);

    const overall_score = Math.round(
      (ats_formatting * 0.20 +
       technical_impact * 0.20 +
       keyword_optimization * 0.20 +
       jd_alignment * 0.15 +
       project_structuring * 0.15 +
       certifications_quality * 0.10)
    );

    return {
      ats_formatting,
      technical_impact,
      keyword_optimization,
      jd_alignment,
      project_structuring,
      certifications_quality,
      overall_score
    };
  }

  static generateATSAnalysis(
    resumeData: any,
    jobDescription: string,
    jdAnalysis: JDAnalysisResult
  ): ATSAnalysis {
    const topKeywords = jdAnalysis.topTechnicalSkills.slice(0, 10);

    const complianceResult = atsRulebookService.validateFullCompliance(
      resumeData,
      jobDescription,
      topKeywords
    );

    const section_order_ok = complianceResult.sectionOrder.isValid;

    const missing_sections: string[] = [];
    const expectedSections = ['header', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'];
    const actualSections = complianceResult.sectionOrder.actualOrder;

    for (const section of expectedSections) {
      if (!actualSections.includes(section) && section !== 'certifications') {
        missing_sections.push(section);
      }
    }

    const summary_word_count = complianceResult.wordCount.summaryWords;
    const total_word_count = complianceResult.wordCount.totalWords;

    const keyword_frequency: { [keyword: string]: number } = {};
    for (const kf of complianceResult.keywordFrequencies) {
      keyword_frequency[kf.keyword] = kf.frequency;
    }

    const job_title_mentions = {
      header: complianceResult.jobTitlePlacement.inHeader,
      summary: complianceResult.jobTitlePlacement.inSummary,
      experience: complianceResult.jobTitlePlacement.inExperience
    };

    const bullets_with_no_metrics_count =
      complianceResult.bulletPattern.bulletsAnalyzed -
      complianceResult.bulletPattern.bulletsWithMetrics;

    const non_compliant_projects: string[] = [];
    if (resumeData.projects) {
      const projectsToValidate = resumeData.projects.map((p: any) => ({
        title: p.title || 'Untitled',
        bullets: p.bullets || []
      }));

      const projectValidation = projectStructureValidator.validateMultipleProjects(projectsToValidate);
      non_compliant_projects.push(...projectValidation.nonCompliantProjects);
    }

    const certifications_needing_fix: string[] = [];
    if (resumeData.certifications) {
      for (const cert of resumeData.certifications) {
        const certName = typeof cert === 'string' ? cert : cert.title || cert.name || '';
        const validation = certificationExpander.validateCertificationFormat(certName);

        if (!validation.isValid) {
          certifications_needing_fix.push(certName);
        }
      }
    }

    const notes_for_candidate: string[] = [];

    if (!section_order_ok) {
      notes_for_candidate.push('Fix section order to match ATS requirements');
    }

    if (total_word_count < 400) {
      notes_for_candidate.push(`Resume is too short (${total_word_count} words, target: 400-650)`);
    } else if (total_word_count > 650) {
      notes_for_candidate.push(`Resume is too long (${total_word_count} words, target: 400-650)`);
    }

    if (bullets_with_no_metrics_count > complianceResult.bulletPattern.bulletsAnalyzed * 0.25) {
      notes_for_candidate.push(`Add quantifiable metrics to ${bullets_with_no_metrics_count} more bullets`);
    }

    if (!complianceResult.jobTitlePlacement.isValid) {
      const locations = [];
      if (!job_title_mentions.header) locations.push('header');
      if (!job_title_mentions.summary) locations.push('summary');
      notes_for_candidate.push(`Include job title "${jdAnalysis.jobTitle}" in: ${locations.join(', ')}`);
    }

    if (non_compliant_projects.length > 0) {
      notes_for_candidate.push(`Fix project structure for: ${non_compliant_projects.join(', ')}`);
    }

    if (certifications_needing_fix.length > 0) {
      notes_for_candidate.push(`Expand certification names: ${certifications_needing_fix.slice(0, 2).join(', ')}`);
    }

    const underusedKeywords = complianceResult.keywordFrequencies.filter(k => k.frequency < k.targetMin);
    if (underusedKeywords.length > 0) {
      notes_for_candidate.push(
        `Increase usage of keywords: ${underusedKeywords.slice(0, 3).map(k => k.keyword).join(', ')}`
      );
    }

    return {
      section_order_ok,
      missing_sections,
      summary_word_count,
      total_word_count,
      keyword_frequency,
      job_title_mentions,
      bullets_with_no_metrics_count,
      non_compliant_projects,
      certifications_needing_fix,
      notes_for_candidate: notes_for_candidate.slice(0, 10)
    };
  }

  static formatOptimizedResumeOutput(
    resumeData: any,
    jobDescription: string
  ): OptimizedResumeOutput {
    const jdAnalysis = jdKeywordExtractor.analyzeJobDescription(jobDescription);

    const scores = this.generateATSScores(resumeData, jobDescription, jdAnalysis);
    const analysis = this.generateATSAnalysis(resumeData, jobDescription, jdAnalysis);

    const optimized_resume = this.convertResumeDataToText(resumeData);

    return {
      optimized_resume,
      scores,
      analysis
    };
  }

  private static convertResumeDataToText(resumeData: any): string {
    const lines: string[] = [];

    if (resumeData.name) {
      lines.push(resumeData.name.toUpperCase());
      lines.push('');
    }

    if (resumeData.phone || resumeData.email || resumeData.location) {
      const contactInfo: string[] = [];
      if (resumeData.phone) contactInfo.push(resumeData.phone);
      if (resumeData.email) contactInfo.push(resumeData.email);
      if (resumeData.location) contactInfo.push(resumeData.location);
      lines.push(contactInfo.join(' | '));
    }

    if (resumeData.linkedin || resumeData.github) {
      const socialLinks: string[] = [];
      if (resumeData.linkedin) socialLinks.push(`LinkedIn: ${resumeData.linkedin}`);
      if (resumeData.github) socialLinks.push(`GitHub: ${resumeData.github}`);
      lines.push(socialLinks.join(' | '));
      lines.push('');
    }

    if (resumeData.summary) {
      lines.push('PROFESSIONAL SUMMARY');
      lines.push(resumeData.summary);
      lines.push('');
    } else if (resumeData.careerObjective) {
      lines.push('CAREER OBJECTIVE');
      lines.push(resumeData.careerObjective);
      lines.push('');
    }

    if (resumeData.skills && resumeData.skills.length > 0) {
      lines.push('SKILLS');
      for (const skillCategory of resumeData.skills) {
        const skillList = Array.isArray(skillCategory.list) ? skillCategory.list.join(', ') : '';
        lines.push(`${skillCategory.category}: ${skillList}`);
      }
      lines.push('');
    }

    if (resumeData.workExperience && resumeData.workExperience.length > 0) {
      lines.push('WORK EXPERIENCE');
      for (const exp of resumeData.workExperience) {
        lines.push(`${exp.role} | ${exp.company} | ${exp.year}`);
        if (exp.bullets && exp.bullets.length > 0) {
          for (const bullet of exp.bullets) {
            lines.push(`• ${bullet}`);
          }
        }
        lines.push('');
      }
    }

    if (resumeData.projects && resumeData.projects.length > 0) {
      lines.push('PROJECTS');
      for (const project of resumeData.projects) {
        lines.push(project.title);
        if (project.bullets && project.bullets.length > 0) {
          for (const bullet of project.bullets) {
            lines.push(`• ${bullet}`);
          }
        }
        lines.push('');
      }
    }

    if (resumeData.education && resumeData.education.length > 0) {
      lines.push('EDUCATION');
      for (const edu of resumeData.education) {
        const eduLine = [edu.degree, edu.school, edu.year].filter(Boolean).join(' | ');
        lines.push(eduLine);
        if (edu.cgpa) {
          lines.push(`CGPA: ${edu.cgpa}`);
        }
        lines.push('');
      }
    }

    if (resumeData.certifications && resumeData.certifications.length > 0) {
      lines.push('CERTIFICATIONS');
      for (const cert of resumeData.certifications) {
        const certName = typeof cert === 'string' ? cert : cert.title || cert.name || '';
        lines.push(`• ${certName}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}

export const atsComplianceScorer = ATSComplianceScorer;
