/**
 * Tier 2: Content Structure Analyzer (25 metrics)
 * Part of the Enhanced ATS Score Checker (220+ Metrics)
 * 
 * Analyzes:
 * - Section Organization metrics (5): headers, order, completeness, consistency, missing sections
 * - Contact Information metrics (5): email, phone, LinkedIn, location, placement
 * - Summary/Objective metrics (5): presence, relevance, length, specificity, metrics/proof
 * - Date Format metrics (5): consistency, chronological order, validity, current role, education dates
 * - Bullet Points metrics (5): count per job, length, format, parsing compatibility, paragraph usage
 */

import { TierScore, ResumeData, SectionInfo, OrderIssue, EXPECTED_SECTION_ORDER } from '../../types/resume';

// ============================================================================
// TYPES
// ============================================================================

export interface ContentStructureInput {
  resumeText: string;
  resumeData?: ResumeData;
}

export interface ContentStructureResult {
  tierScore: TierScore;
  sectionInfo: SectionInfo[];
  orderIssues: OrderIssue[];
  metrics: ContentStructureMetrics;
}

export interface ContentStructureMetrics {
  // Section Organization (5)
  sectionHeaders: MetricResult;
  sectionOrder: MetricResult;
  sectionCompleteness: MetricResult;
  sectionConsistency: MetricResult;
  missingSections: MetricResult;
  
  // Contact Information (5)
  emailPresent: MetricResult;
  phonePresent: MetricResult;
  linkedInPresent: MetricResult;
  locationPresent: MetricResult;
  contactPlacement: MetricResult;
  
  // Summary/Objective (5)
  summaryPresence: MetricResult;
  summaryRelevance: MetricResult;
  summaryLength: MetricResult;
  summarySpecificity: MetricResult;
  summaryMetrics: MetricResult;
  
  // Date Format (5)
  dateConsistency: MetricResult;
  chronologicalOrder: MetricResult;
  dateValidity: MetricResult;
  currentRoleDate: MetricResult;
  educationDates: MetricResult;
  
  // Bullet Points (5)
  bulletCountPerJob: MetricResult;
  bulletLength: MetricResult;
  bulletFormat: MetricResult;
  bulletParsing: MetricResult;
  paragraphUsage: MetricResult;
}

export interface MetricResult {
  score: number;
  maxScore: number;
  passed: boolean;
  details: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIER_CONFIG = {
  tierNumber: 2,
  tierName: 'Content Structure',
  weight: 10,
  maxScore: 25,
  metricsTotal: 25,
};

const REQUIRED_SECTIONS = ['contact', 'experience', 'education', 'skills'];
const RECOMMENDED_SECTIONS = ['summary', 'projects', 'certifications'];

const SECTION_PATTERNS: Record<string, RegExp> = {
  contact: /^(contact|personal\s*info)/im,
  summary: /^(summary|profile|objective|about)/im,
  skills: /^(skills|technical\s*skills|core\s*competencies)/im,
  experience: /^(experience|work\s*experience|employment|professional\s*experience)/im,
  projects: /^(projects|personal\s*projects|key\s*projects)/im,
  education: /^(education|academic|qualifications)/im,
  certifications: /^(certifications?|licenses?|credentials)/im,
  additional: /^(additional|other|interests|hobbies|volunteer)/im,
};

// ============================================================================
// CONTENT STRUCTURE ANALYZER
// ============================================================================

export class ContentStructureAnalyzer {
  /**
   * Analyze content structure of resume (Tier 2: 25 metrics)
   */
  static analyze(input: ContentStructureInput): ContentStructureResult {
    const sectionInfo = this.detectSections(input.resumeText);
    const orderIssues = this.detectOrderIssues(sectionInfo);
    const metrics = this.analyzeAllMetrics(input, sectionInfo);
    const tierScore = this.calculateTierScore(metrics);

    return {
      tierScore,
      sectionInfo,
      orderIssues,
      metrics,
    };
  }

