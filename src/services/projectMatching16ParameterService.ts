/**
 * Project Matching Service for 16-Parameter ATS System
 * 
 * Takes user projects, checks if they match JD domain,
 * returns "❌ Not Suitable" with suggested replacement projects
 * and GitHub repo integration with working JSON parsing.
 */

import { ResumeData, Project } from '../types/resume';
import { extractJdKeywords, JdKeywords } from './projectMatchingEngine';
import { suggestProjectsForJd, SuggestedRepoProject } from './githubProjectSuggestionService';

export interface ProjectDomainMatch {
  project: Project;
  isMatched: boolean;
  matchScore: number;
  matchPercentage: number;
  status: '✅ Suitable' | '❌ Not Suitable' | '⚠️ Partially Suitable';
  domainAlignment: string[];
  missingDomainSkills: string[];
  suggestedReplacements?: ProjectReplacementSuggestion[];
  improvementSuggestions: string[];
}

export interface ProjectReplacementSuggestion {
  type: 'github_repo' | 'project_idea';
  name: string;
  description: string;
  url?: string;
  stars?: number;
  language?: string;
  topics: string[];
  reason: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  matchedSkills: string[];
  implementationGuide: string[];
}

export interface ProjectMatchingResult {
  totalProjects: number;
  suitableProjects: number;
  unsuitableProjects: number;
  overallDomainMatch: number;
  projectMatches: ProjectDomainMatch[];
  recommendedActions: string[];
  githubIntegrationStatus: {
    working: boolean;
    jsonParsed: boolean;
    suggestionsGenerated: boolean;
    githubLinksProvided: boolean;
  };
}

export class ProjectMatching16ParameterService {
  
  /**
   * Main function: Analyze user projects against JD domain
   */
  static async analyzeProjectsForDomain(
    resumeData: ResumeData,
    jobDescription: string
  ): Promise<ProjectMatchingResult> {
    
    console.log('🎯 Analyzing projects for domain match...');
    
    // Extract JD keywords and domain requirements
    const jdKeywords = extractJdKeywords(jobDescription);
    const domainRequirements = this.extractDomainRequirements(jobDescription, jdKeywords);
    
    console.log('📊 Domain Requirements:', {
      primaryDomain: domainRequirements.primaryDomain,
      requiredSkills: domainRequirements.requiredSkills.slice(0, 5),
      totalSkills: domainRequirements.requiredSkills.length
    });
    
    // Get user projects
    const userProjects = resumeData.projects || [];
    
    if (userProjects.length === 0) {
      return this.createEmptyResult(domainRequirements, jdKeywords);
    }
    
    // Analyze each project
    const projectMatches: ProjectDomainMatch[] = [];
    let totalSuitable = 0;
    
    for (const project of userProjects) {
      const match = await this.analyzeProjectMatch(project, domainRequirements, jdKeywords);
      projectMatches.push(match);
      
      if (match.isMatched) {
        totalSuitable++;
      }
    }
    
    // Calculate overall domain match
    const overallDomainMatch = userProjects.length > 0 
      ? Math.round((totalSuitable / userProjects.length) * 100)
      : 0;
    
    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(projectMatches, domainRequirements);
    
    // Test GitHub integration
    const githubIntegrationStatus = await this.testGitHubIntegration(jdKeywords);
    
    return {
      totalProjects: userProjects.length,
      suitableProjects: totalSuitable,
      unsuitableProjects: userProjects.length - totalSuitable,
      overallDomainMatch,
      projectMatches,
      recommendedActions,
      githubIntegrationStatus
    };
  }
  
