/**
 * Tier 7: Red Flag Detector (30 metrics)
 * Part of the Enhanced ATS Score Checker (220+ Metrics)
 * 
 * Detects and applies penalties for:
 * - Employment Red Flags (10)
 * - Skills Red Flags (10)
 * - Formatting Red Flags (10)
 */

import { TierScore, ResumeData, RedFlag, RedFlagType, RedFlagSeverity, RED_FLAG_PENALTIES } from '../../types/resume';

// ============================================================================
// TYPES
// ============================================================================

export interface RedFlagDetectorInput {
  resumeText: string;
  resumeData?: ResumeData;
  jobDescription?: string;
}

export interface RedFlagDetectorResult {
  tierScore: TierScore;
  redFlags: RedFlag[];
  totalPenalty: number;
  autoRejectRisk: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIER_CONFIG = {
  tierNumber: 8,
  tierName: 'Red Flags',
  weight: 0, // Penalty-based, not weighted
  maxScore: 30,
  metricsTotal: 30,
};

// ============================================================================
// RED FLAG DETECTOR
// ============================================================================

export class RedFlagDetector {
  /**
   * Detect red flags (Tier 7: 30 metrics)
   */
  static analyze(input: RedFlagDetectorInput): RedFlagDetectorResult {
    const redFlags: RedFlag[] = [];
    let flagId = 1;


    // Employment Red Flags (10)
    const employmentFlags = this.detectEmploymentRedFlags(input, flagId);
    redFlags.push(...employmentFlags);
    flagId += 10;

    // Skills Red Flags (10)
    const skillsFlags = this.detectSkillsRedFlags(input, flagId);
    redFlags.push(...skillsFlags);
    flagId += 10;

    // Formatting Red Flags (10)
    const formattingFlags = this.detectFormattingRedFlags(input, flagId);
    redFlags.push(...formattingFlags);

    const totalPenalty = redFlags.reduce((sum, flag) => sum + flag.penalty, 0);
    const criticalFlags = redFlags.filter(f => f.severity === 'critical').length;
    const autoRejectRisk = criticalFlags >= RED_FLAG_PENALTIES.multiple_red_flags_threshold;

    const tierScore = this.calculateTierScore(redFlags);

    return {
      tierScore,
      redFlags,
      totalPenalty,
      autoRejectRisk,
    };
  }

  // ============================================================================
  // EMPLOYMENT RED FLAGS (10)
  // ============================================================================

