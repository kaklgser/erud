/**
 * Tier 6: Projects Analyzer (15 metrics)
 * Analyzes project descriptions, technical relevance, and impact
 */

import { ResumeData, TierScore, Project } from '../../types/resume';

export interface ProjectsInput {
  resumeText: string;
  resumeData?: ResumeData;
  jobDescription?: string;
}

export interface ProjectsResult {
  tierScore: TierScore;
  metrics: ProjectMetrics;
}

interface ProjectMetrics {
  projectPresence: boolean;
  projectCount: number;
  descriptionDepth: number;
  techRelevance: number;
  impactMetrics: boolean;
  complexityLevel: number;
  openSourceContributions: boolean;
  portfolioLink: boolean;
  teamSizeIndicated: boolean;
  projectScale: number;
  projectRecency: boolean;
  roleRelevance: number;
  tangibleOutcomes: boolean;
  personalVsWork: 'personal' | 'work' | 'mixed' | 'unknown';
  sideProjects: boolean;
  // NEW: Word repetition metrics
  wordRepetitionScore: number; // 0-100, higher is better (less repetition)
  repeatedWords: string[]; // Words repeated 3+ times
}

// Tech keywords for relevance matching - EXPANDED to match skillsKeywordsAnalyzer
const TECH_KEYWORDS = [
  // Programming Languages
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust',
  'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl',
  // Frameworks
  'react', 'angular', 'vue', 'next.js', 'nuxt', 'express', 'django', 'flask',
  'spring', 'spring boot', 'rails', '.net', 'laravel', 'fastapi', 'nest.js', 'svelte',
  'node.js', 'nodejs', 'node', 'redux', 'graphql', 'rest', 'restful', 'api', 'hibernate',
  // Databases
  'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb',
  'cassandra', 'oracle', 'sql server', 'sqlite', 'firebase', 'supabase', 'sql',
  // Cloud Platforms
  'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'vercel', 'netlify',
  'digitalocean', 'cloudflare', 'ec2', 's3', 'lambda', 'cloud', 'microservices', 'serverless',
  // DevOps Tools
  'docker', 'kubernetes', 'jenkins', 'github actions', 'gitlab ci', 'terraform',
  'ansible', 'ci/cd', 'cicd', 'devops', 'devsecops', 'helm', 'prometheus', 'grafana', 'nginx', 'git',
  // Data & Analytics
  'tableau', 'power bi', 'spark', 'hadoop', 'kafka', 'airflow', 'etl',
  // Testing
  'jest', 'mocha', 'cypress', 'selenium', 'junit', 'pytest', 'testing',
  // AI/ML
  'machine learning', 'ml', 'ai', 'tensorflow', 'pytorch', 'nlp', 'deep learning',
  // Methodologies
  'agile', 'scrum', 'kanban'
];

export class ProjectsAnalyzer {
  static analyze(input: ProjectsInput): ProjectsResult {
    const { resumeText, resumeData, jobDescription } = input;
    const textLower = resumeText.toLowerCase();
    const projects = resumeData?.projects || [];

    const metrics = this.analyzeProjects(projects, textLower, jobDescription);
    const score = this.calculateScore(metrics);
    const maxScore = 15;
    const percentage = Math.round((score / maxScore) * 100);

    const topIssues = this.identifyTopIssues(metrics);

    const tierScore: TierScore = {
      tier_number: 7,
      tier_name: 'Projects',
      score: Math.round(score * 100) / 100,
      max_score: maxScore,
      percentage,
      weight: 8,
      weighted_contribution: Math.round((percentage * 8) / 100 * 100) / 100,
      metrics_passed: this.countPassedMetrics(metrics),
      metrics_total: 16, // Updated: added word repetition metric
      top_issues: topIssues,
    };

    return { tierScore, metrics };
  }

