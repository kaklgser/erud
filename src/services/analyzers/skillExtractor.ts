// src/services/analyzers/skillExtractor.ts
import { SkillExtractorInterface, SkillExtractionResult } from '../../types/resume';
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
  formatSkillName,
  getCategoryOrder
} from '../../constants/skillsTaxonomy';

/**
 * SkillExtractor - Extracts and categorizes skills from resume content
 * Uses centralized taxonomy for ATS-friendly skill categorization
 *
 * Handles:
 * - Comprehensive skill identification throughout document
 * - Total count calculation of unique skills identified
 * - Skill classification using standardized ATS-friendly categories
 * - Skill organization by category with counts per category
 * - Skill quality scoring based on relevance and presentation
 */
export class SkillExtractor implements SkillExtractorInterface {

  /**
   * Extract and categorize skills from resume text using centralized taxonomy
   */
  extractSkills(resumeText: string): SkillExtractionResult {
    console.log('🛠️ SkillExtractor: Starting skill extraction with ATS-friendly taxonomy...');

    const textLower = resumeText.toLowerCase();

    // Extract skills by category using centralized taxonomy
    const programmingLanguages = this.extractSkillsByCategory(textLower, PROGRAMMING_LANGUAGES);
    const frontendTechnologies = this.extractSkillsByCategory(textLower, FRONTEND_TECHNOLOGIES);
    const backendTechnologies = this.extractSkillsByCategory(textLower, BACKEND_TECHNOLOGIES);
    const databases = this.extractSkillsByCategory(textLower, DATABASES);
    const cloudAndDevOps = this.extractSkillsByCategory(textLower, CLOUD_AND_DEVOPS);
    const toolsAndPlatforms = this.extractSkillsByCategory(textLower, TOOLS_AND_PLATFORMS);
    const testingAndQA = this.extractSkillsByCategory(textLower, TESTING_AND_QA);
    const softSkills = this.extractSkillsByCategory(textLower, SOFT_SKILLS);

    // Combine all technical skills for backward compatibility
    const toolsTechnologies = [
      ...frontendTechnologies,
      ...backendTechnologies,
      ...databases,
      ...toolsAndPlatforms,
      ...testingAndQA
    ];

    // Create comprehensive skills list
    const allSkills = [
      ...programmingLanguages,
      ...frontendTechnologies,
      ...backendTechnologies,
      ...databases,
      ...cloudAndDevOps,
      ...toolsAndPlatforms,
      ...testingAndQA,
      ...softSkills
    ];

    // Build skill categories object using ATS-friendly names
    const skillCategories: Record<string, string[]> = {};

    if (programmingLanguages.length > 0) {
      skillCategories[SKILL_CATEGORIES.PROGRAMMING_LANGUAGES] = programmingLanguages;
    }
    if (frontendTechnologies.length > 0) {
      skillCategories[SKILL_CATEGORIES.FRONTEND_TECHNOLOGIES] = frontendTechnologies;
    }
    if (backendTechnologies.length > 0) {
      skillCategories[SKILL_CATEGORIES.BACKEND_TECHNOLOGIES] = backendTechnologies;
    }
    if (databases.length > 0) {
      skillCategories[SKILL_CATEGORIES.DATABASES] = databases;
    }
    if (cloudAndDevOps.length > 0) {
      skillCategories[SKILL_CATEGORIES.CLOUD_AND_DEVOPS] = cloudAndDevOps;
    }
    if (toolsAndPlatforms.length > 0) {
      skillCategories[SKILL_CATEGORIES.TOOLS_AND_PLATFORMS] = toolsAndPlatforms;
    }
    if (testingAndQA.length > 0) {
      skillCategories[SKILL_CATEGORIES.TESTING_AND_QA] = testingAndQA;
    }
    if (softSkills.length > 0) {
      skillCategories[SKILL_CATEGORIES.SOFT_SKILLS] = softSkills;
    }

    const result: SkillExtractionResult = {
      skills_found: allSkills,
      skill_categories: skillCategories,
      skills_count: allSkills.length,
      skills_quality_score: this.calculateSkillsQualityScore(resumeText, allSkills),
      programming_languages: programmingLanguages,
      tools_technologies: toolsTechnologies,
      cloud_platforms: cloudAndDevOps, // Updated to use cloudAndDevOps
      soft_skills: softSkills
    };

    console.log('📊 Skill Extraction Results (ATS-friendly):', {
      total_skills: result.skills_count,
      programming_languages: result.programming_languages.length,
      frontend: frontendTechnologies.length,
      backend: backendTechnologies.length,
      databases: databases.length,
      cloud_devops: cloudAndDevOps.length,
      testing_qa: testingAndQA.length,
      tools_platforms: toolsAndPlatforms.length,
      soft_skills: result.soft_skills.length,
      quality_score: result.skills_quality_score
    });

    return result;
  }

  /**
   * Extract skills from a specific category
   */
  private extractSkillsByCategory(textLower: string, skillList: string[]): string[] {
    const foundSkills: string[] = [];
    
    skillList.forEach(skill => {
      const skillLower = skill.toLowerCase();
      
      // Check for exact matches and common variations
      const patterns = [
        new RegExp(`\\b${this.escapeRegex(skillLower)}\\b`, 'g'),
        new RegExp(`\\b${this.escapeRegex(skillLower.replace(/\./g, ''))}\\b`, 'g'), // Remove dots
        new RegExp(`\\b${this.escapeRegex(skillLower.replace(/\s+/g, ''))}\\b`, 'g'), // Remove spaces
        new RegExp(`\\b${this.escapeRegex(skillLower.replace(/-/g, ''))}\\b`, 'g'), // Remove hyphens
      ];
      
      const isFound = patterns.some(pattern => pattern.test(textLower));
      
      if (isFound) {
        // Format skill name for display
        const displaySkill = this.formatSkillName(skill);
        if (!foundSkills.includes(displaySkill)) {
          foundSkills.push(displaySkill);
        }
      }
    });
    
    return foundSkills.sort();
  }

