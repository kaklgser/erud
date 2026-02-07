/**
 * Resume Optimizer for 16-Parameter ATS System
 * 
 * Provides targeted optimization recommendations to improve scores
 * across all 16 ATS parameters for maximum interview chances.
 */

import { ATSScoreChecker16Parameter, ATSScore16Parameter } from './atsScoreChecker16Parameter';
import { ResumeData } from '../types/resume';

export interface ParameterOptimizationSuggestion {
  parameter: string;
  currentScore: number;
  maxScore: number;
  percentage: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  suggestions: string[];
  quickFixes: string[];
  examples: string[];
}

export interface OptimizationPlan {
  currentOverallScore: number;
  targetOverallScore: number;
  potentialImprovement: number;
  parameterSuggestions: ParameterOptimizationSuggestion[];
  priorityActions: string[];
  estimatedTimeToComplete: string;
  difficultyLevel: 'Easy' | 'Moderate' | 'Advanced';
}

export class ResumeOptimizer16ParameterService {
  
  /**
   * Generate comprehensive optimization plan for all 16 parameters
   */
  static async generateOptimizationPlan(
    resumeText: string,
    jobDescription?: string,
    filename?: string,
    file?: File
  ): Promise<OptimizationPlan> {
    
    console.log('🎯 Generating 16-Parameter Optimization Plan...');
    
    // Get current ATS scores
    const currentScores = await ATSScoreChecker16Parameter.evaluateResume(
      resumeText,
      jobDescription,
      filename,
      file
    );
    
    console.log('📊 Current Scores Retrieved:', {
      overall: currentScores.overallScore,
      confidence: currentScores.confidence,
      matchQuality: currentScores.matchQuality
    });
    
    // Generate suggestions for each parameter
    const parameterSuggestions = this.generateParameterSuggestions(currentScores, jobDescription);
    
    // Calculate optimization potential
    const potentialImprovement = this.calculateOptimizationPotential(parameterSuggestions);
    const targetScore = Math.min(100, currentScores.overallScore + potentialImprovement);
    
    // Generate priority actions
    const priorityActions = this.generatePriorityActions(parameterSuggestions);
    
    // Estimate completion time and difficulty
    const { estimatedTime, difficulty } = this.estimateOptimizationEffort(parameterSuggestions);
    
    return {
      currentOverallScore: currentScores.overallScore,
      targetOverallScore: targetScore,
      potentialImprovement,
      parameterSuggestions,
      priorityActions,
      estimatedTimeToComplete: estimatedTime,
      difficultyLevel: difficulty
    };
  }
  
  /**
   * Generate specific suggestions for each parameter
   */
  private static generateParameterSuggestions(
    scores: ATSScore16Parameter,
    jobDescription?: string
  ): ParameterOptimizationSuggestion[] {
    
    const suggestions: ParameterOptimizationSuggestion[] = [];
    const hasJD = Boolean(jobDescription && jobDescription.length > 50);
    
    // Define max scores for each parameter
    const maxScores: Record<string, number> = {
      keywordMatch: 25, skillsAlignment: 20, experienceRelevance: 15,
      technicalCompetencies: 12, educationScore: 10, quantifiedAchievements: 8,
      employmentHistory: 8, industryExperience: 7, jobTitleMatch: 6,
      careerProgression: 6, certifications: 5, formatting: 5,
      contentQuality: 4, grammar: 3, resumeLength: 2, filenameQuality: 2
    };
    
    // Generate suggestions for each parameter
    Object.entries(scores.scores).forEach(([parameterKey, currentScore]) => {
      const maxScore = maxScores[parameterKey] || 5;
      const percentage = Math.round((currentScore / maxScore) * 100);
      const priority = this.determinePriority(percentage, parameterKey);
      
      const suggestion: ParameterOptimizationSuggestion = {
        parameter: this.getParameterDisplayName(parameterKey),
        currentScore,
        maxScore,
        percentage,
        priority,
        suggestions: this.getParameterSuggestions(parameterKey, percentage, hasJD),
        quickFixes: this.getQuickFixes(parameterKey, percentage),
        examples: this.getParameterExamples(parameterKey)
      };
      
      suggestions.push(suggestion);
    });
    
    // Sort by priority and potential impact
    return suggestions.sort((a, b) => {
      const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      const aPriorityScore = priorityOrder[a.priority];
      const bPriorityScore = priorityOrder[b.priority];
      
      if (aPriorityScore !== bPriorityScore) {
        return bPriorityScore - aPriorityScore; // Higher priority first
      }
      
      // If same priority, sort by potential improvement (max - current)
      const aImprovement = a.maxScore - a.currentScore;
      const bImprovement = b.maxScore - b.currentScore;
      return bImprovement - aImprovement;
    });
  }
  