  /**
   * Detect sections in resume text
   */
  private static detectSections(resumeText: string): SectionInfo[] {
    const sections: SectionInfo[] = [];
    const lines = resumeText.split('\n');
    let position = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      for (const [sectionName, pattern] of Object.entries(SECTION_PATTERNS)) {
        if (pattern.test(line)) {
          const expectedPosition = EXPECTED_SECTION_ORDER.indexOf(sectionName as any);
          sections.push({
            name: sectionName,
            position: position,
            expectedPosition: expectedPosition >= 0 ? expectedPosition : 99,
            isCorrectlyPlaced: false, // Will be calculated later
          });
          position++;
          break;
        }
      }
    }

    // Mark correctly placed sections
    sections.forEach((section, idx) => {
      section.isCorrectlyPlaced = section.position === section.expectedPosition ||
        (idx > 0 && sections[idx - 1].expectedPosition < section.expectedPosition);
    });

    return sections;
  }

  /**
   * Detect section order issues
   */
  private static detectOrderIssues(sectionInfo: SectionInfo[]): OrderIssue[] {
    const issues: OrderIssue[] = [];

    sectionInfo.forEach((section) => {
      if (!section.isCorrectlyPlaced && section.expectedPosition < 99) {
        issues.push({
          section: section.name,
          currentPosition: section.position,
          expectedPosition: section.expectedPosition,
          penalty: -1,
        });
      }
    });

    return issues;
  }

  /**
   * Analyze all 25 metrics
   */
  private static analyzeAllMetrics(input: ContentStructureInput, sectionInfo: SectionInfo[]): ContentStructureMetrics {
    const { resumeText, resumeData } = input;

    return {
      // Section Organization (5)
      sectionHeaders: this.analyzeSectionHeaders(resumeText, sectionInfo),
      sectionOrder: this.analyzeSectionOrder(sectionInfo),
      sectionCompleteness: this.analyzeSectionCompleteness(sectionInfo),
      sectionConsistency: this.analyzeSectionConsistency(resumeText),
      missingSections: this.analyzeMissingSections(sectionInfo),
      
      // Contact Information (5)
      emailPresent: this.analyzeEmailPresent(resumeText, resumeData),
      phonePresent: this.analyzePhonePresent(resumeText, resumeData),
      linkedInPresent: this.analyzeLinkedInPresent(resumeText, resumeData),
      locationPresent: this.analyzeLocationPresent(resumeText, resumeData),
      contactPlacement: this.analyzeContactPlacement(resumeText),
      
      // Summary/Objective (5)
      summaryPresence: this.analyzeSummaryPresence(resumeText, resumeData),
      summaryRelevance: this.analyzeSummaryRelevance(resumeData?.summary),
      summaryLength: this.analyzeSummaryLength(resumeData?.summary),
      summarySpecificity: this.analyzeSummarySpecificity(resumeData?.summary),
      summaryMetrics: this.analyzeSummaryMetrics(resumeData?.summary),
      
      // Date Format (5)
      dateConsistency: this.analyzeDateConsistency(resumeText),
      chronologicalOrder: this.analyzeChronologicalOrder(resumeData),
      dateValidity: this.analyzeDateValidity(resumeText),
      currentRoleDate: this.analyzeCurrentRoleDate(resumeData),
      educationDates: this.analyzeEducationDates(resumeData),
      
      // Bullet Points (5)
      bulletCountPerJob: this.analyzeBulletCountPerJob(resumeData),
      bulletLength: this.analyzeBulletLength(resumeData),
      bulletFormat: this.analyzeBulletFormat(resumeText),
      bulletParsing: this.analyzeBulletParsing(resumeText),
      paragraphUsage: this.analyzeParagraphUsage(resumeText),
    };
  }

  // ============================================================================
  // SECTION ORGANIZATION METRICS (5)
  // ============================================================================

  private static analyzeSectionHeaders(resumeText: string, sectionInfo: SectionInfo[]): MetricResult {
    const headerCount = sectionInfo.length;
    
    if (headerCount >= 5) {
      return { score: 1, maxScore: 1, passed: true, details: `${headerCount} clear section headers` };
    } else if (headerCount >= 3) {
      return { score: 0.5, maxScore: 1, passed: false, details: `Only ${headerCount} sections - add more` };
    }
    return { score: 0, maxScore: 1, passed: false, details: 'Missing clear section headers' };
  }