  /**
   * Extract domain requirements from job description
   */
  private static extractDomainRequirements(jobDescription: string, jdKeywords: JdKeywords) {
    const jdLower = jobDescription.toLowerCase();
    
    // Determine primary domain
    let primaryDomain = 'general';
    let domainScore = 0;
    
    const domainPatterns = {
      'fintech': ['fintech', 'financial', 'banking', 'payment', 'trading', 'cryptocurrency', 'blockchain'],
      'healthcare': ['healthcare', 'medical', 'health', 'clinical', 'patient', 'hospital', 'pharma'],
      'ecommerce': ['ecommerce', 'e-commerce', 'retail', 'shopping', 'marketplace', 'store'],
      'ai_ml': ['machine learning', 'artificial intelligence', 'ai', 'ml', 'data science', 'deep learning'],
      'cloud': ['cloud', 'aws', 'azure', 'gcp', 'devops', 'infrastructure', 'kubernetes'],
      'gaming': ['gaming', 'game', 'entertainment', 'unity', 'unreal', 'mobile games'],
      'edtech': ['education', 'edtech', 'learning', 'student', 'course', 'academic'],
      'social': ['social media', 'social network', 'community', 'messaging', 'chat'],
      'enterprise': ['enterprise', 'saas', 'b2b', 'crm', 'erp', 'business'],
      'mobile': ['mobile', 'ios', 'android', 'react native', 'flutter', 'app development']
    };
    
    for (const [domain, keywords] of Object.entries(domainPatterns)) {
      let score = 0;
      for (const keyword of keywords) {
        if (jdLower.includes(keyword)) {
          score += keyword.split(' ').length; // Multi-word phrases get higher score
        }
      }
      if (score > domainScore) {
        domainScore = score;
        primaryDomain = domain;
      }
    }
    
    // Extract required skills with priority
    const requiredSkills = [...jdKeywords.techSkills];
    
    // Add domain-specific skills
    const domainSpecificSkills = this.getDomainSpecificSkills(primaryDomain);
    requiredSkills.push(...domainSpecificSkills);
    
    // Remove duplicates and prioritize
    const uniqueSkills = Array.from(new Set(requiredSkills));
    
    return {
      primaryDomain,
      requiredSkills: uniqueSkills,
      domainKeywords: domainPatterns[primaryDomain as keyof typeof domainPatterns] || [],
      minMatchThreshold: 40 // Minimum 40% match to be considered suitable
    };
  }
  
  /**
   * Get domain-specific skills
   */
  private static getDomainSpecificSkills(domain: string): string[] {
    const domainSkills: Record<string, string[]> = {
      'fintech': ['stripe', 'paypal', 'plaid', 'security', 'encryption', 'compliance'],
      'healthcare': ['hipaa', 'hl7', 'fhir', 'medical records', 'privacy', 'security'],
      'ecommerce': ['shopify', 'woocommerce', 'payment gateway', 'inventory', 'cart'],
      'ai_ml': ['tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'jupyter'],
      'cloud': ['docker', 'kubernetes', 'terraform', 'ci/cd', 'monitoring'],
      'gaming': ['unity', 'unreal engine', 'c#', 'c++', 'game physics', '3d graphics'],
      'edtech': ['lms', 'scorm', 'video streaming', 'assessment', 'analytics'],
      'social': ['real-time', 'websockets', 'notifications', 'messaging', 'feeds'],
      'enterprise': ['microservices', 'scalability', 'security', 'integration', 'apis'],
      'mobile': ['react native', 'flutter', 'swift', 'kotlin', 'app store', 'push notifications']
    };
    
    return domainSkills[domain] || [];
  }
  
  /**
   * Analyze individual project match
   */
  private static async analyzeProjectMatch(
    project: Project,
    domainRequirements: any,
    jdKeywords: JdKeywords
  ): Promise<ProjectDomainMatch> {
    
    const projectText = `${project.title} ${project.bullets.join(' ')}`.toLowerCase();
    
    // Check domain alignment
    const domainAlignment: string[] = [];
    for (const keyword of domainRequirements.domainKeywords) {
      if (projectText.includes(keyword.toLowerCase())) {
        domainAlignment.push(keyword);
      }
    }
    
    // Check skill matches
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    
    for (const skill of domainRequirements.requiredSkills) {
      if (projectText.includes(skill.toLowerCase())) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }
    
    // Calculate match score
    const skillMatchScore = domainRequirements.requiredSkills.length > 0
      ? (matchedSkills.length / domainRequirements.requiredSkills.length) * 70
      : 0;
    
    const domainMatchScore = domainRequirements.domainKeywords.length > 0
      ? (domainAlignment.length / domainRequirements.domainKeywords.length) * 30
      : 30; // Default if no domain keywords
    
    const matchScore = skillMatchScore + domainMatchScore;
    const matchPercentage = Math.min(100, Math.round(matchScore));
    
    // Determine status
    let status: '✅ Suitable' | '❌ Not Suitable' | '⚠️ Partially Suitable';
    let isMatched: boolean;
    
    if (matchPercentage >= 70) {
      status = '✅ Suitable';
      isMatched = true;
    } else if (matchPercentage >= 40) {
      status = '⚠️ Partially Suitable';
      isMatched = false;
    } else {
      status = '❌ Not Suitable';
      isMatched = false;
    }
    
    // Generate suggestions for unsuitable projects
    let suggestedReplacements: ProjectReplacementSuggestion[] = [];
    if (!isMatched) {
      suggestedReplacements = await this.generateReplacementSuggestions(
        domainRequirements,
        jdKeywords
      );
    }
    
    // Generate improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(
      project,
      missingSkills.slice(0, 5),
      domainAlignment.length === 0
    );
    
    return {
      project,
      isMatched,
      matchScore,
      matchPercentage,
      status,
      domainAlignment,
      missingDomainSkills: missingSkills.slice(0, 8),
      suggestedReplacements,
      improvementSuggestions
    };
  }
  