  /**
   * Get user-friendly parameter names
   */
  private static getParameterDisplayName(parameterKey: string): string {
    const displayNames: Record<string, string> = {
      keywordMatch: 'Keyword Match',
      skillsAlignment: 'Skills Alignment',
      experienceRelevance: 'Experience Relevance',
      technicalCompetencies: 'Technical Competencies',
      educationScore: 'Education Score',
      quantifiedAchievements: 'Quantified Achievements',
      employmentHistory: 'Employment History',
      industryExperience: 'Industry Experience',
      jobTitleMatch: 'Job Title Match',
      careerProgression: 'Career Progression',
      certifications: 'Certifications',
      formatting: 'Formatting',
      contentQuality: 'Content Quality',
      grammar: 'Grammar',
      resumeLength: 'Resume Length',
      filenameQuality: 'Filename Quality'
    };
    
    return displayNames[parameterKey] || parameterKey;
  }
  
  /**
   * Determine priority based on score percentage and parameter importance
   */
  private static determinePriority(percentage: number, parameterKey: string): 'Critical' | 'High' | 'Medium' | 'Low' {
    // High-impact parameters that should be prioritized
    const highImpactParameters = ['keywordMatch', 'skillsAlignment', 'experienceRelevance', 'technicalCompetencies'];
    
    if (percentage < 30) {
      return highImpactParameters.includes(parameterKey) ? 'Critical' : 'High';
    } else if (percentage < 60) {
      return highImpactParameters.includes(parameterKey) ? 'High' : 'Medium';
    } else if (percentage < 80) {
      return 'Medium';
    } else {
      return 'Low';
    }
  }
  
  /**
   * Get specific suggestions for each parameter
   */
  private static getParameterSuggestions(parameterKey: string, percentage: number, hasJD: boolean): string[] {
    const suggestions: Record<string, string[]> = {
      keywordMatch: [
        hasJD ? 'Include more keywords from the job description in your experience bullets' : 'Research industry-standard keywords for your target role',
        hasJD ? 'Use exact phrases from the job posting where relevant' : 'Add technical terms and tools commonly used in your field',
        'Incorporate keywords naturally throughout your resume, not just in a skills section',
        'Use both acronyms and full forms (e.g., "AI" and "Artificial Intelligence")'
      ],
      
      skillsAlignment: [
        'List technical skills that directly match the job requirements',
        'Organize skills by relevance - put most important skills first',
        'Include proficiency levels for key technical skills',
        'Add emerging technologies relevant to your field',
        'Remove outdated or irrelevant skills to focus on what matters'
      ],
      
      experienceRelevance: [
        'Emphasize work experience that directly relates to the target role',
        'Rewrite job descriptions to highlight transferable skills',
        'Focus on achievements that demonstrate relevant capabilities',
        'Use industry-specific terminology in your experience descriptions',
        'Quantify your impact in previous roles with specific metrics'
      ],
      
      technicalCompetencies: [
        'Showcase specific technical projects and their outcomes',
        'Include programming languages, frameworks, and tools you\'ve used',
        'Mention certifications or training in relevant technologies',
        'Describe complex technical challenges you\'ve solved',
        'Add links to your technical portfolio or GitHub projects'
      ],
      
      educationScore: [
        'Include relevant coursework that aligns with the job requirements',
        'Add your GPA if it\'s 3.5 or higher',
        'Mention academic projects related to your target field',
        'Include relevant certifications or continuing education',
        'List honors, awards, or academic achievements'
      ],
      
      quantifiedAchievements: [
        'Add specific numbers, percentages, and metrics to your achievements',
        'Use the STAR method (Situation, Task, Action, Result) for bullet points',
        'Include revenue impact, cost savings, or efficiency improvements',
        'Mention team sizes you\'ve managed or collaborated with',
        'Quantify the scope of projects (budget, timeline, users affected)'
      ],
      
      employmentHistory: [
        'Ensure consistent date formatting across all positions',
        'Fill any employment gaps with relevant activities (freelance, education, etc.)',
        'Use clear, professional job titles',
        'Include company names and locations',
        'Show career progression and increasing responsibilities'
      ],
      
      industryExperience: [
        'Highlight experience in the same or related industries',
        'Use industry-specific terminology and jargon appropriately',
        'Mention knowledge of industry regulations or standards',
        'Include experience with industry-standard tools and processes',
        'Demonstrate understanding of industry challenges and trends'
      ],
      
      jobTitleMatch: [
        hasJD ? 'Align your previous job titles with the target role where truthful' : 'Use standard industry job titles',
        'Include relevant keywords in your current/target role section',
        'Clarify your role if job titles were non-standard at previous companies',
        'Emphasize progression toward your target role',
        'Use parenthetical clarifications for unclear titles'
      ],
      
      careerProgression: [
        'Show clear advancement in responsibilities over time',
        'Highlight promotions and increased scope of work',
        'Demonstrate skill development and learning progression',
        'Include leadership roles and team management experience',
        'Show how each role prepared you for the next level'
      ],
      
      certifications: [
        'Add industry-relevant certifications and licenses',
        'Include completion dates for recent certifications',
        'List professional development courses and training',
        'Mention vendor-specific certifications (AWS, Google, Microsoft, etc.)',
        'Include certifications that are in progress or planned'
      ],
      
      formatting: [
        'Use a clean, ATS-friendly resume template',
        'Ensure consistent formatting throughout the document',
        'Use standard section headers (Experience, Education, Skills)',
        'Avoid tables, columns, and complex layouts',
        'Use bullet points for easy scanning'
      ],
      
      contentQuality: [
        'Write clear, concise bullet points that start with action verbs',
        'Avoid repetitive language and vary your vocabulary',
        'Focus on achievements rather than job duties',
        'Use active voice instead of passive voice',
        'Ensure each bullet point adds unique value'
      ],
      
      grammar: [
        'Proofread carefully for spelling and grammar errors',
        'Use consistent verb tenses (past tense for previous roles)',
        'Ensure proper punctuation and capitalization',
        'Use parallel structure in bullet points',
        'Consider using grammar checking tools like Grammarly'
      ],
      
      resumeLength: [
        'Keep resume to 1-2 pages for most roles (2-3 for senior positions)',
        'Remove outdated or irrelevant information',
        'Prioritize most recent and relevant experience',
        'Use concise language without sacrificing important details',
        'Focus on quality over quantity of information'
      ],
      
      filenameQuality: [
        'Use a professional filename: "FirstName_LastName_Resume.pdf"',
        'Avoid generic names like "Resume.pdf" or "Document1.pdf"',
        'Include the target role if applying to multiple positions',
        'Use underscores or hyphens instead of spaces',
        'Save as PDF to preserve formatting'
      ]
    };
    
    const parameterSuggestions = suggestions[parameterKey] || ['Optimize this parameter for better ATS compatibility'];
    
    // Return different number of suggestions based on score
    if (percentage < 30) {
      return parameterSuggestions; // All suggestions for low scores
    } else if (percentage < 60) {
      return parameterSuggestions.slice(0, 3); // Top 3 for medium scores
    } else {
      return parameterSuggestions.slice(0, 2); // Top 2 for good scores
    }
  }
  
