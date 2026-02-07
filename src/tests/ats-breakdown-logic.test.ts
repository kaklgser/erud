/**
 * Test for corrected ATS breakdown logic
 * Verifies that Education and Certifications are separate categories
 * and that fresher role detection works correctly
 */

import { EnhancedScoringService } from '../services/enhancedScoringService';
import { ResumeData } from '../types/resume';

describe('ATS Breakdown Logic', () => {
  const mockResumeData: ResumeData = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    linkedin: '',
    github: '',
    location: 'New York, NY',
    summary: 'Software developer with experience in React and Node.js',
    careerObjective: '',
    education: [{
      degree: 'Bachelor of Computer Science',
      school: 'University of Technology',
      year: '2023',
      cgpa: '3.8',
      location: 'New York'
    }],
    workExperience: [],
    projects: [{
      title: 'E-commerce Website',
      bullets: ['Built with React and Node.js', 'Implemented payment integration'],
      githubUrl: 'https://github.com/johndoe/ecommerce'
    }],
    skills: [{
      category: 'Programming Languages',
      count: 3,
      list: ['JavaScript', 'Python', 'Java']
    }],
    certifications: [{
      title: 'AWS Cloud Practitioner',
      description: 'Basic cloud computing certification'
    }],
    additionalSections: [],
    achievements: []
  };

  const fresherJobDescription = `
    We are looking for a fresh graduate or entry-level software developer.
    No prior experience required. Recent graduates are encouraged to apply.
    Skills: JavaScript, React, Node.js
  `;

  const experiencedJobDescription = `
    We are looking for a senior software developer with 3+ years of experience.
    Must have experience with React, Node.js, and cloud technologies.
    Skills: JavaScript, React, Node.js, AWS
  `;

  it('should separate Education and Certifications into different categories', async () => {
    const input = {
      resumeText: 'Sample resume text with education and certifications',
      resumeData: mockResumeData,
      jobDescription: experiencedJobDescription,
      extractionMode: 'comprehensive' as const,
    };

    const result = await EnhancedScoringService.calculateScore(input);

    // Verify that Education and Certifications are separate tiers
    expect(result.tier_scores).toHaveProperty('education');
    expect(result.tier_scores).toHaveProperty('certifications');
    expect(result.tier_scores).not.toHaveProperty('education_certifications');

    // Verify they have different tier names
    expect(result.tier_scores.education.tier_name).toBe('Education');
    expect(result.tier_scores.certifications.tier_name).toBe('Certifications');

    // Verify they have separate weights
    expect(result.tier_scores.education.weight).toBe(6);
    expect(result.tier_scores.certifications.weight).toBe(4);
  });

  it('should detect fresher role and adjust experience evaluation', async () => {
    const input = {
      resumeText: 'Fresh graduate resume with no work experience',
      resumeData: mockResumeData,
      jobDescription: fresherJobDescription,
      extractionMode: 'comprehensive' as const,
    };

    const result = await EnhancedScoringService.calculateScore(input);

    // Check that breakdown shows appropriate messaging for fresher roles
    const experienceBreakdown = result.breakdown?.find(item => item.key === 'experience');
    expect(experienceBreakdown).toBeDefined();
    
    // For fresher roles, experience should have reduced weight
    expect(experienceBreakdown?.weight_pct).toBeLessThan(15);
    
    // Should show appropriate message for freshers
    if (experienceBreakdown?.details) {
      expect(experienceBreakdown.details).toContain('not required for fresher roles');
    }
  });

  it('should prioritize education and skills for fresher roles', async () => {
    const input = {
      resumeText: 'Fresh graduate resume',
      resumeData: mockResumeData,
      jobDescription: fresherJobDescription,
      extractionMode: 'comprehensive' as const,
    };

    const result = await EnhancedScoringService.calculateScore(input);

    const breakdown = result.breakdown || [];
    
    // Find education, skills, and experience in breakdown
    const educationItem = breakdown.find(item => item.key === 'education');
    const skillsItem = breakdown.find(item => item.key === 'skills_keywords');
    const experienceItem = breakdown.find(item => item.key === 'experience');

    // For fresher roles, education and skills should have higher weights than experience
    expect(educationItem?.weight_pct).toBeGreaterThan(experienceItem?.weight_pct || 0);
    expect(skillsItem?.weight_pct).toBeGreaterThan(experienceItem?.weight_pct || 0);
  });

  it('should prioritize experience for experienced roles', async () => {
    const experiencedResumeData = {
      ...mockResumeData,
      workExperience: [{
        role: 'Software Developer',
        company: 'Tech Corp',
        year: '2020-2023',
        bullets: ['Developed web applications', 'Led team of 3 developers']
      }]
    };

    const input = {
      resumeText: 'Experienced developer resume',
      resumeData: experiencedResumeData,
      jobDescription: experiencedJobDescription,
      extractionMode: 'comprehensive' as const,
    };

    const result = await EnhancedScoringService.calculateScore(input);

    const breakdown = result.breakdown || [];
    
    // Find experience, education, and skills in breakdown
    const experienceItem = breakdown.find(item => item.key === 'experience');
    const educationItem = breakdown.find(item => item.key === 'education');
    const skillsItem = breakdown.find(item => item.key === 'skills_keywords');

    // For experienced roles, experience should have high weight
    expect(experienceItem?.weight_pct).toBeGreaterThanOrEqual(20);
    
    // Education should have lower weight for experienced roles
    expect(educationItem?.weight_pct).toBeLessThan(experienceItem?.weight_pct || 0);
  });

  it('should show all sections as separate categories', async () => {
    const input = {
      resumeText: 'Complete resume text',
      resumeData: mockResumeData,
      jobDescription: experiencedJobDescription,
      extractionMode: 'comprehensive' as const,
    };

    const result = await EnhancedScoringService.calculateScore(input);

    const breakdown = result.breakdown || [];
    const sectionKeys = breakdown.map(item => item.key);

    // Verify all expected sections are present as separate items
    expect(sectionKeys).toContain('basic_structure');
    expect(sectionKeys).toContain('content_structure');
    expect(sectionKeys).toContain('experience');
    expect(sectionKeys).toContain('education');
    expect(sectionKeys).toContain('certifications');
    expect(sectionKeys).toContain('skills_keywords');
    expect(sectionKeys).toContain('projects');

    // Verify no combined sections exist
    expect(sectionKeys).not.toContain('education_certifications');
    expect(sectionKeys).not.toContain('experience_achievements');
    expect(sectionKeys).not.toContain('content_structure_formatting');
  });
});