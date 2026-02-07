import { ResumeData } from '../types/resume';
import { metricPreserver } from './metricPreserver';

export interface BulletViolation {
  location: string;
  section: string;
  index: number;
  bullet: string;
  length: number;
  excess: number;
}

export interface BulletFix {
  location: string;
  strategy: 'compress' | 'split';
  before: string;
  after: string[];
  lengthBefore: number;
  lengthAfter: number[];
  metricsPreserved: boolean;
  starPreserved: boolean;
}

export interface BulletLengthAnalysis {
  totalBullets: number;
  violations: BulletViolation[];
  fixesApplied: BulletFix[];
  statsBeforeAfter: {
    avgLength: { before: number; after: number };
    maxLength: { before: number; after: number };
    violationCount: { before: number; after: number };
  };
}

export class ATSBulletLengthFixer {
  private static readonly MAX_BULLET_LENGTH = 120;
  private static readonly MIN_BULLET_LENGTH = 30;
  private static readonly IDEAL_SPLIT_LENGTH = 80;

  private static readonly FILLER_PHRASES = [
    'in order to',
    'was responsible for',
    'helped to',
    'worked on',
    'participated in',
    'involved in',
    'contributed to',
    'tasked with',
    'assigned to',
    'worked with',
    'collaborated with team to',
    'worked closely with'
  ];

  private static readonly VERBOSE_REPLACEMENTS = {
    'utilized': 'used',
    'implemented a solution to': 'solved',
    'in an effort to': 'to',
    'with the goal of': 'to',
    'for the purpose of': 'to',
    'was able to': '',
    'successfully': '',
    'effectively': '',
    'efficiently': '',
    'helped in': 'aided',
    'worked together with': 'with',
    'made improvements to': 'improved',
    'conducted analysis on': 'analyzed',
    'performed testing of': 'tested',
    'carried out': 'executed',
    'took part in': 'participated in'
  };

  static scanBullets(resumeData: ResumeData): BulletLengthAnalysis {
    const violations: BulletViolation[] = [];
    let totalBullets = 0;
    let totalLength = 0;
    let maxLength = 0;

    const scanSection = (items: any[], sectionName: string, bulletKey: string = 'bullets') => {
      items?.forEach((item, itemIndex) => {
        const bullets = item[bulletKey] || [];
        bullets.forEach((bullet: string, bulletIndex: number) => {
          totalBullets++;
          const length = bullet.length;
          totalLength += length;
          maxLength = Math.max(maxLength, length);

          if (length > this.MAX_BULLET_LENGTH) {
            violations.push({
              location: `${sectionName}[${itemIndex}].${bulletKey}[${bulletIndex}]`,
              section: sectionName,
              index: bulletIndex,
              bullet,
              length,
              excess: length - this.MAX_BULLET_LENGTH
            });
          }
        });
      });
    };

    scanSection(resumeData.workExperience || [], 'workExperience');
    scanSection(resumeData.projects || [], 'projects', 'description');

    return {
      totalBullets,
      violations,
      fixesApplied: [],
      statsBeforeAfter: {
        avgLength: {
          before: totalBullets > 0 ? Math.round(totalLength / totalBullets) : 0,
          after: 0
        },
        maxLength: {
          before: maxLength,
          after: 0
        },
        violationCount: {
          before: violations.length,
          after: 0
        }
      }
    };
  }

  static fixLongBullet(bullet: string): BulletFix {
    const originalLength = bullet.length;
    const originalMetrics = metricPreserver.extractMetrics(bullet);

    let fixedBullets: string[] = [];
    let strategy: 'compress' | 'split' = 'compress';

    const compressed = this.compressBullet(bullet);

    if (compressed.length <= this.MAX_BULLET_LENGTH) {
      fixedBullets = [compressed];
      strategy = 'compress';
    } else {
      const split = this.splitBullet(compressed);
      if (split.length === 2 && split[0].length <= this.MAX_BULLET_LENGTH && split[1].length <= this.MAX_BULLET_LENGTH) {
        fixedBullets = split;
        strategy = 'split';
      } else {
        fixedBullets = [this.aggressiveCompress(compressed)];
        strategy = 'compress';
      }
    }

    const metricsPreserved = this.validateMetricsPreserved(originalMetrics, fixedBullets);
    const starPreserved = this.validateSTARStructure(bullet, fixedBullets);

    return {
      location: '',
      strategy,
      before: bullet,
      after: fixedBullets,
      lengthBefore: originalLength,
      lengthAfter: fixedBullets.map(b => b.length),
      metricsPreserved,
      starPreserved
    };
  }

