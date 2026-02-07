/**
 * Test for conditional experience evaluation logic
 * Verifies that experience evaluation is skipped for fresher roles
 */

import { EnhancedScoringService } from '../services/enhancedScoringService';
import { ResumeData } from '../types/resume';

describe('Conditional Experience Evaluation', () => {
  const mockFresherResumeData: ResumeData = {
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '123-456-7890',
    linkedin: '',
    github: '',
    location: 'San Francisco, CA',
    summary: 'Recent computer science graduate seeking entry-level position',
    careerObjective: '',
    education: [{
      degree: 'Bachelor of Computer Science',
      school: 'University of California',
      year: '2024',
      cgpa: '3.7',
      location: 'Berkeley'
    }],
    workExperience: [], // No work experience (fresher)
    projects: [{
      title: 'Web Application Project',
      bullets: ['Built with React and Node.js', 'Implemented user authentication'],
      githubUrl: 'https://github.com/jane/webapp'
    }],
    skills: [{
      category: 'Programming Languages',
      count: 4,
      list: ['JavaScript', 'Python', 'Java', 'C++']
    }],
    certifications: [],
    additionalSections: [],
    achievements: []
  };

  const fresherJobDescription = `
    Software Engineer - Entry Level (0-1 years experience)
    
    We are looking for fresh graduates or candidates with 0-1 years of experience.
    Freshers are welcome to apply.
    
    Required Skills:
    - JavaScript, React, Node.js
    - Strong programming fundamentals
    - Good communication skills
    
    Education: Bachelor's degree in Computer Science or related field
  `;

  const experiencedJobDescription = `
    Senior Software Engineer (3+ years experience)
    
    We are looking for experienced software engineers with 3+ years of industry experience.
    Must have proven track record in software development.
    
    Required Skills:
    - JavaScript, React, Node.js
    - 3+ years of professional experience
    - Leadership experience preferred
  `;

  it('should skip experience evaluation for fresher roles', async () => {
    const input = {
      resumeText: 'Fresh graduate resume with no work experience',
      resumeData: mockFresherResumeData,
      jobDescription: fresherJobDescription,
      extractionMode: 'TEXT' as const,
    };

    const result = await EnhancedScoringService.calculateScore(input);

    // Check that experience tier has reduced weight for fresher roles
    expect(result.tier_scores.experience.weight).toBe(8); // Reduced from 25 to 8

    // Check that skills and education have higher weights for freshers
    expect(result.tier_scores.skills_keywords.weight).toBe(28); // Increased from 25 to 28
    expect(result.tier_scores.education.weight).toBe(15); // Increased from 6 to 15

    // Check that experience score is not penalized heavily
    expect(result.tier_scores.experience.percentage).toBeGreaterThanOrEqual(70);

    console.log('✅ Fresher role detected - experience evaluation skipped');
    console.log('✅ Weights redistributed correctly for fresher role');
  });

  it('should evaluate experience normally for experienced roles', async () => {
    const experiencedResumeData = {
      ...mockFresherResumeData,
      workExperience: [{
        role: 'Software Developer',
        company: 'Tech Company',
        year: '2021-2024',
        bullets: [
          'Developed web applications using React and Node.js',
          'Improved system performance by 30%',
          'Led team of 3 junior developers'
        ]
      }]
    };

    const input = {
      resumeText: 'Experienced developer resume with 3 years experience',
      resumeData: experiencedResumeData,
      jobDescription: experiencedJobDescription,
      extractionMode: 'TEXT' as const,
    };

    const result = await EnhancedScoringService.calculateScore(input);

    // Check that experience tier has full weight for experienced roles
    expect(result.tier_scores.experience.weight).toBe(25); // Standard weight

    // Check that skills and education have standard weights
    expect(result.tier_scores.skills_keywords.weight).toBe(25); // Standard weight
    expect(result.tier_scores.education.weight).toBe(6); // Standard weight for experienced

    console.log('✅ Experienced role detected - full experience evaluation performed');
    console.log('✅ Standard weights applied for experienced role');
  });

  it('should show appropriate breakdown messaging for fresher roles', async () => {
    const input = {
      resumeText: 'Fresh graduate resume',
      resumeData: mockFresherResumeData,
      jobDescription: fresherJobDescription,
      extractionMode: 'TEXT' as const,
    };

    const result = await EnhancedScoringService.calculateScore(input);

    // Check breakdown for appropriate messaging
    const breakdown = result.breakdown || [];
    const experienceBreakdown = breakdown.find(item => item.key === 'experience');

    expect(experienceBreakdown).toBeDefined();
    expect(experienceBreakdown?.roleType).toBe('fresher');
    
    // Should show reduced weight
    expect(experienceBreakdown?.weight_pct).toBe(8);

    console.log('✅ Breakdown shows correct messaging for fresher roles');
    console.log(`Experience weight: ${experienceBreakdown?.weight_pct}%`);
  });

  it('should detect fresher role from JD keywords correctly', async () => {
    const testCases = [
      {
        jd: 'Entry-level software engineer position. Freshers welcome.',
        expected: true,
        description: 'Explicit fresher keywords'
      },
      {
        jd: 'Software engineer with 0-1 years experience required.',
        expected: true,
        description: '0-1 years experience range'
      },
      {
        jd: 'Senior software engineer with 5+ years experience required.',
        expected: false,
        description: '5+ years experience requirement'
      },
      {
        jd: 'Software engineer position. Recent graduates encouraged to apply.',
        expected: true,
        description: 'Recent graduate encouragement'
      }
    ];

    for (const testCase of testCases) {
      const input = {
        resumeText: 'Test resume',
        resumeData: mockFresherResumeData,
        jobDescription: testCase.jd,
        extractionMode: 'TEXT' as const,
      };

      const result = await EnhancedScoringService.calculateScore(input);
      const isFresherDetected = result.tier_scores.experience.weight === 8;

      expect(isFresherDetected).toBe(testCase.expected);
      console.log(`✅ ${testCase.description}: ${isFresherDetected ? 'Fresher' : 'Experienced'} role detected`);
    }
  });
});