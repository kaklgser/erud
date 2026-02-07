// Debug script to check JD-based scoring issues
import { ATSScoreChecker16Parameter } from './src/services/atsScoreChecker16Parameter.js';

async function debugJDScoring() {
  console.log('🔍 Debugging JD-based scoring issues...');
  
  const sampleResume = `
    John Doe
    Software Engineer
    john.doe@email.com | (555) 123-4567
    
    EXPERIENCE
    Senior Software Engineer | Tech Corp | 2020-2023
    • Developed scalable web applications using React and Node.js
    • Led a team of 5 developers on critical projects
    • Improved system performance by 40%
    
    Software Engineer | StartupCo | 2018-2020
    • Built REST APIs using Python and Django
    • Implemented CI/CD pipelines
    • Collaborated with cross-functional teams
    
    SKILLS
    JavaScript, React, Node.js, Python, AWS, Docker, Git
    
    EDUCATION
    Bachelor of Science in Computer Science | University | 2018
  `;
  
  const jobDescription = `
    We are looking for a Senior Software Engineer with 3+ years of experience.
    Required skills: JavaScript, React, Node.js, AWS
    Experience with team leadership preferred.
    Must have experience with web application development.
  `;
  
  try {
    console.log('📊 Testing JD-based evaluation...');
    
    const result = await ATSScoreChecker16Parameter.evaluateResume(
      sampleResume,
      jobDescription,
      'john_doe_resume.pdf'
    );
    
    console.log('\n🎯 16-Parameter Results:');
    console.log(`Overall Score: ${result.overallScore}/100`);
    console.log(`Match Quality: ${result.matchQuality}`);
    console.log(`Interview Chance: ${result.interviewChance}`);
    
    console.log('\n📋 Parameter Breakdown:');
    Object.entries(result.scores).forEach(([param, score]) => {
      const maxScores = {
        keywordMatch: 25, skillsAlignment: 20, experienceRelevance: 15,
        technicalCompetencies: 12, educationScore: 10, quantifiedAchievements: 8,
        employmentHistory: 8, industryExperience: 7, jobTitleMatch: 6,
        careerProgression: 6, certifications: 5, formatting: 5,
        contentQuality: 4, grammar: 3, resumeLength: 2, filenameQuality: 2
      };
      const maxScore = maxScores[param] || 5;
      const percentage = Math.round((score / maxScore) * 100);
      console.log(`   ${param}: ${score}/${maxScore} (${percentage}%)`);
    });
    
    console.log('\n🔍 Issues Found:');
    if (result.scores.experienceRelevance === 0) {
      console.log('   ❌ Experience Relevance is 0 - this should not happen with JD matching');
    }
    if (result.scores.careerProgression === 0) {
      console.log('   ❌ Career Progression is 0 - should detect progression from Engineer to Senior');
    }
    if (result.scores.quantifiedAchievements === 0) {
      console.log('   ❌ Quantified Achievements is 0 - should detect "40% improvement"');
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  }
}

// Run debug
debugJDScoring();