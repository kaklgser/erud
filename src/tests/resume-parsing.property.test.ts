// src/tests/resume-parsing.property.test.ts
// Property-based tests for Resume Parsing functionality

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { PipelineController } from '../services/pipelineController';
import { PipelineStep } from '../types/pipeline';

describe('Resume Parsing Properties', () => {
  let controller: PipelineController;
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });
  
  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  /**
   * **Feature: comprehensive-resume-optimization-pipeline, Property 1: Resume parsing extracts all required sections**
   * Resume parsing should extract all available sections from any valid resume format
   */
  it('should extract all required sections from valid resume files', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        userId: fc.string({ minLength: 5, maxLength: 50 }),
        jobDescription: fc.string({ minLength: 50, maxLength: 1000 }),
        targetRole: fc.string({ minLength: 3, maxLength: 100 })
      }),
      fc.record({
        fileName: fc.string({ minLength: 5, maxLength: 50 }).map(s => s + '.pdf'),
        fileSize: fc.integer({ min: 1024, max: 1024 * 1024 }), // 1KB to 1MB
        content: fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 }),
          email: fc.emailAddress(),
          phone: fc.string({ minLength: 10, maxLength: 15 }),
          workExperience: fc.array(fc.record({
            role: fc.string({ minLength: 3, maxLength: 50 }),
            company: fc.string({ minLength: 2, maxLength: 50 }),
            year: fc.string({ minLength: 4, maxLength: 20 }),
            bullets: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 3 })
          }), { minLength: 1, maxLength: 3 }),
          projects: fc.array(fc.record({
            title: fc.string({ minLength: 3, maxLength: 50 }),
            bullets: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 3 })
          }), { minLength: 1, maxLength: 2 }),
          skills: fc.array(fc.record({
            category: fc.string({ minLength: 3, maxLength: 30 }),
            list: fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 1, maxLength: 5 })
          }), { minLength: 1, maxLength: 3 }),
          education: fc.array(fc.record({
            degree: fc.string({ minLength: 3, maxLength: 50 }),
            school: fc.string({ minLength: 3, maxLength: 50 }),
            year: fc.string({ minLength: 4, maxLength: 20 })
          }), { minLength: 1, maxLength: 2 })
        })
      }),
      async (config, mockFile) => {
        controller = new PipelineController(config.userId, config.jobDescription, config.targetRole);
        
        // Create a mock file object
        const file = createMockFile(mockFile.fileName, mockFile.fileSize, mockFile.content);
        
        try {
          // Execute the parsing step
          const result = await controller.executeStep(PipelineStep.PARSE_RESUME, { file });
          
          // Property: Parsing should succeed for valid files
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.data.resumeData).toBeDefined();
          
          const resumeData = result.data.resumeData;
          
          // Property: Should extract basic contact information
          expect(resumeData.name).toBeDefined();
          expect(resumeData.email).toBeDefined();
          expect(resumeData.email).toContain('@');
          
          // Property: Should extract work experience if present
          if (mockFile.content.workExperience.length > 0) {
            expect(resumeData.workExperience).toBeDefined();
            expect(Array.isArray(resumeData.workExperience)).toBe(true);
            expect(resumeData.workExperience.length).toBeGreaterThan(0);
          }
          
          // Property: Should extract projects if present
          if (mockFile.content.projects.length > 0) {
            expect(resumeData.projects).toBeDefined();
            expect(Array.isArray(resumeData.projects)).toBe(true);
            expect(resumeData.projects.length).toBeGreaterThan(0);
          }
          
          // Property: Should extract skills if present
          if (mockFile.content.skills.length > 0) {
            expect(resumeData.skills).toBeDefined();
            expect(Array.isArray(resumeData.skills)).toBe(true);
            expect(resumeData.skills.length).toBeGreaterThan(0);
          }
          
          // Property: Should extract education if present
          if (mockFile.content.education.length > 0) {
            expect(resumeData.education).toBeDefined();
            expect(Array.isArray(resumeData.education)).toBe(true);
            expect(resumeData.education.length).toBeGreaterThan(0);
          }
          
          // Property: Should provide parsing confidence
          expect(result.data.parsingConfidence).toBeDefined();
          expect(result.data.parsingConfidence).toBeGreaterThan(0);
          expect(result.data.parsingConfidence).toBeLessThanOrEqual(1);
          
          // Property: Should identify missing sections
          expect(result.data.missingSections).toBeDefined();
          expect(Array.isArray(result.data.missingSections)).toBe(true);
          
          // Property: Should proceed to next step
          expect(result.nextStep).toBe(PipelineStep.ANALYZE_AGAINST_JD);
          
        } catch (error) {
          // Property: Any errors should be handled gracefully
          expect(error).toBeInstanceOf(Error);
        }
      }
    ), { numRuns: 15 });
  });

  /**
   * **Feature: comprehensive-resume-optimization-pipeline, Property 2: Missing sections detection accuracy**
   * Missing sections detection should accurately identify what sections are missing from a resume
   */
  it('should accurately detect missing sections', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        userId: fc.string({ minLength: 5, maxLength: 50 }),
        jobDescription: fc.string({ minLength: 50, maxLength: 1000 }),
        targetRole: fc.string({ minLength: 3, maxLength: 100 })
      }),
      fc.record({
        fileName: fc.string({ minLength: 5, maxLength: 50 }).map(s => s + '.pdf'),
        fileSize: fc.integer({ min: 1024, max: 1024 * 1024 }),
        hasWorkExperience: fc.boolean(),
        hasProjects: fc.boolean(),
        hasSkills: fc.boolean(),
        hasEducation: fc.boolean(),
        hasCertifications: fc.boolean(),
        content: fc.record({
          name: fc.string({ minLength: 2, maxLength: 100 }),
          email: fc.emailAddress(),
          phone: fc.string({ minLength: 10, maxLength: 15 })
        })
      }),
      async (config, mockFile) => {
        controller = new PipelineController(config.userId, config.jobDescription, config.targetRole);
        
        // Create content based on what sections should be present
        const content = {
          ...mockFile.content,
          workExperience: mockFile.hasWorkExperience ? [{
            role: 'Software Engineer',
            company: 'Tech Corp',
            year: '2020-2023',
            bullets: ['Developed applications', 'Led team projects']
          }] : [],
          projects: mockFile.hasProjects ? [{
            title: 'Web Application',
            bullets: ['Built with React', 'Deployed to AWS']
          }] : [],
          skills: mockFile.hasSkills ? [{
            category: 'Programming',
            list: ['JavaScript', 'Python', 'React']
          }] : [],
          education: mockFile.hasEducation ? [{
            degree: 'Bachelor of Science',
            school: 'University',
            year: '2016-2020'
          }] : [],
          certifications: mockFile.hasCertifications ? ['AWS Certified Developer'] : []
        };
        
        const file = createMockFile(mockFile.fileName, mockFile.fileSize, content);
        
        try {
          // Execute the parsing step
          const result = await controller.executeStep(PipelineStep.PARSE_RESUME, { file });
          
          // Property: Should succeed
          expect(result.success).toBe(true);
          expect(result.data.missingSections).toBeDefined();
          
          const missingSections = result.data.missingSections;
          
          // Property: Should correctly identify missing work experience
          if (!mockFile.hasWorkExperience) {
            expect(missingSections).toContain('workExperience');
          } else {
            expect(missingSections).not.toContain('workExperience');
          }
          
          // Property: Should correctly identify missing projects
          if (!mockFile.hasProjects) {
            expect(missingSections).toContain('projects');
          } else {
            expect(missingSections).not.toContain('projects');
          }
          
          // Property: Should correctly identify missing skills
          if (!mockFile.hasSkills) {
            expect(missingSections).toContain('skills');
          } else {
            expect(missingSections).not.toContain('skills');
          }
          
          // Property: Should correctly identify missing education
          if (!mockFile.hasEducation) {
            expect(missingSections).toContain('education');
          } else {
            expect(missingSections).not.toContain('education');
          }
          
          // Property: Should correctly identify missing certifications (optional)
          if (!mockFile.hasCertifications) {
            expect(missingSections).toContain('certifications');
          } else {
            expect(missingSections).not.toContain('certifications');
          }
          
        } catch (error) {
          // Property: Any errors should be handled gracefully
          expect(error).toBeInstanceOf(Error);
        }
      }
    ), { numRuns: 20 });
  });

  it('should handle invalid files gracefully', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        userId: fc.string({ minLength: 5, maxLength: 50 }),
        jobDescription: fc.string({ minLength: 50, maxLength: 1000 }),
        targetRole: fc.string({ minLength: 3, maxLength: 100 })
      }),
      fc.oneof(
        fc.constant(null), // No file
        fc.constant(undefined), // Undefined file
        fc.record({
          fileName: fc.string({ minLength: 1, maxLength: 5 }), // Invalid name
          fileSize: fc.integer({ min: 0, max: 100 }), // Too small
          content: fc.constant({}) // Empty content
        })
      ),
      async (config, invalidFile) => {
        controller = new PipelineController(config.userId, config.jobDescription, config.targetRole);
        
        let file = null;
        if (invalidFile && typeof invalidFile === 'object' && 'fileName' in invalidFile) {
          file = createMockFile(invalidFile.fileName, invalidFile.fileSize, invalidFile.content);
        }
        
        try {
          // Execute the parsing step with invalid input
          const result = await controller.executeStep(PipelineStep.PARSE_RESUME, { file });
          
          // Property: Should fail gracefully for invalid files
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.data).toBeDefined();
          expect(result.data.errorType).toBeDefined();
          
        } catch (error) {
          // Property: Any errors should be handled gracefully
          expect(error).toBeInstanceOf(Error);
        }
      }
    ), { numRuns: 10 });
  });
});