  private static compressBullet(bullet: string): string {
    let compressed = bullet;

    for (const phrase of this.FILLER_PHRASES) {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      compressed = compressed.replace(regex, '');
    }

    for (const [verbose, concise] of Object.entries(this.VERBOSE_REPLACEMENTS)) {
      const regex = new RegExp(`\\b${verbose}\\b`, 'gi');
      compressed = compressed.replace(regex, concise);
    }

    compressed = compressed.replace(/\s+/g, ' ').trim();
    compressed = compressed.replace(/\s*,\s*/g, ', ');
    compressed = compressed.replace(/\s*\.\s*/g, '. ');

    return compressed;
  }

  private static aggressiveCompress(bullet: string): string {
    let compressed = bullet;

    compressed = compressed.replace(/\b(?:very|really|quite|extremely|highly)\s+/gi, '');
    compressed = compressed.replace(/\b(?:in the|on the|at the|to the|for the)\b/gi, (match) => match.replace(' the', ''));
    compressed = compressed.replace(/\b(?:and|as well as)\b/gi, '&');
    compressed = compressed.replace(/\s+/g, ' ').trim();

    if (compressed.length > this.MAX_BULLET_LENGTH) {
      const sentences = compressed.split(/\.\s+/);
      if (sentences.length > 1) {
        compressed = sentences[0] + '.';
      }
    }

    return compressed.substring(0, this.MAX_BULLET_LENGTH);
  }

  private static splitBullet(bullet: string): string[] {
    const hasActionVerb = /^[A-Z][a-z]+ed\s+/.test(bullet);
    if (!hasActionVerb) {
      return [bullet];
    }

    const metrics = metricPreserver.extractMetrics(bullet);

    const sentences = bullet.split(/\.\s+/);
    if (sentences.length >= 2) {
      return [
        sentences[0].trim() + '.',
        sentences.slice(1).join('. ').trim()
      ];
    }

    const splitPoints = [
      { pattern: /\.\s+(?=[A-Z])/, priority: 1 },
      { pattern: /,\s+(?:resulting in|achieving|leading to|improving)/i, priority: 2 },
      { pattern: /,\s+(?:which|that)/i, priority: 3 },
      { pattern: /\s+(?:while|and|resulting in|achieving)/i, priority: 4 }
    ];

    for (const { pattern } of splitPoints) {
      const match = bullet.match(pattern);
      if (match && match.index) {
        const splitIndex = match.index + match[0].length;
        const part1 = bullet.substring(0, splitIndex).trim();
        const part2 = bullet.substring(splitIndex).trim();

        if (part1.length >= this.MIN_BULLET_LENGTH &&
            part2.length >= this.MIN_BULLET_LENGTH &&
            part1.length <= this.MAX_BULLET_LENGTH &&
            part2.length <= this.MAX_BULLET_LENGTH) {

          let finalPart2 = part2;
          if (!/^[A-Z]/.test(finalPart2)) {
            finalPart2 = finalPart2.charAt(0).toUpperCase() + finalPart2.slice(1);
          }
          if (!/\.$/.test(finalPart2)) {
            finalPart2 += '.';
          }

          return [part1, finalPart2];
        }
      }
    }

    const midpoint = Math.floor(bullet.length / 2);
    const commaIndex = bullet.indexOf(',', midpoint - 20);

    if (commaIndex > 0 && commaIndex < midpoint + 20) {
      const part1 = bullet.substring(0, commaIndex + 1).trim();
      let part2 = bullet.substring(commaIndex + 1).trim();

      if (!/^[A-Z]/.test(part2)) {
        part2 = part2.charAt(0).toUpperCase() + part2.slice(1);
      }
      if (!/\.$/.test(part2)) {
        part2 += '.';
      }

      if (part1.length <= this.MAX_BULLET_LENGTH && part2.length <= this.MAX_BULLET_LENGTH) {
        return [part1, part2];
      }
    }

    return [bullet];
  }

  private static validateMetricsPreserved(originalMetrics: string[], fixedBullets: string[]): boolean {
    if (originalMetrics.length === 0) return true;

    const combinedFixed = fixedBullets.join(' ');
    const fixedMetrics = metricPreserver.extractMetrics(combinedFixed);

    const normalizedOriginal = originalMetrics.map(m => m.replace(/[,\s]/g, '').toLowerCase());
    const normalizedFixed = fixedMetrics.map(m => m.replace(/[,\s]/g, '').toLowerCase());

    return normalizedOriginal.every(metric =>
      normalizedFixed.some(fixed =>
        fixed.includes(metric) || metric.includes(fixed)
      )
    );
  }

  private static validateSTARStructure(original: string, fixed: string[]): boolean {
    const hasActionVerb = (text: string) => /^[A-Z][a-z]+ed\s+/.test(text.trim());
    const hasMetric = (text: string) => /\d+/.test(text);

    const originalHasAction = hasActionVerb(original);
    const originalHasMetric = hasMetric(original);

    const fixedHasAction = fixed.some(hasActionVerb);
    const fixedHasMetric = fixed.some(hasMetric);

    return (originalHasAction === fixedHasAction) && (originalHasMetric === fixedHasMetric);
  }

