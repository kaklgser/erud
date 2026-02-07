/**
 * Enhanced 16-Parameter ATS Score Checker with Advanced Features
 * 
 * Additional features:
 * - Score history tracking
 * - Improvement suggestions generator
 * - Benchmark comparisons
 * - Export functionality
 * - Performance analytics
 */

import { ATSScoreChecker16Parameter, ATSScore16Parameter } from './atsScoreChecker16Parameter';

export interface ScoreHistory {
  timestamp: Date;
  score: ATSScore16Parameter;
  filename: string;
  jobDescription?: string;
  improvements?: string[];
}

export interface BenchmarkData {
  industry: string;
  role: string;
  averageScore: number;
  topPercentileScore: number;
  parameterBenchmarks: Record<string, { average: number; topPercentile: number }>;
}

export interface ImprovementSuggestion {
  parameter: string;
  currentScore: number;
  maxScore: number;
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  expectedImprovement: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export class ATSScoreChecker16ParameterEnhanced {
  private static scoreHistory: ScoreHistory[] = [];
  
  /**
   * Enhanced evaluation with history tracking
   */
  static async evaluateResumeEnhanced(
    resumeText: string,
    jobDescription?: string,
    filename?: string,
    file?: File,
    useEnhancedProcessing: boolean = true,
    trackHistory: boolean = true
  ): Promise<{
    score: ATSScore16Parameter;
    improvements: ImprovementSuggestion[];
    benchmark?: BenchmarkData;
    previousScore?: ATSScore16Parameter;
  }> {
    
    // Get the base score
    const score = await ATSScoreChecker16Parameter.evaluateResume(
      resumeText,
      jobDescription,
      filename,
      file,
      useEnhancedProcessing
    );
    
    // Generate improvement suggestions
    const improvements = this.generateImprovementSuggestions(score);
    
    // Get benchmark data
    const benchmark = this.getBenchmarkData(jobDescription);
    
    // Get previous score for comparison
    const previousScore = this.getPreviousScore(filename || 'resume');
    
    // Track history if enabled
    if (trackHistory) {
      this.addToHistory(score, filename || 'resume', jobDescription, improvements.map(i => i.suggestion));
    }
    
    return {
      score,
      improvements,
      benchmark,
      previousScore
    };
  }
  
  /**
   * Generate specific improvement suggestions based on scores
   */
  private static generateImprovementSuggestions(score: ATSScore16Parameter): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];
    
    // Define parameter max scores and improvement strategies
    const parameterStrategies = {
      keywordMatch: {
        maxScore: 25,
        suggestions: {
          low: 'Add more job-relevant keywords from the job description to your resume',
          medium: 'Include industry-specific terminology and technical skills mentioned in the JD',
          high: 'Fine-tune keyword density and use variations of key terms'
        }
      },
      skillsAlignment: {
        maxScore: 20,
        suggestions: {
          low: 'Expand your skills section with relevant technical and soft skills',
          medium: 'Reorganize skills to match job requirements priority',
          high: 'Add skill proficiency levels and certifications'
        }
      },
      experienceRelevance: {
        maxScore: 15,
        suggestions: {
          low: 'Rewrite job descriptions to highlight relevant experience',
          medium: 'Add more details about responsibilities that match the target role',
          high: 'Quantify achievements and use industry-specific language'
        }
      },
      technicalCompetencies: {
        maxScore: 12,
        suggestions: {
          low: 'Add technical skills and tools mentioned in the job description',
          medium: 'Include specific technologies, programming languages, or software',
          high: 'Demonstrate technical depth with project examples and certifications'
        }
      },
      quantifiedAchievements: {
        maxScore: 8,
        suggestions: {
          low: 'Add numbers, percentages, and metrics to your accomplishments',
          medium: 'Include more specific results and impact measurements',
          high: 'Use compelling metrics that demonstrate business value'
        }
      }
    };
    
    // Analyze each parameter and generate suggestions
    Object.entries(score.scores).forEach(([param, scoreData]) => {
      const percentage = (scoreData.score / scoreData.maxScore) * 100;
      const strategy = parameterStrategies[param as keyof typeof parameterStrategies];
      
      if (strategy && percentage < 80) {
        let priority: 'high' | 'medium' | 'low' = 'low';
        let suggestion = strategy.suggestions.low;
        let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
        
        if (percentage < 40) {
          priority = 'high';
          suggestion = strategy.suggestions.low;
          difficulty = 'medium';
        } else if (percentage < 70) {
          priority = 'medium';
          suggestion = strategy.suggestions.medium;
          difficulty = 'medium';
        } else {
          priority = 'low';
          suggestion = strategy.suggestions.high;
          difficulty = 'hard';
        }
        
        suggestions.push({
          parameter: param.replace(/([A-Z])/g, ' $1').trim(),
          currentScore: scoreData.score,
          maxScore: scoreData.maxScore,
          priority,
          suggestion,
          expectedImprovement: Math.round((strategy.maxScore - scoreData.score) * 0.6),
          difficulty
        });
      }
    });
    
