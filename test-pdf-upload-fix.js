/**
 * Test script to verify PDF upload error fix
 * Tests the "Cannot read properties of undefined (reading 'percentage')" error
 */

import { EnhancedScoringService } from './dist/services/enhancedScoringService.js';

async function testPdfUploadFix() {
  console.log('🧪 Testing PDF upload fix...');
  
  try {
    // Create a mock file object similar to what would come from PDF upload
    const mockFile = {
      name: 'test-resume.pdf',
      size: 150000, // 150KB
      type: 'application/pdf'
    };
    
    // Create minimal resume data that might cause the error
    const mockResumeData = {
      personalInfo: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      skills: [
        {
          category: 'Technical',
          list: ['JavaScript', 'Python', 'React']
        }
      ],
      workExperience: [
        {
          role: 'Software Developer',
          company: 'Tech Corp',
          year: '2022-Present',
          bullets: ['Developed web applications', 'Worked with React and Node.js']
        }
      ],
      education: [
        {
          degree: 'Bachelor of Computer Science',
          school: 'University of Tech',
          year: '2022'
        }
      ]
    };
    
    // Test the enhanced scoring service with error handling
    console.log('📊 Testing enhanced scoring service...');
    
    const result = await EnhancedScoringService.processAndScore(
      mockFile,
      mockResumeData,
      undefined, // No job description
      'experienced'
    );
    
    console.log('✅ Success! Score calculated:', result.overall);
    console.log('📈 Match band:', result.match_band);
    console.log('🎯 Confidence:', result.confidence);
    
    // Verify tier scores exist and have percentage property
    if (result.tier_scores) {
      console.log('\n📋 Tier Scores:');
      Object.entries(result.tier_scores).forEach(([key, tier]) => {
        if (tier && typeof tier.percentage === 'number') {
          console.log(`  ${key}: ${tier.percentage}%`);
        } else {
          console.log(`  ${key}: Invalid tier (${tier})`);
        }
      });
    }
    
    console.log('\n🎉 PDF upload fix test PASSED!');
    return true;
    
  } catch (error) {
    console.error('❌ PDF upload fix test FAILED:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the test
testPdfUploadFix()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });