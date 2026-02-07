// src/services/githubProjectSuggestionService.ts
// GitHub Project Suggestion Service - Suggests real GitHub projects as inspiration

import { JdKeywords } from './projectMatchingEngine';
import { github } from './aiProxyService';

// Suggested repository project interface
export interface SuggestedRepoProject {
  name: string;
  url: string;
  description: string;
  stars: number;
  language: string | null;
  topics: string[];
  reason: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  matchedSkills: string[];
}

// GitHub API response types
interface GitHubRepo {
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  topics?: string[];
  forks_count: number;
  open_issues_count: number;
}

interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}

/**
 * Build search queries from JD keywords
 */
const buildSearchQueries = (jdKeywords: JdKeywords): string[] => {
  const queries: string[] = [];
  
  // Combine tech skills into meaningful queries
  const techSkills = jdKeywords.techSkills.slice(0, 6);
  
  if (techSkills.length >= 2) {
    // Primary query: top 2-3 skills
    queries.push(techSkills.slice(0, 3).join(' '));
  }
  
  if (techSkills.length >= 4) {
    // Secondary query: next set of skills
    queries.push(techSkills.slice(2, 5).join(' '));
  }
  
  // Domain-specific queries
  for (const domain of jdKeywords.domains.slice(0, 2)) {
    const domainQuery = `${domain} ${techSkills[0] || 'project'}`;
    queries.push(domainQuery);
  }
  
  // If we have tools, add a tools-focused query
  if (jdKeywords.tools.length > 0 && techSkills.length > 0) {
    queries.push(`${techSkills[0]} ${jdKeywords.tools[0]}`);
  }
  
  // Ensure we have at least one query
  if (queries.length === 0 && jdKeywords.rawKeywords.length > 0) {
    queries.push(jdKeywords.rawKeywords.slice(0, 3).join(' '));
  }
  
  return queries.slice(0, 3); // Max 3 queries
};

/**
 * Search GitHub repositories via Supabase Edge Function proxy
 */
const searchGitHubRepos = async (query: string, perPage: number = 5): Promise<GitHubRepo[]> => {
  try {
    const data = await github.searchRepos(query, { sort: 'stars', order: 'desc', perPage });
    return data.items || [];
  } catch (error) {
    console.error('GitHub search error:', error);
    return [];
  }
};

/**
 * Determine project difficulty based on stars and complexity indicators
 */
const determineDifficulty = (repo: GitHubRepo): 'beginner' | 'intermediate' | 'advanced' => {
  const stars = repo.stargazers_count;
  const forks = repo.forks_count;
  const issues = repo.open_issues_count;
  
  // Simple heuristic based on project size/complexity
  if (stars > 10000 || forks > 2000 || issues > 500) {
    return 'advanced';
  } else if (stars > 1000 || forks > 200 || issues > 50) {
    return 'intermediate';
  }
  return 'beginner';
};

/**
 * Generate reason why this project matches the JD
 */
const generateMatchReason = (repo: GitHubRepo, jdKeywords: JdKeywords): { reason: string; matchedSkills: string[] } => {
  const matchedSkills: string[] = [];
  const repoText = `${repo.name} ${repo.description || ''} ${repo.language || ''} ${(repo.topics || []).join(' ')}`.toLowerCase();
  
  // Find matched skills
  for (const skill of jdKeywords.techSkills) {
    if (repoText.includes(skill.toLowerCase())) {
      matchedSkills.push(skill);
    }
  }
  
  // Check language match
  if (repo.language) {
    const langLower = repo.language.toLowerCase();
    for (const skill of jdKeywords.techSkills) {
      if (langLower.includes(skill.toLowerCase()) || skill.toLowerCase().includes(langLower)) {
        if (!matchedSkills.includes(skill)) {
          matchedSkills.push(skill);
        }
      }
    }
  }
  
  // Generate reason text
  let reason = '';
  if (matchedSkills.length > 0) {
    reason = `Matches JD skills: ${matchedSkills.slice(0, 4).join(', ')}`;
  } else if (repo.language) {
    reason = `Built with ${repo.language}`;
  } else {
    reason = 'Relevant project structure';
  }
  
  // Add domain context if applicable
  for (const domain of jdKeywords.domains) {
    if (repoText.includes(domain.toLowerCase())) {
      reason += ` • ${domain} domain`;
      break;
    }
  }
  
  return { reason, matchedSkills };
};

/**
 * Main function: Suggest GitHub projects based on JD keywords
 */
