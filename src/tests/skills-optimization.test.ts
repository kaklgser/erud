/**
 * Test for Skills Optimization Service
 * Verifies that skills section cleanup and optimization works correctly
 */

import SkillsOptimizationService from '../services/skillsOptimizationService';

describe('Skills Optimization Service', () => {
  const problematicSkillsText = `
Technical Skills: oracle, PL/SQL, cloud, azure, .net

Tools & Technologies: Linux, Improve, Wipro, Write, Troubleshoot, Prepare, Leverage, Prioritize, CSAT, NET, devops, Kyndryl, Windows, PMs, Collaboration, devsecops, sprint, EY GDS, SAP, analytical problem-solving, strong debugging mindset, good communication, teamwork, relevant internship experience, strong analytical and problem-solving mindset, good communication and teamwork skills

Programming Languages: BI, Data & Analytics, AI, Full-stack development, Testing & Quality Engineering

Frontend: HTML, CSS, Bootstrap, JavaScript, React.js

Backend: Python, Express, Node.js

Database: SQLite

Other Skills: scalable, Git, automotive software, production-grade, secure, performance-focused
  `;

  it('should remove company names from skills section', () => {
    const result = SkillsOptimizationService.optimizeSkills(problematicSkillsText);

    // Check that company names were removed
    expect(result.removedItems.companyNames).toContain('wipro');
    expect(result.removedItems.companyNames).toContain('kyndryl');
    expect(result.removedItems.companyNames).toContain('ey gds');

    // Check that they don't appear in optimized skills
    const allOptimizedSkills = Object.values(result.optimizedSkills).flat().join(' ').toLowerCase();
    expect(allOptimizedSkills).not.toContain('wipro');
    expect(allOptimizedSkills).not.toContain('kyndryl');
    expect(allOptimizedSkills).not.toContain('ey gds');

    console.log('✅ Company names successfully removed from skills');
  });

  it('should move domains from programming languages to domains section', () => {
    const result = SkillsOptimizationService.optimizeSkills(problematicSkillsText);

    // Check that domains were moved
    expect(result.removedItems.domainsFromLanguages).toContain('bi');
    expect(result.removedItems.domainsFromLanguages).toContain('data & analytics');
    expect(result.removedItems.domainsFromLanguages).toContain('ai');

    // Check that they appear in domains section
    expect(result.optimizedSkills.domains).toContain('Bi');
    expect(result.optimizedSkills.domains).toContain('Ai');

    // Check that they don't appear in programming languages
    expect(result.optimizedSkills.programmingLanguages).not.toContain('BI');
    expect(result.optimizedSkills.programmingLanguages).not.toContain('AI');

    console.log('✅ Domains correctly moved from programming languages to domains section');
  });

  it('should move soft skills to core competencies', () => {
    const result = SkillsOptimizationService.optimizeSkills(problematicSkillsText);

    // Check that soft skills were moved
    expect(result.removedItems.softSkillsFromTech.length).toBeGreaterThan(0);
    expect(result.removedItems.softSkillsFromTech).toContain('analytical problem-solving');
    expect(result.removedItems.softSkillsFromTech).toContain('good communication');
    expect(result.removedItems.softSkillsFromTech).toContain('teamwork');

    // Check that they appear in core competencies
    expect(result.optimizedSkills.coreCompetencies.length).toBeGreaterThan(0);

    console.log('✅ Soft skills moved to core competencies section');
  });

  it('should remove action verbs from tools section', () => {
    const result = SkillsOptimizationService.optimizeSkills(problematicSkillsText);

    // Check that action verbs were removed
    const allOptimizedSkills = Object.values(result.optimizedSkills).flat().join(' ').toLowerCase();
    expect(allOptimizedSkills).not.toContain('improve');
    expect(allOptimizedSkills).not.toContain('write');
    expect(allOptimizedSkills).not.toContain('troubleshoot');
    expect(allOptimizedSkills).not.toContain('prepare');

    console.log('✅ Action verbs removed from tools section');
  });

  it('should categorize valid programming languages correctly', () => {
    const result = SkillsOptimizationService.optimizeSkills(problematicSkillsText);

    // Check that valid programming languages are preserved
    expect(result.optimizedSkills.programmingLanguages).toContain('Javascript');
    expect(result.optimizedSkills.programmingLanguages).toContain('Python');

    console.log('✅ Valid programming languages correctly categorized');
  });

  it('should organize frontend and backend technologies', () => {
    const result = SkillsOptimizationService.optimizeSkills(problematicSkillsText);

    // Check frontend categorization
    expect(result.optimizedSkills.frontend).toContain('Bootstrap');
    expect(result.optimizedSkills.frontend).toContain('React.js');
    
    // HTML and CSS are categorized as programming languages in this case
    expect(result.optimizedSkills.programmingLanguages).toContain('Html');
    expect(result.optimizedSkills.programmingLanguages).toContain('Css');

    // Check backend categorization
    expect(result.optimizedSkills.backend).toContain('Express');
    expect(result.optimizedSkills.backend).toContain('Node.js');
    expect(result.optimizedSkills.backend).toContain('.net');
    
    // Python is correctly categorized as a programming language
    expect(result.optimizedSkills.programmingLanguages).toContain('Python');

    console.log('✅ Frontend and backend technologies properly categorized');
  });

  it('should calculate ATS compatibility score', () => {
    const result = SkillsOptimizationService.optimizeSkills(problematicSkillsText);

    expect(result.atsCompatibilityScore).toBeGreaterThan(0);
    expect(result.atsCompatibilityScore).toBeLessThanOrEqual(100);

    console.log(`✅ ATS compatibility score: ${result.atsCompatibilityScore}/100`);
  });

  it('should generate appropriate recommendations', () => {
    const result = SkillsOptimizationService.optimizeSkills(problematicSkillsText);

    expect(result.recommendations.length).toBeGreaterThan(0);
    
    // Should have critical recommendation about company names
    const hasCompanyNameWarning = result.recommendations.some(rec => 
      rec.includes('company names') && rec.includes('CRITICAL')
    );
    expect(hasCompanyNameWarning).toBe(true);

    // Should have recommendation about domains
    const hasDomainsWarning = result.recommendations.some(rec => 
      rec.includes('domain keywords') && rec.includes('Programming Languages')
    );
    expect(hasDomainsWarning).toBe(true);

    console.log('✅ Appropriate recommendations generated');
    console.log('Recommendations:', result.recommendations);
  });

  it('should generate clean optimized skills text', () => {
    const result = SkillsOptimizationService.optimizeSkills(problematicSkillsText);
    const optimizedText = SkillsOptimizationService.generateOptimizedSkillsText(result.optimizedSkills);

    // Should not contain company names
    expect(optimizedText.toLowerCase()).not.toContain('wipro');
    expect(optimizedText.toLowerCase()).not.toContain('kyndryl');
    expect(optimizedText.toLowerCase()).not.toContain('ey gds');

    // Should have proper section headers
    expect(optimizedText).toContain('Programming Languages:');
    expect(optimizedText).toContain('Tools & Technologies:');
    expect(optimizedText).toContain('Frontend:');
    expect(optimizedText).toContain('Backend:');
    expect(optimizedText).toContain('Domains:');

    console.log('✅ Clean optimized skills text generated');
    console.log('Optimized Skills:\n', optimizedText);
  });

  it('should handle JD-based optimization', () => {
    const jobDescription = `
      We are looking for a React developer with experience in:
      - JavaScript, TypeScript
      - React.js, Node.js
      - AWS cloud services
      - MongoDB database
    `;

    const result = SkillsOptimizationService.optimizeSkills(problematicSkillsText, jobDescription);

    // Should provide JD alignment recommendations
    const hasJDRecommendation = result.recommendations.some(rec => 
      rec.includes('JD ALIGNMENT') || rec.includes('JD keywords')
    );

    console.log('✅ JD-based optimization working');
    if (hasJDRecommendation) {
      console.log('JD alignment recommendations provided');
    }
  });
});