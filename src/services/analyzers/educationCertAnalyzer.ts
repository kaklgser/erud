/**
 * Tier 4: Education & Certifications Analyzer (20 metrics)
 * Analyzes education credentials and professional certifications
 */

import { ResumeData, TierScore, Certification } from '../../types/resume';

export interface EducationCertInput {
  resumeText: string;
  resumeData?: ResumeData;
  jobDescription?: string;
}

export interface EducationCertResult {
  tierScore: TierScore;
  educationMetrics: EducationMetrics;
  certificationMetrics: CertificationMetrics;
}

interface EducationMetrics {
  degreePresent: boolean;
  degreeRelevance: number;
  degreeType: string;
  institutionPrestige: number;
  gpaIncluded: boolean;
  graduationDatePresent: boolean;
  honorsAwards: boolean;
  relevantCoursework: boolean;
  multipleDegrees: boolean;
  educationFormat: number;
}

interface CertificationMetrics {
  certCount: number;
  certRelevance: number;
  certCurrency: boolean;
  certCredibility: number;
  cloudCerts: boolean;
  securityCerts: boolean;
  pmCerts: boolean;
  languageCerts: boolean;
  certDatePresent: boolean;
  certFormatCorrect: boolean;
}

// Known prestigious institutions (sample)
const PRESTIGIOUS_INSTITUTIONS = [
  'mit', 'stanford', 'harvard', 'berkeley', 'caltech', 'princeton', 'yale',
  'columbia', 'cornell', 'carnegie mellon', 'georgia tech', 'university of michigan',
  'iit', 'nit', 'bits', 'iisc', 'oxford', 'cambridge', 'eth zurich'
];

// Relevant certifications by category
const CLOUD_CERTS = ['aws', 'azure', 'gcp', 'google cloud', 'cloud practitioner', 'solutions architect'];
const SECURITY_CERTS = ['cissp', 'cism', 'ceh', 'security+', 'comptia security', 'oscp'];
const PM_CERTS = ['pmp', 'prince2', 'scrum master', 'csm', 'psm', 'safe', 'agile'];
const LANGUAGE_CERTS = ['toefl', 'ielts', 'jlpt', 'dele', 'delf'];

export class EducationCertAnalyzer {
  static analyze(input: EducationCertInput): EducationCertResult {
    const { resumeText, resumeData, jobDescription } = input;
    const textLower = resumeText.toLowerCase();

    // Analyze education (10 metrics)
    const educationMetrics = this.analyzeEducation(resumeData, textLower, jobDescription);
    
    // Analyze certifications (10 metrics)
    const certificationMetrics = this.analyzeCertifications(resumeData, textLower, jobDescription);

    // Calculate scores
    const educationScore = this.calculateEducationScore(educationMetrics);
    const certScore = this.calculateCertScore(certificationMetrics);
    
    const totalScore = educationScore + certScore;
    const maxScore = 20;
    const percentage = Math.round((totalScore / maxScore) * 100);

    const topIssues = this.identifyTopIssues(educationMetrics, certificationMetrics);
    const educationIssues = this.identifyEducationIssues(educationMetrics);
    const certificationIssues = this.identifyCertificationIssues(certificationMetrics);

    const tierScore: TierScore = {
      tier_number: 4,
      tier_name: 'Education & Certifications',
      score: Math.round(totalScore * 100) / 100,
      max_score: maxScore,
      percentage,
      weight: 8,
      weighted_contribution: Math.round((percentage * 8) / 100 * 100) / 100,
      metrics_passed: this.countPassedMetrics(educationMetrics, certificationMetrics),
      metrics_total: 20,
      top_issues: [...educationIssues, ...certificationIssues, ...topIssues].slice(0, 5),
    };

    return { tierScore, educationMetrics, certificationMetrics };
  }


