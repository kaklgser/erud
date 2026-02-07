export interface ATSParsingResult {
  score: number;
  issues: ATSIssue[];
  sections: ATSSection[];
  contactInfo: ContactValidation;
  formatting: FormattingValidation;
  recommendations: string[];
}

export interface ATSIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  location?: string;
}

export interface ATSSection {
  name: string;
  detected: boolean;
  headerFormat: 'correct' | 'incorrect' | 'missing';
  bulletCount: number;
  dateFormat: 'consistent' | 'inconsistent' | 'none';
}

export interface ContactValidation {
  hasName: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasLocation: boolean;
  isTopAligned: boolean;
  issues: string[];
}

export interface FormattingValidation {
  hasHeaders: boolean;
  headerStyle: 'uppercase' | 'titlecase' | 'mixed';
  bulletStyle: 'consistent' | 'mixed';
  dateFormat: 'standard' | 'nonstandard' | 'missing';
  hasColumns: boolean;
  hasGraphics: boolean;
  fontConsistent: boolean;
}

export class ATSSimulator {
  private static readonly ATS_SYSTEMS = {
    workday: {
      name: 'Workday',
      strictness: 0.9,
      requiresStandardSections: true,
      parsesGraphics: false
    },
    taleo: {
      name: 'Taleo (Oracle)',
      strictness: 0.85,
      requiresStandardSections: true,
      parsesGraphics: false
    },
    greenhouse: {
      name: 'Greenhouse',
      strictness: 0.75,
      requiresStandardSections: false,
      parsesGraphics: false
    },
    lever: {
      name: 'Lever',
      strictness: 0.7,
      requiresStandardSections: false,
      parsesGraphics: false
    }
  };

  private static readonly STANDARD_SECTIONS = [
    'WORK EXPERIENCE',
    'EXPERIENCE',
    'PROFESSIONAL EXPERIENCE',
    'EMPLOYMENT HISTORY',
    'EDUCATION',
    'SKILLS',
    'TECHNICAL SKILLS',
    'PROJECTS',
    'CERTIFICATIONS'
  ];

  private static readonly DATE_PATTERNS = [
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*[-–—]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/gi,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*[-–—]\s*Present\b/gi,
    /\b\d{4}\s*[-–—]\s*\d{4}\b/g,
    /\b\d{4}\s*[-–—]\s*Present\b/gi
  ];