  private static analyzeSectionOrder(sectionInfo: SectionInfo[]): MetricResult {
    const correctlyPlaced = sectionInfo.filter(s => s.isCorrectlyPlaced).length;
    const total = sectionInfo.length;
    const ratio = total > 0 ? correctlyPlaced / total : 0;

    if (ratio >= 0.8) {
      return { score: 1, maxScore: 1, passed: true, details: 'Sections in optimal order' };
    } else if (ratio >= 0.5) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'Some sections out of order' };
    }
    return { score: 0, maxScore: 1, passed: false, details: 'Reorder sections for ATS' };
  }

  private static analyzeSectionCompleteness(sectionInfo: SectionInfo[]): MetricResult {
    const sectionNames = sectionInfo.map(s => s.name);
    const hasRequired = REQUIRED_SECTIONS.every(s => sectionNames.includes(s) || s === 'contact');
    const hasRecommended = RECOMMENDED_SECTIONS.filter(s => sectionNames.includes(s)).length;

    if (hasRequired && hasRecommended >= 2) {
      return { score: 1, maxScore: 1, passed: true, details: 'All key sections present' };
    } else if (hasRequired) {
      return { score: 0.75, maxScore: 1, passed: true, details: 'Required sections present' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Missing required sections' };
  }

  private static analyzeSectionConsistency(resumeText: string): MetricResult {
    // Check for consistent header formatting (ALL CAPS, Title Case, etc.)
    const headers = resumeText.match(/^[A-Z][A-Za-z\s]+:?$/gm) || [];
    const allCaps = headers.filter(h => h === h.toUpperCase()).length;
    const titleCase = headers.filter(h => h !== h.toUpperCase() && h !== h.toLowerCase()).length;
    
    const total = headers.length;
    if (total === 0) return { score: 0.5, maxScore: 1, passed: false, details: 'No headers detected' };
    
    const consistency = Math.max(allCaps, titleCase) / total;
    
    if (consistency >= 0.8) {
      return { score: 1, maxScore: 1, passed: true, details: 'Consistent header formatting' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Inconsistent header formatting' };
  }

  private static analyzeMissingSections(sectionInfo: SectionInfo[]): MetricResult {
    const sectionNames = sectionInfo.map(s => s.name);
    const missing = REQUIRED_SECTIONS.filter(s => !sectionNames.includes(s) && s !== 'contact');
    
    if (missing.length === 0) {
      return { score: 1, maxScore: 1, passed: true, details: 'No missing required sections' };
    }
    return { 
      score: 0, 
      maxScore: 1, 
      passed: false, 
      details: `Missing: ${missing.join(', ')}` 
    };
  }

  // ============================================================================
  // CONTACT INFORMATION METRICS (5)
  // ============================================================================

  private static analyzeEmailPresent(resumeText: string, resumeData?: ResumeData): MetricResult {
    const hasEmail = resumeData?.email || /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
    
    if (hasEmail) {
      return { score: 1, maxScore: 1, passed: true, details: 'Email address present' };
    }
    return { score: 0, maxScore: 1, passed: false, details: 'Add email address' };
  }

  private static analyzePhonePresent(resumeText: string, resumeData?: ResumeData): MetricResult {
    const hasPhone = resumeData?.phone || /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText);
    
    if (hasPhone) {
      return { score: 1, maxScore: 1, passed: true, details: 'Phone number present' };
    }
    return { score: 0, maxScore: 1, passed: false, details: 'Add phone number' };
  }

  private static analyzeLinkedInPresent(resumeText: string, resumeData?: ResumeData): MetricResult {
    const hasLinkedIn = resumeData?.linkedin || /linkedin\.com\/in\/[\w-]+/i.test(resumeText);
    
    if (hasLinkedIn) {
      return { score: 1, maxScore: 1, passed: true, details: 'LinkedIn profile present' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Add LinkedIn profile URL' };
  }

  private static analyzeLocationPresent(resumeText: string, resumeData?: ResumeData): MetricResult {
    const hasLocation = resumeData?.location || /\b[A-Z][a-z]+,?\s*[A-Z]{2}\b/.test(resumeText);
    
    if (hasLocation) {
      return { score: 1, maxScore: 1, passed: true, details: 'Location present' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Add city/state location' };
  }

  private static analyzeContactPlacement(resumeText: string): MetricResult {
    const lines = resumeText.split('\n').slice(0, 10);
    const topSection = lines.join('\n');
    
    const hasEmailTop = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(topSection);
    const hasPhoneTop = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(topSection);
    
    if (hasEmailTop && hasPhoneTop) {
      return { score: 1, maxScore: 1, passed: true, details: 'Contact info at top' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Move contact info to top' };
  }

  // ============================================================================
  // SUMMARY/OBJECTIVE METRICS (5)
  // ============================================================================

  private static analyzeSummaryPresence(_resumeText: string, resumeData?: ResumeData): MetricResult {
    const hasSummary = resumeData?.summary || resumeData?.careerObjective || 
      /^(summary|profile|objective|about|career)/im.test(_resumeText) ||
      // Also check for summary-like content at the beginning (first 500 chars)
      /seeking|passionate|experienced|skilled|professional|dedicated|results-driven/i.test(_resumeText.slice(0, 500));
    
    if (hasSummary) {
      return { score: 1, maxScore: 1, passed: true, details: 'Professional summary present' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Add professional summary' };
  }

  private static analyzeSummaryRelevance(summary?: string): MetricResult {
    if (!summary) {
      // Give partial credit if no summary - don't penalize too harshly
      return { score: 0.5, maxScore: 1, passed: false, details: 'No summary to analyze' };
    }

    // Check for role-specific keywords (expanded list)
    const roleKeywords = /engineer|developer|manager|analyst|designer|specialist|consultant|architect|lead|senior|software|data|product|project|technical/i;
    const hasRoleKeywords = roleKeywords.test(summary);
    
    if (hasRoleKeywords) {
      return { score: 1, maxScore: 1, passed: true, details: 'Summary mentions target role' };
    }
    return { score: 0.75, maxScore: 1, passed: true, details: 'Summary present' };
  }

  private static analyzeSummaryLength(summary?: string): MetricResult {
    if (!summary) {
      // Give partial credit - don't penalize too harshly
      return { score: 0.5, maxScore: 1, passed: false, details: 'No summary' };
    }

    const wordCount = summary.split(/\s+/).length;
    
    // ATS Rulebook: Summary should be 40-60 words (2-3 lines)
    if (wordCount >= 40 && wordCount <= 60) {
      return { score: 1, maxScore: 1, passed: true, details: `${wordCount} words - optimal length` };
    } else if (wordCount >= 30 && wordCount < 40) {
      return { score: 0.85, maxScore: 1, passed: true, details: `${wordCount} words - slightly short` };
    } else if (wordCount > 60 && wordCount <= 80) {
      return { score: 0.85, maxScore: 1, passed: true, details: `${wordCount} words - slightly long` };
    } else if (wordCount >= 20 && wordCount < 30) {
      return { score: 0.7, maxScore: 1, passed: true, details: 'Summary could be longer (aim for 40-60 words)' };
    } else if (wordCount < 20) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'Summary too short (aim for 40-60 words)' };
    }
    return { score: 0.7, maxScore: 1, passed: true, details: 'Summary too long (aim for 40-60 words)' };
  }

  private static analyzeSummarySpecificity(summary?: string): MetricResult {
    if (!summary) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'No summary' };
    }

    // Check for specific technologies, years, or achievements (expanded patterns)
    const hasSpecifics = /\d+\s*(years?|months?|\+)|[A-Z][a-z]+(?:JS|\.js|\.py|SQL|AWS|Azure)|python|java|react|node|angular|vue|docker|kubernetes|agile|scrum/i.test(summary);
    
    if (hasSpecifics) {
      return { score: 1, maxScore: 1, passed: true, details: 'Summary has specific details' };
    }
    return { score: 0.75, maxScore: 1, passed: true, details: 'Summary present' };
  }

  private static analyzeSummaryMetrics(summary?: string): MetricResult {
    if (!summary) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'No summary' };
    }

    // Check for quantified achievements (expanded patterns)
    const hasMetrics = /\d+%|\$\d+|\d+\s*(users?|clients?|projects?|team|years?|applications?|systems?)/i.test(summary);
    
    if (hasMetrics) {
      return { score: 1, maxScore: 1, passed: true, details: 'Summary includes metrics' };
    }
    // Give partial credit for having a summary even without metrics
    return { score: 0.75, maxScore: 1, passed: true, details: 'Summary present' };
  }

  // ============================================================================
  // DATE FORMAT METRICS (5)
  // ============================================================================

  private static analyzeDateConsistency(resumeText: string): MetricResult {
    // Find all date patterns
    const datePatterns = [
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/gi,
      /\b\d{1,2}\/\d{4}\b/g,
      /\b\d{4}\s*-\s*\d{4}\b/g,
      /\b\d{4}\s*-\s*Present\b/gi,
    ];

    const foundFormats = datePatterns.filter(p => p.test(resumeText)).length;
    
    if (foundFormats <= 2) {
      return { score: 1, maxScore: 1, passed: true, details: 'Consistent date format' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Use consistent date format (e.g., Jan 2020)' };
  }

  private static analyzeChronologicalOrder(resumeData?: ResumeData): MetricResult {
    if (!resumeData?.workExperience || resumeData.workExperience.length < 2) {
      return { score: 1, maxScore: 1, passed: true, details: 'Chronological order OK' };
    }

    // Check if experiences are in reverse chronological order
    // This is a simplified check - assumes year format in the year field
    let isOrdered = true;
    for (let i = 1; i < resumeData.workExperience.length; i++) {
      const prevYear = this.extractYear(resumeData.workExperience[i - 1].year);
      const currYear = this.extractYear(resumeData.workExperience[i].year);
      if (currYear > prevYear) {
        isOrdered = false;
        break;
      }
    }

    if (isOrdered) {
      return { score: 1, maxScore: 1, passed: true, details: 'Reverse chronological order' };
    }
    return { score: 0, maxScore: 1, passed: false, details: 'Order experience by most recent first' };
  }

  private static analyzeDateValidity(resumeText: string): MetricResult {
    // Check for future dates (except "Present")
    const currentYear = new Date().getFullYear();
    const futureYearPattern = new RegExp(`\\b(${currentYear + 1}|${currentYear + 2})\\b`, 'g');
    const hasFutureDates = futureYearPattern.test(resumeText.replace(/expected|anticipated/gi, ''));
    
    if (!hasFutureDates) {
      return { score: 1, maxScore: 1, passed: true, details: 'All dates valid' };
    }
    return { score: 0, maxScore: 1, passed: false, details: 'Remove future dates' };
  }

  private static analyzeCurrentRoleDate(resumeData?: ResumeData): MetricResult {
    if (!resumeData?.workExperience || resumeData.workExperience.length === 0) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'No work experience' };
    }

    const firstJob = resumeData.workExperience[0];
    const hasPresent = /present|current|now/i.test(firstJob.year);
    
    if (hasPresent) {
      return { score: 1, maxScore: 1, passed: true, details: 'Current role marked as Present' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Mark current role with "Present"' };
  }

  private static analyzeEducationDates(resumeData?: ResumeData): MetricResult {
    if (!resumeData?.education || resumeData.education.length === 0) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'No education listed' };
    }

    const hasGradYear = resumeData.education.some(e => /\d{4}/.test(e.year));
    
    if (hasGradYear) {
      return { score: 1, maxScore: 1, passed: true, details: 'Education dates present' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Add graduation year' };
  }

  // ============================================================================
  // BULLET POINTS METRICS (5)
  // ============================================================================

  private static analyzeBulletCountPerJob(resumeData?: ResumeData): MetricResult {
    if (!resumeData?.workExperience || resumeData.workExperience.length === 0) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'No work experience' };
    }

    const bulletCounts = resumeData.workExperience.map(exp => exp.bullets?.length || 0);
    const avgBullets = bulletCounts.reduce((a, b) => a + b, 0) / bulletCounts.length;
    
    if (avgBullets >= 3 && avgBullets <= 6) {
      return { score: 1, maxScore: 1, passed: true, details: `Avg ${avgBullets.toFixed(1)} bullets per job` };
    } else if (avgBullets < 3) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'Add more bullet points (3-6 per job)' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Too many bullets - prioritize top achievements' };
  }

  private static analyzeBulletLength(resumeData?: ResumeData): MetricResult {
    if (!resumeData?.workExperience) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'No bullets to analyze' };
    }

    const allBullets = resumeData.workExperience.flatMap(exp => exp.bullets || []);
    if (allBullets.length === 0) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'No bullets found' };
    }

    // ATS Rulebook: 10-12 words per bullet (max 22 words)
    const wordCounts = allBullets.map(b => b.split(/\s+/).length);
    const avgWords = wordCounts.reduce((sum, w) => sum + w, 0) / wordCounts.length;
    const bulletsInRange = wordCounts.filter(w => w >= 8 && w <= 22).length;
    const percentInRange = (bulletsInRange / wordCounts.length) * 100;
    
    if (percentInRange >= 70 && avgWords >= 8 && avgWords <= 18) {
      return { score: 1, maxScore: 1, passed: true, details: `Avg ${avgWords.toFixed(0)} words/bullet - optimal` };
    } else if (percentInRange >= 50) {
      return { score: 0.75, maxScore: 1, passed: true, details: `Avg ${avgWords.toFixed(0)} words/bullet - good` };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Aim for 10-18 words per bullet' };
  }

  private static analyzeBulletFormat(resumeText: string): MetricResult {
    const bulletPatterns = resumeText.match(/^[\s]*[•\-\*\u2022\u2023\u25E6\u2043]/gm) || [];
    const uniqueStyles = new Set(bulletPatterns.map(p => p.trim()[0]));
    
    if (bulletPatterns.length > 0 && uniqueStyles.size === 1) {
      return { score: 1, maxScore: 1, passed: true, details: 'Consistent bullet format' };
    } else if (uniqueStyles.size > 1) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'Use consistent bullet style' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Use bullet points for achievements' };
  }

  private static analyzeBulletParsing(resumeText: string): MetricResult {
    // Check for ATS-friendly bullet characters
    const atsFriendlyBullets = (resumeText.match(/^[\s]*[•\-\*]/gm) || []).length;
    const totalBullets = (resumeText.match(/^[\s]*[•\-\*\u2022\u2023\u25E6\u2043\u25CF\u25CB]/gm) || []).length;
    
    if (totalBullets === 0) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'No bullets detected' };
    }

    const ratio = atsFriendlyBullets / totalBullets;
    
    if (ratio >= 0.9) {
      return { score: 1, maxScore: 1, passed: true, details: 'ATS-friendly bullet characters' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Use standard bullets (•, -, *)' };
  }

  private static analyzeParagraphUsage(resumeText: string): MetricResult {
    // Check for long paragraphs (bad for ATS)
    const paragraphs = resumeText.split(/\n\n+/);
    const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 50).length;
    
    if (longParagraphs === 0) {
      return { score: 1, maxScore: 1, passed: true, details: 'No long paragraphs' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Break long paragraphs into bullets' };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static extractYear(dateStr: string): number {
    const match = dateStr.match(/\d{4}/);
    return match ? parseInt(match[0]) : 0;
  }

  private static calculateTierScore(metrics: ContentStructureMetrics): TierScore {
    const allMetrics = Object.values(metrics);
    const totalScore = allMetrics.reduce((sum, m) => sum + m.score, 0);
    const maxScore = allMetrics.reduce((sum, m) => sum + m.maxScore, 0);
    const metricsPassed = allMetrics.filter(m => m.passed).length;
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const weightedContribution = (percentage * TIER_CONFIG.weight) / 100;

    const topIssues = allMetrics
      .filter(m => !m.passed)
      .map(m => m.details)
      .slice(0, 5);

    return {
      tier_number: TIER_CONFIG.tierNumber,
      tier_name: TIER_CONFIG.tierName,
      score: Math.round(totalScore * 100) / 100,
      max_score: maxScore,
      percentage: Math.round(percentage * 100) / 100,
      weight: TIER_CONFIG.weight,
      weighted_contribution: Math.round(weightedContribution * 100) / 100,
      metrics_passed: metricsPassed,
      metrics_total: TIER_CONFIG.metricsTotal,
      top_issues: topIssues,
    };
  }
}

export default ContentStructureAnalyzer;