  private static detectEmploymentRedFlags(input: RedFlagDetectorInput, startId: number): RedFlag[] {
    const flags: RedFlag[] = [];
    const { resumeText, resumeData } = input;
    let id = startId;

    // 1. Unexplained gap > 6 months
    const gaps = this.detectEmploymentGaps(resumeData);
    const largeGaps = gaps.filter(g => g > 6);
    if (largeGaps.length > 0) {
      flags.push(this.createFlag(id++, 'employment', 'Unexplained Employment Gap', 'high',
        RED_FLAG_PENALTIES.employment_gap_6_months,
        `${largeGaps.length} gap(s) > 6 months detected`,
        'Add explanation for employment gaps (education, freelance, etc.)'
      ));
    }

    // 2. Job hopping pattern
    const shortTenures = this.countShortTenures(resumeData);
    if (shortTenures >= 3) {
      flags.push(this.createFlag(id++, 'employment', 'Job Hopping Pattern', 'high',
        RED_FLAG_PENALTIES.job_hopping_pattern,
        `${shortTenures} positions with < 1 year tenure`,
        'Highlight achievements and reasons for transitions'
      ));
    }

    // 3. Title inflation
    if (this.detectTitleInflation(resumeText)) {
      flags.push(this.createFlag(id++, 'employment', 'Potential Title Inflation', 'critical',
        RED_FLAG_PENALTIES.title_inflation,
        'Job titles may be inflated beyond actual responsibilities',
        'Ensure titles accurately reflect your role'
      ));
    }

    // 4. Conflicting dates
    if (this.detectConflictingDates(resumeData)) {
      flags.push(this.createFlag(id++, 'employment', 'Conflicting Dates', 'medium',
        -2,
        'Overlapping or inconsistent employment dates',
        'Review and correct date ranges'
      ));
    }

    // 5. Vague responsibilities
    if (this.detectVagueResponsibilities(resumeData)) {
      flags.push(this.createFlag(id++, 'employment', 'Vague Responsibilities', 'low',
        -1,
        'Job descriptions lack specific details',
        'Add specific achievements and metrics'
      ));
    }

    // 6. No career progression
    if (this.detectNoProgression(resumeData)) {
      flags.push(this.createFlag(id++, 'employment', 'No Career Progression', 'medium',
        -2,
        'No visible career advancement over time',
        'Highlight promotions, increased responsibilities'
      ));
    }

    // 7. Layoff pattern (multiple short stints)
    if (shortTenures >= 4) {
      flags.push(this.createFlag(id++, 'employment', 'Potential Layoff Pattern', 'medium',
        -2,
        'Multiple short-term positions may indicate layoffs',
        'Address employment stability in cover letter'
      ));
    }

    // 8. LinkedIn inconsistencies (can't detect without LinkedIn data)
    // Skipped - would need LinkedIn integration

    // 9. Recent frequent changes
    if (this.detectRecentFrequentChanges(resumeData)) {
      flags.push(this.createFlag(id++, 'employment', 'Recent Frequent Job Changes', 'medium',
        -2,
        'Multiple job changes in recent years',
        'Explain reasons for recent transitions'
      ));
    }

    // 10. Unexplained salary jumps (can't detect without salary data)
    // Skipped - would need salary information

    return flags;
  }

  // ============================================================================
  // SKILLS RED FLAGS (10)
  // ============================================================================

