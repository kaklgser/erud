// src/services/skillsOptimizerService.ts
import { ResumeData } from '../types/resume';

export interface SkillCategory {
  category: string;
  skills: string[];
  count: number;
  priority: number;
}

export interface SkillsOptimizationResult {
  originalSkillsCount: number;
  optimizedSkillsCount: number;
  removedSkills: string[];
  groupedSkills: SkillCategory[];
  recommendations: string[];
}

export class SkillsOptimizerService {

  private static readonly IDEAL_MIN = 10;
  private static readonly IDEAL_MAX = 15;

  private static readonly SKILL_CATEGORIES = {
    'Programming Languages': ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin'],
    'Frontend Frameworks': ['React', 'React.js', 'Angular', 'Vue', 'Vue.js', 'Svelte', 'Next.js', 'Nuxt.js'],
    'Backend Frameworks': ['Node.js', 'Express', 'Express.js', 'Spring Boot', 'Django', 'Flask', 'FastAPI', 'ASP.NET', '.NET', 'Laravel'],
    'Databases': ['MySQL', 'PostgreSQL', 'MongoDB', 'SQL', 'NoSQL', 'Redis', 'DynamoDB', 'Cassandra', 'Oracle', 'SQL Server'],
    'Cloud & DevOps': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Terraform', 'Ansible'],
    'Tools & Platforms': ['Git', 'GitHub', 'GitLab', 'Jira', 'Postman', 'VS Code', 'IntelliJ'],
    'Web Technologies': ['HTML', 'HTML5', 'CSS', 'CSS3', 'Sass', 'SCSS', 'Tailwind', 'Bootstrap'],
    'APIs & Integration': ['REST API', 'RESTful', 'GraphQL', 'WebSockets', 'Microservices', 'API Integration'],
    'Methodologies': ['Agile', 'Scrum', 'Kanban', 'SDLC', 'TDD', 'OOP'],
    'Testing': ['Jest', 'Mocha', 'Chai', 'Selenium', 'Cypress', 'Unit Testing', 'Integration Testing']
  };

  private static readonly GENERIC_SKILLS = [
    'Full Stack Development',
    'Web Development',
    'Software Development',
    'Programming',
    'Coding',
    'Development',
    'Computer Science',
    'Problem Solving',
    'Data Structures',
    'Algorithms',
    'Software Engineering'
  ];

  static optimizeSkills(resumeData: ResumeData, jobDescription?: string): SkillsOptimizationResult {
    const originalSkills = this.extractAllSkills(resumeData);
    const originalSkillsCount = originalSkills.length;

    // Step 1: Remove duplicates and normalize
    const normalizedSkills = this.normalizeSk ills(originalSkills);

    // Step 2: Categorize skills
    const categorizedSkills = this.categorizeSkills(normalizedSkills);

    // Step 3: Prioritize based on job description (if provided)
    const prioritizedSkills = jobDescription
      ? this.prioritizeByJobDescription(categorizedSkills, jobDescription)
      : categorizedSkills;

    // Step 4: Remove generic/redundant skills
    const filteredSkills = this.removeGenericSkills(prioritizedSkills);

    // Step 5: Select top skills (10-15)
    const optimizedSkills = this.selectTopSkills(filteredSkills);

    // Step 6: Identify removed skills
    const removedSkills = this.identifyRemovedSkills(originalSkills, optimizedSkills);

    // Step 7: Generate recommendations
    const recommendations = this.generateRecommendations(optimizedSkills, jobDescription);

    return {
      originalSkillsCount,
      optimizedSkillsCount: optimizedSkills.reduce((sum, cat) => sum + cat.skills.length, 0),
      removedSkills,
      groupedSkills: optimizedSkills,
      recommendations
    };
  }

  private static extractAllSkills(resumeData: ResumeData): string[] {
    const skills: string[] = [];

    if (resumeData.skills) {
      resumeData.skills.forEach(category => {
        if (category.list) {
          skills.push(...category.list);
        }
      });
    }

    return skills;
  }

  private static normalizeSkills(skills: string[]): string[] {
    const normalized = new Set<string>();

    skills.forEach(skill => {
      const trimmed = skill.trim();
      if (trimmed) {
        // Remove duplicates with different casings
        const lower = trimmed.toLowerCase();

        // Normalize common variations
        if (lower === 'react.js' || lower === 'reactjs') {
          normalized.add('React');
        } else if (lower === 'node.js' || lower === 'nodejs') {
          normalized.add('Node.js');
        } else if (lower === 'express.js' || lower === 'expressjs') {
          normalized.add('Express');
        } else if (lower === 'vue.js' || lower === 'vuejs') {
          normalized.add('Vue');
        } else if (lower === 'next.js' || lower === 'nextjs') {
          normalized.add('Next.js');
        } else if (lower === 'typescript' || lower === 'ts') {
          normalized.add('TypeScript');
        } else if (lower === 'javascript' || lower === 'js') {
          normalized.add('JavaScript');
        } else {
          normalized.add(trimmed);
        }
      }
    });

    return Array.from(normalized);
  }

