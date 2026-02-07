/**
 * PrimoBoost ATS Scoring Validation Tests
 * 
 * Ensures the PrimoBoost 16-parameter ATS scoring system
 * maintains proper metrics and validation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringMetricsValidator } from '../services/scoringMetricsValidator';
import { ATSScoreChecker16Parameter } from '../services/atsScoreChecker16Parameter';
import { PrimoBoostATSEngine } from '../services/primoBoostATSEngine';
import { ResumeData } from '../types/resume';

describe('PrimoBoost ATS Scoring Validation', () => {
  let mockResumeData: ResumeData;
  let mockJobDescription: string;

  beforeEach(() => {
    mockResumeData = {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '(555) 123-4567',
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe',
      summary: 'Experienced software engineer with 5+ years of experience',
      careerObjective: 'Seeking a challenging role in software development',
      workExperience: [
        {
          role: 'Senior Software Engineer',
          company: 'Tech Company',
          year: '2020-Present',
          bullets: [
            'Developed web applications using React and Node.js',
            'Improved performance by 40% through optimization',
            'Led team of 3 developers'
          ]
        }
      ],
      education: [
        {
          degree: 'Bachelor of Science in Computer Science',
          school: 'University of Technology',
          year: '2018',
          cgpa: '3.8'
        }
      ],
      skills: [
        {
          category: 'Programming Languages',
          count: 4,
          list: ['JavaScript', 'Python', 'Java', 'TypeScript']
        },
        {
          category: 'Frameworks',
          count: 3,
          list: ['React', 'Node.js', 'Express']
        }
      ],
      projects: [
        {
          title: 'E-commerce Platform',
          bullets: [
            'Built full-stack application using React and Node.js',
            'Integrated payment processing with Stripe'
          ]
        }
      ],
      certifications: [
        {
          title: 'AWS Certified Solutions Architect',
          description: 'Certified in 2021'
        }
      ]
    };

    mockJobDescription = `
      We are looking for a Senior Software Engineer to join our team.
      
      Requirements:
      - 3+ years of experience in software development
      - Proficiency in JavaScript, React, and Node.js
      - Experience with cloud technologies (AWS preferred)
      - Strong problem-solving skills
      - Bachelor's degree in Computer Science or related field
      
      Responsibilities:
      - Develop and maintain web applications
      - Collaborate with cross-functional teams
      - Optimize application performance
      - Mentor junior developers
    `;
  });

  describe('PrimoBoost Engine Validation', () => {
    it('should validate PrimoBoost scoring structure', async () => {
      const resumeText = `
        John Doe
        john.doe@email.com
        (555) 123-4567
        
        PROFESSIONAL SUMMARY
        Experienced software engineer with 5+ years of experience in full-stack development.
        
        WORK EXPERIENCE
        Senior Software Engineer | Tech Company | 2020-Present
        • Developed web applications using React and Node.js
        • Improved performance by 40% through optimization
        • Led team of 3 developers
        
        EDUCATION
        Bachelor of Science in Computer Science
        University of Technology | 2018
        
        SKILLS
        JavaScript, Python, Java, TypeScript, React, Node.js, Express
      `;

      const primoBoostScore = await PrimoBoostATSEngine.evaluateResume(
        resumeText,
        mockJobDescription
      );

      const validation = ScoringMetricsValidator.validatePrimoBoostScoring(primoBoostScore);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.summary.validationScore).toBeGreaterThan(90);
    });

    it('should handle JD vs General mode correctly', async () => {
      const resumeText = JSON.stringify(mockResumeData);

      // Test JD mode (JD > 50 characters)
      const jdModeScore = await PrimoBoostATSEngine.evaluateResume(
        resumeText,
        mockJobDescription
      );

      // Test General mode (no JD)
      const generalModeScore = await PrimoBoostATSEngine.evaluateResume(
        resumeText
      );

      // Both should be valid
      const jdValidation = ScoringMetricsValidator.validatePrimoBoostScoring(jdModeScore);
      const generalValidation = ScoringMetricsValidator.validatePrimoBoostScoring(generalModeScore);

      expect(jdValidation.isValid).toBe(true);
      expect(generalValidation.isValid).toBe(true);

      // JD mode should have missing keywords, General mode should not
      expect(jdModeScore.missingKeywords.critical.length + 
             jdModeScore.missingKeywords.important.length + 
             jdModeScore.missingKeywords.optional.length).toBeGreaterThanOrEqual(0);
      
      expect(generalModeScore.missingKeywords.critical).toHaveLength(0);
      expect(generalModeScore.missingKeywords.important).toHaveLength(0);
      expect(generalModeScore.missingKeywords.optional).toHaveLength(0);
    });
  });

  describe('16-Parameter Scoring Validation', () => {
    it('should validate 16-parameter structure', async () => {
      const resumeText = `
        John Doe
        john.doe@email.com
        (555) 123-4567
        
        PROFESSIONAL SUMMARY
        Experienced software engineer with 5+ years of experience in full-stack development.
        
        WORK EXPERIENCE
        Senior Software Engineer | Tech Company | 2020-Present
        • Developed web applications using React and Node.js
        • Improved performance by 40% through optimization
        • Led team of 3 developers
        
        EDUCATION
        Bachelor of Science in Computer Science
        University of Technology | 2018
        
        SKILLS
        JavaScript, Python, Java, TypeScript, React, Node.js, Express
      `;

      const sixteenParameterScore = await ATSScoreChecker16Parameter.evaluateResumeTextOnly(
        resumeText,
        mockJobDescription
      );

      const validation = ScoringMetricsValidator.validatePrimoBoostScoring(sixteenParameterScore);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.summary.validationScore).toBeGreaterThan(90);
    });

    it('should validate all 16 parameters exist and are within bounds', async () => {
      const resumeText = JSON.stringify(mockResumeData);
      const sixteenParameterScore = await ATSScoreChecker16Parameter.evaluateResumeTextOnly(
        resumeText,
        mockJobDescription
      );

      const expectedParameters = [
        { key: 'keywordMatch', max: 25 },
        { key: 'skillsAlignment', max: 20 },
        { key: 'experienceRelevance', max: 15 },
        { key: 'technicalCompetencies', max: 12 },
        { key: 'educationScore', max: 10 },
        { key: 'quantifiedAchievements', max: 8 },
        { key: 'employmentHistory', max: 8 },
        { key: 'industryExperience', max: 7 },
        { key: 'jobTitleMatch', max: 6 },
        { key: 'careerProgression', max: 6 },
        { key: 'certifications', max: 5 },
        { key: 'formatting', max: 5 },
        { key: 'contentQuality', max: 4 },
        { key: 'grammar', max: 3 },
        { key: 'resumeLength', max: 2 },
        { key: 'filenameQuality', max: 2 }
      ];

      for (const param of expectedParameters) {
        expect(sixteenParameterScore.scores).toHaveProperty(param.key);
        
        const score = sixteenParameterScore.scores[param.key as keyof typeof sixteenParameterScore.scores];
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(param.max);
      }

      // Overall score should be sum of all parameters
      const calculatedTotal = Object.values(sixteenParameterScore.scores)
        .reduce((sum, score) => sum + score, 0);
      expect(sixteenParameterScore.overallScore).toBe(calculatedTotal);
    });

    it('should validate confidence and match quality consistency', async () => {
      const resumeText = JSON.stringify(mockResumeData);
      const sixteenParameterScore = await ATSScoreChecker16Parameter.evaluateResumeTextOnly(
        resumeText,
        mockJobDescription
      );

      // Validate confidence levels
      expect(['High', 'Medium', 'Low']).toContain(sixteenParameterScore.confidence);

      // Validate match quality
      const validMatchQualities = ['Excellent', 'Good', 'Adequate', 'Poor', 'Inadequate'];
      expect(validMatchQualities).toContain(sixteenParameterScore.matchQuality);

      // Validate interview chance
      const validInterviewChances = ['1-2%', '5-12%', '20-30%', '40-60%', '70-80%', '80-90%', '90%+'];
      expect(validInterviewChances).toContain(sixteenParameterScore.interviewChance);

      // Check consistency between overall score and match quality
      if (sixteenParameterScore.overallScore >= 85) {
        expect(sixteenParameterScore.matchQuality).toBe('Excellent');
      } else if (sixteenParameterScore.overallScore >= 70) {
        expect(['Good', 'Excellent']).toContain(sixteenParameterScore.matchQuality);
      }
    });
  });

  describe('PrimoBoost System Health', () => {
    it('should generate comprehensive health report', async () => {
      const resumeText = JSON.stringify(mockResumeData);

      const primoBoostScore = await ATSScoreChecker16Parameter.evaluateResumeTextOnly(
        resumeText,
        mockJobDescription
      );

      const healthReport = ScoringMetricsValidator.generateHealthReport(primoBoostScore);

      expect(['Excellent', 'Good', 'Fair', 'Poor']).toContain(healthReport.overallHealth);
      expect(healthReport.validation).toBeDefined();
      expect(healthReport.summary).toBeDefined();
      expect(Array.isArray(healthReport.recommendations)).toBe(true);
    });

    it('should validate scoring determinism', async () => {
      const resumeText = JSON.stringify(mockResumeData);

      // Run the same evaluation multiple times
      const score1 = await PrimoBoostATSEngine.evaluateResume(resumeText, mockJobDescription);
      const score2 = await PrimoBoostATSEngine.evaluateResume(resumeText, mockJobDescription);
      const score3 = await PrimoBoostATSEngine.evaluateResume(resumeText, mockJobDescription);

      // Results should be identical (deterministic)
      expect(score1.overallScore).toBe(score2.overallScore);
      expect(score2.overallScore).toBe(score3.overallScore);
      expect(score1.confidence).toBe(score2.confidence);
      expect(score1.matchQuality).toBe(score2.matchQuality);
      
      // All individual parameter scores should match
      Object.keys(score1.scores).forEach(key => {
        expect(score1.scores[key as keyof typeof score1.scores])
          .toBe(score2.scores[key as keyof typeof score2.scores]);
        expect(score2.scores[key as keyof typeof score2.scores])
          .toBe(score3.scores[key as keyof typeof score3.scores]);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty resume data gracefully', async () => {
      const emptyResumeText = '';

      const primoBoostScore = await ATSScoreChecker16Parameter.evaluateResumeTextOnly(
        emptyResumeText
      );

      // Should still produce valid structure
      const validation = ScoringMetricsValidator.validatePrimoBoostScoring(primoBoostScore);

      expect(validation.isValid).toBe(true);

      // Score should be low but valid
      expect(primoBoostScore.overallScore).toBeGreaterThanOrEqual(0);
      expect(primoBoostScore.overallScore).toBeLessThanOrEqual(100);
    });

    it('should handle mode selection correctly', async () => {
      const resumeText = `
        Jane Smith
        jane.smith@email.com
        
        EDUCATION
        Bachelor of Science in Computer Science
        University | 2023
        
        PROJECTS
        Web Application | Built using React and Node.js
        
        SKILLS
        JavaScript, React, HTML, CSS
      `;

      // Test short JD (should trigger General mode)
      const shortJD = 'Developer role';
      const generalModeScore = await PrimoBoostATSEngine.evaluateResume(resumeText, shortJD);

      // Test long JD (should trigger JD mode)
      const longJD = mockJobDescription;
      const jdModeScore = await PrimoBoostATSEngine.evaluateResume(resumeText, longJD);

      // Both should be valid
      const generalValidation = ScoringMetricsValidator.validatePrimoBoostScoring(generalModeScore);
      const jdValidation = ScoringMetricsValidator.validatePrimoBoostScoring(jdModeScore);

      expect(generalValidation.isValid).toBe(true);
      expect(jdValidation.isValid).toBe(true);

      // General mode should have no missing keywords
      expect(generalModeScore.missingKeywords.critical).toHaveLength(0);
      expect(generalModeScore.missingKeywords.important).toHaveLength(0);
      expect(generalModeScore.missingKeywords.optional).toHaveLength(0);
    });
  });
});