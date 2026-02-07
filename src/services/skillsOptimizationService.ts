/**
 * Skills Optimization Service - Cleans and optimizes skills sections for ATS compatibility
 * Removes company names, fixes categorization, and implements ATS-friendly structure
 * Uses centralized taxonomy for consistent categorization
 */

import {
  SKILL_CATEGORIES,
  PROGRAMMING_LANGUAGES,
  FRONTEND_TECHNOLOGIES,
  BACKEND_TECHNOLOGIES,
  DATABASES,
  CLOUD_AND_DEVOPS,
  TOOLS_AND_PLATFORMS,
  TESTING_AND_QA,
  SOFT_SKILLS,
  categorizeSkill,
  formatSkillName as formatSkill,
  getCategoryOrder
} from '../constants/skillsTaxonomy';

export interface SkillsOptimizationResult {
  optimizedSkills: OptimizedSkillCategories;
  removedItems: RemovedSkillsReport;
  recommendations: string[];
  atsCompatibilityScore: number;
}

// Updated to match ATS-friendly structure from Gemini service
export interface OptimizedSkillCategories {
  programmingLanguages: string[];
  frontendTechnologies: string[];
  backendTechnologies: string[];
  databases: string[];
  cloudAndDevOps: string[];
  toolsAndPlatforms: string[];
  testingAndQA: string[];
  softSkills: string[];
}

export interface RemovedSkillsReport {
  companyNames: string[];
  softSkillsFromTech: string[];
  domainsFromLanguages: string[];
  invalidCategories: string[];
}

export class SkillsOptimizationService {
  // Company names that should NEVER appear in skills
  private static readonly COMPANY_NAMES = [
    'wipro', 'kyndryl', 'ey gds', 'tcs', 'infosys', 'cognizant', 'accenture',
    'capgemini', 'hcl', 'tech mahindra', 'mindtree', 'ltts', 'persistent',
    'mphasis', 'zensar', 'cyient', 'l&t infotech', 'hexaware', 'sonata',
    'primoboostai', 'primoboost'
  ];

  // Items that are NOT programming languages
  private static readonly NOT_PROGRAMMING_LANGUAGES = [
    'bi', 'data & analytics', 'ai', 'testing', 'full-stack', 'sdlc',
    'full-stack development', 'testing & quality engineering',
    'frameworks', 'domains', 'analytics', 'machine learning',
    'data science', 'devops', 'cloud', 'frontend', 'backend'
  ];

  // Action verbs that are not tools
  private static readonly ACTION_VERBS = [
    'improve', 'write', 'troubleshoot', 'prepare', 'leverage', 'prioritize'
  ];

  /**
   * Main optimization method - cleans and restructures skills section
   */
  static optimizeSkills(skillsText: string, jobDescription?: string): SkillsOptimizationResult {
    // Parse existing skills from text
    const parsedSkills = this.parseSkillsFromText(skillsText);
    
    // Initialize removal tracking
    const removedItems: RemovedSkillsReport = {
      companyNames: [],
      softSkillsFromTech: [],
      domainsFromLanguages: [],
      invalidCategories: []
    };

    // Clean and categorize skills
    const optimizedSkills = this.cleanAndCategorizeSkills(parsedSkills, removedItems);

    // Generate recommendations
    const recommendations = this.generateRecommendations(removedItems, optimizedSkills, jobDescription);

    // Calculate ATS compatibility score
    const atsCompatibilityScore = this.calculateATSCompatibilityScore(optimizedSkills, removedItems);

    return {
      optimizedSkills,
      removedItems,
      recommendations,
      atsCompatibilityScore
    };
  }

  /**
   * Parse skills from resume text
   */
  private static parseSkillsFromText(skillsText: string): Record<string, string[]> {
    const skills: Record<string, string[]> = {};
    const lines = skillsText.split('\n');

    let currentCategory = '';
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) continue;
      