  private static detectSkillsRedFlags(input: RedFlagDetectorInput, startId: number): RedFlag[] {
    const flags: RedFlag[] = [];
    const { resumeText, resumeData, jobDescription } = input;
    let id = startId;

    // 1. Company names in skills section (CRITICAL)
    if (this.detectCompanyNamesInSkills(resumeText)) {
      flags.push(this.createFlag(id++, 'skills', 'Company Names in Skills', 'critical',
        -5,
        'Company names found in skills section (Wipro, Kyndryl, EY GDS, etc.)',
        'Remove all company names from skills - they cause ATS keyword stuffing flags'
      ));
    }

    // 2. Domains listed as programming languages
    if (this.detectDomainsAsLanguages(resumeText)) {
      flags.push(this.createFlag(id++, 'skills', 'Domains Listed as Programming Languages', 'critical',
        -4,
        'Non-programming domains (BI, AI, Data Analytics) listed as programming languages',
        'Move domains like BI, AI, Data Analytics to separate Domains section'
      ));
    }

    // 3. Soft skills in technical categories
    if (this.detectSoftSkillsInTechCategories(resumeText)) {
      flags.push(this.createFlag(id++, 'skills', 'Soft Skills in Technical Categories', 'high',
        -3,
        'Soft skills (teamwork, communication) mixed with technical tools',
        'Move soft skills to Core Competencies section'
      ));
    }

    // 4. Keyword stuffing
    if (this.detectKeywordStuffing(resumeText)) {
      flags.push(this.createFlag(id++, 'skills', 'Keyword Stuffing', 'critical',
        RED_FLAG_PENALTIES.keyword_stuffing,
        'Excessive repetition of keywords detected',
        'Use keywords naturally throughout resume'
      ));
    }

    // 2. Unsubstantiated claims
    if (this.detectUnsubstantiatedClaims(resumeText)) {
      flags.push(this.createFlag(id++, 'skills', 'Unsubstantiated Claims', 'medium',
        -2,
        'Claims without supporting evidence',
        'Back up claims with specific examples and metrics'
      ));
    }

    // 3. Missing proof for skills
    if (this.detectMissingSkillProof(resumeData)) {
      flags.push(this.createFlag(id++, 'skills', 'Skills Without Context', 'low',
        -1,
        'Skills listed without demonstration in experience',
        'Show skills in action within job descriptions'
      ));
    }

    // 4. Outdated technologies
    if (this.detectOutdatedTech(resumeText)) {
      flags.push(this.createFlag(id++, 'skills', 'Outdated Technologies', 'medium',
        -2,
        'Resume emphasizes outdated technologies',
        'Highlight current, in-demand technologies'
      ));
    }

    // 5. Irrelevant skills (if JD provided)
    if (jobDescription && this.detectIrrelevantSkills(resumeData, jobDescription)) {
      flags.push(this.createFlag(id++, 'skills', 'Irrelevant Skills Emphasized', 'low',
        -1,
        'Skills not aligned with job requirements',
        'Tailor skills section to match JD'
      ));
    }

    // 6. No depth in skills
    if (this.detectNoSkillDepth(resumeData)) {
      flags.push(this.createFlag(id++, 'skills', 'Shallow Skill Presentation', 'low',
        -1,
        'Skills listed without proficiency levels',
        'Indicate expertise level for key skills'
      ));
    }

    // 7. Generic language
    if (this.detectGenericLanguage(resumeText)) {
      flags.push(this.createFlag(id++, 'skills', 'Generic Language', 'low',
        -1,
        'Overuse of generic phrases',
        'Replace generic terms with specific achievements'
      ));
    }

    // 8. Missing domain knowledge
    if (jobDescription && this.detectMissingDomainKnowledge(resumeText, jobDescription)) {
      flags.push(this.createFlag(id++, 'skills', 'Missing Domain Knowledge', 'medium',
        -2,
        'Key domain terms from JD not present',
        'Add relevant industry terminology'
      ));
    }

    // 9. Unverifiable claims
    if (this.detectUnverifiableClaims(resumeText)) {
      flags.push(this.createFlag(id++, 'skills', 'Unverifiable Claims', 'medium',
        -2,
        'Claims that cannot be verified',
        'Focus on demonstrable achievements'
      ));
    }

    // 10. Skill decay (old certifications, no recent learning)
    if (this.detectSkillDecay(resumeData)) {
      flags.push(this.createFlag(id++, 'skills', 'Potential Skill Decay', 'low',
        -1,
        'No recent certifications or learning',
        'Add recent courses, certifications, or projects'
      ));
    }

    return flags;
  }

  // ============================================================================
  // FORMATTING RED FLAGS (10)
  // ============================================================================

  private static detectFormattingRedFlags(input: RedFlagDetectorInput, startId: number): RedFlag[] {
    const flags: RedFlag[] = [];
    const { resumeText } = input;
    let id = startId;

    // 1. Grammar/spelling errors
    if (this.detectGrammarErrors(resumeText)) {
      flags.push(this.createFlag(id++, 'formatting', 'Grammar/Spelling Errors', 'high',
        -3,
        'Grammar or spelling errors detected',
        'Proofread carefully or use grammar tools'
      ));
    }

    // 2. Inconsistent formatting
    if (this.detectInconsistentFormatting(resumeText)) {
      flags.push(this.createFlag(id++, 'formatting', 'Inconsistent Formatting', 'medium',
        -2,
        'Inconsistent bullet styles, fonts, or spacing',
        'Use consistent formatting throughout'
      ));
    }

    // 3. ATS parsing issues
    if (this.detectATSParsingIssues(resumeText)) {
      flags.push(this.createFlag(id++, 'formatting', 'ATS Parsing Issues', 'high',
        -3,
        'Format may cause ATS parsing problems',
        'Use simple, ATS-friendly formatting'
      ));
    }

    // 4. Excessive graphics (can't fully detect from text)
    // Partial detection based on text patterns

    // 5. Font issues (can't detect from text)
    // Skipped

    // 6. Length violations
    if (this.detectLengthViolations(resumeText)) {
      flags.push(this.createFlag(id++, 'formatting', 'Length Issues', 'low',
        -1,
        'Resume may be too long or too short',
        'Aim for 1-2 pages with relevant content'
      ));
    }

    // 7. Contact info issues
    if (this.detectContactIssues(resumeText)) {
      flags.push(this.createFlag(id++, 'formatting', 'Contact Information Issues', 'high',
        -3,
        'Missing or incomplete contact information',
        'Include email, phone, and LinkedIn'
      ));
    }

    // 8. Header problems
    if (this.detectHeaderProblems(resumeText)) {
      flags.push(this.createFlag(id++, 'formatting', 'Section Header Issues', 'medium',
        -2,
        'Missing or unclear section headers',
        'Use clear, standard section headers'
      ));
    }

    // 9. Whitespace issues
    if (this.detectWhitespaceIssues(resumeText)) {
      flags.push(this.createFlag(id++, 'formatting', 'Whitespace Issues', 'low',
        -1,
        'Poor use of whitespace',
        'Balance content with appropriate spacing'
      ));
    }

    // 10. Overall presentation
    if (this.detectPresentationIssues(resumeText)) {
      flags.push(this.createFlag(id++, 'formatting', 'Presentation Issues', 'low',
        -1,
        'Overall presentation could be improved',
        'Review layout and visual hierarchy'
      ));
    }

    return flags;
  }


