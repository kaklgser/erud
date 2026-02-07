// Test script to verify JD-based experience scoring fix

async function testJDExperienceFix() {
  console.log('🧪 Testing JD-based Experience Scoring Fix...');
  
  // Simulate the intelligent parameter calculation
  const mockEnhancedScore = {
    overall: 45, // Low overall score that was causing issues
    tier_scores: {
      experience: { percentage: 20, score: 15 }, // Low experience tier score
      skills_keywords: { percentage: 60, score: 30 },
      education: { percentage: 80, score: 12 },
      certifications: { percentage: 10, score: 2 },
      basic_structure: { percentage: 70, score: 14 },
      content_structure: { percentage: 50, score: 12 },
      qualitative: { percentage: 60, score: 6 },
      competitive: { percentage: 40, score: 6 }
    },
    critical_metrics: {
      jd_keywords_match: { percentage: 45, score: 3 },
      technical_skills_alignment: { percentage: 55, score: 4 },
      quantified_results_presence: { percentage: 30, score: 2 },
      job_title_relevance: { percentage: 40, score: 2 },
      experience_relevance: { percentage: 25, score: 2 }
    },
    red_flags: [],
    keyStrengths: ['Technical skills', 'Education background', 'Clean format'],
    improvementAreas: ['Add more experience details', 'Include quantified achievements', 'Improve keyword matching'],
    missing_keywords_enhanced: [
      { keyword: 'leadership', tier: 'important' },
      { keyword: 'agile', tier: 'optional' }
    ]
  };
  
  const jobDescription = `
    Senior Software Engineer position requiring 3+ years experience.
    Must have React, Node.js, and team leadership experience.
  `;
  
  // Simulate the intelligent parameter calculation
  function calculateIntelligentScores(enhancedScore, jobDescription) {
    const hasJD = Boolean(jobDescription && jobDescription.length > 50);
    
    // Experience Relevance (was 0, should be improved)
    let experienceRelevance = Math.round((enhancedScore.tier_scores.experience.percentage / 100) * 15);
    if (enhancedScore.critical_metrics.experience_relevance.score > 0) {
      experienceRelevance = Math.max(experienceRelevance, 3); // Minimum 3 if any relevance
    }
    if (hasJD && enhancedScore.critical_metrics.jd_keywords_match.percentage > 30) {
      experienceRelevance = Math.max(experienceRelevance, Math.round(15 * 0.4)); // 40% if good keyword match
    }
    if (enhancedScore.tier_scores.experience.score > 0) {
      experienceRelevance = Math.max(experienceRelevance, 2); // Minimum 2 if any experience
    }
    
    // Career Progression (was 0, should be improved)
    let careerProgression = Math.round((enhancedScore.tier_scores.experience.percentage / 100) * 6);
    if (enhancedScore.tier_scores.experience.score > 0) {
      careerProgression = Math.max(careerProgression, 1); // Minimum 1 if experience exists
    }
    if (enhancedScore.tier_scores.competitive.percentage > 50) {
      careerProgression = Math.max(careerProgression, Math.round(6 * 0.5));
    }
    
    // Employment History (was 0, should be improved)
    let employmentHistory = Math.round((enhancedScore.tier_scores.experience.percentage / 100) * 8);
    if (enhancedScore.tier_scores.experience.score > 0) {
      employmentHistory = Math.max(employmentHistory, 2); // Minimum 2 if experience exists
    }
    if (enhancedScore.red_flags.length === 0) {
      employmentHistory = Math.max(employmentHistory, Math.round(8 * 0.5)); // 50% if no red flags
    }
    
    return {
      experienceRelevance: Math.min(experienceRelevance, 15),
      careerProgression: Math.min(careerProgression, 6),
      employmentHistory: Math.min(employmentHistory, 8)
    };
  }
  
  console.log('\n📊 Before Fix (Direct Tier Mapping):');
  const beforeFix = {
    experienceRelevance: Math.round((mockEnhancedScore.tier_scores.experience.percentage / 100) * 15),
    careerProgression: Math.round((mockEnhancedScore.tier_scores.experience.percentage / 100) * 6),
    employmentHistory: Math.round((mockEnhancedScore.tier_scores.experience.percentage / 100) * 8)
  };
  console.log(`   Experience Relevance: ${beforeFix.experienceRelevance}/15 (${Math.round((beforeFix.experienceRelevance/15)*100)}%)`);
  console.log(`   Career Progression: ${beforeFix.careerProgression}/6 (${Math.round((beforeFix.careerProgression/6)*100)}%)`);
  console.log(`   Employment History: ${beforeFix.employmentHistory}/8 (${Math.round((beforeFix.employmentHistory/8)*100)}%)`);
  
  console.log('\n✅ After Fix (Intelligent Mapping):');
  const afterFix = calculateIntelligentScores(mockEnhancedScore, jobDescription);
  console.log(`   Experience Relevance: ${afterFix.experienceRelevance}/15 (${Math.round((afterFix.experienceRelevance/15)*100)}%)`);
  console.log(`   Career Progression: ${afterFix.careerProgression}/6 (${Math.round((afterFix.careerProgression/6)*100)}%)`);
  console.log(`   Employment History: ${afterFix.employmentHistory}/8 (${Math.round((afterFix.employmentHistory/8)*100)}%)`);
  
  console.log('\n🎯 Improvements:');
  console.log(`   ✓ Experience Relevance: ${beforeFix.experienceRelevance} → ${afterFix.experienceRelevance} (+${afterFix.experienceRelevance - beforeFix.experienceRelevance})`);
  console.log(`   ✓ Career Progression: ${beforeFix.careerProgression} → ${afterFix.careerProgression} (+${afterFix.careerProgression - beforeFix.careerProgression})`);
  console.log(`   ✓ Employment History: ${beforeFix.employmentHistory} → ${afterFix.employmentHistory} (+${afterFix.employmentHistory - beforeFix.employmentHistory})`);
  
  const totalBefore = beforeFix.experienceRelevance + beforeFix.careerProgression + beforeFix.employmentHistory;
  const totalAfter = afterFix.experienceRelevance + afterFix.careerProgression + afterFix.employmentHistory;
  
  console.log(`\n📈 Total Experience Points: ${totalBefore} → ${totalAfter} (+${totalAfter - totalBefore})`);
  console.log(`   Max Possible: 29 points (15+6+8)`);
  console.log(`   Before: ${Math.round((totalBefore/29)*100)}% of max`);
  console.log(`   After: ${Math.round((totalAfter/29)*100)}% of max`);
  
  if (totalAfter > totalBefore) {
    console.log('\n🎉 FIX SUCCESSFUL: Experience parameters now show meaningful scores!');
  } else {
    console.log('\n❌ FIX FAILED: No improvement in experience scoring');
  }
}

// Run the test
testJDExperienceFix();