  /**
   * Get quick fixes that can be implemented immediately
   */
  private static getQuickFixes(parameterKey: string, percentage: number): string[] {
    if (percentage > 80) return []; // No quick fixes needed for good scores
    
    const quickFixes: Record<string, string[]> = {
      keywordMatch: ['Add 3-5 relevant keywords from the job description', 'Include industry acronyms'],
      skillsAlignment: ['Reorder skills by relevance', 'Remove outdated skills'],
      experienceRelevance: ['Rewrite top 2 bullet points with relevant keywords', 'Emphasize transferable skills'],
      technicalCompetencies: ['Add specific tools/technologies used', 'Include version numbers where relevant'],
      educationScore: ['Add relevant coursework', 'Include GPA if 3.5+'],
      quantifiedAchievements: ['Add numbers to top 3 achievements', 'Use percentages and metrics'],
      employmentHistory: ['Fix date formatting', 'Add missing company locations'],
      industryExperience: ['Use industry-specific terms', 'Mention relevant standards/regulations'],
      jobTitleMatch: ['Clarify job titles with parenthetical descriptions', 'Use standard industry titles'],
      careerProgression: ['Highlight promotions', 'Show increasing responsibilities'],
      certifications: ['List current certifications', 'Add completion dates'],
      formatting: ['Use consistent bullet points', 'Standardize section headers'],
      contentQuality: ['Start bullets with action verbs', 'Remove redundant phrases'],
      grammar: ['Run spell check', 'Fix verb tense consistency'],
      resumeLength: ['Remove oldest experience if over 2 pages', 'Combine similar bullet points'],
      filenameQuality: ['Rename file to "FirstName_LastName_Resume.pdf"', 'Save as PDF format']
    };
    
    return quickFixes[parameterKey] || [];
  }
  