  // ============================================================================
  // DETECTION HELPERS
  // ============================================================================

  private static detectEmploymentGaps(resumeData?: ResumeData): number[] {
    if (!resumeData?.workExperience || resumeData.workExperience.length < 2) {
      return [];
    }

    const gaps: number[] = [];
    const experiences = resumeData.workExperience;

    for (let i = 0; i < experiences.length - 1; i++) {
      const currentEnd = this.extractEndYear(experiences[i].year);
      const nextStart = this.extractStartYear(experiences[i + 1].year);

      if (currentEnd && nextStart && currentEnd > nextStart) {
        const gapMonths = (currentEnd - nextStart) * 12;
        if (gapMonths > 2) {
          gaps.push(gapMonths);
        }
      }
    }

    return gaps;
  }

  private static countShortTenures(resumeData?: ResumeData): number {
    if (!resumeData?.workExperience) return 0;

    return resumeData.workExperience.filter(exp => {
      const tenure = this.estimateTenureMonths(exp.year);
      return tenure < 12;
    }).length;
  }

  private static detectTitleInflation(resumeText: string): boolean {
    const inflatedPatterns = [
      /\bCEO\b.*\b(startup|small|1-10|solo)/i,
      /\bCTO\b.*\b(startup|small|1-10|solo)/i,
      /\bVP\b.*\b(startup|small|1-10)/i,
      /\bDirector\b.*\b(intern|junior|entry)/i,
    ];
    return inflatedPatterns.some(p => p.test(resumeText));
  }

  private static detectConflictingDates(resumeData?: ResumeData): boolean {
    if (!resumeData?.workExperience || resumeData.workExperience.length < 2) {
      return false;
    }

    // Check for overlapping dates
    for (let i = 0; i < resumeData.workExperience.length - 1; i++) {
      const current = resumeData.workExperience[i];
      const next = resumeData.workExperience[i + 1];
      
      const currentStart = this.extractStartYear(current.year);
      const nextEnd = this.extractEndYear(next.year);

      if (currentStart && nextEnd && currentStart < nextEnd) {
        return true; // Overlap detected
      }
    }

    return false;
  }

  private static detectVagueResponsibilities(resumeData?: ResumeData): boolean {
    if (!resumeData?.workExperience) return false;

    const allBullets = resumeData.workExperience.flatMap(exp => exp.bullets || []);
    const vagueBullets = allBullets.filter(b => 
      /various|multiple|different|several|many|some/i.test(b) &&
      !/\d+/.test(b)
    );

    return vagueBullets.length > allBullets.length * 0.3;
  }

