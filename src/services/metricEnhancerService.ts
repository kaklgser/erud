// src/services/metricEnhancerService.ts
import { ResumeData } from '../types/resume';

export interface MetricSuggestion {
  originalBullet: string;
  enhancedBullet: string;
  metricType: 'percentage' | 'scale' | 'time' | 'quality' | 'financial';
  placeholder: string;
  section: 'experience' | 'projects';
  itemTitle: string;
}

export interface MetricEnhancementReport {
  suggestions: MetricSuggestion[];
  totalBullets: number;
  bulletsWithMetrics: number;
  bulletsNeedingMetrics: number;
  metricsPercentage: number;
}

export class MetricEnhancerService {

  static analyzeAndSuggestMetrics(resumeData: ResumeData): MetricEnhancementReport {
    const suggestions: MetricSuggestion[] = [];
    let totalBullets = 0;
    let bulletsWithMetrics = 0;

    // Analyze work experience bullets
    if (resumeData.workExperience) {
      resumeData.workExperience.forEach(job => {
        if (job.bullets) {
          job.bullets.forEach(bullet => {
            totalBullets++;
            if (this.hasMetric(bullet)) {
              bulletsWithMetrics++;
            } else {
              const suggestion = this.generateMetricSuggestion(
                bullet,
                'experience',
                `${job.role} at ${job.company}`
              );
              if (suggestion) {
                suggestions.push(suggestion);
              }
            }
          });
        }
      });
    }

    // Analyze project bullets
    if (resumeData.projects) {
      resumeData.projects.forEach(project => {
        if (project.bullets) {
          project.bullets.forEach(bullet => {
            totalBullets++;
            if (this.hasMetric(bullet)) {
              bulletsWithMetrics++;
            } else {
              const suggestion = this.generateMetricSuggestion(
                bullet,
                'projects',
                project.title
              );
              if (suggestion) {
                suggestions.push(suggestion);
              }
            }
          });
        }
      });
    }

    const bulletsNeedingMetrics = totalBullets - bulletsWithMetrics;
    const metricsPercentage = totalBullets > 0 ? (bulletsWithMetrics / totalBullets) * 100 : 0;

    return {
      suggestions,
      totalBullets,
      bulletsWithMetrics,
      bulletsNeedingMetrics,
      metricsPercentage
    };
  }

  private static hasMetric(bullet: string): boolean {
    const metricPatterns = [
      /\d+%/,                    // Percentage
      /\d+x/i,                   // Multiplier
      /\$\d+/,                   // Currency
      /\d+(?:,\d{3})+/,          // Large numbers with commas
      /\d+\+/,                   // Numbers with plus
      /\d+\s*(?:users|transactions|requests|ms|seconds|minutes|hours|days|weeks|months)/i,
      /reduced.*?\d+/i,
      /increased.*?\d+/i,
      /improved.*?\d+/i,
      /\[\w+%?\]/                // Placeholder metrics
    ];

    return metricPatterns.some(pattern => pattern.test(bullet));
  }