  static simulateATS(resumeText: string, targetSystem: keyof typeof ATSSimulator.ATS_SYSTEMS = 'workday'): ATSParsingResult {
    const issues: ATSIssue[] = [];
    const sections: ATSSection[] = [];
    const recommendations: string[] = [];

    const system = this.ATS_SYSTEMS[targetSystem];

    const contactInfo = this.validateContactInfo(resumeText);
    contactInfo.issues.forEach(issue => {
      issues.push({
        severity: 'critical',
        category: 'Contact Information',
        message: issue,
        location: 'Header'
      });
    });

    const formatting = this.validateFormatting(resumeText);
    if (!formatting.hasHeaders) {
      issues.push({
        severity: 'critical',
        category: 'Structure',
        message: 'No section headers detected. ATS may fail to parse resume.',
        location: 'Overall'
      });
      recommendations.push('Add clear section headers in ALL CAPS (e.g., WORK EXPERIENCE, EDUCATION, SKILLS)');
    }

    if (formatting.headerStyle === 'mixed') {
      issues.push({
        severity: 'warning',
        category: 'Formatting',
        message: 'Inconsistent header capitalization. Use ALL CAPS for better ATS compatibility.',
        location: 'Section Headers'
      });
      recommendations.push('Standardize all section headers to ALL CAPS');
    }

    if (formatting.hasGraphics) {
      issues.push({
        severity: 'critical',
        category: 'Graphics',
        message: `${system.name} cannot parse graphics, tables, or images. Content may be lost.`,
        location: 'Overall'
      });
      recommendations.push('Remove all graphics, charts, and tables. Use plain text only.');
    }

    if (formatting.hasColumns) {
      issues.push({
        severity: 'warning',
        category: 'Layout',
        message: 'Multi-column layout detected. ATS may parse content out of order.',
        location: 'Overall'
      });
      recommendations.push('Use single-column layout for better ATS parsing');
    }

    const detectedSections = this.detectSections(resumeText);
    detectedSections.forEach(section => {
      sections.push(section);

      if (!section.detected && system.requiresStandardSections) {
        issues.push({
          severity: 'warning',
          category: 'Missing Section',
          message: `Standard section "${section.name}" not found. ${system.name} expects this section.`,
          location: section.name
        });
      }

      if (section.dateFormat === 'inconsistent') {
        issues.push({
          severity: 'warning',
          category: 'Date Format',
          message: `Inconsistent date format in ${section.name}. Use "Jan 2023 – Mar 2024" format.`,
          location: section.name
        });
        recommendations.push(`Standardize dates in ${section.name} to "Mon YYYY – Mon YYYY" format`);
      }

      if (section.bulletCount > 0 && section.headerFormat === 'incorrect') {
        issues.push({
          severity: 'warning',
          category: 'Section Format',
          message: `${section.name} header not in standard format. Use ALL CAPS.`,
          location: section.name
        });
      }
    });

    const bulletValidation = this.validateBulletPoints(resumeText);
    if (bulletValidation.hasNoBullets) {
      issues.push({
        severity: 'critical',
        category: 'Content Structure',
        message: 'No bullet points detected. ATS expects bullet-point format for experience.',
        location: 'Experience Sections'
      });
      recommendations.push('Format all experience and project descriptions as bullet points');
    }

    if (bulletValidation.inconsistentStyle) {
      issues.push({
        severity: 'warning',
        category: 'Bullet Format',
        message: 'Inconsistent bullet point style (mixing •, -, *, etc.). Use single style.',
        location: 'Overall'
      });
      recommendations.push('Use consistent bullet style throughout (• or simple dash)');
    }

    const skillsParsing = this.validateSkillsSection(resumeText);
    if (!skillsParsing.detected) {
      issues.push({
        severity: 'warning',
        category: 'Skills Section',
        message: 'Skills section not clearly detected. ATS may miss important keywords.',
        location: 'Skills'
      });
      recommendations.push('Add clear SKILLS or TECHNICAL SKILLS section with comma-separated list');
    } else if (skillsParsing.hasSubcategories && targetSystem === 'taleo') {
      issues.push({
        severity: 'info',
        category: 'Skills Format',
        message: 'Taleo may not parse skills subcategories well. Consider flat list.',
        location: 'Skills'
      });
    }

    const specialCharValidation = this.validateSpecialCharacters(resumeText);
    if (specialCharValidation.hasProblematicChars) {
      issues.push({
        severity: 'warning',
        category: 'Special Characters',
        message: `Problematic characters detected: ${specialCharValidation.chars.join(', ')}`,
        location: 'Overall'
      });
      recommendations.push('Replace special characters with standard ASCII equivalents');
    }

    const score = this.calculateATSScore(
      issues,
      sections,
      contactInfo,
      formatting,
      system.strictness
    );

    return {
      score,
      issues,
      sections,
      contactInfo,
      formatting,
      recommendations
    };
  }

  private static validateContactInfo(text: string): ContactValidation {
    const first200 = text.substring(0, 200);
    const issues: string[] = [];

    const hasName = /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(first200.trim());
    if (!hasName) {
      issues.push('Name not detected at top of resume');
    }

    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(first200);
    if (!hasEmail) {
      issues.push('Email address not found in contact section');
    }

    const hasPhone = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(first200);
    if (!hasPhone) {
      issues.push('Phone number not found in contact section');
    }

    const hasLocation = /(,\s*[A-Z]{2}|[A-Z][a-z]+,\s*[A-Z]{2})/.test(first200);

    return {
      hasName,
      hasEmail,
      hasPhone,
      hasLocation,
      isTopAligned: true,
      issues
    };
  }

  private static validateFormatting(text: string): FormattingValidation {
    const headerMatches = text.match(/^[A-Z\s]{3,}$/gm);
    const hasHeaders = (headerMatches?.length || 0) > 0;

    let headerStyle: 'uppercase' | 'titlecase' | 'mixed' = 'uppercase';
    if (headerMatches) {
      const hasUppercase = headerMatches.some(h => h === h.toUpperCase());
      const hasTitlecase = headerMatches.some(h => /^[A-Z][a-z]/.test(h));
      if (hasUppercase && hasTitlecase) {
        headerStyle = 'mixed';
      } else if (hasTitlecase) {
        headerStyle = 'titlecase';
      }
    }

    const bulletMarkers = text.match(/^[\s]*[•●○◦▪▫■□★☆►▸→⇒➤➢⮕]\s/gm) || [];
    const dashMarkers = text.match(/^[\s]*[-–—]\s/gm) || [];
    const bulletStyle = bulletMarkers.length > 0 && dashMarkers.length > 0 ? 'mixed' : 'consistent';

    const dateMatches = text.match(/\d{4}/g);
    const dateFormat = dateMatches && dateMatches.length > 2 ? 'standard' : 'missing';

    const hasColumns = text.includes('\t\t') || /\s{10,}/.test(text);
    const hasGraphics = /\[image\]|\[chart\]|\[graph\]/i.test(text);
    const fontConsistent = true;

    return {
      hasHeaders,
      headerStyle,
      bulletStyle,
      dateFormat,
      hasColumns,
      hasGraphics,
      fontConsistent
    };
  }