  private static detectNoProgression(resumeData?: ResumeData): boolean {
    if (!resumeData?.workExperience || resumeData.workExperience.length < 3) {
      return false;
    }

    const titles = resumeData.workExperience.map(e => e.role.toLowerCase());
    const seniorityKeywords = ['junior', 'senior', 'lead', 'principal', 'manager', 'director'];
    
    const hasProgression = titles.some((title, i) => {
      if (i === 0) return false;
      const prevTitle = titles[i - 1];
      return seniorityKeywords.some(k => 
        title.includes(k) && !prevTitle.includes(k)
      );
    });

    return !hasProgression;
  }

  private static detectRecentFrequentChanges(resumeData?: ResumeData): boolean {
    if (!resumeData?.workExperience || resumeData.workExperience.length < 3) {
      return false;
    }

    const currentYear = new Date().getFullYear();
    const recentJobs = resumeData.workExperience.filter(exp => {
      const year = this.extractStartYear(exp.year);
      return year && year >= currentYear - 3;
    });

    return recentJobs.length >= 3;
  }

  private static detectCompanyNamesInSkills(resumeText: string): boolean {
    const companyNames = [
      'wipro', 'kyndryl', 'ey gds', 'tcs', 'infosys', 'cognizant', 'accenture',
      'capgemini', 'hcl', 'tech mahindra', 'mindtree', 'ltts', 'persistent',
      'mphasis', 'zensar', 'cyient', 'primoboostai', 'primoboost'
    ];

    const skillsSection = this.extractSkillsSection(resumeText);
    if (!skillsSection) return false;

    const skillsLower = skillsSection.toLowerCase();
    return companyNames.some(company => skillsLower.includes(company));
  }

  private static detectDomainsAsLanguages(resumeText: string): boolean {
    const nonLanguageDomains = [
      'bi', 'data & analytics', 'ai', 'testing', 'full-stack', 'sdlc',
      'full-stack development', 'testing & quality engineering',
      'data analytics', 'business intelligence'
    ];

    const programmingSection = this.extractProgrammingLanguagesSection(resumeText);
    if (!programmingSection) return false;

    const progLower = programmingSection.toLowerCase();
    return nonLanguageDomains.some(domain => progLower.includes(domain));
  }

  private static detectSoftSkillsInTechCategories(resumeText: string): boolean {
    const softSkills = [
      'analytical thinking', 'debugging mindset', 'good communication',
      'teamwork', 'problem-solving', 'collaboration', 'leadership',
      'analytical problem-solving', 'strong debugging mindset',
      'good communication and teamwork skills'
    ];

    const techSections = this.extractTechnicalSections(resumeText);
    if (!techSections) return false;

    const techLower = techSections.toLowerCase();
    return softSkills.some(skill => techLower.includes(skill));
  }

  private static extractSkillsSection(resumeText: string): string | null {
    const skillsMatch = resumeText.match(/(?:skills?|technical skills?|tools?\s*&?\s*technologies?)[\s\S]*?(?=\n[A-Z][A-Za-z\s]+:|\n\n|$)/i);
    return skillsMatch ? skillsMatch[0] : null;
  }

  private static extractProgrammingLanguagesSection(resumeText: string): string | null {
    const progMatch = resumeText.match(/programming languages?:[\s\S]*?(?=\n[A-Z][A-Za-z\s]+:|\n\n|$)/i);
    return progMatch ? progMatch[0] : null;
  }

  private static extractTechnicalSections(resumeText: string): string | null {
    const techMatch = resumeText.match(/(?:technical skills?|tools?\s*&?\s*technologies?|programming languages?)[\s\S]*?(?=\n[A-Z][A-Za-z\s]+:|\n\n|$)/i);
    return techMatch ? techMatch[0] : null;
  }

  private static detectKeywordStuffing(resumeText: string): boolean {
    const words = resumeText.toLowerCase().split(/\s+/);
    const wordCounts: Record<string, number> = {};

    words.forEach(word => {
      if (word.length > 4) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });

    // Check for excessive repetition
    const maxCount = Math.max(...Object.values(wordCounts));
    return maxCount > 15;
  }

  private static detectUnsubstantiatedClaims(resumeText: string): boolean {
    const claimPatterns = [
      /\b(best|top|leading|expert|guru|ninja|rockstar)\b/i,
      /\b(world-class|industry-leading|cutting-edge)\b/i,
    ];
    return claimPatterns.some(p => p.test(resumeText));
  }

