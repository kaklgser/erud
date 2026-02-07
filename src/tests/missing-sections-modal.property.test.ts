// src/tests/missing-sections-modal.property.test.ts
// Property-based tests for Missing Sections Modal functionality

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { PipelineController } from '../services/pipelineController';
import { PipelineStep } from '../types/pipeline';

describe('Missing Sections Modal Properties', () => {
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
   * **Feature: comprehensive-resume-optimization-pipeline, Property 5: Required section enforcement**
   * Required sections (work experience, projects, skills, education) cannot be skipped
   */
  it('should enforce required sections and prevent skipping', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        userId: fc.string({ minLength: 5, maxLength: 50 }),
        jobDescription: fc.string({ minLength: 50, maxLength: 1000 }),
        targetRole: fc.string({ minLength: 3, maxLength: 100 })
      }),
      fc.record({
        name: fc.string({ minLength: 2, maxLength: 100 }),
        email: fc.emailAddress()
      }),
      async (config, basicResumeData) => {
        controller = new PipelineController(config.userId, config.jobDescription, config.targetRole);
        
        // Create incomplete resume data (missing required sections)
        const mockResumeData = {
          ...basicResumeData,
          phone: '+1234567890',
          linkedin: '',
          github: '',
          location: 'Test City, TS',
          summary: 'Professional summary',
          workExperience: [], // Empty required section
          projects: [], // Empty required section
          skills: [], // Empty required section
          education: [], // Empty required section
          certifications: [],
          parsedText: createMockResumeText(basicResumeData),
          parsingConfidence: 0.95,
          origin: 'test_mock'
        };
        
        // Save incomplete resume version and mock analysis results
        controller.saveResumeVersion(mockResumeData, ['Mock parsing completed']);
        controller.recordUserInput('analysis_results', {
          gapAnalysis: { beforeScore: { overall: 50 }, missingKeywords: [] },
          analysisType: 'jd_analysis'
        });
        
        try {
          // Execute the missing sections step without input (should return config)
          const result = await controller.executeStep(PipelineStep.MISSING_SECTIONS_MODAL, {});
          
          // Property: Should identify missing required sections
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.data.missingSections).toBeDefined();
          expect(Array.isArray(result.data.missingSections)).toBe(true);
          
          // Property: All required sections should be identified as missing
          const requiredSections = ['workExperience', 'projects', 'skills', 'education'];
          const missingSections = result.data.missingSections;
          
          requiredSections.forEach(section => {
            expect(missingSections).toContain(section);
          });
          
          // Property: Should require user input
          expect(result.userInputRequired).toBe(true);
          expect(result.data.requiresUserInput).toBe(true);
          
          // Property: Should provide suggested certifications if JD analysis
          if (result.data.analysisType === 'jd_analysis') {
            expect(result.data.suggestedCertifications).toBeDefined();
            expect(Array.isArray(result.data.suggestedCertifications)).toBe(true);
          }
          
          // Property: Next step should be project analysis
          expect(result.nextStep).toBe(PipelineStep.PROJECT_ANALYSIS);
          
        } catch (error) {
          // Property: Any errors should be handled gracefully
          expect(error).toBeInstanceOf(Error);
        }
      }
    ), { numRuns: 20 });
  });

  /**
   * **Feature: comprehensive-resume-optimization-pipeline, Property 6: Optional section flexibility**
   * Certifications section should be optional and skippable
   */
  it('should allow skipping certifications but enforce other sections', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        userId: fc.string({ minLength: 5, maxLength: 50 }),
        jobDescription: fc.string({ minLength: 50, maxLength: 1000 }),
        targetRole: fc.string({ minLength: 3, maxLength: 100 })
      }),
      fc.record({
        name: fc.string({ minLength: 2, maxLength: 100 }),
        email: fc.emailAddress(),
        workExperience: fc.array(fc.record({
          role: fc.string({ minLength: 3, maxLength: 50 }),
          company: fc.string({ minLength: 2, maxLength: 50 }),
          year: fc.string({ minLength: 4, maxLength: 20 }),
          bullets: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 3 })
        }), { minLength: 1, maxLength: 2 }),
        projects: fc.array(fc.record({
          title: fc.string({ minLength: 3, maxLength: 50 }),
          bullets: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 3 })
        }), { minLength: 1, maxLength: 2 }),
        skills: fc.array(fc.record({
          category: fc.string({ minLength: 3, maxLength: 30 }),
          list: fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
          count: fc.nat({ max: 5 })
        }), { minLength: 1, maxLength: 2 }),
        education: fc.array(fc.record({
          degree: fc.string({ minLength: 3, maxLength: 50 }),
          school: fc.string({ minLength: 3, maxLength: 50 }),
          year: fc.string({ minLength: 4, maxLength: 20 })
        }), { minLength: 1, maxLength: 2 })
      }),
      async (config, resumeDataWithoutCerts) => {
        controller = new PipelineController(config.userId, config.jobDescription, config.targetRole);
        
        // Create resume data missing only certifications
        const mockResumeData = {
          ...resumeDataWithoutCerts,
          phone: '+1234567890',
          linkedin: '',
          github: '',
          location: 'Test City, TS',
          summary: 'Professional summary',
          certifications: [], // Empty optional section
          parsedText: createMockResumeText(resumeDataWithoutCerts),
          parsingConfidence: 0.95,
          origin: 'test_mock'
        };
        
        // Save resume version and mock analysis results
        controller.saveResumeVersion(mockResumeData, ['Mock parsing completed']);
        controller.recordUserInput('analysis_results', {
          gapAnalysis: { beforeScore: { overall: 75 }, missingKeywords: [] },
          analysisType: 'jd_analysis'
        });
        
        try {
          // Execute the missing sections step
          const result = await controller.executeStep(PipelineStep.MISSING_SECTIONS_MODAL, {});
          
          // Property: Should identify only certifications as missing (if any)
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          
          const missingSections = result.data.missingSections || [];
          
          // Property: Required sections should not be in missing list
          const requiredSections = ['workExperience', 'projects', 'skills', 'education'];
          requiredSections.forEach(section => {
            expect(missingSections).not.toContain(section);
          });
          
          // Property: If certifications is missing, it should be the only missing section
          if (missingSections.length > 0) {
            expect(missingSections).toEqual(['certifications']);
          }
          
          // Property: If no missing sections, should skip this step
          if (missingSections.length === 0) {
            expect(result.data.skipped).toBe(true);
            expect(result.data.reason).toBe('No missing sections detected');
          }
          
        } catch (error) {
          // Property: Any errors should be handled gracefully
          expect(error).toBeInstanceOf(Error);
        }
      }
    ), { numRuns: 20 });
  });

  it('should validate missing sections data correctly', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        userId: fc.string({ minLength: 5, maxLength: 50 }),
        jobDescription: fc.string({ minLength: 50, maxLength: 1000 }),
        targetRole: fc.string({ minLength: 3, maxLength: 100 })
      }),
      fc.record({
        workExperience: fc.array(fc.record({
          role: fc.string({ minLength: 2, maxLength: 50 }),
          company: fc.string({ minLength: 2, maxLength: 50 }),
          year: fc.string({ minLength: 4, maxLength: 20 }),
          bullets: fc.array(fc.string({ minLength: 5, maxLength: 200 }), { minLength: 1, maxLength: 3 })
        }), { minLength: 1, maxLength: 2 }),
        projects: fc.array(fc.record({
          title: fc.string({ minLength: 3, maxLength: 50 }),
          bullets: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 3 })
        }), { minLength: 1, maxLength: 2 }),
        skills: fc.array(fc.record({
          category: fc.string({ minLength: 2, maxLength: 30 }),
          list: fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
          count: fc.nat({ max: 5 })
        }), { minLength: 1, maxLength: 2 }),
        education: fc.array(fc.record({
          degree: fc.string({ minLength: 2, maxLength: 50 }),
          school: fc.string({ minLength: 2, maxLength: 50 }),
          year: fc.string({ minLength: 4, maxLength: 20 })
        }), { minLength: 1, maxLength: 2 }),
        contactDetails: fc.record({
          email: fc.emailAddress(),
          phone: fc.string({ minLength: 10, maxLength: 15 }),
          linkedin: fc.string({ minLength: 0, maxLength: 100 }),
          github: fc.string({ minLength: 0, maxLength: 100 })
        })
      }),
      async (config, validMissingSectionsData) => {
        controller = new PipelineController(config.userId, config.jobDescription, config.targetRole);
        
        // Create incomplete resume data
        const incompleteResumeData = {
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
          linkedin: '',
          github: '',
          location: 'Test City, TS',
          summary: 'Professional summary',
          workExperience: [],
          projects: [],
          skills: [],
          education: [],
          certifications: [],
          parsedText: 'Test resume text',
          parsingConfidence: 0.95,
          origin: 'test_mock'
        };
        
        // Save incomplete resume version and mock analysis results
        controller.saveResumeVersion(incompleteResumeData, ['Mock parsing completed']);
        controller.recordUserInput('analysis_results', {
          gapAnalysis: { beforeScore: { overall: 50 }, missingKeywords: [] },
          analysisType: 'jd_analysis'
        });
        
        try {
          // Execute the missing sections step with valid data
          const result = await controller.executeStep(PipelineStep.MISSING_SECTIONS_MODAL, {
            missingSectionsData: validMissingSectionsData
          });
          
          // Property: Valid data should be accepted
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.data.updatedResumeData).toBeDefined();
          expect(result.data.changes).toBeDefined();
          expect(Array.isArray(result.data.changes)).toBe(true);
          
          // Property: Updated resume should contain merged data
          const updatedResume = result.data.updatedResumeData;
          
          if (validMissingSectionsData.workExperience) {
            expect(updatedResume.workExperience).toBeDefined();
            expect(Array.isArray(updatedResume.workExperience)).toBe(true);
            expect(updatedResume.workExperience.length).toBeGreaterThan(0);
          }
          
          if (validMissingSectionsData.projects) {
            expect(updatedResume.projects).toBeDefined();
            expect(Array.isArray(updatedResume.projects)).toBe(true);
            expect(updatedResume.projects.length).toBeGreaterThan(0);
          }
          
          if (validMissingSectionsData.skills) {
            expect(updatedResume.skills).toBeDefined();
            expect(Array.isArray(updatedResume.skills)).toBe(true);
            expect(updatedResume.skills.length).toBeGreaterThan(0);
          }
          
          if (validMissingSectionsData.education) {
            expect(updatedResume.education).toBeDefined();
            expect(Array.isArray(updatedResume.education)).toBe(true);
            expect(updatedResume.education.length).toBeGreaterThan(0);
          }
          
          if (validMissingSectionsData.contactDetails) {
            expect(updatedResume.email).toBeDefined();
            if (validMissingSectionsData.contactDetails.phone) {
              expect(updatedResume.phone).toBeDefined();
            }
          }
          
          // Property: Should proceed to next step
          expect(result.nextStep).toBe(PipelineStep.PROJECT_ANALYSIS);
          
        } catch (error) {
          // Property: Any errors should be handled gracefully
          expect(error).toBeInstanceOf(Error);
        }
      }
    ), { numRuns: 15 });
  });

  it('should handle invalid missing sections data appropriately', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        userId: fc.string({ minLength: 5, maxLength: 50 }),
        jobDescription: fc.string({ minLength: 50, maxLength: 1000 }),
        targetRole: fc.string({ minLength: 3, maxLength: 100 })
      }),
      fc.record({
        // Invalid data - too short or missing required fields
        workExperience: fc.array(fc.record({
          role: fc.string({ minLength: 0, maxLength: 1 }), // Too short
          company: fc.string({ minLength: 0, maxLength: 1 }), // Too short
          year: fc.string({ minLength: 0, maxLength: 3 }), // Too short
          bullets: fc.array(fc.string({ minLength: 0, maxLength: 5 }), { minLength: 0, maxLength: 1 })
        }), { minLength: 1, maxLength: 1 }),
        contactDetails: fc.record({
          email: fc.string({ minLength: 1, maxLength: 10 }), // Invalid email
          phone: fc.string({ minLength: 1, maxLength: 5 }) // Too short phone
        })
      }),
      async (config, invalidMissingSectionsData) => {
        controller = new PipelineController(config.userId, config.jobDescription, config.targetRole);
        
        // Create incomplete resume data
        const incompleteResumeData = {
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
          linkedin: '',
          github: '',
          location: 'Test City, TS',
          summary: 'Professional summary',
          workExperience: [],
          projects: [],
          skills: [],
          education: [],
          certifications: [],
          parsedText: 'Test resume text',
          parsingConfidence: 0.95,
          origin: 'test_mock'
        };
        
        // Save incomplete resume version and mock analysis results
        controller.saveResumeVersion(incompleteResumeData, ['Mock parsing completed']);
        controller.recordUserInput('analysis_results', {
          gapAnalysis: { beforeScore: { overall: 50 }, missingKeywords: [] },
          analysisType: 'jd_analysis'
        });
        
        try {
          // Execute the missing sections step with invalid data
          const result = await controller.executeStep(PipelineStep.MISSING_SECTIONS_MODAL, {
            missingSectionsData: invalidMissingSectionsData
          });
          
          // Property: Invalid data should be rejected
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error).toContain('validation failed');
          expect(result.data).toBeDefined();
          expect(result.data.validationErrors).toBeDefined();
          expect(Array.isArray(result.data.validationErrors)).toBe(true);
          expect(result.data.validationErrors.length).toBeGreaterThan(0);
          
          // Property: Should provide missing sections for retry
          expect(result.data.missingSections).toBeDefined();
          
        } catch (error) {
          // Property: Any errors should be handled gracefully
          expect(error).toBeInstanceOf(Error);
        }
      }
    ), { numRuns: 10 });
  });
});

