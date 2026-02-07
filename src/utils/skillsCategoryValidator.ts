/**
 * Skills Category Validator
 * Validates that skills are correctly categorized according to ATS standards
 * Helps catch common categorization mistakes
 */

import {
  SKILL_CATEGORIES,
  PROGRAMMING_LANGUAGES,
  FRONTEND_TECHNOLOGIES,
  BACKEND_TECHNOLOGIES,
  DATABASES,
  CLOUD_AND_DEVOPS,
  TESTING_AND_QA,
  categorizeSkill,
  validateSkillCategory,
  type SkillCategoryName
} from '../constants/skillsTaxonomy';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  skill: string;
  currentCategory: string;
  correctCategory: string;
  severity: 'error' | 'critical';
  message: string;
}

export interface ValidationWarning {
  skill: string;
  category: string;
  message: string;
}

/**
 * Common categorization mistakes to check for
 */
const COMMON_MISTAKES = {
  // Frameworks incorrectly placed in Programming Languages
  frameworksInLanguages: {
    skills: ['react', 'angular', 'vue', 'express', 'django', 'flask', 'spring boot', 'node.js'],
    correctCategory: 'Frontend or Backend Technologies',
    message: 'Frameworks should not be listed under Programming Languages'
  },
  // Databases incorrectly placed in Programming Languages
  databasesInLanguages: {
    skills: ['mysql', 'postgresql', 'mongodb', 'redis', 'sqlite'],
    correctCategory: SKILL_CATEGORIES.DATABASES,
    message: 'Databases should not be listed under Programming Languages'
  },
  // Cloud platforms split across categories
  cloudPlatformsSplit: {
    skills: ['aws', 'azure', 'gcp', 'google cloud'],
    correctCategory: SKILL_CATEGORIES.CLOUD_AND_DEVOPS,
    message: 'All cloud platforms should be under Cloud & DevOps, not split'
  },
  // DevOps tools split from cloud
  devopsSplit: {
    skills: ['docker', 'kubernetes', 'jenkins', 'terraform'],
    correctCategory: SKILL_CATEGORIES.CLOUD_AND_DEVOPS,
    message: 'DevOps tools should be under Cloud & DevOps with cloud platforms'
  },
  // Testing skills buried in other categories
  testingMiscategorized: {
    skills: ['junit', 'jest', 'selenium', 'cypress', 'manual testing', 'unit testing'],
    correctCategory: SKILL_CATEGORIES.TESTING_AND_QA,
    message: 'Testing skills should have their own Testing & QA category'
  }
};

/**
 * Validate skills categorization
 * @param skillsByCategory - Object mapping category names to skill arrays
 * @returns ValidationResult with errors and warnings
 */
