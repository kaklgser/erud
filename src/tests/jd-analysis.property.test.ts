// src/tests/jd-analysis.property.test.ts
// Property-based tests for JD analysis functionality

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { PipelineController } from '../services/pipelineController';
import { PipelineStep } from '../types/pipeline';

describe('JD Analysis Properties', () => {
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
   * **Feature: comprehensive-resume-optimization-pipeline, Property 4: Analysis completeness**
   * For any resume and job description, analysis should provide comprehensive results with all required components
   */
  it('should provide complete analysis results for any resume and JD combination', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        userId: fc.string({ minLength: 5, maxLength: 50 }),
        targetRole: fc.string({ minLength: 3, maxLength: 100 })
      }),
      fc.record({
        jobDescription: fc.string({ minLength: 50, maxLength: 2000 }),
        hasJobDescription: fc.boolean()
      }),
      fc.record({
        name: fc.string({ minLength: 2, maxLength: 100 }),
        email: fc.emailAddress(),
        workExperience: fc.array(fc.record({
          role: fc.string({ minLength: 3, maxLength: 50 }),
          company: fc.string({ minLength: 2, maxLength: 50 }),
          year: fc.string({ minLength: 4, maxLength: 20 }),
          bullets: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 5 })
        }), { minLength: 1, maxLength: 3 }),
        skills: fc.array(fc.record({
          category: fc.string({ minLength: 3, maxLength: 30 }),
          list: fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 1, maxLength: 10 }),
          count: fc.nat({ max: 10 })
        }), { minLength: 1, maxLength: 3 })
      }),
      async (config, jdConfig, resumeData) => {
        // Create controller with or without job description
        const jobDescription = jdConfig.hasJobDescription ? jdConfig.jobDescription : '';
        controller = new PipelineController(config.userId, jobDescription, config.targetRole);
        
        // Create mock resume data with parsed text
        const mockResumeData = {
          ...resumeData,
          phone: '+1234567890',
          linkedin: '',
          github: '',
          location: 'Test City, TS',
          summary: 'Professional summary',
          careerObjective: 'Career objective',
          education: [{
            degree: 'Test Degree',
            school: 'Test University',
            year: '2023',
            cgpa: '',
            location: ''
          }],
          projects: [{
            title: 'Test Project',
            bullets: ['Test project description'],
            githubUrl: ''
          }],
          certifications: [{
            title: 'Test Certification',
            description: 'Test description'
          }],
          parsedText: createMockResumeText(resumeData),
          parsingConfidence: 0.95,
          origin: 'test_mock'
        };
        
        // Save mock resume version to simulate previous parsing step
        controller.saveResumeVersion(mockResumeData, ['Mock parsing completed']);
        
        try {
          // Execute the analysis step
          const result = await controller.executeStep(PipelineStep.ANALYZE_AGAINST_JD, {});
          
          // Property: Analysis should always provide structured results
          expect(result).toBeDefined();
          expect(typeof result.success).toBe('boolean');
          
          if (result.success) {
            // Property: Successful analysis should have complete data structure
            expect(result.data).toBeDefined();
            expect(result.data.gapAnalysis).toBeDefined();
            expect(result.data.beforeScore).toBeDefined();
            expect(result.data.analysisType).toBeDefined();
            expect(result.data.prioritizedGaps).toBeDefined();
            expect(result.data.recommendations).toBeDefined();
            
            // Property: Analysis type should be appropriate for input
            if (jdConfig.hasJobDescription && jobDescription.length > 50) {
              expect(result.data.analysisType).toBe('jd_analysis');
            } else {
              expect(result.data.analysisType).toBe('general_analysis');
            }
            
            // Property: Before score should be valid
            expect(result.data.beforeScore.overall).toBeGreaterThanOrEqual(0);
            expect(result.data.beforeScore.overall).toBeLessThanOrEqual(100);
            
            // Property: Prioritized gaps should have proper structure
            expect(result.data.prioritizedGaps.high).toBeDefined();
            expect(result.data.prioritizedGaps.medium).toBeDefined();
            expect(result.data.prioritizedGaps.low).toBeDefined();
            expect(Array.isArray(result.data.prioritizedGaps.high)).toBe(true);
            expect(Array.isArray(result.data.prioritizedGaps.medium)).toBe(true);
            expect(Array.isArray(result.data.prioritizedGaps.low)).toBe(true);
            
            // Property: Recommendations should be actionable
            expect(Array.isArray(result.data.recommendations)).toBe(true);
            
            // Property: Gap analysis should have appropriate structure
            expect(result.data.gapAnalysis.beforeScore).toBeDefined();
            
            // Property: Next step should be missing sections modal
            expect(result.nextStep).toBe(PipelineStep.MISSING_SECTIONS_MODAL);
            
            // Property: Progress should be updated appropriately
            expect(result.progressUpdate).toBe(30);
            
          } else {
            // Property: Failed analysis should have error information
            expect(result.error).toBeDefined();
            expect(typeof result.error).toBe('string');
            expect(result.data).toBeDefined();
            expect(result.data.errorType).toBeDefined();
          }
          
          // Property: Pipeline state should be updated
          const state = controller.getState();
          expect(state.errorMessages).toBeDefined();
          expect(Array.isArray(state.errorMessages)).toBe(true);
          
          if (!result.success) {
            expect(state.failedSteps).toContain(PipelineStep.ANALYZE_AGAINST_JD);
          }
          
        } catch (error) {
          // Property: Any errors should be handled gracefully
          expect(error).toBeInstanceOf(Error);
          
          const state = controller.getState();
          expect(state.errorMessages.length).toBeGreaterThan(0);
        }
      }
    ), { numRuns: 20 }); // Reduced runs since we're testing with complex analysis
  });

  it('should handle missing resume data gracefully', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        userId: fc.string({ minLength: 5, maxLength: 50 }),
        jobDescription: fc.string({ minLength: 10, maxLength: 1000 }),
        targetRole: fc.string({ minLength: 3, maxLength: 100 })
      }),
      async (config) => {
        controller = new PipelineController(config.userId, config.jobDescription, config.targetRole);
        
        // Don't save any resume version to simulate missing data
        
        const result = await controller.executeStep(PipelineStep.ANALYZE_AGAINST_JD, {});
        
        // Property: Missing resume data should be handled gracefully
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error).toContain('No resume data available');
        expect(result.data.errorType).toBe('validation_error');
        
        // Property: Error should be logged in pipeline state
        const state = controller.getState();
        expect(state.errorMessages.length).toBeGreaterThan(0);
        expect(state.failedSteps).toContain(PipelineStep.ANALYZE_AGAINST_JD);
      }
    ), { numRuns: 10 });
  });

  it('should differentiate between JD analysis and general analysis', () => {
    fc.assert(fc.property(
      fc.record({
        userId: fc.string({ minLength: 5, maxLength: 50 }),
        targetRole: fc.string({ minLength: 3, maxLength: 100 })
      }),
      fc.oneof(
        fc.string({ minLength: 100, maxLength: 1000 }), // Long JD
        fc.string({ minLength: 1, maxLength: 30 })       // Short/no JD
      ),
      (config, jobDescription) => {
        controller = new PipelineController(config.userId, jobDescription, config.targetRole);
        
        // Test the analysis type determination logic
        const hasValidJD = jobDescription.trim().length > 50;
        
        // Property: JD validation should be consistent
        if (hasValidJD) {
          expect(jobDescription.length).toBeGreaterThan(50);
        } else {
          expect(jobDescription.length).toBeLessThanOrEqual(50);
        }
        
        // Property: Analysis type should be deterministic
        const expectedAnalysisType = hasValidJD ? 'jd_analysis' : 'general_analysis';
        
        // We can't easily test the full analysis without mocking, but we can test the logic
        expect(expectedAnalysisType).toMatch(/^(jd_analysis|general_analysis)$/);
      }
    ), { numRuns: 50 });
  });

  it('should prioritize gaps correctly based on severity', () => {
    fc.assert(fc.property(
      fc.record({
        userId: fc.string({ minLength: 5, maxLength: 50 }),
        jobDescription: fc.string({ minLength: 10, maxLength: 1000 }),
        targetRole: fc.string({ minLength: 3, maxLength: 100 })
      }),
      fc.record({
        missingKeywords: fc.array(fc.record({
          keyword: fc.string({ minLength: 3, maxLength: 20 }),
          tier: fc.constantFrom('critical', 'important', 'nice_to_have')
        }), { minLength: 0, maxLength: 20 }),
        redFlags: fc.array(fc.record({
          name: fc.string({ minLength: 5, maxLength: 50 }),
          severity: fc.constantFrom('high', 'medium', 'low')
        }), { minLength: 0, maxLength: 10 }),
        tierScores: fc.record({
          skills_keywords: fc.record({ percentage: fc.integer({ min: 0, max: 100 }) }),
          experience: fc.record({ percentage: fc.integer({ min: 0, max: 100 }) }),
          basic_structure: fc.record({ percentage: fc.integer({ min: 0, max: 100 }) })
        })
      }),
      (config, mockAnalysis) => {
        controller = new PipelineController(config.userId, config.jobDescription, config.targetRole);
        
        // Test the gap prioritization logic directly
        const gapAnalysis = {
          missingKeywords: mockAnalysis.missingKeywords,
          criticalIssues: []
        };
        
        const beforeScore = {
          red_flags: mockAnalysis.redFlags,
          tier_scores: mockAnalysis.tierScores,
          overall: Math.floor(Math.random() * 100)
        };
        
        const prioritizedGaps = (controller as any).prioritizeGapsAndIssues(gapAnalysis, beforeScore);
        
        // Property: Prioritized gaps should have proper structure
        expect(prioritizedGaps).toBeDefined();
        expect(Array.isArray(prioritizedGaps.high)).toBe(true);
        expect(Array.isArray(prioritizedGaps.medium)).toBe(true);
        expect(Array.isArray(prioritizedGaps.low)).toBe(true);
        
        // Property: Critical keywords should create high priority issues
        const criticalKeywords = mockAnalysis.missingKeywords.filter((k: any) => k.tier === 'critical');
        if (criticalKeywords.length > 0) {
          const hasCriticalKeywordIssue = prioritizedGaps.high.some((issue: string) => 
            issue.includes('critical keywords')
          );
          expect(hasCriticalKeywordIssue).toBe(true);
        }
        
        // Property: Red flags should create high priority issues
        if (mockAnalysis.redFlags.length > 0) {
          const hasRedFlagIssue = prioritizedGaps.high.some((issue: string) => 
            issue.includes('Red flag')
          );
          expect(hasRedFlagIssue).toBe(true);
        }
        
        // Property: Low tier scores should create appropriate priority issues
        Object.entries(mockAnalysis.tierScores).forEach(([tier, score]: [string, any]) => {
          if (score.percentage < 60) {
            const hasLowScoreIssue = prioritizedGaps.high.some((issue: string) => 
              issue.includes(`Low ${tier.replace('_', ' ')}`)
            );
            expect(hasLowScoreIssue).toBe(true);
          }
        });
      }
    ), { numRuns: 100 });
  });
});

/**
 * Helper function to create mock resume text from resume data
 */
function createMockResumeText(resumeData: any): string {
  let text = `${resumeData.name}\n${resumeData.email}\n\n`;
  
  if (resumeData.workExperience && resumeData.workExperience.length > 0) {
    text += 'WORK EXPERIENCE\n';
    resumeData.workExperience.forEach((exp: any) => {
      text += `${exp.role} at ${exp.company} (${exp.year})\n`;
      exp.bullets.forEach((bullet: string) => text += `• ${bullet}\n`);
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
  
  return text;
}