  private static analyzeEducation(
    resumeData: ResumeData | undefined,
    textLower: string,
    jobDescription?: string
  ): EducationMetrics {
    const education = resumeData?.education || [];
    const jdLower = jobDescription?.toLowerCase() || '';

    // 1. Degree present
    const degreePresent = education.length > 0 || /\b(bachelor|master|phd|b\.?s\.?|m\.?s\.?|b\.?e\.?|m\.?e\.?|mba|degree)\b/i.test(textLower);

    // 2. Degree relevance to JD
    let degreeRelevance = 50;
    if (jdLower && education.length > 0) {
      const relevantFields = ['computer science', 'engineering', 'information technology', 'software', 'data science', 'mathematics'];
      const hasRelevant = education.some(e => 
        relevantFields.some(f => e.degree.toLowerCase().includes(f) || jdLower.includes(f))
      );
      degreeRelevance = hasRelevant ? 85 : 50;
    }

    // 3. Degree type
    let degreeType = 'unknown';
    if (/phd|doctorate/i.test(textLower)) degreeType = 'phd';
    else if (/master|m\.?s\.?|m\.?e\.?|mba/i.test(textLower)) degreeType = 'masters';
    else if (/bachelor|b\.?s\.?|b\.?e\.?|b\.?tech/i.test(textLower)) degreeType = 'bachelors';
    else if (/associate|diploma/i.test(textLower)) degreeType = 'associate';

    // 4. Institution prestige
    let institutionPrestige = 60;  // Base score for any education
    const schools = education.map(e => e.school.toLowerCase());
    if (schools.some(s => PRESTIGIOUS_INSTITUTIONS.some(p => s.includes(p)))) {
      institutionPrestige = 95;
    } else if (schools.some(s => /university|college|institute|school/i.test(s))) {
      institutionPrestige = 75;  // Any recognized institution
    } else if (schools.length > 0 && schools.some(s => s.length > 3)) {
      institutionPrestige = 70;  // Has school name
    }

    // 5. GPA included
    const gpaIncluded = education.some(e => e.cgpa) || /\bgpa\b|cgpa|\d\.\d{1,2}\s*\/\s*4/i.test(textLower);

    // 6. Graduation date present
    const graduationDatePresent = education.some(e => e.year) || /\b(20\d{2}|19\d{2})\b/.test(textLower);

    // 7. Honors/Awards
    const honorsAwards = /\b(cum laude|magna|summa|honors|dean.?s list|distinction|gold medal|first class)\b/i.test(textLower);

    // 8. Relevant coursework
    const relevantCoursework = /\b(coursework|courses|relevant courses|key courses)\b/i.test(textLower);

    // 9. Multiple degrees
    const multipleDegrees = education.length > 1;

    // 10. Education format score (0-100)
    let educationFormat = 70;
    if (education.length > 0) {
      const hasAllFields = education.every(e => e.degree && e.school && e.year);
      educationFormat = hasAllFields ? 90 : 60;
    }

    return {
      degreePresent,
      degreeRelevance,
      degreeType,
      institutionPrestige,
      gpaIncluded,
      graduationDatePresent,
      honorsAwards,
      relevantCoursework,
      multipleDegrees,
      educationFormat,
    };
  }

  private static analyzeCertifications(
    resumeData: ResumeData | undefined,
    textLower: string,
    jobDescription?: string
  ): CertificationMetrics {
    const certs = resumeData?.certifications || [];
    const jdLower = jobDescription?.toLowerCase() || '';

    // Normalize certifications to strings
    const certStrings = certs.map(c => 
      typeof c === 'string' ? c.toLowerCase() : (c as Certification).title.toLowerCase()
    );
    const allCertText = certStrings.join(' ') + ' ' + textLower;

    // 1. Certification count
    const certCount = certs.length;

    // 2. Certification relevance to JD
    let certRelevance = 50;
    if (jdLower && certCount > 0) {
      const jdKeywords = jdLower.split(/\s+/).filter(w => w.length > 4);
      const matches = certStrings.filter(c => jdKeywords.some(k => c.includes(k))).length;
      certRelevance = certCount > 0 ? Math.min(100, (matches / certCount) * 100 + 30) : 50;
    }

    // 3. Certification currency (has recent dates - 2018-2025)
    const certCurrency = /20(2[0-5]|1[89])/.test(allCertText);

    // 4. Certification credibility (known providers)
    const knownProviders = ['aws', 'microsoft', 'google', 'cisco', 'comptia', 'pmi', 'scrum.org', 'oracle', 'salesforce'];
    const credibleCerts = certStrings.filter(c => knownProviders.some(p => c.includes(p))).length;
    const certCredibility = certCount > 0 ? (credibleCerts / certCount) * 100 : 0;

    // 5. Cloud certifications
    const cloudCerts = CLOUD_CERTS.some(c => allCertText.includes(c));

    // 6. Security certifications
    const securityCerts = SECURITY_CERTS.some(c => allCertText.includes(c));

    // 7. PM certifications
    const pmCerts = PM_CERTS.some(c => allCertText.includes(c));

    // 8. Language certifications
    const languageCerts = LANGUAGE_CERTS.some(c => allCertText.includes(c));

    // 9. Certification dates present
    const certDatePresent = /\b(20\d{2}|expires?|valid|issued)\b/i.test(allCertText);

    // 10. Certification format correct
    const certFormatCorrect = certCount === 0 || certStrings.every(c => c.length > 5);

    return {
      certCount,
      certRelevance,
      certCurrency,
      certCredibility,
      cloudCerts,
      securityCerts,
      pmCerts,
      languageCerts,
      certDatePresent,
      certFormatCorrect,
    };
  }