    // Sort by priority and potential impact
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.expectedImprovement - a.expectedImprovement;
    });
  }
  
  /**
   * Get benchmark data for comparison
   */
  private static getBenchmarkData(jobDescription?: string): BenchmarkData | undefined {
    if (!jobDescription) return undefined;
    
    // Detect role and industry from job description
    const role = this.detectRole(jobDescription);
    const industry = this.detectIndustry(jobDescription);
    
    // Return mock benchmark data (in production, this would come from a database)
    return {
      industry,
      role,
      averageScore: role.includes('analyst') ? 68 : 65,
      topPercentileScore: role.includes('analyst') ? 85 : 82,
      parameterBenchmarks: {
        keywordMatch: { average: 15, topPercentile: 22 },
        skillsAlignment: { average: 12, topPercentile: 18 },
        experienceRelevance: { average: 9, topPercentile: 13 },
        technicalCompetencies: { average: 7, topPercentile: 11 },
        educationScore: { average: 6, topPercentile: 9 }
      }
    };
  }
  
  /**
   * Detect role from job description
   */
  private static detectRole(jobDescription: string): string {
    const jd = jobDescription.toLowerCase();
    
    if (jd.includes('data analyst') || jd.includes('business analyst')) return 'Data Analyst';
    if (jd.includes('software engineer') || jd.includes('developer')) return 'Software Engineer';
    if (jd.includes('product manager')) return 'Product Manager';
    if (jd.includes('marketing')) return 'Marketing Specialist';
    if (jd.includes('sales')) return 'Sales Representative';
    
    return 'General';
  }
  
  /**
   * Detect industry from job description
   */
  private static detectIndustry(jobDescription: string): string {
    const jd = jobDescription.toLowerCase();
    
    if (jd.includes('fintech') || jd.includes('financial') || jd.includes('banking')) return 'Financial Services';
    if (jd.includes('healthcare') || jd.includes('medical') || jd.includes('pharma')) return 'Healthcare';
    if (jd.includes('saas') || jd.includes('software') || jd.includes('tech')) return 'Technology';
    if (jd.includes('retail') || jd.includes('ecommerce')) return 'Retail';
    if (jd.includes('consulting')) return 'Consulting';
    
    return 'General';
  }
  
  /**
   * Add score to history
   */
  private static addToHistory(
    score: ATSScore16Parameter,
    filename: string,
    jobDescription?: string,
    improvements?: string[]
  ): void {
    this.scoreHistory.push({
      timestamp: new Date(),
      score,
      filename,
      jobDescription,
      improvements
    });
    
    // Keep only last 50 entries
    if (this.scoreHistory.length > 50) {
      this.scoreHistory = this.scoreHistory.slice(-50);
    }
  }
  
  /**
   * Get previous score for the same file
   */
  private static getPreviousScore(filename: string): ATSScore16Parameter | undefined {
    const previousEntries = this.scoreHistory
      .filter(entry => entry.filename === filename)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return previousEntries.length > 1 ? previousEntries[1].score : undefined;
  }
  
  /**
   * Get score history
   */
  static getScoreHistory(): ScoreHistory[] {
    return [...this.scoreHistory].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Export score data to JSON
   */
  static exportScoreData(score: ATSScore16Parameter, format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(score, null, 2);
    } else {
      // CSV format
      const headers = ['Parameter', 'Score', 'Max Score', 'Percentage'];
      const rows = Object.entries(score.scores).map(([param, data]) => [
        param.replace(/([A-Z])/g, ' $1').trim(),
        data.score.toString(),
        data.maxScore.toString(),
        `${Math.round((data.score / data.maxScore) * 100)}%`
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
  
  /**
   * Calculate improvement potential
   */
  static calculateImprovementPotential(score: ATSScore16Parameter): {
    totalPotential: number;
    easyWins: string[];
    mediumEffort: string[];
    hardWork: string[];
  } {
    const easyWins: string[] = [];
    const mediumEffort: string[] = [];
    const hardWork: string[] = [];
    
    let totalPotential = 0;
    
    Object.entries(score.scores).forEach(([param, data]) => {
      const percentage = (data.score / data.maxScore) * 100;
      const potential = data.maxScore - data.score;
      totalPotential += potential;
      
      const paramName = param.replace(/([A-Z])/g, ' $1').trim();
      
      if (percentage < 40) {
        easyWins.push(`${paramName} (+${potential} points)`);
      } else if (percentage < 70) {
        mediumEffort.push(`${paramName} (+${potential} points)`);
      } else if (percentage < 90) {
        hardWork.push(`${paramName} (+${potential} points)`);
      }
    });
    
    return {
      totalPotential,
      easyWins,
      mediumEffort,
      hardWork
    };
  }
  
  /**
   * Generate detailed report
   */
  static generateDetailedReport(
    score: ATSScore16Parameter,
    improvements: ImprovementSuggestion[],
    benchmark?: BenchmarkData,
    previousScore?: ATSScore16Parameter
  ): string {
    let report = `# ATS Score Report - 16 Parameter Analysis\n\n`;
    
    // Overall summary
    report += `## Overall Performance\n`;
    report += `- **Score**: ${score.overallScore}/100\n`;
    report += `- **Match Quality**: ${score.matchQuality}\n`;
    report += `- **Interview Chance**: ${score.interviewChance}\n`;
    report += `- **Confidence**: ${score.confidence}\n\n`;
    
    // Comparison with previous score
    if (previousScore) {
      const improvement = score.overallScore - previousScore.overallScore;
      report += `## Progress Tracking\n`;
      report += `- **Previous Score**: ${previousScore.overallScore}/100\n`;
      report += `- **Current Score**: ${score.overallScore}/100\n`;
      report += `- **Improvement**: ${improvement > 0 ? '+' : ''}${improvement} points\n\n`;
    }
    
    // Benchmark comparison
    if (benchmark) {
      report += `## Industry Benchmark (${benchmark.role} - ${benchmark.industry})\n`;
      report += `- **Industry Average**: ${benchmark.averageScore}/100\n`;
      report += `- **Top Percentile**: ${benchmark.topPercentileScore}/100\n`;
      report += `- **Your Position**: ${score.overallScore >= benchmark.topPercentileScore ? 'Top Percentile' : 
                                      score.overallScore >= benchmark.averageScore ? 'Above Average' : 'Below Average'}\n\n`;
    }
    
    // Parameter breakdown
    report += `## Parameter Breakdown\n`;
    Object.entries(score.scores).forEach(([param, data]) => {
      const percentage = Math.round((data.score / data.maxScore) * 100);
      const status = percentage >= 80 ? '🟢' : percentage >= 60 ? '🟡' : '🔴';
      const paramName = param.replace(/([A-Z])/g, ' $1').trim();
      report += `- **${paramName}**: ${data.score}/${data.maxScore} (${percentage}%) ${status}\n`;
    });
    
    // Top improvement suggestions
    report += `\n## Top Improvement Suggestions\n`;
    improvements.slice(0, 5).forEach((suggestion, index) => {
      const priorityIcon = suggestion.priority === 'high' ? '🔴' : 
                          suggestion.priority === 'medium' ? '🟡' : '🟢';
      report += `${index + 1}. **${suggestion.parameter}** ${priorityIcon}\n`;
      report += `   - Current: ${suggestion.currentScore}/${suggestion.maxScore}\n`;
      report += `   - Suggestion: ${suggestion.suggestion}\n`;
      report += `   - Expected Improvement: +${suggestion.expectedImprovement} points\n\n`;
    });
    
    // Missing keywords
    if (score.missingKeywords.critical.length > 0 || score.missingKeywords.important.length > 0) {
      report += `## Missing Keywords\n`;
      if (score.missingKeywords.critical.length > 0) {
        report += `- **Critical**: ${score.missingKeywords.critical.join(', ')}\n`;
      }
      if (score.missingKeywords.important.length > 0) {
        report += `- **Important**: ${score.missingKeywords.important.join(', ')}\n`;
      }
      if (score.missingKeywords.optional.length > 0) {
        report += `- **Optional**: ${score.missingKeywords.optional.join(', ')}\n`;
      }
    }
    
    report += `\n---\n*Report generated on ${new Date().toLocaleString()}*`;
    
    return report;
  }
}

// Export enhanced service
export const atsScoreChecker16ParameterEnhanced = ATSScoreChecker16ParameterEnhanced;