  private static generateMetricSuggestion(
    bullet: string,
    section: 'experience' | 'projects',
    itemTitle: string
  ): MetricSuggestion | null {
    const lowerBullet = bullet.toLowerCase();

    // Development/Building metrics
    if (lowerBullet.match(/develop|built|created|engineer|implement|design/)) {
      if (lowerBullet.includes('user') || lowerBullet.includes('portal') || lowerBullet.includes('platform') || lowerBullet.includes('application')) {
        return {
          originalBullet: bullet,
          enhancedBullet: `${bullet} serving [X] daily active users`,
          metricType: 'scale',
          placeholder: '[X] = number of users (e.g., 500, 10K, 50K+)',
          section,
          itemTitle
        };
      }

      if (lowerBullet.includes('api') || lowerBullet.includes('service') || lowerBullet.includes('endpoint')) {
        return {
          originalBullet: bullet,
          enhancedBullet: `${bullet} handling [X] requests/day with [Y]ms average response time`,
          metricType: 'scale',
          placeholder: '[X] = requests (e.g., 10K, 100K), [Y] = latency in ms (e.g., 50, 200)',
          section,
          itemTitle
        };
      }

      if (lowerBullet.includes('feature') || lowerBullet.includes('module') || lowerBullet.includes('component')) {
        return {
          originalBullet: bullet,
          enhancedBullet: `${bullet} reducing development time by [X]%`,
          metricType: 'percentage',
          placeholder: '[X] = percentage reduction (e.g., 25, 40, 50)',
          section,
          itemTitle
        };
      }

      // Default for development
      return {
        originalBullet: bullet,
        enhancedBullet: `${bullet} impacting [X] users`,
        metricType: 'scale',
        placeholder: '[X] = number of users/systems affected',
        section,
        itemTitle
      };
    }

    // Improvement/Optimization metrics
    if (lowerBullet.match(/improv|enhanc|optim|upgrad|refactor/)) {
      if (lowerBullet.includes('performance') || lowerBullet.includes('speed') || lowerBullet.includes('load') || lowerBullet.includes('response')) {
        return {
          originalBullet: bullet,
          enhancedBullet: `${bullet} by [X]% resulting in [Y]ms faster load time`,
          metricType: 'percentage',
          placeholder: '[X] = percentage improvement (e.g., 30, 45, 60), [Y] = time in ms',
          section,
          itemTitle
        };
      }

      if (lowerBullet.includes('efficiency') || lowerBullet.includes('productivity')) {
        return {
          originalBullet: bullet,
          enhancedBullet: `${bullet} by [X]% saving [Y] hours per week`,
          metricType: 'time',
          placeholder: '[X] = percentage, [Y] = time saved',
          section,
          itemTitle
        };
      }

      // Default for improvements
      return {
        originalBullet: bullet,
        enhancedBullet: `${bullet} by [X]%`,
        metricType: 'percentage',
        placeholder: '[X] = percentage improvement (e.g., 25, 35, 50)',
        section,
        itemTitle
      };
    }

    // Reduction metrics
    if (lowerBullet.match(/reduc|decreas|minimi|eliminat|cut/)) {
      if (lowerBullet.includes('bug') || lowerBullet.includes('error') || lowerBullet.includes('issue')) {
        return {
          originalBullet: bullet,
          enhancedBullet: `${bullet} by [X]% achieving [Y]% code quality score`,
          metricType: 'quality',
          placeholder: '[X] = reduction percentage (e.g., 40, 60, 75), [Y] = quality score',
          section,
          itemTitle
        };
      }

      if (lowerBullet.includes('time') || lowerBullet.includes('duration') || lowerBullet.includes('latency')) {
        return {
          originalBullet: bullet,
          enhancedBullet: `${bullet} by [X]% from [Y]ms to [Z]ms`,
          metricType: 'time',
          placeholder: '[X] = percentage reduction, [Y] = before, [Z] = after',
          section,
          itemTitle
        };
      }

      if (lowerBullet.includes('cost')) {
        return {
          originalBullet: bullet,
          enhancedBullet: `${bullet} by [X]% saving $[Y] annually`,
          metricType: 'financial',
          placeholder: '[X] = percentage, [Y] = amount saved',
          section,
          itemTitle
        };
      }

      // Default for reductions
      return {
        originalBullet: bullet,
        enhancedBullet: `${bullet} by [X]%`,
        metricType: 'percentage',
        placeholder: '[X] = reduction percentage (e.g., 30, 45, 60)',
        section,
        itemTitle
      };
    }

    // Increase metrics
    if (lowerBullet.match(/increas|boost|rais|expand|grow|scale/)) {
      if (lowerBullet.includes('user') || lowerBullet.includes('traffic') || lowerBullet.includes('engagement')) {
        return {
          originalBullet: bullet,
          enhancedBullet: `${bullet} by [X]% reaching [Y] monthly active users`,
          metricType: 'scale',
          placeholder: '[X] = percentage increase, [Y] = total users',
          section,
          itemTitle
        };
      }

      if (lowerBullet.includes('revenue') || lowerBullet.includes('sales')) {
        return {
          originalBullet: bullet,
          enhancedBullet: `${bullet} by [X]% generating additional $[Y]K in revenue`,
          metricType: 'financial',
          placeholder: '[X] = percentage, [Y] = revenue amount',
          section,
          itemTitle
        };
      }

      // Default for increases
      return {
        originalBullet: bullet,
        enhancedBullet: `${bullet} by [X]%`,
        metricType: 'percentage',
        placeholder: '[X] = increase percentage (e.g., 25, 50, 100)',
        section,
        itemTitle
      };
    }

    // Testing/Quality metrics
    if (lowerBullet.match(/test|debug|fix|resolv|troubleshoot|quality/)) {
      return {
        originalBullet: bullet,
        enhancedBullet: `${bullet} achieving [X]% code coverage and [Y]% bug reduction`,
        metricType: 'quality',
        placeholder: '[X] = test coverage (e.g., 80, 90, 95), [Y] = bug reduction',
        section,
        itemTitle
      };
    }

    // Integration/Deployment metrics
    if (lowerBullet.match(/integrat|deploy|launch|migrat|implement/)) {
      return {
        originalBullet: bullet,
        enhancedBullet: `${bullet} for [X] users with [Y]% uptime`,
        metricType: 'quality',
        placeholder: '[X] = number of users, [Y] = uptime percentage (e.g., 99.5, 99.9)',
        section,
        itemTitle
      };
    }

    // Collaboration metrics
    if (lowerBullet.match(/collaborat|work.*team|led|manag|coordinat/)) {
      return {
        originalBullet: bullet,
        enhancedBullet: `${bullet} delivering project [X]% ahead of schedule`,
        metricType: 'time',
        placeholder: '[X] = ahead percentage or days (e.g., 15% or 10 days)',
        section,
        itemTitle
      };
    }

    // Automation metrics
    if (lowerBullet.match(/automat|streamlin|simplif/)) {
      return {
        originalBullet: bullet,
        enhancedBullet: `${bullet} saving [X] hours per week and reducing manual effort by [Y]%`,
        metricType: 'time',
        placeholder: '[X] = time saved, [Y] = effort reduction percentage',
        section,
        itemTitle
      };
    }

    // Generic default - add scale
    return {
      originalBullet: bullet,
      enhancedBullet: `${bullet} with [X]% improvement in efficiency`,
      metricType: 'percentage',
      placeholder: '[X] = improvement percentage (estimate based on your experience)',
      section,
      itemTitle
    };
  }

