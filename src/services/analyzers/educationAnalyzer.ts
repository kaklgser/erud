/**
 * Tier 4a: Education Analyzer (12 metrics)
 * Analyzes education credentials and academic background
 */

import { ResumeData, TierScore } from '../../types/resume';

export interface EducationInput {
  resumeText: string;
  resumeData?: ResumeData;
  jobDescription?: string;
}

export interface EducationResult {
  tierScore: TierScore;
  educationMetrics: EducationMetrics;
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
  fieldOfStudyRelevance: number;
  educationLevel: number;
}

// Known prestigious institutions (sample)
const PRESTIGIOUS_INSTITUTIONS = [
  'mit', 'stanford', 'harvard', 'berkeley', 'caltech', 'princeton', 'yale',
  'columbia', 'cornell', 'carnegie mellon', 'georgia tech', 'university of michigan',
  'iit', 'nit', 'bits', 'iisc', 'oxford', 'cambridge', 'eth zurich'
];

export class EducationAnalyzer {
  static analyze(input: EducationInput): EducationResult {
    const { resumeText, resumeData, jobDescription } = input;
    const textLower = resumeText.toLowerCase();

    // Analyze education (12 metrics)
    const educationMetrics = this.analyzeEducation(resumeData, textLower, jobDescription);

    // Calculate score
    const totalScore = this.calculateEducationScore(educationMetrics);
    const maxScore = 12;
    const percentage = Math.round((totalScore / maxScore) * 100);

    const topIssues = this.identifyEducationIssues(educationMetrics);

    const tierScore: TierScore = {
      tier_number: 4,
      tier_name: 'Education',
      score: Math.round(totalScore * 100) / 100,
      max_score: maxScore,
      percentage,
      weight: 6, // Separate weight for education
      weighted_contribution: Math.round((percentage * 6) / 100 * 100) / 100,
      metrics_passed: this.countPassedMetrics(educationMetrics),
      metrics_total: 12,
      top_issues: topIssues.slice(0, 3),
    };

    return { tierScore, educationMetrics };
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

    // 11. Field of study relevance
    let fieldOfStudyRelevance = 50;
    if (jdLower && education.length > 0) {
      const techFields = ['computer', 'software', 'engineering', 'technology', 'science', 'mathematics', 'data'];
      const hasRelevantField = education.some(e => 
        techFields.some(f => e.degree.toLowerCase().includes(f))
      );
      fieldOfStudyRelevance = hasRelevantField ? 80 : 50;
    }

    // 12. Education level appropriateness
    let educationLevel = 70;
    if (degreeType === 'phd') educationLevel = 95;
    else if (degreeType === 'masters') educationLevel = 85;
    else if (degreeType === 'bachelors') educationLevel = 75;
    else if (degreeType !== 'unknown') educationLevel = 60;

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
      fieldOfStudyRelevance,
      educationLevel,
    };
  }

  private static calculateEducationScore(metrics: EducationMetrics): number {
    let score = 0;

    // Core education metrics (weighted higher)
    if (metrics.degreePresent) score += 2.5;
    score += (metrics.degreeRelevance / 100) * 2;
    if (metrics.degreeType === 'phd') score += 1.5;
    else if (metrics.degreeType === 'masters') score += 1.2;
    else if (metrics.degreeType === 'bachelors') score += 1;
    else if (metrics.degreeType !== 'unknown') score += 0.8;
    score += (metrics.institutionPrestige / 100) * 1.5;
    if (metrics.graduationDatePresent) score += 1;
    score += (metrics.fieldOfStudyRelevance / 100) * 1;
    score += (metrics.educationLevel / 100) * 0.8;
    
    // Optional/bonus metrics
    if (metrics.gpaIncluded) score += 0.3;
    if (metrics.honorsAwards) score += 0.4;
    if (metrics.relevantCoursework) score += 0.2;
    if (metrics.multipleDegrees) score += 0.3;
    score += (metrics.educationFormat / 100) * 0.5;

    return Math.min(12, score);
  }

  private static countPassedMetrics(edu: EducationMetrics): number {
    let passed = 0;

    if (edu.degreePresent) passed++;
    if (edu.degreeRelevance >= 70) passed++;
    if (edu.degreeType !== 'unknown') passed++;
    if (edu.institutionPrestige >= 60) passed++;
    if (edu.gpaIncluded) passed++;
    if (edu.graduationDatePresent) passed++;
    if (edu.honorsAwards) passed++;
    if (edu.relevantCoursework) passed++;
    if (edu.multipleDegrees) passed++;
    if (edu.educationFormat >= 70) passed++;
    if (edu.fieldOfStudyRelevance >= 60) passed++;
    if (edu.educationLevel >= 70) passed++;

    return passed;
  }

  private static identifyEducationIssues(edu: EducationMetrics): string[] {
    const issues: string[] = [];

    if (!edu.degreePresent) issues.push('No degree information found');
    if (edu.degreeRelevance < 60) issues.push('Degree may not be relevant to target role');
    if (!edu.graduationDatePresent) issues.push('Add graduation dates to education');
    if (edu.educationFormat < 70) issues.push('Improve education section formatting');
    if (edu.fieldOfStudyRelevance < 60) issues.push('Field of study may not align with target role');
    if (edu.institutionPrestige < 60) issues.push('Consider highlighting institution achievements');

    return issues;
  }
}

export default EducationAnalyzer;