  private static detectMissingSkillProof(resumeData?: ResumeData): boolean {
    if (!resumeData?.skills || !resumeData?.workExperience) return false;

    const allSkills = resumeData.skills.flatMap(s => s.list).map(s => s.toLowerCase());
    const allBullets = resumeData.workExperience.flatMap(e => e.bullets || []).join(' ').toLowerCase();

    const unprovenSkills = allSkills.filter(skill => !allBullets.includes(skill));
    return unprovenSkills.length > allSkills.length * 0.5;
  }

  private static detectOutdatedTech(resumeText: string): boolean {
    const outdatedTech = [
      /\b(cobol|fortran|pascal|delphi|vb6|visual basic 6)\b/i,
      /\b(flash|actionscript|silverlight)\b/i,
      /\b(jquery)\b/i, // Debatable, but often considered legacy
    ];
    const modernTech = /\b(react|vue|angular|typescript|python|go|rust|kubernetes|docker)\b/i;

    const hasOutdated = outdatedTech.some(p => p.test(resumeText));
    const hasModern = modernTech.test(resumeText);

    return hasOutdated && !hasModern;
  }

  private static detectIrrelevantSkills(resumeData: ResumeData | undefined, jobDescription: string): boolean {
    if (!resumeData?.skills) return false;

    const jdLower = jobDescription.toLowerCase();
    const allSkills = resumeData.skills.flatMap(s => s.list);
    const relevantSkills = allSkills.filter(skill => jdLower.includes(skill.toLowerCase()));

    return relevantSkills.length < allSkills.length * 0.3;
  }

  private static detectNoSkillDepth(resumeData?: ResumeData): boolean {
    if (!resumeData?.skills) return false;

    // Check if skills are just listed without categorization
    return resumeData.skills.length === 1 && resumeData.skills[0].list.length > 20;
  }

  private static detectGenericLanguage(resumeText: string): boolean {
    const genericPhrases = [
      /team player/i,
      /hard worker/i,
      /detail-oriented/i,
      /self-starter/i,
      /go-getter/i,
      /think outside the box/i,
      /synergy/i,
      /leverage/i,
    ];

    const matches = genericPhrases.filter(p => p.test(resumeText)).length;
    return matches >= 3;
  }

  private static detectMissingDomainKnowledge(resumeText: string, jobDescription: string): boolean {
    // Extract key domain terms from JD
    const domainTerms = jobDescription.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g) || [];
    const uniqueTerms = [...new Set(domainTerms)].slice(0, 10);

    if (uniqueTerms.length === 0) return false;

    const resumeLower = resumeText.toLowerCase();
    const matches = uniqueTerms.filter(term => resumeLower.includes(term.toLowerCase()));

    return matches.length < uniqueTerms.length * 0.3;
  }

  private static detectUnverifiableClaims(resumeText: string): boolean {
    const unverifiable = [
      /\b(always|never|100%|perfect)\b/i,
      /\b(guaranteed|proven)\b.*\b(results|success)\b/i,
    ];
    return unverifiable.some(p => p.test(resumeText));
  }

  private static detectSkillDecay(resumeData?: ResumeData): boolean {
    if (!resumeData?.certifications) return false;

    const certText = resumeData.certifications.map(c => 
      typeof c === 'string' ? c : c.title
    ).join(' ');

    // Check for certifications from recent years (2023+)
    const hasRecentCert = /20(2[3-9]|[3-9]\d)/.test(certText);
    return !hasRecentCert && resumeData.certifications.length > 0;
  }