export const suggestProjectsForJd = async (jdKeywords: JdKeywords): Promise<SuggestedRepoProject[]> => {
  const queries = buildSearchQueries(jdKeywords);
  
  if (queries.length === 0) {
    console.warn('No search queries could be generated from JD keywords');
    return [];
  }
  
  const allRepos: GitHubRepo[] = [];
  const seenUrls = new Set<string>();
  
  // Execute searches
  for (const query of queries) {
    const repos = await searchGitHubRepos(query, 5);
    
    for (const repo of repos) {
      if (!seenUrls.has(repo.html_url)) {
        seenUrls.add(repo.html_url);
        allRepos.push(repo);
      }
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Map to SuggestedRepoProject format
  const suggestions: SuggestedRepoProject[] = allRepos.map(repo => {
    const { reason, matchedSkills } = generateMatchReason(repo, jdKeywords);
    
    return {
      name: repo.name,
      url: repo.html_url,
      description: repo.description || 'No description available',
      stars: repo.stargazers_count,
      language: repo.language,
      topics: repo.topics || [],
      reason,
      difficulty: determineDifficulty(repo),
      matchedSkills,
    };
  });
  
  // Sort by matched skills count, then by stars
  suggestions.sort((a, b) => {
    if (b.matchedSkills.length !== a.matchedSkills.length) {
      return b.matchedSkills.length - a.matchedSkills.length;
    }
    return b.stars - a.stars;
  });
  
  // Return top 5 unique suggestions
  return suggestions.slice(0, 5);
};

/**
 * Generate AI-style project suggestions based on JD (without GitHub API)
 * Fallback when GitHub API is unavailable
 */
export const generateProjectIdeas = (jdKeywords: JdKeywords): SuggestedRepoProject[] => {
  const ideas: SuggestedRepoProject[] = [];
  const techSkills = jdKeywords.techSkills;
  const domains = jdKeywords.domains;
  
  // Project templates based on common patterns
  const projectTemplates = [
    {
      pattern: ['react', 'typescript'],
      name: 'Task Management Dashboard',
      description: 'Build a Kanban-style task management app with drag-and-drop, user authentication, and real-time updates.',
      difficulty: 'intermediate' as const,
    },
    {
      pattern: ['node', 'express', 'mongodb'],
      name: 'RESTful API Service',
      description: 'Create a production-ready REST API with authentication, rate limiting, and comprehensive documentation.',
      difficulty: 'intermediate' as const,
    },
    {
      pattern: ['python', 'machine learning'],
      name: 'ML Model Pipeline',
      description: 'Build an end-to-end ML pipeline with data preprocessing, model training, and API deployment.',
      difficulty: 'advanced' as const,
    },
    {
      pattern: ['aws', 'docker'],
      name: 'Microservices Architecture',
      description: 'Design and deploy a microservices-based application with containerization and cloud deployment.',
      difficulty: 'advanced' as const,
    },
    {
      pattern: ['sql', 'postgresql'],
      name: 'Analytics Dashboard',
      description: 'Build a data analytics dashboard with complex SQL queries, data visualization, and reporting.',
      difficulty: 'intermediate' as const,
    },
  ];
  
  // Match templates to JD skills
  for (const template of projectTemplates) {
    const matchCount = template.pattern.filter(p => 
      techSkills.some(s => s.toLowerCase().includes(p) || p.includes(s.toLowerCase()))
    ).length;
    
    if (matchCount > 0) {
      ideas.push({
        name: template.name,
        url: '',
        description: template.description,
        stars: 0,
        language: techSkills[0] || null,
        topics: techSkills.slice(0, 5),
        reason: `Matches JD skills: ${techSkills.slice(0, 3).join(', ')}`,
        difficulty: template.difficulty,
        matchedSkills: techSkills.slice(0, 4),
      });
    }
  }
  
  // Add domain-specific suggestions
  if (domains.includes('fintech')) {
    ideas.push({
      name: 'Payment Gateway Integration',
      url: '',
      description: 'Build a secure payment processing system with Stripe/PayPal integration and transaction management.',
      stars: 0,
      language: techSkills[0] || 'JavaScript',
      topics: ['fintech', 'payments', ...techSkills.slice(0, 3)],
      reason: 'FinTech domain project',
      difficulty: 'advanced',
      matchedSkills: techSkills.slice(0, 3),
    });
  }
  
  if (domains.includes('ecommerce')) {
    ideas.push({
      name: 'E-commerce Platform',
      url: '',
      description: 'Full-featured e-commerce site with product catalog, cart, checkout, and order management.',
      stars: 0,
      language: techSkills[0] || 'JavaScript',
      topics: ['ecommerce', 'shopping', ...techSkills.slice(0, 3)],
      reason: 'E-commerce domain project',
      difficulty: 'intermediate',
      matchedSkills: techSkills.slice(0, 3),
    });
  }
  
  return ideas.slice(0, 5);
};

export const githubProjectSuggestionService = {
  suggestProjectsForJd,
  generateProjectIdeas,
  buildSearchQueries,
};

export default githubProjectSuggestionService;
