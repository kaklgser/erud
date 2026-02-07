// src/utils/skillsVersionStripper.ts

/**
 * Utility to clean and normalize skills by stripping version numbers and variations
 * This pre-processing step helps AI focus on skill names rather than version details
 */

/**
 * Strips version numbers and normalizes skill names
 * Examples:
 * - "Python 3.11" → "Python"
 * - "Node.js 20.x" → "Node.js"
 * - "React 18" → "React"
 * - "TypeScript v5" → "TypeScript"
 */
export function stripVersionFromSkill(skill: string): string {
  let cleaned = skill.trim();

  // Remove version patterns:
  // - "3.11", "20.x", "v5", "5.0", etc.
  cleaned = cleaned.replace(/\s+v?\d+(\.\d+)?(\.\d+)?\.?x?\s*$/i, '');

  // Remove parenthetical versions: "Python (3.11)" → "Python"
  cleaned = cleaned.replace(/\s*\([^)]*\d+[^)]*\)/g, '');

  // Remove trailing version indicators: "ES6" → "ES6" (keep), "Python 3" → "Python"
  // But preserve skills like "ES6", "Python3" (no space)
  if (!/^[A-Z]{2,}\d+$/.test(cleaned)) {
    cleaned = cleaned.replace(/\s+\d+$/g, '');
  }

  return cleaned.trim();
}

/**
 * Cleans entire resume text by normalizing skill mentions
 */
export function cleanResumeTextForAI(text: string): string {
  let cleaned = text;

  // Common patterns to normalize
  const patterns = [
    // Version numbers in common formats
    { pattern: /Python\s+3\.\d+/gi, replacement: 'Python' },
    { pattern: /Node\.js\s+\d+\.x/gi, replacement: 'Node.js' },
    { pattern: /React\s+\d+/gi, replacement: 'React' },
    { pattern: /Angular\s+\d+/gi, replacement: 'Angular' },
    { pattern: /Vue\s+\d+/gi, replacement: 'Vue.js' },
    { pattern: /TypeScript\s+\d+/gi, replacement: 'TypeScript' },
    { pattern: /Java\s+\d+/gi, replacement: 'Java' },
    { pattern: /Spring\s+Boot\s+\d+/gi, replacement: 'Spring Boot' },
    { pattern: /Django\s+\d+/gi, replacement: 'Django' },
    { pattern: /Flask\s+\d+/gi, replacement: 'Flask' },

    // Common variations to standardize
    { pattern: /NodeJS/gi, replacement: 'Node.js' },
    { pattern: /ReactJS/gi, replacement: 'React' },
    { pattern: /VueJS/gi, replacement: 'Vue.js' },
    { pattern: /NextJS/gi, replacement: 'Next.js' },
    { pattern: /ExpressJS/gi, replacement: 'Express' },
  ];

  patterns.forEach(({ pattern, replacement }) => {
    cleaned = cleaned.replace(pattern, replacement);
  });

  return cleaned;
}

/**
 * Deduplicates skills array and removes version duplicates
 * Example: ["Python", "Python 3.11", "Python 3.9"] → ["Python"]
 */
export function deduplicateSkills(skills: string[]): string[] {
  const normalized = new Map<string, string>();

  skills.forEach(skill => {
    const stripped = stripVersionFromSkill(skill);
    const lowerKey = stripped.toLowerCase();

    // Keep the cleaner version (without numbers usually)
    if (!normalized.has(lowerKey) || stripped.length < normalized.get(lowerKey)!.length) {
      normalized.set(lowerKey, stripped);
    }
  });

  return Array.from(normalized.values());
}

/**
 * Validates if a string looks like a real skill name
 * Filters out noise like random words, single letters, etc.
 */
export function isValidSkillName(skill: string): boolean {
  const trimmed = skill.trim();

  // Too short or too long
  if (trimmed.length < 2 || trimmed.length > 50) {
    return false;
  }

  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(trimmed)) {
    return false;
  }

  // Filter out common noise words
  const noiseWords = ['the', 'and', 'or', 'with', 'using', 'via', 'etc', 'such', 'as'];
  if (noiseWords.includes(trimmed.toLowerCase())) {
    return false;
  }

  return true;
}