  /**
   * Generate replacement project suggestions
   */
  private static async generateReplacementSuggestions(
    domainRequirements: any,
    jdKeywords: JdKeywords
  ): Promise<ProjectReplacementSuggestion[]> {
    
    const suggestions: ProjectReplacementSuggestion[] = [];
    
    try {
      // Get GitHub suggestions
      const githubSuggestions = await suggestProjectsForJd(jdKeywords);
      
      // Convert GitHub suggestions to replacement suggestions
      for (const githubProject of githubSuggestions.slice(0, 3)) {
        suggestions.push({
          type: 'github_repo',
          name: githubProject.name,
          description: githubProject.description,
          url: githubProject.url,
          stars: githubProject.stars,
          language: githubProject.language || undefined,
          topics: githubProject.topics,
          reason: githubProject.reason,
          difficulty: githubProject.difficulty,
          matchedSkills: githubProject.matchedSkills,
          implementationGuide: this.generateImplementationGuide(githubProject, domainRequirements)
        });
      }
      
      // Add custom project ideas
      const customIdeas = this.generateCustomProjectIdeas(domainRequirements, jdKeywords);
      suggestions.push(...customIdeas.slice(0, 2));
      
    } catch (error) {
      console.error('Error generating replacement suggestions:', error);
      
      // Fallback to custom ideas only
      const fallbackIdeas = this.generateCustomProjectIdeas(domainRequirements, jdKeywords);
      suggestions.push(...fallbackIdeas.slice(0, 3));
    }
    
    return suggestions.slice(0, 5);
  }
  