export function validateSkillsCategorization(
  skillsByCategory: Record<string, string[]>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check each category
  for (const [category, skills] of Object.entries(skillsByCategory)) {
    if (!skills || skills.length === 0) continue;

    for (const skill of skills) {
      const skillLower = skill.toLowerCase().trim();

      // Validate using centralized taxonomy
      const correctCategory = categorizeSkill(skillLower);

      if (correctCategory && category !== correctCategory) {
        errors.push({
          skill,
          currentCategory: category,
          correctCategory,
          severity: 'error',
          message: `"${skill}" is incorrectly categorized as "${category}". Should be "${correctCategory}".`
        });
      }
    }
  }

  // Check for common mistakes
  checkForCommonMistakes(skillsByCategory, errors, warnings);

  // Check for split categories
  checkForSplitCategories(skillsByCategory, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Check for common categorization mistakes
 */
function checkForCommonMistakes(
  skillsByCategory: Record<string, string[]>,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  const programmingLanguages = skillsByCategory[SKILL_CATEGORIES.PROGRAMMING_LANGUAGES] || [];

  // Check if frameworks are in Programming Languages
  for (const skill of programmingLanguages) {
    const skillLower = skill.toLowerCase();

    if (FRONTEND_TECHNOLOGIES.some(tech => skillLower.includes(tech)) ||
        BACKEND_TECHNOLOGIES.some(tech => skillLower.includes(tech))) {
      errors.push({
        skill,
        currentCategory: SKILL_CATEGORIES.PROGRAMMING_LANGUAGES,
        correctCategory: 'Frontend or Backend Technologies',
        severity: 'critical',
        message: `CRITICAL: "${skill}" is a framework, not a programming language. This confuses ATS systems.`
      });
    }

    // Check if databases are in Programming Languages
    if (DATABASES.some(db => skillLower.includes(db))) {
      errors.push({
        skill,
        currentCategory: SKILL_CATEGORIES.PROGRAMMING_LANGUAGES,
        correctCategory: SKILL_CATEGORIES.DATABASES,
        severity: 'critical',
        message: `CRITICAL: "${skill}" is a database, not a programming language. This confuses ATS systems.`
      });
    }

    // Check if cloud platforms are in Programming Languages
    if (CLOUD_AND_DEVOPS.some(cloud => skillLower.includes(cloud))) {
      errors.push({
        skill,
        currentCategory: SKILL_CATEGORIES.PROGRAMMING_LANGUAGES,
        correctCategory: SKILL_CATEGORIES.CLOUD_AND_DEVOPS,
        severity: 'critical',
        message: `CRITICAL: "${skill}" is a cloud/DevOps tool, not a programming language.`
      });
    }
  }
}

/**
 * Check if categories are incorrectly split
 */
function checkForSplitCategories(
  skillsByCategory: Record<string, string[]>,
  warnings: ValidationWarning[]
): void {
  // Check if cloud platforms and DevOps are split
  const hasCloudInMultipleCategories = Object.entries(skillsByCategory).filter(([category, skills]) => {
    if (category === SKILL_CATEGORIES.CLOUD_AND_DEVOPS) return false;

    return skills.some(skill => {
      const skillLower = skill.toLowerCase();
      return CLOUD_AND_DEVOPS.some(cloudTech => skillLower.includes(cloudTech));
    });
  });

  if (hasCloudInMultipleCategories.length > 0) {
    warnings.push({
      skill: 'Cloud & DevOps tools',
      category: 'Multiple categories',
      message: 'Cloud platforms and DevOps tools are split across multiple categories. They should all be under "Cloud & DevOps".'
    });
  }

  // Check if testing skills are buried
  const hasTestingInOtherCategories = Object.entries(skillsByCategory).filter(([category, skills]) => {
    if (category === SKILL_CATEGORIES.TESTING_AND_QA) return false;

    return skills.some(skill => {
      const skillLower = skill.toLowerCase();
      return TESTING_AND_QA.some(testTech => skillLower.includes(testTech));
    });
  });

  if (hasTestingInOtherCategories.length > 0) {
    warnings.push({
      skill: 'Testing & QA skills',
      category: 'Multiple categories',
      message: 'Testing skills are scattered across categories. They should have their own "Testing & QA" category for better ATS visibility.'
    });
  }
}

/**
 * Get a human-readable validation report
 */
export function getValidationReport(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.isValid) {
    lines.push('✅ Skills Categorization is ATS-Friendly!');
    lines.push('All skills are correctly categorized according to ATS standards.');
  } else {
    lines.push('❌ Skills Categorization Issues Found');
    lines.push('');
  }

  if (result.errors.length > 0) {
    lines.push(`Found ${result.errors.length} categorization error(s):`);
    lines.push('');

    result.errors.forEach((error, index) => {
      const icon = error.severity === 'critical' ? '🚨' : '⚠️';
      lines.push(`${index + 1}. ${icon} ${error.message}`);
      lines.push(`   Current: ${error.currentCategory}`);
      lines.push(`   Correct: ${error.correctCategory}`);
      lines.push('');
    });
  }

  if (result.warnings.length > 0) {
    lines.push(`Found ${result.warnings.length} warning(s):`);
    lines.push('');

    result.warnings.forEach((warning, index) => {
      lines.push(`${index + 1}. ⚡ ${warning.message}`);
      lines.push('');
    });
  }

  if (!result.isValid) {
    lines.push('💡 Fix these issues to improve ATS compatibility and passing rate.');
  }

  return lines.join('\n');
}

/**
 * Quick validation for a single skill-category pair
 */
export function validateSingleSkill(skill: string, category: SkillCategoryName): boolean {
  return validateSkillCategory(skill, category);
}

/**
 * Get suggestions for fixing categorization issues
 */
export function getFixSuggestions(errors: ValidationError[]): Record<string, string[]> {
  const suggestions: Record<string, string[]> = {};

  for (const error of errors) {
    if (!suggestions[error.correctCategory]) {
      suggestions[error.correctCategory] = [];
    }
    suggestions[error.correctCategory].push(error.skill);
  }

  return suggestions;
}
