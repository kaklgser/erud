import { 
  SemanticMatcherInterface, 
  SemanticMatch, 
  SimilarityScore, 
  ExpandedKeyword 
} from '../types/resume';

/**
 * Semantic Matching Service
 * 
 * Provides AI-powered conceptual similarity detection beyond exact keywords,
 * enabling better matching between resume content and job descriptions.
 */
export class SemanticMatchingService implements SemanticMatcherInterface {
  
  private readonly EXACT_MATCH_THRESHOLD = 1.0;
  private readonly SEMANTIC_MATCH_THRESHOLD = 0.8;
  private readonly RELATED_MATCH_THRESHOLD = 0.5;
  
  // Common synonyms and related terms for technical skills
  private readonly SKILL_SYNONYMS = new Map([
    ['javascript', ['js', 'ecmascript', 'node.js', 'nodejs']],
    ['python', ['py', 'python3', 'django', 'flask']],
    ['react', ['reactjs', 'react.js', 'jsx']],
    ['angular', ['angularjs', 'ng']],
    ['vue', ['vuejs', 'vue.js']],
    ['aws', ['amazon web services', 'amazon aws', 'cloud']],
    ['docker', ['containerization', 'containers']],
    ['kubernetes', ['k8s', 'container orchestration']],
    ['sql', ['mysql', 'postgresql', 'database']],
    ['nosql', ['mongodb', 'cassandra', 'dynamodb']],
    ['api', ['rest api', 'restful', 'web services']],
    ['ci/cd', ['continuous integration', 'continuous deployment', 'devops']],
    ['machine learning', ['ml', 'artificial intelligence', 'ai']],
    ['frontend', ['front-end', 'ui', 'user interface']],
    ['backend', ['back-end', 'server-side', 'api development']],
    ['fullstack', ['full-stack', 'full stack developer']]
  ]);
  
  /**
   * Find semantic matches between resume and job description
   */
  findSemanticMatches(resumeText: string, jobDescription: string): SemanticMatch[] {
    try {
      const matches: SemanticMatch[] = [];
      
      // Extract keywords from job description
      const jdKeywords = this.extractKeywords(jobDescription);
      
      // Extract keywords from resume
      const resumeKeywords = this.extractKeywords(resumeText);
      
      // Find matches for each JD keyword
      jdKeywords.forEach(jdKeyword => {
        const bestMatch = this.findBestMatch(jdKeyword, resumeKeywords, resumeText);
        if (bestMatch) {
          matches.push(bestMatch);
        }
      });
      
      return matches;
      
    } catch (error) {
      console.error('Semantic matching failed:', error);
      return [];
    }
  }
  
  /**
   * Calculate similarity between two terms
   */
  calculateSimilarity(term1: string, term2: string): SimilarityScore {
    try {
      const normalizedTerm1 = this.normalizeText(term1);
      const normalizedTerm2 = this.normalizeText(term2);
      
      // Exact match
      if (normalizedTerm1 === normalizedTerm2) {
        return {
          score: 1.0,
          confidence: 100,
          method: 'lexical'
        };
      }
      
      // Check synonyms
      const synonymScore = this.calculateSynonymSimilarity(normalizedTerm1, normalizedTerm2);
      if (synonymScore > 0) {
        return {
          score: synonymScore,
          confidence: 90,
          method: 'lexical'
        };
      }
      
      // Calculate lexical similarity
      const lexicalScore = this.calculateLexicalSimilarity(normalizedTerm1, normalizedTerm2);
      
      // In a full implementation, this would also include:
      // - Word embedding similarity
      // - Contextual similarity using transformers
      // - Domain-specific similarity models
      
      return {
        score: lexicalScore,
        confidence: Math.min(80, lexicalScore * 100),
        method: 'lexical'
      };
      
    } catch (error) {
      console.error('Similarity calculation failed:', error);
      return {
        score: 0,
        confidence: 0,
        method: 'lexical'
      };
    }
  }
  
  /**
   * Expand keywords with synonyms and related terms
   */
  expandKeywords(keywords: string[]): ExpandedKeyword[] {
    return keywords.map(keyword => {
      const normalized = this.normalizeText(keyword);
      const synonyms = this.getSynonyms(normalized);
      const relatedTerms = this.getRelatedTerms(normalized);
      const contextualVariations = this.getContextualVariations(normalized);
      
      return {
        original: keyword,
        synonyms,
        relatedTerms,
        contextualVariations
      };
    });
  }
  
  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const normalized = this.normalizeText(text);
    