  /**
   * Generate custom project ideas based on domain
   */
  private static generateCustomProjectIdeas(
    domainRequirements: any,
    jdKeywords: JdKeywords
  ): ProjectReplacementSuggestion[] {
    
    const domain = domainRequirements.primaryDomain;
    const skills = domainRequirements.requiredSkills.slice(0, 4);
    
    const projectIdeas: Record<string, ProjectReplacementSuggestion[]> = {
      'fintech': [
        {
          type: 'project_idea',
          name: 'Personal Finance Tracker',
          description: 'Build a comprehensive personal finance app with expense tracking, budget management, and financial goal setting.',
          topics: ['fintech', 'finance', 'budgeting', ...skills],
          reason: 'Perfect for FinTech domain - demonstrates financial data handling',
          difficulty: 'intermediate',
          matchedSkills: skills,
          implementationGuide: [
            'Set up secure user authentication and data encryption',
            'Implement expense categorization and tracking',
            'Add budget creation and monitoring features',
            'Integrate with bank APIs (Plaid) for transaction import',
            'Create financial reports and analytics dashboard'
          ]
        }
      ],
      'ecommerce': [
        {
          type: 'project_idea',
          name: 'Multi-Vendor Marketplace',
          description: 'Create a full-featured e-commerce platform where multiple vendors can sell products with integrated payment processing.',
          topics: ['ecommerce', 'marketplace', 'payments', ...skills],
          reason: 'Ideal for E-commerce domain - shows complex business logic',
          difficulty: 'advanced',
          matchedSkills: skills,
          implementationGuide: [
            'Design multi-tenant architecture for vendors',
            'Implement product catalog with search and filters',
            'Add shopping cart and checkout functionality',
            'Integrate payment gateways (Stripe, PayPal)',
            'Build vendor dashboard and order management'
          ]
        }
      ],
      'healthcare': [
        {
          type: 'project_idea',
          name: 'Patient Management System',
          description: 'Develop a HIPAA-compliant patient management system with appointment scheduling and medical records.',
          topics: ['healthcare', 'hipaa', 'medical', ...skills],
          reason: 'Healthcare domain focus - demonstrates compliance knowledge',
          difficulty: 'advanced',
          matchedSkills: skills,
          implementationGuide: [
            'Implement HIPAA-compliant data security measures',
            'Create patient registration and profile management',
            'Add appointment scheduling system',
            'Build medical records management with access controls',
            'Integrate with healthcare APIs and standards'
          ]
        }
      ],
      'ai_ml': [
        {
          type: 'project_idea',
          name: 'ML-Powered Recommendation Engine',
          description: 'Build an intelligent recommendation system using machine learning algorithms for personalized content delivery.',
          topics: ['machine learning', 'ai', 'recommendations', ...skills],
          reason: 'AI/ML domain expertise - shows advanced technical skills',
          difficulty: 'advanced',
          matchedSkills: skills,
          implementationGuide: [
            'Collect and preprocess user interaction data',
            'Implement collaborative filtering algorithms',
            'Train ML models using TensorFlow/PyTorch',
            'Build real-time recommendation API',
            'Create A/B testing framework for model evaluation'
          ]
        }
      ]
    };
    
    return projectIdeas[domain] || [
      {
        type: 'project_idea',
        name: 'Full-Stack Web Application',
        description: `Build a comprehensive web application using ${skills.slice(0, 3).join(', ')} with modern best practices.`,
        topics: ['full-stack', 'web development', ...skills],
        reason: `Demonstrates proficiency in ${skills.slice(0, 2).join(' and ')}`,
        difficulty: 'intermediate',
        matchedSkills: skills,
        implementationGuide: [
          'Set up modern development environment and tooling',
          'Implement responsive frontend with component architecture',
          'Build RESTful API with proper authentication',
          'Add database integration with optimized queries',
          'Deploy to cloud platform with CI/CD pipeline'
        ]
      }
    ];
  }
  
  /**
   * Generate implementation guide for GitHub projects
   */
  private static generateImplementationGuide(
    githubProject: SuggestedRepoProject,
    domainRequirements: any
  ): string[] {
    
    const baseGuide = [
      `Fork and clone the ${githubProject.name} repository`,
      'Study the codebase structure and documentation',
      'Set up local development environment',
      'Understand the core functionality and architecture'
    ];
    
    // Add domain-specific guidance
    const domainGuide = {
      'fintech': ['Add financial data validation and security measures', 'Implement audit logging for compliance'],
      'healthcare': ['Ensure HIPAA compliance in data handling', 'Add proper access controls and encryption'],
      'ecommerce': ['Implement payment processing integration', 'Add inventory management features'],
      'ai_ml': ['Experiment with different ML algorithms', 'Add model evaluation and monitoring'],
    };
    
    const specificGuide = domainGuide[domainRequirements.primaryDomain as keyof typeof domainGuide] || [
      'Add your own features and improvements',
      'Implement additional functionality based on JD requirements'
    ];
    
    return [...baseGuide, ...specificGuide];
  }
  