  private static categorizeSkills(skills: string[]): SkillCategory[] {
    const categorized: Map<string, string[]> = new Map();

    // Initialize categories
    Object.keys(this.SKILL_CATEGORIES).forEach(category => {
      categorized.set(category, []);
    });

    // Categorize each skill
    skills.forEach(skill => {
      let categorized_flag = false;

      for (const [category, keywords] of Object.entries(this.SKILL_CATEGORIES)) {
        if (keywords.some(keyword => skill.toLowerCase().includes(keyword.toLowerCase()))) {
          const existing = categorized.get(category) || [];
          existing.push(skill);
          categorized.set(category, existing);
          categorized_flag = true;
          break;
        }
      }

      // If not categorized, put in "Other"
      if (!categorized_flag) {
        const other = categorized.get('Other') || [];
        other.push(skill);
        categorized.set('Other', other);
      }
    });

    // Convert to SkillCategory array
    const result: SkillCategory[] = [];
    categorized.forEach((skills, category) => {
      if (skills.length > 0 && category !== 'Other') {
        result.push({
          category,
          skills,
          count: skills.length,
          priority: 0
        });
      }
    });

    return result;
  }

  private static prioritizeByJobDescription(categories: SkillCategory[], jobDescription: string): SkillCategory[] {
    const jdLower = jobDescription.toLowerCase();

    return categories.map(category => {
      // Count how many skills in this category appear in the JD
      const matchCount = category.skills.filter(skill =>
        jdLower.includes(skill.toLowerCase())
      ).length;

      return {
        ...category,
        priority: matchCount
      };
    }).sort((a, b) => b.priority - a.priority);
  }

  private static removeGenericSkills(categories: SkillCategory[]): SkillCategory[] {
    return categories.map(category => ({
      ...category,
      skills: category.skills.filter(skill =>
        !this.GENERIC_SKILLS.some(generic => skill.toLowerCase() === generic.toLowerCase())
      )
    })).filter(category => category.skills.length > 0);
  }

  private static selectTopSkills(categories: SkillCategory[]): SkillCategory[] {
    const result: SkillCategory[] = [];
    let currentCount = 0;

    // Priority 1: Take all high-priority categories (those matching JD)
    const highPriority = categories.filter(cat => cat.priority > 0);
    for (const category of highPriority) {
      const spaceLeft = this.IDEAL_MAX - currentCount;
      if (spaceLeft > 0) {
        const skillsToTake = Math.min(category.skills.length, spaceLeft);
        result.push({
          ...category,
          skills: category.skills.slice(0, skillsToTake),
          count: skillsToTake
        });
        currentCount += skillsToTake;
      }
    }

    // Priority 2: Fill remaining slots with other important categories
    const remainingCategories = categories.filter(cat => cat.priority === 0);
    for (const category of remainingCategories) {
      const spaceLeft = this.IDEAL_MAX - currentCount;
      if (spaceLeft <= 0) break;

      // Take 2-3 skills per category to maintain diversity
      const skillsToTake = Math.min(category.skills.length, 3, spaceLeft);
      if (skillsToTake > 0) {
        result.push({
          ...category,
          skills: category.skills.slice(0, skillsToTake),
          count: skillsToTake
        });
        currentCount += skillsToTake;
      }
    }

    return result;
  }

  private static identifyRemovedSkills(original: string[], optimized: SkillCategory[]): string[] {
    const optimizedFlat = optimized.flatMap(cat => cat.skills);
    return original.filter(skill => !optimizedFlat.includes(skill));
  }

  private static generateRecommendations(optimized: SkillCategory[], jobDescription?: string): string[] {
    const recommendations: string[] = [];

    const totalSkills = optimized.reduce((sum, cat) => sum + cat.count, 0);

    if (totalSkills < this.IDEAL_MIN) {
      recommendations.push(`Consider adding ${this.IDEAL_MIN - totalSkills} more relevant technical skills to reach the ideal range.`);
    }

    if (optimized.length < 3) {
      recommendations.push('Try to represent skills across at least 3-4 different categories for better diversity.');
    }

    if (jobDescription) {
      const hasHighPriority = optimized.some(cat => cat.priority > 0);
      if (!hasHighPriority) {
        recommendations.push('None of your skills directly match the job description. Review the JD and add relevant skills you possess.');
      }
    }

    recommendations.push('Focus on technical skills specific to your target role rather than generic terms like "Problem Solving" or "Full Stack Development".');

    return recommendations;
  }

  static applySkillsOptimization(resumeData: ResumeData, optimizedSkills: SkillCategory[]): ResumeData {
    return {
      ...resumeData,
      skills: optimizedSkills.map(category => ({
        category: category.category,
        list: category.skills,
        count: category.count
      }))
    };
  }
}

export const skillsOptimizerService = SkillsOptimizerService;