  private static calculateEducationScore(metrics: EducationMetrics): number {
    /**
     * SIMPLIFIED EDUCATION SCORING (0-5 scale, doubled to 0-10 for tier)
     * Fair for Diploma, Bachelor, Master, PG + Freshers
     * 
     * 5/5 – Perfect match:
     * - Degree level meets or exceeds JD requirement
     * - Field of study is directly relevant (CS/IT/Data for SWE/Data roles)
     * - Education is clearly formatted (degree, school, year)
     * - For students/freshers: GPA/CGPA is included and reasonable
     * 
     * 3-4/5 – Mostly aligned:
     * - Degree level meets requirement but field is slightly adjacent
     *   (e.g., Electronics, Math, Physics for SWE/Data when JD says "CS or related field")
     * - Or: degree is good but some details are missing (no year, no GPA)
     * - Still reasonably clear and ATS-friendly
     * 
     * 1-2/5 – Partial match:
     * - Has education but not well formatted or relevant
     * 
     * 0/5 – No education found
     */
    
    // No education = 0
    if (!metrics.degreePresent) {
      return 0;
    }
    
    let score = 0;
    
    // 1. Degree Level (0-2 points) - Fair for all degree types
    // PhD/PG/Masters = 2, Bachelor = 1.5, Diploma/Associate = 1
    if (metrics.degreeType === 'phd') score += 2;
    else if (metrics.degreeType === 'masters') score += 2;
    else if (metrics.degreeType === 'bachelors') score += 1.5;
    else if (metrics.degreeType === 'associate') score += 1;
    else score += 1; // Diploma or unknown - still gets base score
    
    // 2. Field Relevance (0-1.5 points)
    // Directly relevant (CS/IT/Engineering) = 1.5, Adjacent = 1, Unrelated = 0.5
    if (metrics.degreeRelevance >= 85) score += 1.5;
    else if (metrics.degreeRelevance >= 50) score += 1;
    else score += 0.5;
    
    // 3. Education Format Complete (0-1 point)
    // Has Degree + College + Year = 1, Partial = 0.5
    if (metrics.educationFormat >= 90) score += 1;
    else if (metrics.educationFormat >= 60) score += 0.5;
    
    // 4. GPA/CGPA for Students/Freshers (0-0.5 points)
    // Important for freshers to show academic performance
    if (metrics.gpaIncluded) score += 0.5;
    
    // Cap at 5, then double to get 0-10 scale for tier
    const finalScore = Math.min(5, score);
    
    // Return doubled score (0-10 scale for tier calculation)
    return finalScore * 2;
  }