  static applyMetricEnhancements(
    resumeData: ResumeData,
    selectedSuggestions: MetricSuggestion[]
  ): ResumeData {
    const enhancedData = { ...resumeData };

    // Apply work experience enhancements
    if (enhancedData.workExperience) {
      enhancedData.workExperience = enhancedData.workExperience.map(job => ({
        ...job,
        bullets: job.bullets?.map(bullet => {
          const suggestion = selectedSuggestions.find(
            s => s.originalBullet === bullet && s.section === 'experience'
          );
          return suggestion ? suggestion.enhancedBullet : bullet;
        })
      }));
    }

    // Apply project enhancements
    if (enhancedData.projects) {
      enhancedData.projects = enhancedData.projects.map(project => ({
        ...project,
        bullets: project.bullets?.map(bullet => {
          const suggestion = selectedSuggestions.find(
            s => s.originalBullet === bullet && s.section === 'projects'
          );
          return suggestion ? suggestion.enhancedBullet : bullet;
        })
      }));
    }

    return enhancedData;
  }

  static getMetricGuidelines(): Record<string, string[]> {
    return {
      percentage: [
        'Performance improvement: 20-60%',
        'Bug reduction: 30-70%',
        'Time savings: 25-50%',
        'Efficiency gains: 15-45%'
      ],
      scale: [
        'Daily active users: 100, 500, 1K, 5K, 10K+',
        'API requests: 1K, 10K, 100K, 1M+ per day',
        'Data processed: GB, TB scale',
        'Concurrent users: 50, 100, 500, 1K+'
      ],
      time: [
        'Load time: 100ms, 200ms, 500ms, 1s, 2s',
        'Development time saved: days/weeks',
        'Processing time: seconds, minutes',
        'Deployment time: hours to minutes'
      ],
      quality: [
        'Code coverage: 70%, 80%, 90%, 95%+',
        'Uptime: 99%, 99.5%, 99.9%',
        'Test pass rate: 95%, 98%, 100%',
        'Bug-free releases: X consecutive releases'
      ],
      financial: [
        'Cost savings: $1K, $5K, $10K+',
        'Revenue generated: $10K, $50K, $100K+',
        'Resource optimization: hours × hourly rate',
        'Infrastructure savings: % of cloud costs'
      ]
    };
  }
}

export const metricEnhancerService = MetricEnhancerService;