  private static detectSections(text: string): ATSSection[] {
    const sections: ATSSection[] = [];

    const sectionPatterns = [
      { name: 'WORK EXPERIENCE', pattern: /(WORK\s+EXPERIENCE|PROFESSIONAL\s+EXPERIENCE|EXPERIENCE|EMPLOYMENT)/i },
      { name: 'EDUCATION', pattern: /EDUCATION/i },
      { name: 'SKILLS', pattern: /(TECHNICAL\s+)?SKILLS/i },
      { name: 'PROJECTS', pattern: /PROJECTS/i },
      { name: 'CERTIFICATIONS', pattern: /CERTIFICATIONS?/i }
    ];

    sectionPatterns.forEach(({ name, pattern }) => {
      const match = text.match(pattern);
      const detected = match !== null;

      let headerFormat: 'correct' | 'incorrect' | 'missing' = 'missing';
      if (detected && match) {
        headerFormat = match[0] === match[0].toUpperCase() ? 'correct' : 'incorrect';
      }

      let bulletCount = 0;
      let dateFormat: 'consistent' | 'inconsistent' | 'none' = 'none';

      if (detected && match) {
        const sectionStart = text.indexOf(match[0]);
        const nextSection = text.substring(sectionStart + 100).search(/^[A-Z\s]{3,}$/m);
        const sectionText = nextSection > 0
          ? text.substring(sectionStart, sectionStart + 100 + nextSection)
          : text.substring(sectionStart, sectionStart + 500);

        bulletCount = (sectionText.match(/^[\s]*[•\-–]/gm) || []).length;

        const dates = this.extractDatesFromSection(sectionText);
        dateFormat = this.validateDateConsistency(dates);
      }

      sections.push({
        name,
        detected,
        headerFormat,
        bulletCount,
        dateFormat
      });
    });

    return sections;
  }

