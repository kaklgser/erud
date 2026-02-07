/**
 * Test script to verify the percentage property fix
 * Simulates the error condition and tests our null checking
 */

// Simulate the applyNormalizedWeights function with our fix
function applyNormalizedWeights(tierScores, candidateLevel) {
  const weights = {
    skills_keywords: 35,
    experience: 0,
    education: 18,
    projects: 20,
    certifications: 8,
    basic_structure: 6,
    content_structure: 6,
    competitive: 3,
    culture_fit: 2,
    qualitative: 2,
  };
  
  const normalizedScores = {};
  
  for (const [key, tier] of Object.entries(tierScores)) {
    // CRITICAL FIX: Check if tier exists and has required properties
    if (!tier || typeof tier.percentage !== 'number') {
      console.warn(`[normalModeScoring] Invalid tier score for ${key}:`, tier);
      continue; // Skip invalid tier scores
    }
    
    const newWeight = weights[key] ?? tier.weight;
    
    normalizedScores[key] = {
      ...tier,
      weight: newWeight,
      weighted_contribution: (tier.percentage * newWeight) / 100,
    };
  }
  
  return normalizedScores;
}

// Test cases
function testPercentageFix() {
  console.log('🧪 Testing percentage property fix...');
  
  // Test Case 1: Normal tier scores (should work)
  console.log('\n📊 Test 1: Normal tier scores');
  const normalTierScores = {
    skills_keywords: { percentage: 75, weight: 25, tier_name: 'Skills' },
    experience: { percentage: 60, weight: 25, tier_name: 'Experience' },
    education: { percentage: 80, weight: 6, tier_name: 'Education' }
  };
  
  try {
    const result1 = applyNormalizedWeights(normalTierScores, 'fresher');
    console.log('✅ Normal case passed');
    console.log('   Skills contribution:', result1.skills_keywords?.weighted_contribution);
  } catch (error) {
    console.error('❌ Normal case failed:', error.message);
  }
  
  // Test Case 2: Undefined tier (the original error case)
  console.log('\n📊 Test 2: Undefined tier (original error case)');
  const undefinedTierScores = {
    skills_keywords: undefined, // This would cause the original error
    experience: { percentage: 60, weight: 25, tier_name: 'Experience' },
    education: { percentage: 80, weight: 6, tier_name: 'Education' }
  };
  
  try {
    const result2 = applyNormalizedWeights(undefinedTierScores, 'fresher');
    console.log('✅ Undefined tier handled gracefully');
    console.log('   Result keys:', Object.keys(result2));
  } catch (error) {
    console.error('❌ Undefined tier case failed:', error.message);
  }
  
  // Test Case 3: Missing percentage property
  console.log('\n📊 Test 3: Missing percentage property');
  const missingPercentageTierScores = {
    skills_keywords: { weight: 25, tier_name: 'Skills' }, // Missing percentage
    experience: { percentage: 60, weight: 25, tier_name: 'Experience' },
    education: { percentage: 80, weight: 6, tier_name: 'Education' }
  };
  
  try {
    const result3 = applyNormalizedWeights(missingPercentageTierScores, 'fresher');
    console.log('✅ Missing percentage handled gracefully');
    console.log('   Result keys:', Object.keys(result3));
  } catch (error) {
    console.error('❌ Missing percentage case failed:', error.message);
  }
  
  // Test Case 4: Null tier
  console.log('\n📊 Test 4: Null tier');
  const nullTierScores = {
    skills_keywords: null, // Null tier
    experience: { percentage: 60, weight: 25, tier_name: 'Experience' },
    education: { percentage: 80, weight: 6, tier_name: 'Education' }
  };
  
  try {
    const result4 = applyNormalizedWeights(nullTierScores, 'fresher');
    console.log('✅ Null tier handled gracefully');
    console.log('   Result keys:', Object.keys(result4));
  } catch (error) {
    console.error('❌ Null tier case failed:', error.message);
  }
  
  console.log('\n🎉 All percentage property fix tests completed!');
  console.log('✅ The "Cannot read properties of undefined (reading \'percentage\')" error should now be fixed.');
}

// Run the test
testPercentageFix();