  private static detectGrammarErrors(resumeText: string): boolean {
    const errors = [
      /\s{2,}/g, // Double spaces
      /[.]{2,}/g, // Multiple periods
      /\bi\b(?!['\u2019])/g, // Lowercase "i" alone
      /\s[,.:;]/g, // Space before punctuation
    ];

    const errorCount = errors.reduce((count, pattern) => {
      const matches = resumeText.match(pattern);
      return count + (matches?.length || 0);
    }, 0);

    return errorCount > 5;
  }

  private static detectInconsistentFormatting(resumeText: string): boolean {
    const bulletStyles = resumeText.match(/^[\s]*[•\-\*\u2022\u2023\u25E6]/gm) || [];
    const uniqueStyles = new Set(bulletStyles.map(b => b.trim()[0]));
    return uniqueStyles.size > 2;
  }

  private static detectATSParsingIssues(resumeText: string): boolean {
    // Check for potential parsing issues
    const issues = [
      /[│┃┆┇┊┋]/g, // Table characters
      /[\u2500-\u257F]/g, // Box drawing characters
    ];

    return issues.some(p => p.test(resumeText));
  }

  private static detectLengthViolations(resumeText: string): boolean {
    const wordCount = resumeText.split(/\s+/).length;
    return wordCount < 200 || wordCount > 1500;
  }

  private static detectContactIssues(resumeText: string): boolean {
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
    const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText);
    return !hasEmail || !hasPhone;
  }

  private static detectHeaderProblems(resumeText: string): boolean {
    const headers = resumeText.match(/^[A-Z][A-Z\s]+:?$/gm) || [];
    return headers.length < 3;
  }

  private static detectWhitespaceIssues(resumeText: string): boolean {
    const lines = resumeText.split('\n');
    const emptyLines = lines.filter(l => l.trim() === '').length;
    const ratio = emptyLines / lines.length;
    return ratio < 0.05 || ratio > 0.4;
  }

  private static detectPresentationIssues(resumeText: string): boolean {
    // Check for very long lines (poor formatting)
    const lines = resumeText.split('\n');
    const longLines = lines.filter(l => l.length > 120).length;
    return longLines > lines.length * 0.2;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private static createFlag(
    id: number,
    type: RedFlagType,
    name: string,
    severity: RedFlagSeverity,
    penalty: number,
    description: string,
    recommendation: string
  ): RedFlag {
    return { id, type, name, severity, penalty, description, recommendation };
  }

  private static extractStartYear(dateStr: string): number | null {
    const years = dateStr.match(/\d{4}/g);
    if (!years) return null;
    return Math.min(...years.map(y => parseInt(y)));
  }

  private static extractEndYear(dateStr: string): number | null {
    if (/present|current|now/i.test(dateStr)) {
      return new Date().getFullYear();
    }
    const years = dateStr.match(/\d{4}/g);
    if (!years) return null;
    return Math.max(...years.map(y => parseInt(y)));
  }

  private static estimateTenureMonths(dateStr: string): number {
    const startYear = this.extractStartYear(dateStr);
    const endYear = this.extractEndYear(dateStr);
    
    if (!startYear || !endYear) return 12;
    return Math.max(1, (endYear - startYear) * 12 + 6);
  }

  private static calculateTierScore(redFlags: RedFlag[]): TierScore {
    // For red flags, score is inverse - fewer flags = higher score
    const totalPenalty = Math.abs(redFlags.reduce((sum, f) => sum + f.penalty, 0));
    const score = Math.max(0, TIER_CONFIG.maxScore - totalPenalty);
    const percentage = (score / TIER_CONFIG.maxScore) * 100;

    const topIssues = redFlags
      .sort((a, b) => a.penalty - b.penalty) // Most severe first
      .slice(0, 5)
      .map(f => f.description);

    return {
      tier_number: TIER_CONFIG.tierNumber,
      tier_name: TIER_CONFIG.tierName,
      score: Math.round(score * 100) / 100,
      max_score: TIER_CONFIG.maxScore,
      percentage: Math.round(percentage * 100) / 100,
      weight: TIER_CONFIG.weight,
      weighted_contribution: 0, // Penalty-based, not weighted
      metrics_passed: TIER_CONFIG.metricsTotal - redFlags.length,
      metrics_total: TIER_CONFIG.metricsTotal,
      top_issues: topIssues,
    };
  }
}

export default RedFlagDetector;