  static applyFixes(resumeData: ResumeData, analysis: BulletLengthAnalysis): ResumeData {
    const fixedData = JSON.parse(JSON.stringify(resumeData));
    const fixes: BulletFix[] = [];

    analysis.violations.forEach(violation => {
      const fix = this.fixLongBullet(violation.bullet);
      fix.location = violation.location;
      fixes.push(fix);

      const pathParts = violation.location.match(/(\w+)\[(\d+)\]\.(\w+)\[(\d+)\]/);
      if (pathParts) {
        const [, section, sectionIndex, bulletKey, bulletIndex] = pathParts;
        const sectionArray = fixedData[section as keyof ResumeData] as any[];

        if (sectionArray && sectionArray[parseInt(sectionIndex)]) {
          const item = sectionArray[parseInt(sectionIndex)];
          const bullets = item[bulletKey];

          if (bullets && bullets[parseInt(bulletIndex)]) {
            if (fix.after.length === 1) {
              bullets[parseInt(bulletIndex)] = fix.after[0];
            } else {
              bullets[parseInt(bulletIndex)] = fix.after[0];
              bullets.splice(parseInt(bulletIndex) + 1, 0, fix.after[1]);
            }
          }
        }
      }
    });

    const postFixAnalysis = this.scanBullets(fixedData);

    analysis.fixesApplied = fixes;
    analysis.statsBeforeAfter.avgLength.after = postFixAnalysis.statsBeforeAfter.avgLength.before;
    analysis.statsBeforeAfter.maxLength.after = postFixAnalysis.statsBeforeAfter.maxLength.before;
    analysis.statsBeforeAfter.violationCount.after = postFixAnalysis.violations.length;

    return fixedData;
  }

  static generateFixReport(analysis: BulletLengthAnalysis): string {
    const report: string[] = [];

    report.push('=== ATS BULLET LENGTH ANALYSIS ===');
    report.push(`Total Bullets: ${analysis.totalBullets}`);
    report.push(`Violations Found: ${analysis.statsBeforeAfter.violationCount.before}`);
    report.push(`Violations After Fix: ${analysis.statsBeforeAfter.violationCount.after}`);
    report.push('');

    report.push('STATISTICS:');
    report.push(`  Avg Length: ${analysis.statsBeforeAfter.avgLength.before} → ${analysis.statsBeforeAfter.avgLength.after} chars`);
    report.push(`  Max Length: ${analysis.statsBeforeAfter.maxLength.before} → ${analysis.statsBeforeAfter.maxLength.after} chars`);
    report.push('');

    if (analysis.fixesApplied.length > 0) {
      report.push('FIXES APPLIED:');
      analysis.fixesApplied.forEach((fix, i) => {
        report.push(`\n${i + 1}. Location: ${fix.location}`);
        report.push(`   Strategy: ${fix.strategy.toUpperCase()}`);
        report.push(`   Length: ${fix.lengthBefore} → ${fix.lengthAfter.join(', ')} chars`);
        report.push(`   Metrics Preserved: ${fix.metricsPreserved ? '✓' : '✗'}`);
        report.push(`   STAR Preserved: ${fix.starPreserved ? '✓' : '✗'}`);
        report.push(`   Before: ${fix.before.substring(0, 80)}...`);
        fix.after.forEach((bullet, j) => {
          report.push(`   After ${j + 1}: ${bullet.substring(0, 80)}${bullet.length > 80 ? '...' : ''}`);
        });
      });
    }

    if (analysis.statsBeforeAfter.violationCount.after === 0) {
      report.push('\n✅ ALL BULLETS NOW COMPLY WITH ATS LENGTH REQUIREMENTS');
    } else {
      report.push(`\n⚠️ ${analysis.statsBeforeAfter.violationCount.after} VIOLATIONS REMAIN`);
    }

    return report.join('\n');
  }

  static getViolationSummary(analysis: BulletLengthAnalysis): {
    hasViolations: boolean;
    count: number;
    sections: string[];
    avgExcess: number;
  } {
    const sections = new Set(analysis.violations.map(v => v.section));
    const avgExcess = analysis.violations.length > 0
      ? Math.round(analysis.violations.reduce((sum, v) => sum + v.excess, 0) / analysis.violations.length)
      : 0;

    return {
      hasViolations: analysis.violations.length > 0,
      count: analysis.violations.length,
      sections: Array.from(sections),
      avgExcess
    };
  }
}

export const atsBulletLengthFixer = ATSBulletLengthFixer;