  private static analyzeProjects(
    projects: Project[],
    textLower: string,
    jobDescription?: string
  ): ProjectMetrics {
    const jdLower = jobDescription?.toLowerCase() || '';
    let allBullets = projects.flatMap(p => p.bullets || []);
    
    // ENHANCED: Use both structured projects AND text-based analysis
    // If no structured projects, extract project content from text
    let allProjectText = projects.map(p => `${p.title} ${p.bullets?.join(' ') || ''}`).join(' ').toLowerCase();
    
    // If no structured projects, try to extract project section from text
    if (projects.length === 0 && textLower.includes('project')) {
      // Extract everything after "PROJECTS" section header
      const projectsSectionMatch = textLower.match(/\bprojects?\b[\s\S]*?(?=\b(?:education|certifications?|skills|work\s*experience|experience|achievements?|references?)\b|$)/i);
      if (projectsSectionMatch) {
        allProjectText = projectsSectionMatch[0];
        console.log(`📊 ProjectsAnalyzer: Using text-based project analysis (${allProjectText.length} chars)`);
        
        // Extract bullets from text (lines starting with • or -)
        const bulletMatches = allProjectText.match(/[-•]\s*[A-Z][^•\n]+/g);
        if (bulletMatches) {
          allBullets = bulletMatches.map(b => b.replace(/^[-•]\s*/, '').trim());
          console.log(`📊 ProjectsAnalyzer: Extracted ${allBullets.length} bullets from text`);
        }
      }
    }

    // 1. Project presence - check both structured and text
    const projectPresence = projects.length > 0 || /\bprojects?\b/i.test(textLower);

    // 2. Project count - count from structured OR estimate from text
    let projectCount = projects.length;
    if (projectCount === 0 && allProjectText.length > 50) {
      // Estimate project count from text by looking for project title patterns
      const titlePatterns = allProjectText.match(/(?:^|\n)([a-z][a-z\s]+(?:system|app|application|platform|tool|dashboard|website|portal|api|service|engine|manager|tracker|analyzer|management|analytics|automation|integration|processing))/gi);
      projectCount = titlePatterns ? Math.min(titlePatterns.length, 5) : 1;
    }

    // 3. Description depth (avg bullets per project)
    const avgBullets = projects.length > 0 
      ? allBullets.length / projects.length 
      : 0;
    const descriptionDepth = Math.min(100, avgBullets * 25);

    // 4. Tech relevance to JD - IMPROVED scoring
    let techRelevance = 50;
    if (jdLower) {
      const jdTech = TECH_KEYWORDS.filter(t => jdLower.includes(t.toLowerCase()));
      const projectTech = TECH_KEYWORDS.filter(t => allProjectText.includes(t.toLowerCase()));
      const matches = jdTech.filter(t => projectTech.includes(t)).length;
      // More generous scoring: base 30 + matches bonus
      techRelevance = jdTech.length > 0 
        ? Math.min(100, (matches / jdTech.length) * 70 + 30) 
        : 60;
      // Bonus if project has many tech keywords even if not all match JD
      if (projectTech.length >= 5) techRelevance = Math.min(100, techRelevance + 15);
    } else {
      const projectTech = TECH_KEYWORDS.filter(t => allProjectText.includes(t.toLowerCase()));
      techRelevance = Math.min(100, projectTech.length * 12 + 30);
    }

    // 5. Impact metrics present
    const impactPattern = /\d+%|\d+\s*(users?|downloads?|requests?|transactions?|customers?)|reduced|increased|improved|optimized/i;
    const impactMetrics = allBullets.some(b => impactPattern.test(b));

    // 6. Complexity level (0-100)
    const complexityIndicators = ['architecture', 'scalable', 'distributed', 'microservices', 'machine learning', 'ai', 'algorithm', 'optimization', 'real-time', 'concurrent'];
    const complexityMatches = complexityIndicators.filter(c => allProjectText.includes(c)).length;
    const complexityLevel = Math.min(100, complexityMatches * 15 + 30);

    // 7. Open source contributions
    const openSourceContributions = /\b(open.?source|github|contribution|contributor|pull request|pr|fork)\b/i.test(allProjectText);

    // 8. Portfolio/GitHub link
    const portfolioLink = projects.some(p => p.githubUrl) || /\b(github\.com|gitlab\.com|portfolio|demo|live)\b/i.test(textLower);

    // 9. Team size indicated
    const teamSizeIndicated = /\b(team of \d+|\d+ (developers?|engineers?|members?)|collaborated|cross-functional)\b/i.test(allProjectText);

    // 10. Project scale (0-100)
    const scaleIndicators = ['enterprise', 'production', 'million', 'thousands', 'large-scale', 'company-wide', 'organization'];
    const scaleMatches = scaleIndicators.filter(s => allProjectText.includes(s)).length;
    const projectScale = Math.min(100, scaleMatches * 20 + 30);

    // 11. Project recency
    const currentYear = new Date().getFullYear();
    const recentYears = [currentYear, currentYear - 1, currentYear - 2].map(String);
    const projectRecency = recentYears.some(y => allProjectText.includes(y)) || /\b(current|ongoing|present)\b/i.test(allProjectText);

    // 12. Role relevance to target
    let roleRelevance = 50;
    if (jdLower) {
      const roleKeywords = jdLower.split(/\s+/).filter(w => w.length > 5);
      const matches = roleKeywords.filter(k => allProjectText.includes(k)).length;
      roleRelevance = Math.min(100, (matches / Math.max(1, roleKeywords.length)) * 100 + 20);
    }

    // 13. Tangible outcomes
    const tangibleOutcomes = /\b(launched|deployed|shipped|released|delivered|completed|built|created|developed)\b/i.test(allProjectText);

    // 14. Personal vs Work projects
    let personalVsWork: 'personal' | 'work' | 'mixed' | 'unknown' = 'unknown';
    const hasPersonal = /\b(personal|side|hobby|self-taught|independent)\b/i.test(allProjectText);
    const hasWork = /\b(company|client|enterprise|production|work|professional)\b/i.test(allProjectText);
    if (hasPersonal && hasWork) personalVsWork = 'mixed';
    else if (hasPersonal) personalVsWork = 'personal';
    else if (hasWork) personalVsWork = 'work';

    // 15. Side projects
    const sideProjects = /\b(side project|personal project|hobby|weekend|hackathon)\b/i.test(allProjectText);

    // 16. Word Repetition Detection - penalize if any word is repeated 3+ times
    const { wordRepetitionScore, repeatedWords } = this.analyzeWordRepetition(allBullets);

    return {
      projectPresence,
      projectCount,
      descriptionDepth,
      techRelevance,
      impactMetrics,
      complexityLevel,
      openSourceContributions,
      portfolioLink,
      teamSizeIndicated,
      projectScale,
      projectRecency,
      roleRelevance,
      tangibleOutcomes,
      personalVsWork,
      sideProjects,
      wordRepetitionScore,
      repeatedWords,
    };
  }