/**
 * Helper function to create mock resume text from resume data
 */
function createMockResumeText(resumeData: any): string {
  let text = `${resumeData.name || 'Test User'}\n${resumeData.email || 'test@example.com'}\n\n`;
  
  if (resumeData.workExperience && resumeData.workExperience.length > 0) {
    text += 'WORK EXPERIENCE\n';
    resumeData.workExperience.forEach((exp: any) => {
      text += `${exp.role} at ${exp.company} (${exp.year})\n`;
      exp.bullets.forEach((bullet: string) => text += `• ${bullet}\n`);
    });
    text += '\n';
  }
  
  if (resumeData.projects && resumeData.projects.length > 0) {
    text += 'PROJECTS\n';
    resumeData.projects.forEach((project: any) => {
      text += `${project.title}\n`;
      project.bullets.forEach((bullet: string) => text += `• ${bullet}\n`);
    });
    text += '\n';
  }
  
  if (resumeData.skills && resumeData.skills.length > 0) {
    text += 'SKILLS\n';
    resumeData.skills.forEach((skill: any) => {
      text += `${skill.category}: ${skill.list.join(', ')}\n`;
    });
    text += '\n';
  }
  
  if (resumeData.education && resumeData.education.length > 0) {
    text += 'EDUCATION\n';
    resumeData.education.forEach((edu: any) => {
      text += `${edu.degree} from ${edu.school} (${edu.year})\n`;
    });
    text += '\n';
  }
  
  return text;
}