  private static extractDatesFromSection(text: string): string[] {
    const dates: string[] = [];

    this.DATE_PATTERNS.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        dates.push(match[0]);
      }
    });

    return dates;
  }

  private static validateDateConsistency(dates: string[]): 'consistent' | 'inconsistent' | 'none' {
    if (dates.length === 0) return 'none';
    if (dates.length === 1) return 'consistent';

    const formats = dates.map(date => {
      if (/Jan|Feb|Mar/i.test(date)) return 'month-year';
      if (/^\d{4}/.test(date)) return 'year-only';
      return 'unknown';
    });

    const uniqueFormats = new Set(formats);
    return uniqueFormats.size === 1 ? 'consistent' : 'inconsistent';
  }

  private static validateBulletPoints(text: string): { hasNoBullets: boolean; inconsistentStyle: boolean } {
    const bulletMarkers = text.match(/^[\s]*[•●○◦▪▫■□★☆►▸→⇒➤➢⮕]\s/gm) || [];
    const dashMarkers = text.match(/^[\s]*[-–—]\s/gm) || [];

    const hasNoBullets = bulletMarkers.length === 0 && dashMarkers.length === 0;
    const inconsistentStyle = bulletMarkers.length > 0 && dashMarkers.length > 0;

    return { hasNoBullets, inconsistentStyle };
  }

  private static validateSkillsSection(text: string): { detected: boolean; hasSubcategories: boolean } {
    const skillsMatch = text.match(/(TECHNICAL\s+)?SKILLS[\s\S]{0,500}/i);
    const detected = skillsMatch !== null;

    let hasSubcategories = false;
    if (detected && skillsMatch) {
      hasSubcategories = /:\s*[\w\s,]+(\n|$)/g.test(skillsMatch[0]);
    }

    return { detected, hasSubcategories };
  }

  private static validateSpecialCharacters(text: string): { hasProblematicChars: boolean; chars: string[] } {
    const problematicChars: string[] = [];
    const problematicPatterns = [
      { char: '"', name: 'Smart quotes' },
      { char: '"', name: 'Smart quotes' },
      { char: ''', name: 'Smart apostrophe' },
      { char: ''', name: 'Smart apostrophe' },
      { char: '—', name: 'Em dash (use - instead)' },
      { char: '–', name: 'En dash (use - instead)' }
    ];

    problematicPatterns.forEach(({ char, name }) => {
      if (text.includes(char)) {
        problematicChars.push(name);
      }
    });

    return {
      hasProblematicChars: problematicChars.length > 0,
      chars: problematicChars
    };
  }

  private static calculateATSScore(
    issues: ATSIssue[],
    sections: ATSSection[],
    contactInfo: ContactValidation,
    formatting: FormattingValidation,
    systemStrictness: number
  ): number {
    let score = 100;

    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;

    score -= criticalCount * 15;
    score -= warningCount * 5;
    score -= infoCount * 2;

    if (!contactInfo.hasName) score -= 20;
    if (!contactInfo.hasEmail) score -= 15;
    if (!contactInfo.hasPhone) score -= 10;

    if (!formatting.hasHeaders) score -= 25;
    if (formatting.headerStyle === 'mixed') score -= 10;
    if (formatting.hasGraphics) score -= 20;
    if (formatting.hasColumns) score -= 10;

    const detectedCount = sections.filter(s => s.detected).length;
    if (detectedCount < 3) score -= 15;

    score = Math.max(0, Math.min(100, score));

    score = score * systemStrictness;

    return Math.round(score);
  }

  static getSystemRecommendations(targetSystem: keyof typeof ATSSimulator.ATS_SYSTEMS): string[] {
    const system = this.ATS_SYSTEMS[targetSystem];
    const recommendations: string[] = [];

    recommendations.push(`Optimizing for ${system.name} ATS (Strictness: ${system.strictness * 100}%)`);

    if (system.requiresStandardSections) {
      recommendations.push('Use standard section headers: WORK EXPERIENCE, EDUCATION, SKILLS, PROJECTS');
    }

    if (!system.parsesGraphics) {
      recommendations.push('Avoid all graphics, tables, charts, and images');
    }

    recommendations.push('Use single-column layout');
    recommendations.push('Format dates as "Jan 2023 – Mar 2024"');
    recommendations.push('Use consistent bullet points (• or -)');
    recommendations.push('Keep all text left-aligned');

    return recommendations;
  }

  static compareAcrossSystems(resumeText: string): Record<string, ATSParsingResult> {
    const results: Record<string, ATSParsingResult> = {};

    Object.keys(this.ATS_SYSTEMS).forEach(system => {
      results[system] = this.simulateATS(resumeText, system as keyof typeof ATSSimulator.ATS_SYSTEMS);
    });

    return results;
  }

  static generateATSReport(result: ATSParsingResult): string {
    const report: string[] = [];

    report.push(`=== ATS COMPATIBILITY REPORT ===`);
    report.push(`Overall Score: ${result.score}/100`);
    report.push('');

    if (result.score >= 90) {
      report.push('✅ EXCELLENT - Your resume is highly ATS-compatible');
    } else if (result.score >= 75) {
      report.push('⚠️ GOOD - Minor improvements recommended');
    } else if (result.score >= 60) {
      report.push('⚠️ FAIR - Several issues need attention');
    } else {
      report.push('❌ POOR - Major issues must be fixed');
    }

    report.push('');
    report.push('=== ISSUES FOUND ===');

    const criticalIssues = result.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      report.push('\n❌ CRITICAL ISSUES:');
      criticalIssues.forEach(issue => {
        report.push(`  - ${issue.message} (${issue.location})`);
      });
    }

    const warnings = result.issues.filter(i => i.severity === 'warning');
    if (warnings.length > 0) {
      report.push('\n⚠️ WARNINGS:');
      warnings.forEach(issue => {
        report.push(`  - ${issue.message} (${issue.location})`);
      });
    }

    report.push('');
    report.push('=== RECOMMENDATIONS ===');
    result.recommendations.forEach((rec, i) => {
      report.push(`${i + 1}. ${rec}`);
    });

    return report.join('\n');
  }
}

export const atsSimulator = ATSSimulator;