  private static calculateCertScore(metrics: CertificationMetrics): number {
    let score = 0;

    // Core certification metrics (weighted higher)
    // Give base score if any certs present
    if (metrics.certCount > 0) {
      score += 3;  // Base score for having certifications
      score += Math.min(2, (metrics.certCount - 1) * 0.5);  // Bonus for additional certs
    }
    score += (metrics.certRelevance / 100) * 2;
    score += (metrics.certCredibility / 100) * 1.5;
    
    // Bonus for specific cert types (not required)
    if (metrics.cloudCerts) score += 0.5;
    if (metrics.securityCerts) score += 0.25;
    if (metrics.pmCerts) score += 0.25;
    if (metrics.languageCerts) score += 0.1;
    
    // Optional formatting metrics
    if (metrics.certCurrency) score += 0.25;
    if (metrics.certDatePresent) score += 0.1;
    if (metrics.certFormatCorrect) score += 0.1;

    return Math.min(10, score);
  }

  private static countPassedMetrics(edu: EducationMetrics, cert: CertificationMetrics): number {
    let passed = 0;

    // Education metrics (core 4 criteria)
    if (edu.degreePresent) passed++;
    if (edu.degreeRelevance >= 70) passed++;
    if (edu.degreeType !== 'unknown') passed++;
    if (edu.educationFormat >= 70) passed++; // Format complete (degree + college + year)
    if (edu.gpaIncluded) passed++;
    if (edu.graduationDatePresent) passed++;
    if (edu.multipleDegrees) passed++;
    if (edu.educationFormat >= 70) passed++;

    // Certification metrics
    if (cert.certCount > 0) passed++;
    if (cert.certRelevance >= 60) passed++;
    if (cert.certCurrency) passed++;
    if (cert.certCredibility >= 50) passed++;
    if (cert.cloudCerts) passed++;
    if (cert.securityCerts) passed++;
    if (cert.pmCerts) passed++;
    if (cert.languageCerts) passed++;
    if (cert.certDatePresent) passed++;
    if (cert.certFormatCorrect) passed++;

    return passed;
  }

  private static identifyTopIssues(edu: EducationMetrics, cert: CertificationMetrics): string[] {
    const issues: string[] = [];

    if (!edu.degreePresent) issues.push('No degree information found');
    if (edu.degreeRelevance < 60) issues.push('Degree may not be relevant to target role');
    if (!edu.graduationDatePresent) issues.push('Add graduation dates to education');
    if (edu.educationFormat < 70) issues.push('Improve education section formatting');
    if (cert.certCount === 0) issues.push('Consider adding relevant certifications');
    if (cert.certCount > 0 && !cert.certCurrency) issues.push('Update certification dates or add recent certifications');
    if (cert.certCredibility < 50) issues.push('Add certifications from recognized providers');

    return issues.slice(0, 3);
  }

  private static identifyEducationIssues(edu: EducationMetrics): string[] {
    const issues: string[] = [];

    if (!edu.degreePresent) {
      issues.push('No education/degree information found - add your educational background');
    }
    if (edu.degreeType === 'unknown') {
      issues.push('Degree type not clearly specified - mention Bachelor/Master/PhD explicitly');
    }
    if (edu.degreeRelevance < 60) {
      issues.push('Education field may not align with target role - highlight relevant coursework');
    }
    if (!edu.graduationDatePresent) {
      issues.push('Missing graduation year - add completion date to education');
    }
    if (edu.educationFormat < 70) {
      issues.push('Education format incomplete - include degree, institution, and year');
    }
    if (!edu.gpaIncluded && edu.degreeType !== 'unknown') {
      issues.push('Consider adding GPA/CGPA if above 3.0/7.0');
    }

    return issues;
  }

  private static identifyCertificationIssues(cert: CertificationMetrics): string[] {
    const issues: string[] = [];

    if (cert.certCount === 0) {
      issues.push('No certifications found - consider adding relevant industry certifications');
    }
    if (cert.certCount > 0 && cert.certRelevance < 50) {
      issues.push('Certifications may not be relevant to target role');
    }
    if (cert.certCount > 0 && !cert.certCurrency) {
      issues.push('Certification dates missing or outdated - add recent certifications');
    }
    if (cert.certCount > 0 && cert.certCredibility < 50) {
      issues.push('Add certifications from recognized providers (AWS, Microsoft, Google, etc.)');
    }
    if (cert.certCount > 0 && !cert.certDatePresent) {
      issues.push('Add issue/expiry dates to certifications');
    }

    return issues;
  }
}

export default EducationCertAnalyzer;
