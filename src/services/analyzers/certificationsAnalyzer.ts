/**
 * Tier 4b: Certifications Analyzer (8 metrics)
 * Analyzes professional certifications and licenses
 */

import { ResumeData, TierScore, Certification } from '../../types/resume';

export interface CertificationsInput {
  resumeText: string;
  resumeData?: ResumeData;
  jobDescription?: string;
}

export interface CertificationsResult {
  tierScore: TierScore;
  certificationMetrics: CertificationMetrics;
}

interface CertificationMetrics {
  certCount: number;
  certRelevance: number;
  certCurrency: boolean;
  certCredibility: number;
  cloudCerts: boolean;
  securityCerts: boolean;
  pmCerts: boolean;
  certFormatCorrect: boolean;
}

// Relevant certifications by category
const CLOUD_CERTS = ['aws', 'azure', 'gcp', 'google cloud', 'cloud practitioner', 'solutions architect'];
const SECURITY_CERTS = ['cissp', 'cism', 'ceh', 'security+', 'comptia security', 'oscp'];
const PM_CERTS = ['pmp', 'prince2', 'scrum master', 'csm', 'psm', 'safe', 'agile'];

export class CertificationsAnalyzer {
  static analyze(input: CertificationsInput): CertificationsResult {
    const { resumeText, resumeData, jobDescription } = input;
    const textLower = resumeText.toLowerCase();

    // Analyze certifications (8 metrics)
    const certificationMetrics = this.analyzeCertifications(resumeData, textLower, jobDescription);

    // Calculate score
    const totalScore = this.calculateCertScore(certificationMetrics);
    const maxScore = 8;
    const percentage = Math.round((totalScore / maxScore) * 100);

    const topIssues = this.identifyCertificationIssues(certificationMetrics);

    const tierScore: TierScore = {
      tier_number: 5, // Tier 4b
      tier_name: 'Certifications',
      score: Math.round(totalScore * 100) / 100,
      max_score: maxScore,
      percentage,
      weight: 4, // Separate weight for certifications
      weighted_contribution: Math.round((percentage * 4) / 100 * 100) / 100,
      metrics_passed: this.countPassedMetrics(certificationMetrics),
      metrics_total: 8,
      top_issues: topIssues.slice(0, 3),
    };

    return { tierScore, certificationMetrics };
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

    // 3. Certification currency (has recent dates)
    const certCurrency = /20(2[0-4]|1[89])/.test(allCertText);

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

    // 8. Certification format correct
    const certFormatCorrect = certCount === 0 || certStrings.every(c => c.length > 5);

    return {
      certCount,
      certRelevance,
      certCurrency,
      certCredibility,
      cloudCerts,
      securityCerts,
      pmCerts,
      certFormatCorrect,
    };
  }

  private static calculateCertScore(metrics: CertificationMetrics): number {
    let score = 0;

    // Core certification metrics (weighted higher)
    // Give base score if any certs present
    if (metrics.certCount > 0) {
      score += 2.5;  // Base score for having certifications
      score += Math.min(1.5, (metrics.certCount - 1) * 0.3);  // Bonus for additional certs
    }
    score += (metrics.certRelevance / 100) * 1.5;
    score += (metrics.certCredibility / 100) * 1.2;
    
    // Bonus for specific cert types
    if (metrics.cloudCerts) score += 0.8;
    if (metrics.securityCerts) score += 0.6;
    if (metrics.pmCerts) score += 0.5;
    
    // Optional formatting metrics
    if (metrics.certCurrency) score += 0.4;
    if (metrics.certFormatCorrect) score += 0.2;

    return Math.min(8, score);
  }

  private static countPassedMetrics(cert: CertificationMetrics): number {
    let passed = 0;

    if (cert.certCount > 0) passed++;
    if (cert.certRelevance >= 60) passed++;
    if (cert.certCurrency) passed++;
    if (cert.certCredibility >= 50) passed++;
    if (cert.cloudCerts) passed++;
    if (cert.securityCerts) passed++;
    if (cert.pmCerts) passed++;
    if (cert.certFormatCorrect) passed++;

    return passed;
  }

  private static identifyCertificationIssues(cert: CertificationMetrics): string[] {
    const issues: string[] = [];

    if (cert.certCount === 0) issues.push('Consider adding relevant certifications');
    if (cert.certCount > 0 && !cert.certCurrency) issues.push('Update certification dates or add recent certifications');
    if (cert.certCredibility < 50) issues.push('Add certifications from recognized providers');
    if (cert.certRelevance < 60) issues.push('Add certifications relevant to target role');
    if (!cert.cloudCerts && !cert.securityCerts && !cert.pmCerts) issues.push('Consider industry-specific certifications');

    return issues;
  }
}

export default CertificationsAnalyzer;