  /**
   * Analyze word repetition in project bullets
   * Returns a score (0-100) where 100 = no repetition, lower = more repetition
   * Also returns list of words repeated 3+ times
   */
  private static analyzeWordRepetition(bullets: string[]): { wordRepetitionScore: number; repeatedWords: string[] } {
    // Common words to ignore (articles, prepositions, etc.)
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'that', 'which', 'who', 'whom', 'this', 'these', 'those', 'it', 'its', 'i', 'we',
      'you', 'they', 'he', 'she', 'my', 'your', 'our', 'their', 'his', 'her', 'using',
      'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
      'under', 'over', 'out', 'up', 'down', 'off', 'about', 'than', 'so', 'if', 'then',
      'also', 'just', 'only', 'both', 'each', 'all', 'any', 'some', 'no', 'not', 'more',
      'most', 'other', 'such', 'own', 'same', 'new', 'first', 'last', 'long', 'great',
      'little', 'own', 'other', 'old', 'right', 'big', 'high', 'different', 'small',
      'large', 'next', 'early', 'young', 'important', 'few', 'public', 'bad', 'same',
      'able', 'per', 'via', 'etc', 'based', 'across', 'within', 'along', 'including'
    ]);

    // Count word frequencies across all bullets
    const wordCounts: Record<string, number> = {};
    const allText = bullets.join(' ').toLowerCase();
    
    // Extract words (only alphabetic, 3+ characters)
    const words = allText.match(/\b[a-z]{3,}\b/g) || [];
    
    words.forEach(word => {
      if (!stopWords.has(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });

    // Find words repeated 3+ times
    const repeatedWords: string[] = [];
    let repetitionPenalty = 0;

    Object.entries(wordCounts).forEach(([word, count]) => {
      if (count >= 3) {
        repeatedWords.push(`${word} (${count}x)`);
        // Penalty increases with more repetitions
        repetitionPenalty += (count - 2) * 10; // -10 for each repetition beyond 2
      }
    });

    // Calculate score (100 = perfect, 0 = very repetitive)
    const wordRepetitionScore = Math.max(0, 100 - repetitionPenalty);

    if (repeatedWords.length > 0) {
      console.log(`⚠️ Word repetition detected: ${repeatedWords.join(', ')}`);
    }

    return { wordRepetitionScore, repeatedWords };
  }


  private static calculateScore(metrics: ProjectMetrics): number {
    let score = 0;

    // Core project metrics (weighted higher - most good resumes have these)
    if (metrics.projectPresence) score += 2;  // Increased from 1
    score += Math.min(3, metrics.projectCount * 1);  // Increased from 0.5
    score += (metrics.descriptionDepth / 100) * 2;  // Increased from 1.5
    score += (metrics.techRelevance / 100) * 3;  // Increased from 2
    if (metrics.tangibleOutcomes) score += 1.5;  // Increased from 0.5
    
    // Secondary metrics
    if (metrics.impactMetrics) score += 1;
    score += (metrics.complexityLevel / 100) * 1;
    score += (metrics.roleRelevance / 100) * 0.75;
    
    // Optional/bonus metrics (not everyone has these)
    if (metrics.openSourceContributions) score += 0.25;
    if (metrics.portfolioLink) score += 0.25;
    if (metrics.teamSizeIndicated) score += 0.1;
    score += (metrics.projectScale / 100) * 0.25;
    if (metrics.projectRecency) score += 0.25;
    if (metrics.personalVsWork === 'mixed') score += 0.1;
    if (metrics.sideProjects) score += 0.1;

    // WORD REPETITION PENALTY - deduct up to 2 points for excessive repetition
    // If wordRepetitionScore is 100 (no repetition), no penalty
    // If wordRepetitionScore is 0 (very repetitive), -2 points
    const repetitionPenalty = ((100 - metrics.wordRepetitionScore) / 100) * 2;
    score -= repetitionPenalty;

    return Math.max(0, Math.min(15, score));
  }

  private static countPassedMetrics(metrics: ProjectMetrics): number {
    let passed = 0;

    if (metrics.projectPresence) passed++;
    if (metrics.projectCount >= 2) passed++;
    if (metrics.descriptionDepth >= 50) passed++;
    if (metrics.techRelevance >= 60) passed++;
    if (metrics.impactMetrics) passed++;
    if (metrics.complexityLevel >= 50) passed++;
    if (metrics.openSourceContributions) passed++;
    if (metrics.portfolioLink) passed++;
    if (metrics.teamSizeIndicated) passed++;
    if (metrics.projectScale >= 50) passed++;
    if (metrics.projectRecency) passed++;
    if (metrics.roleRelevance >= 60) passed++;
    if (metrics.tangibleOutcomes) passed++;
    if (metrics.personalVsWork !== 'unknown') passed++;
    if (metrics.sideProjects) passed++;
    // Word repetition - pass if score >= 70 (minimal repetition)
    if (metrics.wordRepetitionScore >= 70) passed++;

    return passed;
  }

  private static identifyTopIssues(metrics: ProjectMetrics): string[] {
    const issues: string[] = [];

    // PRIORITY: Word repetition is a critical issue
    if (metrics.wordRepetitionScore < 70 && metrics.repeatedWords.length > 0) {
      issues.push(`Avoid word repetition: ${metrics.repeatedWords.slice(0, 3).join(', ')}`);
    }
    
    if (!metrics.projectPresence) issues.push('Add a projects section to showcase your work');
    if (metrics.projectCount < 2) issues.push('Include at least 2-3 relevant projects');
    if (metrics.descriptionDepth < 50) issues.push('Add more detail to project descriptions');
    if (metrics.techRelevance < 60) issues.push('Highlight technologies relevant to target role');
    if (!metrics.impactMetrics) issues.push('Add quantified impact/results to projects');
    if (!metrics.portfolioLink) issues.push('Include GitHub or portfolio links');
    if (!metrics.projectRecency) issues.push('Add recent projects to show current skills');
    if (!metrics.tangibleOutcomes) issues.push('Describe tangible outcomes for each project');

    return issues.slice(0, 3);
  }
}

export default ProjectsAnalyzer;