  /**
   * Calculate skills quality score based on presentation and relevance
   */
  private calculateSkillsQualityScore(resumeText: string, skills: string[]): number {
    if (skills.length === 0) return 0;
    
    let qualityScore = 70; // Base score
    
    // Check for skills section organization
    const hasSkillsSection = /\b(?:skills|technical\s+skills|core\s+competencies|technologies)\b/i.test(resumeText);
    if (hasSkillsSection) qualityScore += 15;
    
    // Check for skill categorization
    const hasCategorization = /\b(?:programming|languages|frameworks|databases|tools|cloud)\b/i.test(resumeText);
    if (hasCategorization) qualityScore += 10;
    
    // Bonus for good skill count (not too few, not too many)
    if (skills.length >= 8 && skills.length <= 25) {
      qualityScore += 5;
    } else if (skills.length < 5) {
      qualityScore -= 10; // Too few skills
    } else if (skills.length > 30) {
      qualityScore -= 5; // Too many skills (might be stuffing)
    }
    
    // Check for skill context (skills mentioned in experience/projects)
    let skillsWithContext = 0;
    skills.forEach(skill => {
      const skillPattern = new RegExp(`\\b${this.escapeRegex(skill.toLowerCase())}\\b`, 'gi');
      const matches = resumeText.match(skillPattern);
      if (matches && matches.length > 1) { // Mentioned more than once
        skillsWithContext++;
      }
    });
    
    const contextRatio = skillsWithContext / skills.length;
    if (contextRatio > 0.5) {
      qualityScore += 10; // Good context
    } else if (contextRatio < 0.2) {
      qualityScore -= 5; // Poor context
    }
    
    return Math.max(0, Math.min(100, qualityScore));
  }

  /**
   * Format skill name for display using centralized taxonomy
   */
  private formatSkillName = formatSkillName;

  /**
   * Escape regex special characters
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get skill extraction insights with ATS-friendly recommendations
   */
  getSkillInsights(result: SkillExtractionResult): string[] {
    const insights: string[] = [];

    if (result.skills_count === 0) {
      insights.push('No technical skills detected. Add a dedicated Skills section to your resume.');
      return insights;
    }

    if (result.skills_count < 8) {
      insights.push('Consider adding more relevant technical skills to strengthen your profile');
    } else if (result.skills_count > 25) {
      insights.push('You have many skills listed. Consider focusing on the most relevant ones for your target role');
    }

    if (result.programming_languages.length === 0) {
      insights.push('No programming languages detected. Add relevant programming languages for technical roles');
    }

    // Check for Cloud & DevOps
    const hasCloudDevOps = result.skill_categories[SKILL_CATEGORIES.CLOUD_AND_DEVOPS]?.length > 0;
    if (!hasCloudDevOps) {
      insights.push('Consider adding Cloud & DevOps experience (AWS, Azure, GCP, Docker, Kubernetes) as it\'s highly valued');
    }

    // Check for Testing & QA skills
    const hasTestingQA = result.skill_categories[SKILL_CATEGORIES.TESTING_AND_QA]?.length > 0;
    if (!hasTestingQA) {
      insights.push('Add Testing & QA skills (Unit Testing, Test Automation, Manual Testing) to show quality focus');
    }

    if (result.soft_skills.length < 3) {
      insights.push('Include more soft skills like leadership, communication, and teamwork');
    }

    if (result.skills_quality_score < 70) {
      insights.push('Improve skills presentation by organizing them into ATS-friendly categories and providing context in your experience');
    }

    // Category-specific insights using ATS-friendly structure
    const categories = Object.keys(result.skill_categories);
    if (categories.length < 4) {
      insights.push('Diversify your skill set across more ATS-friendly categories (Programming Languages, Frontend, Backend, Cloud & DevOps, etc.)');
    }

    return insights;
  }

  /**
   * Suggest skills based on role
   */
  suggestSkillsForRole(role: string): string[] {
    const roleLower = role.toLowerCase();
    const suggestions: string[] = [];
    
    if (roleLower.includes('frontend') || roleLower.includes('front-end')) {
      suggestions.push('React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Webpack', 'Git');
    } else if (roleLower.includes('backend') || roleLower.includes('back-end')) {
      suggestions.push('Node.js', 'Python', 'Java', 'SQL', 'REST', 'Docker', 'AWS');
    } else if (roleLower.includes('fullstack') || roleLower.includes('full-stack')) {
      suggestions.push('React', 'Node.js', 'JavaScript', 'SQL', 'Git', 'Docker', 'AWS');
    } else if (roleLower.includes('devops')) {
      suggestions.push('Docker', 'Kubernetes', 'AWS', 'Terraform', 'Jenkins', 'Git', 'Linux');
    } else if (roleLower.includes('data')) {
      suggestions.push('Python', 'SQL', 'Pandas', 'NumPy', 'Machine Learning', 'AWS', 'Git');
    } else {
      // General software development suggestions
      suggestions.push('Git', 'Agile', 'Problem Solving', 'Communication', 'Teamwork');
    }
    
    return suggestions;
  }
}

// Export singleton instance
export const skillExtractor = new SkillExtractor();