  /**
   * Get examples for each parameter
   */
  private static getParameterExamples(parameterKey: string): string[] {
    const examples: Record<string, string[]> = {
      keywordMatch: [
        'Before: "Worked on software projects" → After: "Developed React applications using JavaScript and Node.js"',
        'Before: "Managed team" → After: "Led cross-functional team of 8 developers using Agile methodology"'
      ],
      
      quantifiedAchievements: [
        'Before: "Improved system performance" → After: "Improved system performance by 40%, reducing load times from 3s to 1.8s"',
        'Before: "Managed budget" → After: "Managed $2.5M annual budget, reducing costs by 15% while maintaining quality"'
      ],
      
      contentQuality: [
        'Before: "Responsible for database management" → After: "Optimized MySQL databases, improving query performance by 60%"',
        'Before: "Helped with customer service" → After: "Resolved 95% of customer issues within 24 hours, achieving 4.8/5 satisfaction rating"'
      ],
      
      technicalCompetencies: [
        'Example: "Built RESTful APIs using Python Flask, handling 10K+ daily requests with 99.9% uptime"',
        'Example: "Implemented CI/CD pipeline using Jenkins and Docker, reducing deployment time by 70%"'
      ]
    };
    
    return examples[parameterKey] || [];
  }
  
  /**
   * Calculate total optimization potential
   */
  private static calculateOptimizationPotential(suggestions: ParameterOptimizationSuggestion[]): number {
    let totalPotential = 0;
    
    suggestions.forEach(suggestion => {
      const currentGap = suggestion.maxScore - suggestion.currentScore;
      
      // Estimate improvement potential based on priority and current score
      let improvementFactor = 0;
      
      switch (suggestion.priority) {
        case 'Critical':
          improvementFactor = 0.8; // Can improve 80% of the gap
          break;
        case 'High':
          improvementFactor = 0.6; // Can improve 60% of the gap
          break;
        case 'Medium':
          improvementFactor = 0.4; // Can improve 40% of the gap
          break;
        case 'Low':
          improvementFactor = 0.2; // Can improve 20% of the gap
          break;
      }
      
      totalPotential += Math.round(currentGap * improvementFactor);
    });
    
    return Math.min(totalPotential, 30); // Cap at 30 points improvement
  }
  
  /**
   * Generate priority actions list
   */
  private static generatePriorityActions(suggestions: ParameterOptimizationSuggestion[]): string[] {
    const criticalActions = suggestions
      .filter(s => s.priority === 'Critical')
      .map(s => `Fix ${s.parameter}: ${s.quickFixes[0] || s.suggestions[0]}`)
      .slice(0, 3);
    
    const highActions = suggestions
      .filter(s => s.priority === 'High')
      .map(s => `Improve ${s.parameter}: ${s.quickFixes[0] || s.suggestions[0]}`)
      .slice(0, 2);
    
    return [...criticalActions, ...highActions];
  }
  
  /**
   * Estimate optimization effort
   */
  private static estimateOptimizationEffort(suggestions: ParameterOptimizationSuggestion[]): {
    estimatedTime: string;
    difficulty: 'Easy' | 'Moderate' | 'Advanced';
  } {
    const criticalCount = suggestions.filter(s => s.priority === 'Critical').length;
    const highCount = suggestions.filter(s => s.priority === 'High').length;
    
    let estimatedMinutes = 0;
    let difficultyScore = 0;
    
    // Calculate time and difficulty
    suggestions.forEach(suggestion => {
      switch (suggestion.priority) {
        case 'Critical':
          estimatedMinutes += 15;
          difficultyScore += 3;
          break;
        case 'High':
          estimatedMinutes += 10;
          difficultyScore += 2;
          break;
        case 'Medium':
          estimatedMinutes += 5;
          difficultyScore += 1;
          break;
        case 'Low':
          estimatedMinutes += 2;
          break;
      }
    });
    
    // Convert to readable time format
    let estimatedTime: string;
    if (estimatedMinutes < 30) {
      estimatedTime = `${estimatedMinutes} minutes`;
    } else if (estimatedMinutes < 120) {
      estimatedTime = `${Math.round(estimatedMinutes / 30) * 30} minutes`;
    } else {
      estimatedTime = `${Math.round(estimatedMinutes / 60)} hours`;
    }
    
    // Determine difficulty
    let difficulty: 'Easy' | 'Moderate' | 'Advanced';
    if (difficultyScore < 5) {
      difficulty = 'Easy';
    } else if (difficultyScore < 15) {
      difficulty = 'Moderate';
    } else {
      difficulty = 'Advanced';
    }
    
    return { estimatedTime, difficulty };
  }
}

export default ResumeOptimizer16ParameterService;