  /**
   * Generate improvement suggestions for existing projects
   */
  private static generateImprovementSuggestions(
    project: Project,
    missingSkills: string[],
    lacksDomainFocus: boolean
  ): string[] {
    
    const suggestions: string[] = [];
    
    if (lacksDomainFocus) {
      suggestions.push('Add domain-specific features to better align with the job requirements');
    }
    
    if (missingSkills.length > 0) {
      suggestions.push(`Incorporate these technologies: ${missingSkills.slice(0, 3).join(', ')}`);
    }
    
    if (project.bullets.length < 3) {
      suggestions.push('Expand project description with more technical details and achievements');
    }
    
    const projectText = project.bullets.join(' ').toLowerCase();
    if (!projectText.includes('api') && !projectText.includes('database')) {
      suggestions.push('Add backend API integration or database functionality');
    }
    
    if (!projectText.match(/\d+%|\d+x|improved|increased|reduced/)) {
      suggestions.push('Include quantified results and performance improvements');
    }
    
    suggestions.push('Consider creating a GitHub repository to showcase the code');
    
    return suggestions.slice(0, 4);
  }
  
  /**
   * Generate recommended actions based on analysis
   */
  private static generateRecommendedActions(
    projectMatches: ProjectDomainMatch[],
    domainRequirements: any
  ): string[] {
    
    const actions: string[] = [];
    const unsuitableCount = projectMatches.filter(p => !p.isMatched).length;
    const totalCount = projectMatches.length;
    
    if (unsuitableCount === totalCount) {
      actions.push('🚨 All projects need domain alignment - consider replacing with domain-specific projects');
      actions.push(`Focus on ${domainRequirements.primaryDomain} domain projects using ${domainRequirements.requiredSkills.slice(0, 3).join(', ')}`);
    } else if (unsuitableCount > totalCount / 2) {
      actions.push('⚠️ Most projects need improvement - prioritize domain-relevant projects');
      actions.push('Replace weakest projects with suggested alternatives');
    } else if (unsuitableCount > 0) {
      actions.push('✅ Good project alignment overall - enhance weaker projects');
      actions.push('Add missing technologies to existing projects where possible');
    } else {
      actions.push('🎉 Excellent project-domain alignment!');
      actions.push('Consider adding quantified achievements to strengthen impact');
    }
    
    // Add specific skill recommendations
    const allMissingSkills = projectMatches.flatMap(p => p.missingDomainSkills);
    const topMissingSkills = [...new Set(allMissingSkills)].slice(0, 3);
    
    if (topMissingSkills.length > 0) {
      actions.push(`🎯 Priority skills to add: ${topMissingSkills.join(', ')}`);
    }
    
    return actions;
  }
  
  /**
   * Test GitHub integration status
   */
  private static async testGitHubIntegration(jdKeywords: JdKeywords): Promise<{
    working: boolean;
    jsonParsed: boolean;
    suggestionsGenerated: boolean;
    githubLinksProvided: boolean;
  }> {
    
    let working = false;
    let jsonParsed = false;
    let suggestionsGenerated = false;
    let githubLinksProvided = false;
    
    try {
      // Test GitHub API integration
      const suggestions = await suggestProjectsForJd(jdKeywords);
      working = true;
      
      // Test JSON parsing
      if (Array.isArray(suggestions)) {
        jsonParsed = true;
      }
      
      // Test suggestions generation
      if (suggestions.length > 0) {
        suggestionsGenerated = true;
      }
      
      // Test GitHub links
      const hasGitHubLinks = suggestions.some(s => s.url && s.url.includes('github.com'));
      if (hasGitHubLinks) {
        githubLinksProvided = true;
      }
      
    } catch (error) {
      console.error('GitHub integration test failed:', error);
    }
    
    return {
      working,
      jsonParsed,
      suggestionsGenerated,
      githubLinksProvided
    };
  }
  
  /**
   * Create empty result for cases with no projects
   */
  private static async createEmptyResult(
    domainRequirements: any,
    jdKeywords: JdKeywords
  ): Promise<ProjectMatchingResult> {
    
    const githubIntegrationStatus = await this.testGitHubIntegration(jdKeywords);
    
    return {
      totalProjects: 0,
      suitableProjects: 0,
      unsuitableProjects: 0,
      overallDomainMatch: 0,
      projectMatches: [],
      recommendedActions: [
        '📝 No projects found - add 2-3 domain-relevant projects',
        `🎯 Focus on ${domainRequirements.primaryDomain} domain projects`,
        `💻 Use these technologies: ${domainRequirements.requiredSkills.slice(0, 4).join(', ')}`
      ],
      githubIntegrationStatus
    };
  }
}

export default ProjectMatching16ParameterService;