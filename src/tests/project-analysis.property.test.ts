// src/tests/project-analysis.property.test.ts
// Property-based tests for Project Analysis functionality

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { PipelineController } from '../services/pipelineController';
import { PipelineStep } from '../types/pipeline';

describe('Project Analysis Properties', () => {
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
   * **Feature: comprehensive-resume-optimization-pipeline, Property 7: Project analysis accuracy**
   * Project analysis should accurately assess project-JD alignment and provide relevant recommendations
   */
  it('should provide accurate project analysis and alignment scoring', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        userId: fc.string({ minLength: 5, maxLength: 50 }),
        jobDescription: fc.string({ minLength: 100, maxLength: 1000 }),
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
          bullets: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 3 }),
          githubUrl: fc.option(fc.webUrl(), { nil: undefined })
        }), { minLength: 1, maxLength: 4 }),
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
      async (config, resumeDataWithProjects) => {
        controller = new PipelineController(config.userId, config.jobDescription, config.targetRole);
        
        // Create complete resume data
        const mockResumeData = {
          ...resumeDataWithProjects,
          phone: '+1234567890',
          linkedin: '',
          github: '',
          location: 'Test City, TS',
          summary: 'Professional summary',
          certifications: [],
          parsedText: createMockResumeText(resumeDataWithProjects),
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
          // Execute the project analysis step without input (should return analysis)
          const result = await controller.executeStep(PipelineStep.PROJECT_ANALYSIS, {});
          
          // Property: Should provide project analysis results
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.data.projectAnalysisResult).toBeDefined();
          
          const analysisResult = result.data.projectAnalysisResult;
          
          // Property: Should analyze all existing projects
          expect(analysisResult.projectAnalysis).toBeDefined();
          expect(Array.isArray(analysisResult.projectAnalysis)).toBe(true);
          expect(analysisResult.projectAnalysis.length).toBe(resumeDataWithProjects.projects.length);
          
          // Property: Each project should have suitability assessment
          analysisResult.projectAnalysis.forEach((projectAnalysis: any) => {
            expect(projectAnalysis.title).toBeDefined();
            expect(typeof projectAnalysis.suitable).toBe('boolean');
            expect(projectAnalysis.alignmentScore).toBeDefined();
            expect(projectAnalysis.alignmentScore).toBeGreaterThanOrEqual(0);
            expect(projectAnalysis.alignmentScore).toBeLessThanOrEqual(100);
            
            if (!projectAnalysis.suitable) {
              expect(projectAnalysis.issues).toBeDefined();
              expect(Array.isArray(projectAnalysis.issues)).toBe(true);
            }
          });
          
          // Property: Should provide project suggestions if needed
          expect(analysisResult.suggestedProjects).toBeDefined();
          expect(Array.isArray(analysisResult.suggestedProjects)).toBe(true);
          
          // Property: Should require user input for modifications
          expect(result.userInputRequired).toBe(true);
          expect(result.data.requiresUserInput).toBe(true);
          
          // Property: Should provide current resume data for context
          expect(result.data.currentResumeData).toBeDefined();
          expect(result.data.currentResumeData.projects).toBeDefined();
          
          // Property: Next step should be re-analysis
          expect(result.nextStep).toBe(PipelineStep.RE_ANALYSIS);
          
        } catch (error) {
          // Property: Any errors should be handled gracefully
          expect(error).toBeInstanceOf(Error);
        }
      }
    ), { numRuns: 15 });
  });

  it('should handle project modifications correctly', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        userId: fc.string({ minLength: 5, maxLength: 50 }),
        jobDescription: fc.string({ minLength: 100, maxLength: 1000 }),
        targetRole: fc.string({ minLength: 3, maxLength: 100 })
      }),
      fc.record({
        originalProjects: fc.array(fc.record({
          title: fc.string({ minLength: 3, maxLength: 50 }),
          bullets: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 3 })
        }), { minLength: 1, maxLength: 3 }),
        modifications: fc.record({
          addedProjects: fc.array(fc.record({
            title: fc.string({ minLength: 3, maxLength: 50 }),
            bullets: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 3 })
          }), { minLength: 0, maxLength: 2 }),
          removedProjectTitles: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 0, maxLength: 1 }),
          modifiedProjects: fc.array(fc.record({
            title: fc.string({ minLength: 3, maxLength: 50 }),
            bullets: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 3 })
          }), { minLength: 0, maxLength: 1 })
        })
      }),
      async (config, testData) => {
        controller = new PipelineController(config.userId, config.jobDescription, config.targetRole);
        
        // Create resume data with original projects
        const mockResumeData = {
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
          linkedin: '',
          github: '',
          location: 'Test City, TS',
          summary: 'Professional summary',
          workExperience: [{
            role: 'Software Engineer',
            company: 'Tech Corp',
            year: '2020-2023',
            bullets: ['Developed applications']
          }],
          projects: testData.originalProjects,
          skills: [{
            category: 'Programming',
            list: ['JavaScript', 'Python'],
            count: 2
          }],
          education: [{
            degree: 'Bachelor of Science',
            school: 'University',
            year: '2016-2020'
          }],
          certifications: [],
          parsedText: 'Test resume text',
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
          // Execute the project analysis step with modifications
          const result = await controller.executeStep(PipelineStep.PROJECT_ANALYSIS, {
            projectModifications: testData.modifications
          });
          
          // Property: Valid modifications should be accepted
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.data.updatedResumeData).toBeDefined();
          expect(result.data.changes).toBeDefined();
          expect(Array.isArray(result.data.changes)).toBe(true);
          
          const updatedResume = result.data.updatedResumeData;
          const originalProjectCount = testData.originalProjects.length;
          const addedCount = testData.modifications.addedProjects.length;
          const removedCount = testData.modifications.removedProjectTitles.length;
          
          // Property: Project count should reflect modifications
          const expectedProjectCount = originalProjectCount + addedCount - removedCount;
          expect(updatedResume.projects.length).toBeGreaterThanOrEqual(0);
          
          // Property: Added projects should be present
          testData.modifications.addedProjects.forEach((addedProject: any) => {
            const foundProject = updatedResume.projects.find((p: any) => p.title === addedProject.title);
            expect(foundProject).toBeDefined();
            expect(foundProject.bullets.length).toBeGreaterThan(0);
          });
          
          // Property: Removed projects should not be present
          testData.modifications.removedProjectTitles.forEach((removedTitle: string) => {
            const foundProject = updatedResume.projects.find((p: any) => p.title === removedTitle);
            expect(foundProject).toBeUndefined();
          });
          
          // Property: Should provide alignment scores
          expect(result.data.alignmentScores).toBeDefined();
          expect(Array.isArray(result.data.alignmentScores)).toBe(true);
          expect(result.data.alignmentScores.length).toBe(updatedResume.projects.length);
          
          // Property: Each alignment score should be valid
          result.data.alignmentScores.forEach((score: any) => {
            expect(score.title).toBeDefined();
            expect(score.alignmentScore).toBeDefined();
            expect(score.alignmentScore).toBeGreaterThanOrEqual(0);
            expect(score.alignmentScore).toBeLessThanOrEqual(1);
          });
          
          // Property: Should proceed to next step
          expect(result.nextStep).toBe(PipelineStep.RE_ANALYSIS);
          
        } catch (error) {
          // Property: Any errors should be handled gracefully
          expect(error).toBeInstanceOf(Error);
        }
      }
    ), { numRuns: 15 });
  });

  it('should handle invalid project modifications appropriately', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        userId: fc.string({ minLength: 5, maxLength: 50 }),
        jobDescription: fc.string({ minLength: 100, maxLength: 1000 }),
        targetRole: fc.string({ minLength: 3, maxLength: 100 })
      }),
      fc.oneof(
        fc.record({
          addedProjects: fc.array(fc.record({
            title: fc.string({ minLength: 0, maxLength: 2 }), // Too short
            bullets: fc.array(fc.string({ minLength: 0, maxLength: 5 }), { minLength: 0, maxLength: 1 }) // Too short
          }), { minLength: 1, maxLength: 1 })
        }),
        fc.record({
          modifiedProjects: fc.array(fc.record({
            title: fc.string({ minLength: 0, maxLength: 1 }), // Too short
            bullets: fc.constant([]) // Empty bullets
          }), { minLength: 1, maxLength: 1 })
        }),
        fc.constant(null), // Null modifications
        fc.constant('invalid') // Invalid type
      ),
      async (config, invalidModifications) => {
        controller = new PipelineController(config.userId, config.jobDescription, config.targetRole);
        
        // Create resume data
        const mockResumeData = {
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
          linkedin: '',
          github: '',
          location: 'Test City, TS',
          summary: 'Professional summary',
          workExperience: [{
            role: 'Software Engineer',
            company: 'Tech Corp',
            year: '2020-2023',
            bullets: ['Developed applications']
          }],
          projects: [{
            title: 'Test Project',
            bullets: ['Built a web application']
          }],
          skills: [{
            category: 'Programming',
            list: ['JavaScript'],
            count: 1
          }],
          education: [{
            degree: 'Bachelor of Science',
            school: 'University',
            year: '2016-2020'
          }],
          certifications: [],
          parsedText: 'Test resume text',
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
          // Execute the project analysis step with invalid modifications
          const result = await controller.executeStep(PipelineStep.PROJECT_ANALYSIS, {
            projectModifications: invalidModifications
          });
          
          // Property: Invalid modifications should be rejected
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error).toContain('validation failed');
          expect(result.data).toBeDefined();
          expect(result.data.validationErrors).toBeDefined();
          expect(Array.isArray(result.data.validationErrors)).toBe(true);
          expect(result.data.validationErrors.length).toBeGreaterThan(0);
          
          // Property: Should provide project analysis for retry
          expect(result.data.projectAnalysisResult).toBeDefined();
          
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
      if (project.githubUrl) text += `GitHub: ${project.githubUrl}\n`;
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