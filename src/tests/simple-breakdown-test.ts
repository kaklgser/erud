/**
 * Simple test to verify the corrected ATS breakdown logic works
 */

import { EnhancedScoringService } from '../services/enhancedScoringService';

describe('Simple ATS Breakdown Test', () => {
  it('should have separate education and certifications tiers', async () => {
    const input = {
      resumeText: 'John Doe, Software Developer. Education: BS Computer Science. Certifications: AWS Cloud Practitioner.',
      extractionMode: 'comprehensive' as const,
    };

    const result = await EnhancedScoringService.calculateScore(input);

    // Check that we have separate tiers
    expect(result.tier_scores.education).toBeDefined();
    expect(result.tier_scores.certifications).toBeDefined();
    expect(result.tier_scores).not.toHaveProperty('education_certifications');

    // Check tier names
    expect(result.tier_scores.education.tier_name).toBe('Education');
    expect(result.tier_scores.certifications.tier_name).toBe('Certifications');

    // Check tier numbers
    expect(result.tier_scores.education.tier_number).toBe(4);
    expect(result.tier_scores.certifications.tier_number).toBe(5);

    console.log('✅ Separate tiers working correctly!');
    console.log('Education tier:', result.tier_scores.education.tier_name);
    console.log('Certifications tier:', result.tier_scores.certifications.tier_name);
  });
});