      // Check if this is a category header
      if (this.isCategoryHeader(trimmedLine)) {
        currentCategory = this.extractCategoryName(trimmedLine);
        skills[currentCategory] = [];
        
        // Check if skills are on the same line after the colon
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex !== -1 && colonIndex < trimmedLine.length - 1) {
          const skillsOnSameLine = trimmedLine.substring(colonIndex + 1).trim();
          if (skillsOnSameLine) {
            const skillItems = this.parseSkillItems(skillsOnSameLine);
            skills[currentCategory].push(...skillItems);
          }
        }
      } else if (currentCategory && trimmedLine) {
        // Parse skills from this line
        const skillItems = this.parseSkillItems(trimmedLine);
        skills[currentCategory].push(...skillItems);
      }
    }

    return skills;
  }

  /**
   * Check if a line is a category header
   */
  private static isCategoryHeader(line: string): boolean {
    const categoryPatterns = [
      /^(technical skills?|programming languages?|tools?\s*&?\s*technologies?|frontend|backend|database|cloud|other skills?|core competencies):/i,
      /^(skills?|technologies?|languages?)$/i
    ];
    
    return categoryPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Extract category name from header
   */
  private static extractCategoryName(line: string): string {
    return line.replace(/[:\-\s]*$/, '').trim().toLowerCase();
  }

  /**
   * Parse individual skill items from a line
   */
  private static parseSkillItems(line: string): string[] {
    // Remove common prefixes and clean up
    const cleaned = line
      .replace(/^[\-\•\*\s]*/, '') // Remove bullet points
      .replace(/[:\-\s]*$/, ''); // Remove trailing punctuation

    // Split by commas and clean each item
    return cleaned
      .split(',')
      .map(item => item.trim().toLowerCase())
      .filter(item => item.length > 0);
  }

  /**
   * Clean and categorize skills into ATS-friendly structure using centralized taxonomy
   */
  private static cleanAndCategorizeSkills(
    parsedSkills: Record<string, string[]>,
    removedItems: RemovedSkillsReport
  ): OptimizedSkillCategories {
    const optimized: OptimizedSkillCategories = {
      programmingLanguages: [],
      frontendTechnologies: [],
      backendTechnologies: [],
      databases: [],
      cloudAndDevOps: [],
      toolsAndPlatforms: [],
      testingAndQA: [],
      softSkills: []
    };

    // Track already added skills to prevent cross-category duplicates
    const addedSkills = new Set<string>();

    // Process each category
    for (const [category, items] of Object.entries(parsedSkills)) {
      for (const item of items) {
        this.categorizeSkillItem(item, optimized, removedItems, addedSkills);
      }
    }

    // Clean up duplicates and sort
    this.deduplicateAndSort(optimized);

    return optimized;
  }

  /**
   * Categorize a single skill item using centralized taxonomy
   */
  private static categorizeSkillItem(
    item: string,
    optimized: OptimizedSkillCategories,
    removedItems: RemovedSkillsReport,
    addedSkills: Set<string>
  ): void {
    const cleanItem = item.trim().toLowerCase();

    // Skip empty items
    if (!cleanItem) return;

    // Format the skill (strips versions, normalizes)
    const formattedSkill = formatSkill(item);
    const formattedLower = formattedSkill.toLowerCase();

    // Check if this skill (after formatting) was already added
    if (addedSkills.has(formattedLower)) {
      // Skip duplicate - already added to another category
      return;
    }

    // Remove company names
    if (this.COMPANY_NAMES.some(company => cleanItem.includes(company))) {
      removedItems.companyNames.push(item);
      return;
    }

    // Remove action verbs
    if (this.ACTION_VERBS.includes(cleanItem)) {
      removedItems.invalidCategories.push(item);
      return;
    }

    // Check for soft skills
    if (SOFT_SKILLS.some(soft => cleanItem.includes(soft))) {
      optimized.softSkills.push(formattedSkill);
      addedSkills.add(formattedLower);
      return;
    }

    // Check for domains that shouldn't be in programming languages
    if (this.NOT_PROGRAMMING_LANGUAGES.some(domain => cleanItem.includes(domain))) {
      removedItems.domainsFromLanguages.push(item);
      // Don't add to any category - these are domain keywords, not skills
      return;
    }

    // Use centralized categorization
    const category = categorizeSkill(cleanItem);

    if (category === SKILL_CATEGORIES.PROGRAMMING_LANGUAGES) {
      optimized.programmingLanguages.push(formattedSkill);
      addedSkills.add(formattedLower);
    } else if (category === SKILL_CATEGORIES.FRONTEND_TECHNOLOGIES) {
      optimized.frontendTechnologies.push(formattedSkill);
      addedSkills.add(formattedLower);
    } else if (category === SKILL_CATEGORIES.BACKEND_TECHNOLOGIES) {
      optimized.backendTechnologies.push(formattedSkill);
      addedSkills.add(formattedLower);
    } else if (category === SKILL_CATEGORIES.DATABASES) {
      optimized.databases.push(formattedSkill);
      addedSkills.add(formattedLower);
    } else if (category === SKILL_CATEGORIES.CLOUD_AND_DEVOPS) {
      optimized.cloudAndDevOps.push(formattedSkill);
      addedSkills.add(formattedLower);
    } else if (category === SKILL_CATEGORIES.TESTING_AND_QA) {
      optimized.testingAndQA.push(formattedSkill);
      addedSkills.add(formattedLower);
    } else if (category === SKILL_CATEGORIES.TOOLS_AND_PLATFORMS) {
      optimized.toolsAndPlatforms.push(formattedSkill);
      addedSkills.add(formattedLower);
    } else if (category === SKILL_CATEGORIES.SOFT_SKILLS) {
      optimized.softSkills.push(formattedSkill);
      addedSkills.add(formattedLower);
    } else {
      // If not categorized, default to tools & platforms
      optimized.toolsAndPlatforms.push(formattedSkill);
      addedSkills.add(formattedLower);
    }
  }

  /**
   * Remove duplicates and sort skills
   */
  private static deduplicateAndSort(optimized: OptimizedSkillCategories): void {
    for (const [key, skills] of Object.entries(optimized)) {
      const uniqueSkills = [...new Set(skills)];
      (optimized as any)[key] = uniqueSkills.sort();
    }
  }

  /**
   * Generate optimization recommendations
   */
  private static generateRecommendations(
    removedItems: RemovedSkillsReport,
    optimizedSkills: OptimizedSkillCategories,
    jobDescription?: string
  ): string[] {
    const recommendations: string[] = [];

    if (removedItems.companyNames.length > 0) {
      recommendations.push(`❌ CRITICAL: Removed ${removedItems.companyNames.length} company names from skills (${removedItems.companyNames.join(', ')}). Company names cause ATS keyword stuffing flags.`);
    }

    if (removedItems.domainsFromLanguages.length > 0) {
      recommendations.push(`🔧 FIXED: Moved ${removedItems.domainsFromLanguages.length} domain keywords from Programming Languages to Domains section (${removedItems.domainsFromLanguages.join(', ')}). This prevents ATS skill category mismatches.`);
    }

    if (removedItems.softSkillsFromTech.length > 0) {
      recommendations.push(`📝 IMPROVED: Moved ${removedItems.softSkillsFromTech.length} soft skills to Core Competencies section. Soft skills in technical categories reduce ATS scores.`);
    }

    if (optimizedSkills.programmingLanguages.length === 0) {
      recommendations.push(`⚠️ WARNING: No valid programming languages detected. Add languages like JavaScript, Python, Java, etc.`);
    }

    if (jobDescription) {
      const jdKeywords = this.extractJDKeywords(jobDescription);
      const missingKeywords = jdKeywords.filter(keyword => 
        !this.isKeywordPresent(keyword, optimizedSkills)
      );
      
      if (missingKeywords.length > 0) {
        recommendations.push(`🎯 JD ALIGNMENT: Consider adding these JD keywords: ${missingKeywords.slice(0, 5).join(', ')}`);
      }
    }

    recommendations.push(`✅ STRUCTURE: Organized skills into ${Object.keys(optimizedSkills).filter(key => (optimizedSkills as any)[key].length > 0).length} ATS-friendly categories`);

    return recommendations;
  }

  /**
   * Extract keywords from job description
   */
  private static extractJDKeywords(jobDescription: string): string[] {
    const techKeywords = /\b(javascript|python|java|react|angular|vue|node\.?js|aws|azure|docker|kubernetes|sql|mongodb|git)\b/gi;
    const matches = jobDescription.match(techKeywords) || [];
    return [...new Set(matches.map(m => m.toLowerCase()))];
  }

  /**
   * Check if keyword is present in optimized skills
   */
  private static isKeywordPresent(keyword: string, skills: OptimizedSkillCategories): boolean {
    const allSkills = Object.values(skills).flat().map(s => s.toLowerCase());
    return allSkills.some(skill => skill.includes(keyword.toLowerCase()));
  }

  /**
   * Calculate ATS compatibility score
   */
  private static calculateATSCompatibilityScore(
    optimized: OptimizedSkillCategories,
    removedItems: RemovedSkillsReport
  ): number {
    let score = 100;

    // Penalties for removed problematic items (these are actually good!)
    // No penalty - removing these improves the score

    // Bonuses for good structure
    if (optimized.programmingLanguages.length > 0) score += 10;
    if (optimized.technicalSkills.length > 0) score += 5;
    if (optimized.cloudPlatforms.length > 0) score += 5;
    if (optimized.database.length > 0) score += 5;

    // Penalties for missing essential categories
    if (optimized.programmingLanguages.length === 0) score -= 20;
    if (optimized.technicalSkills.length === 0 && optimized.toolsTechnologies.length === 0) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate optimized skills section text with ATS-friendly category names
   */
  static generateOptimizedSkillsText(optimized: OptimizedSkillCategories): string {
    const sections: string[] = [];

    // Use category order from centralized taxonomy
    if (optimized.programmingLanguages.length > 0) {
      sections.push(`${SKILL_CATEGORIES.PROGRAMMING_LANGUAGES}: ${optimized.programmingLanguages.join(', ')}`);
    }

    if (optimized.frontendTechnologies.length > 0) {
      sections.push(`${SKILL_CATEGORIES.FRONTEND_TECHNOLOGIES}: ${optimized.frontendTechnologies.join(', ')}`);
    }

    if (optimized.backendTechnologies.length > 0) {
      sections.push(`${SKILL_CATEGORIES.BACKEND_TECHNOLOGIES}: ${optimized.backendTechnologies.join(', ')}`);
    }

    if (optimized.databases.length > 0) {
      sections.push(`${SKILL_CATEGORIES.DATABASES}: ${optimized.databases.join(', ')}`);
    }

    if (optimized.cloudAndDevOps.length > 0) {
      sections.push(`${SKILL_CATEGORIES.CLOUD_AND_DEVOPS}: ${optimized.cloudAndDevOps.join(', ')}`);
    }

    if (optimized.testingAndQA.length > 0) {
      sections.push(`${SKILL_CATEGORIES.TESTING_AND_QA}: ${optimized.testingAndQA.join(', ')}`);
    }

    if (optimized.toolsAndPlatforms.length > 0) {
      sections.push(`${SKILL_CATEGORIES.TOOLS_AND_PLATFORMS}: ${optimized.toolsAndPlatforms.join(', ')}`);
    }

    if (optimized.softSkills.length > 0) {
      sections.push(`${SKILL_CATEGORIES.SOFT_SKILLS}: ${optimized.softSkills.join(', ')}`);
    }

    return sections.join('\n\n');
  }
}

export default SkillsOptimizationService;