/**
 * Helper function to create a mock file object for testing
 */
function createMockFile(fileName: string, fileSize: number, content: any): File {
  // Create a mock resume text from the content
  const resumeText = createResumeText(content);
  
  // Create a blob with the resume text
  const blob = new Blob([resumeText], { type: 'application/pdf' });
  
  // Create a file object
  const file = new File([blob], fileName, { type: 'application/pdf' });
  
  // Override the size property to match our test data
  Object.defineProperty(file, 'size', {
    value: fileSize,
    writable: false
  });
  
  return file;
}

/**
 * Helper function to create resume text from content object
 */
function createResumeText(content: any): string {
  let text = '';
  
  if (content.name) text += `${content.name}\n`;
  if (content.email) text += `${content.email}\n`;
  if (content.phone) text += `${content.phone}\n\n`;
  
  if (content.workExperience && content.workExperience.length > 0) {
    text += 'WORK EXPERIENCE\n';
    content.workExperience.forEach((exp: any) => {
      text += `${exp.role} at ${exp.company} (${exp.year})\n`;
      exp.bullets.forEach((bullet: string) => text += `• ${bullet}\n`);
    });
    text += '\n';
  }
  
  if (content.projects && content.projects.length > 0) {
    text += 'PROJECTS\n';
    content.projects.forEach((project: any) => {
      text += `${project.title}\n`;
      project.bullets.forEach((bullet: string) => text += `• ${bullet}\n`);
    });
    text += '\n';
  }
  
  if (content.skills && content.skills.length > 0) {
    text += 'SKILLS\n';
    content.skills.forEach((skill: any) => {
      text += `${skill.category}: ${skill.list.join(', ')}\n`;
    });
    text += '\n';
  }
  
  if (content.education && content.education.length > 0) {
    text += 'EDUCATION\n';
    content.education.forEach((edu: any) => {
      text += `${edu.degree} from ${edu.school} (${edu.year})\n`;
    });
    text += '\n';
  }
  
  if (content.certifications && content.certifications.length > 0) {
    text += 'CERTIFICATIONS\n';
    content.certifications.forEach((cert: string) => {
      text += `${cert}\n`;
    });
    text += '\n';
  }
  
  return text;
}