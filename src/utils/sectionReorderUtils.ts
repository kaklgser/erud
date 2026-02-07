// src/utils/sectionReorderUtils.ts
import { ResumeData, UserType } from '../types/resume';

export interface SectionOrderRule {
  section: string;
  position: number;
  required: boolean;
}

export interface ReorderInstruction {
  section: string;
  currentPosition: number;
  targetPosition: number;
  action: 'move_up' | 'move_down' | 'keep';
}

export const SECTION_ORDER_RULES: Record<UserType, SectionOrderRule[]> = {
  experienced: [
    { section: 'header', position: 1, required: true },
    { section: 'summary', position: 2, required: true },
    { section: 'skills', position: 3, required: true },
    { section: 'experience', position: 4, required: true },
    { section: 'projects', position: 5, required: false },
    { section: 'education', position: 6, required: true },
    { section: 'certifications', position: 7, required: false }
  ],
  fresher: [
    { section: 'header', position: 1, required: true },
    { section: 'careerObjective', position: 2, required: true },
    { section: 'skills', position: 3, required: true },
    { section: 'experience', position: 4, required: false },
    { section: 'projects', position: 5, required: true },
    { section: 'education', position: 6, required: true },
    { section: 'certifications', position: 7, required: false },
    { section: 'achievements', position: 8, required: false }
  ],
  student: [
    { section: 'header', position: 1, required: true },
    { section: 'careerObjective', position: 2, required: true },
    { section: 'education', position: 3, required: true },
    { section: 'skills', position: 4, required: true },
    { section: 'projects', position: 5, required: true },
    { section: 'experience', position: 6, required: false },
    { section: 'certifications', position: 7, required: false },
    { section: 'achievements', position: 8, required: false }
  ]
};

export function detectCurrentOrder(resumeData: ResumeData): string[] {
  const order: string[] = ['header'];

  if (resumeData.summary) order.push('summary');
  if (resumeData.careerObjective) order.push('careerObjective');
  if (resumeData.education?.length > 0) order.push('education');
  if (resumeData.skills?.length > 0) order.push('skills');
  if (resumeData.workExperience?.length > 0) order.push('experience');
  if (resumeData.projects?.length > 0) order.push('projects');
  if (resumeData.certifications?.length > 0) order.push('certifications');
  if (resumeData.achievements?.length > 0) order.push('achievements');

  return order;
}

export function generateReorderInstructions(
  resumeData: ResumeData,
  userType: UserType
): ReorderInstruction[] {
  const currentOrder = detectCurrentOrder(resumeData);
  const rules = SECTION_ORDER_RULES[userType];
  const instructions: ReorderInstruction[] = [];

  // Create a map of target positions
  const targetPositions = new Map<string, number>();
  rules.forEach(rule => {
    targetPositions.set(rule.section, rule.position);
  });

  // Generate instructions for each section
  currentOrder.forEach((section, currentIndex) => {
    const targetPosition = targetPositions.get(section);

    if (targetPosition !== undefined) {
      const currentPos = currentIndex + 1; // 1-indexed for display
      const targetPos = targetPosition;

      let action: 'move_up' | 'move_down' | 'keep' = 'keep';
      if (currentPos < targetPos) {
        action = 'move_down';
      } else if (currentPos > targetPos) {
        action = 'move_up';
      }

      instructions.push({
        section,
        currentPosition: currentPos,
        targetPosition: targetPos,
        action
      });
    }
  });

  return instructions.filter(inst => inst.action !== 'keep');
}

export function reorderResumeSections(
  resumeData: ResumeData,
  userType: UserType
): ResumeData {
  // The actual reordering happens during rendering/export
  // This function just returns the data with a flag indicating it's been validated
  return {
    ...resumeData,
    origin: 'reordered'
  };
}

export function getSectionDisplayName(section: string): string {
  const displayNames: Record<string, string> = {
    header: 'Header (Name & Contact)',
    summary: 'Professional Summary',
    careerObjective: 'Career Objective',
    education: 'Education',
    skills: 'Skills',
    experience: 'Work Experience',
    projects: 'Projects',
    certifications: 'Certifications',
    achievements: 'Achievements'
  };

  return displayNames[section] || section.toUpperCase();
}

export function visualizeSectionOrder(sections: string[], rules: SectionOrderRule[]): string {
  const visualization: string[] = [];

  sections.forEach((section, index) => {
    const rule = rules.find(r => r.section === section);
    const currentPos = index + 1;
    const targetPos = rule?.position || '?';
    const status = currentPos === targetPos ? '✓' : '✗';

    visualization.push(`${status} ${currentPos}. ${getSectionDisplayName(section)} ${currentPos !== targetPos ? `→ should be ${targetPos}` : ''}`);
  });

  return visualization.join('\n');
}

export const sectionReorderUtils = {
  detectCurrentOrder,
  generateReorderInstructions,
  reorderResumeSections,
  getSectionDisplayName,
  visualizeSectionOrder
};