    // Extract technical terms, skills, and important phrases
    const keywords: string[] = [];
    
    // Common technical skills patterns
    const skillPatterns = [
      /\b(?:javascript|python|java|react|angular|vue|node\.?js|typescript)\b/gi,
      /\b(?:aws|azure|gcp|docker|kubernetes|jenkins|git)\b/gi,
      /\b(?:sql|nosql|mongodb|postgresql|mysql|redis)\b/gi,
      /\b(?:api|rest|graphql|microservices|devops|ci\/cd)\b/gi,
      /\b(?:machine learning|artificial intelligence|data science|analytics)\b/gi,
      /\b(?:frontend|backend|fullstack|full.stack)\b/gi
    ];
    
    skillPatterns.forEach(pattern => {
      const matches = normalized.match(pattern);
      if (matches) {
        keywords.push(...matches.map(match => match.toLowerCase()));
      }
    });
    
    // Extract multi-word phrases
    const phrases = this.extractPhrases(normalized);
    keywords.push(...phrases);
    
    // Remove duplicates and return
    return [...new Set(keywords)];
  }
  
  /**
   * Extract important phrases from text
   */
  private extractPhrases(text: string): string[] {
    const phrases: string[] = [];
    
    // Common multi-word technical terms
    const phrasePatterns = [
      /\b(?:machine learning|artificial intelligence|data science|software engineering|web development|mobile development|cloud computing|database design|system architecture|project management|agile methodology|scrum master|product management|user experience|user interface|quality assurance|test automation|continuous integration|continuous deployment|version control|code review|performance optimization|security testing|load balancing|microservices architecture|api development|frontend development|backend development|full stack development|devops engineering|site reliability engineering|data analysis|business intelligence|technical writing|software testing|system administration|network security|cybersecurity|information security)\b/gi
    ];
    
    phrasePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        phrases.push(...matches.map(match => match.toLowerCase()));
      }
    });
    
    return phrases;
  }
  
  /**
   * Find best match for a keyword in resume text
   */
  private findBestMatch(jdKeyword: string, resumeKeywords: string[], resumeText: string): SemanticMatch | null {
    let bestMatch: SemanticMatch | null = null;
    let bestScore = 0;
    
    resumeKeywords.forEach(resumeKeyword => {
      const similarity = this.calculateSimilarity(jdKeyword, resumeKeyword);
      
      if (similarity.score > bestScore && similarity.score >= this.RELATED_MATCH_THRESHOLD) {
        const matchType = this.determineMatchType(similarity.score);
        
        bestMatch = {
          resumeTerm: resumeKeyword,
          jdTerm: jdKeyword,
          similarity: similarity.score,
          matchType,
          confidence: similarity.confidence,
          explanation: this.generateMatchExplanation(jdKeyword, resumeKeyword, matchType, similarity.score)
        };
        
        bestScore = similarity.score;
      }
    });
    
    return bestMatch;
  }
  
  /**
   * Determine match type based on similarity score
   */
  private determineMatchType(score: number): 'exact' | 'semantic' | 'related' {
    if (score >= this.EXACT_MATCH_THRESHOLD) return 'exact';
    if (score >= this.SEMANTIC_MATCH_THRESHOLD) return 'semantic';
    return 'related';
  }
  
  /**
   * Generate explanation for a match
   */
  private generateMatchExplanation(
    jdTerm: string, 
    resumeTerm: string, 
    matchType: 'exact' | 'semantic' | 'related',
    score: number
  ): string {
    if (matchType === 'exact') {
      return `Exact match: "${resumeTerm}" directly matches "${jdTerm}"`;
    } else if (matchType === 'semantic') {
      return `Semantic match: "${resumeTerm}" is conceptually similar to "${jdTerm}" (${Math.round(score * 100)}% similarity)`;
    } else {
      return `Related match: "${resumeTerm}" is related to "${jdTerm}" (${Math.round(score * 100)}% similarity)`;
    }
  }
  
  /**
   * Calculate synonym-based similarity
   */
  private calculateSynonymSimilarity(term1: string, term2: string): number {
    // Check if term1 has synonyms that match term2
    const synonyms1 = this.getSynonyms(term1);
    if (synonyms1.includes(term2)) {
      return 0.9; // High similarity for synonyms
    }
    
    // Check if term2 has synonyms that match term1
    const synonyms2 = this.getSynonyms(term2);
    if (synonyms2.includes(term1)) {
      return 0.9;
    }
    
    // Check for cross-synonym matches
    const commonSynonyms = synonyms1.filter(syn => synonyms2.includes(syn));
    if (commonSynonyms.length > 0) {
      return 0.85; // Slightly lower for indirect synonym matches
    }
    
    return 0;
  }
  
  /**
   * Calculate lexical similarity using string metrics
   */
  private calculateLexicalSimilarity(term1: string, term2: string): number {
    // Jaccard similarity for word sets
    const words1 = new Set(term1.split(/\s+/));
    const words2 = new Set(term2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    const jaccardSimilarity = intersection.size / union.size;
    
    // Edit distance similarity
    const editDistance = this.calculateEditDistance(term1, term2);
    const maxLength = Math.max(term1.length, term2.length);
    const editSimilarity = maxLength > 0 ? 1 - (editDistance / maxLength) : 0;
    
    // Combine similarities
    return Math.max(jaccardSimilarity, editSimilarity * 0.7);
  }
  
  /**
   * Calculate edit distance between two strings
   */
  private calculateEditDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  /**
   * Get synonyms for a term
   */
  private getSynonyms(term: string): string[] {
    const normalized = term.toLowerCase();
    
    // Check direct synonyms
    if (this.SKILL_SYNONYMS.has(normalized)) {
      return this.SKILL_SYNONYMS.get(normalized) || [];
    }
    
    // Check if term is a synonym of another term
    for (const [key, synonyms] of this.SKILL_SYNONYMS.entries()) {
      if (synonyms.includes(normalized)) {
        return [key, ...synonyms.filter(syn => syn !== normalized)];
      }
    }
    
    return [];
  }
  
  /**
   * Get related terms for a keyword
   */
  private getRelatedTerms(term: string): string[] {
    const related: string[] = [];
    
    // Domain-specific related terms
    const relatedTermsMap = new Map([
      ['javascript', ['web development', 'frontend', 'programming']],
      ['python', ['data science', 'backend', 'automation', 'scripting']],
      ['react', ['frontend', 'ui development', 'component-based']],
      ['aws', ['cloud computing', 'infrastructure', 'scalability']],
      ['docker', ['containerization', 'deployment', 'microservices']],
      ['sql', ['database', 'data management', 'queries']],
      ['api', ['integration', 'web services', 'backend']]
    ]);
    
    const normalized = term.toLowerCase();
    if (relatedTermsMap.has(normalized)) {
      related.push(...(relatedTermsMap.get(normalized) || []));
    }
    
    return related;
  }
  
  /**
   * Get contextual variations of a term
   */
  private getContextualVariations(term: string): string[] {
    const variations: string[] = [];
    
    // Add common variations
    variations.push(
      term.toLowerCase(),
      term.toUpperCase(),
      this.capitalizeFirst(term)
    );
    
    // Add with/without common suffixes
    if (!term.endsWith('ing')) {
      variations.push(term + 'ing');
    }
    
    if (!term.endsWith('er')) {
      variations.push(term + 'er');
    }
    
    // Add plural forms
    if (!term.endsWith('s')) {
      variations.push(term + 's');
    }
    
    return [...new Set(variations)];
  }
  
  /**
   * Normalize text for processing
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s.-]/g, ' ') // Replace special chars with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
  
  /**
   * Capitalize first letter of a string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  
  /**
   * Get match weight based on match type
   */
  getMatchWeight(matchType: 'exact' | 'semantic' | 'related'): number {
    switch (matchType) {
      case 'exact': return 1.0; // 100%
      case 'semantic': return 0.85; // 85% (80-90% range)
      case 'related': return 0.6; // 60% (50-70% range)
      default: return 0;
    }
  }
  
  /**
   * Filter matches by confidence threshold
   */
  filterMatchesByConfidence(matches: SemanticMatch[], minConfidence: number = 70): SemanticMatch[] {
    return matches.filter(match => match.confidence >= minConfidence);
  }
  
  /**
   * Group matches by type
   */
  groupMatchesByType(matches: SemanticMatch[]): {
    exact: SemanticMatch[];
    semantic: SemanticMatch[];
    related: SemanticMatch[];
  } {
    return {
      exact: matches.filter(m => m.matchType === 'exact'),
      semantic: matches.filter(m => m.matchType === 'semantic'),
      related: matches.filter(m => m.matchType === 'related')
    };
  }
}

// Export singleton instance
export const semanticMatchingService = new SemanticMatchingService();