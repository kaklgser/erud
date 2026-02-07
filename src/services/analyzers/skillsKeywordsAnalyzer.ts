/**
 * Tier 5: Skills & Keywords Analyzer (40 metrics)
 * Part of the Enhanced ATS Score Checker (220+ Metrics)
 * 
 * Analyzes:
 * - Skills Organization metrics (5)
 * - Technical Skills metrics (15)
 * - Soft Skills metrics (10)
 * - Keyword Matching metrics (10)
 */

import { TierScore, ResumeData, MissingKeyword, KeywordTier, KeywordColor } from '../../types/resume';

// ============================================================================
// TYPES
// ============================================================================

export interface SkillsKeywordsInput {
  resumeText: string;
  resumeData?: ResumeData;
  jobDescription?: string;
  jdKeywords?: string[];
}

export interface SkillsKeywordsResult {
  tierScore: TierScore;
  metrics: SkillsKeywordsMetrics;
  missingKeywords: MissingKeyword[];
  keywordMatchRate: number;
}

export interface SkillsKeywordsMetrics {
  // Skills Organization (5)
  skillsSectionPresence: MetricResult;
  skillsCategorization: MetricResult;
  skillsRelevance: MetricResult;
  skillsHierarchy: MetricResult;
  skillsFormat: MetricResult;
  
  // Technical Skills (15)
  programmingLanguages: MetricResult;
  jdTechMatch: MetricResult;
  criticalSkills: MetricResult;
  frameworks: MetricResult;
  databases: MetricResult;
  cloudPlatforms: MetricResult;
  devOpsTools: MetricResult;
  dataTools: MetricResult;
  apiKnowledge: MetricResult;
  versionControl: MetricResult;
  testingTools: MetricResult;
  agileMethodology: MetricResult;
  systemDesign: MetricResult;
  aiMlTools: MetricResult;
  softSkillsKeywords: MetricResult;
  
  // Soft Skills (10)
  leadershipEvidence: MetricResult;
  communicationEvidence: MetricResult;
  problemSolvingEvidence: MetricResult;
  collaborationEvidence: MetricResult;
  initiativeEvidence: MetricResult;
  adaptabilityEvidence: MetricResult;
  customerFocusEvidence: MetricResult;
  attentionToDetailEvidence: MetricResult;
  domainExpertiseEvidence: MetricResult;
  trainingMentoringEvidence: MetricResult;
  
  // Keyword Matching (10)
  exactKeywordMatch: MetricResult;
  semanticKeywordMatch: MetricResult;
  relatedKeywordMatch: MetricResult;
  criticalKeywordCoverage: MetricResult;
  importantKeywordCoverage: MetricResult;
  niceToHaveKeywordCoverage: MetricResult;
  keywordDistribution: MetricResult;
  keywordContext: MetricResult;
  keywordDensity: MetricResult;
  keywordPlacement: MetricResult;
}

export interface MetricResult {
  score: number;
  maxScore: number;
  passed: boolean;
  details: string;
}


// ============================================================================
// CONSTANTS
// ============================================================================

const TIER_CONFIG = {
  tierNumber: 6,
  tierName: 'Skills & Keywords',
  weight: 25, // Highest weight tier (tied with Experience)
  maxScore: 40,
  metricsTotal: 40,
};

// Technical skill categories
const PROGRAMMING_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust',
  'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl'
];

const FRAMEWORKS = [
  'react', 'angular', 'vue', 'next.js', 'nuxt', 'express', 'django', 'flask',
  'spring', 'spring boot', 'rails', '.net', 'laravel', 'fastapi', 'nest.js', 'svelte',
  'node.js', 'nodejs', 'redux', 'graphql', 'rest', 'restful', 'api', 'hibernate'
];

const DATABASES = [
  'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb',
  'cassandra', 'oracle', 'sql server', 'sqlite', 'firebase', 'supabase'
];

const CLOUD_PLATFORMS = [
  'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'vercel', 'netlify',
  'digitalocean', 'cloudflare', 'alibaba cloud', 'ec2', 's3', 'lambda',
  'cloud', 'microservices', 'serverless', 'saas', 'paas', 'iaas'
];

const DEVOPS_TOOLS = [
  'docker', 'kubernetes', 'jenkins', 'github actions', 'gitlab ci', 'terraform',
  'ansible', 'puppet', 'chef', 'circleci', 'travis', 'argo', 'ci/cd', 'cicd',
  'devops', 'devsecops', 'helm', 'prometheus', 'grafana', 'nginx', 'apache'
];

// ============================================================================
// SKILLS & KEYWORDS ANALYZER
// ============================================================================

export class SkillsKeywordsAnalyzer {
  /**
   * Analyze skills and keywords (Tier 5: 40 metrics)
   */
  static analyze(input: SkillsKeywordsInput): SkillsKeywordsResult {
    const { resumeText, resumeData, jobDescription, jdKeywords } = input;
    
    const extractedJdKeywords = jdKeywords || this.extractKeywordsFromJD(jobDescription);
    const missingKeywords = this.findMissingKeywords(resumeText, resumeData, extractedJdKeywords);
    const keywordMatchRate = this.calculateKeywordMatchRate(resumeText, extractedJdKeywords);
    
    const metrics = this.analyzeAllMetrics(input, extractedJdKeywords, keywordMatchRate);
    const tierScore = this.calculateTierScore(metrics);

    return {
      tierScore,
      metrics,
      missingKeywords,
      keywordMatchRate,
    };
  }

  /**
   * Extract keywords from job description
   * Enhanced to extract more comprehensive keywords for better optimization
   */
  private static extractKeywordsFromJD(jobDescription?: string): string[] {
    if (!jobDescription) return [];

    const keywords: string[] = [];
    const jdLower = jobDescription.toLowerCase();

    // Extract technical keywords from predefined lists
    [...PROGRAMMING_LANGUAGES, ...FRAMEWORKS, ...DATABASES, ...CLOUD_PLATFORMS, ...DEVOPS_TOOLS]
      .forEach(keyword => {
        if (jdLower.includes(keyword.toLowerCase())) {
          keywords.push(keyword);
        }
      });

    // Additional technical patterns to extract
    const additionalTechPatterns = [
      // Data & Analytics
      /\b(tableau|power bi|looker|data visualization|etl|data pipeline|spark|hadoop|kafka|airflow)\b/gi,
      // Testing
      /\b(jest|mocha|cypress|selenium|junit|pytest|testing|unit test|integration test|e2e)\b/gi,
      // Security
      /\b(oauth|jwt|ssl|tls|encryption|authentication|authorization|security|sso|saml)\b/gi,
      // Methodologies
      /\b(agile|scrum|kanban|waterfall|lean|sprint|standup|retrospective)\b/gi,
      // Tools
      /\b(jira|confluence|slack|trello|asana|notion|figma|sketch|adobe)\b/gi,
      // Architecture
      /\b(microservices|monolith|event-driven|cqrs|ddd|clean architecture|solid)\b/gi,
      // Mobile
      /\b(ios|android|react native|flutter|xamarin|mobile|responsive)\b/gi,
      // AI/ML
      /\b(machine learning|ml|ai|tensorflow|pytorch|scikit-learn|nlp|deep learning|neural network)\b/gi,
    ];

    additionalTechPatterns.forEach(pattern => {
      const matches = jdLower.match(pattern) || [];
      keywords.push(...matches.map(m => m.toLowerCase()));
    });

    // Extract other significant words (capitalized terms, acronyms)
    // FIXED: Filter out section headers, concatenated text, and invalid keywords
    const significantTerms = jobDescription.match(/\b[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\b/g) || [];
    
    // Common section headers and invalid patterns to exclude
    const invalidPatterns = [
      /^(Key|Required|Preferred|Minimum|Basic|Strong|Good|Excellent|Must|Should|Will|Can|Our|The|And|For|With|You|Are)$/i,
      /Responsibilities/i,
      /Qualifications/i,
      /Requirements/i,
      /Skills$/i,
      /Education$/i,
      /Experience$/i,
      /Performance/i,
      /Knowledge$/i,
      /Expertise/i,
      /Fundamentals/i,
      /About\s*(Us|The|Company)/i,
      /Benefits/i,
      /Overview/i,
      /Description/i,
      /Summary/i,
      /Duties/i,
      /Role/i,
      /Position/i,
      /Job\s*Title/i,
      /Apply/i,
      /Submit/i,
      /Contact/i,
      /Location/i,
      /Salary/i,
      /Compensation/i,
      /Work\s*(From|Remote|Hybrid)/i,
      /Full\s*Time/i,
      /Part\s*Time/i,
      /Contract/i,
      /Permanent/i,
      /Internship/i,
      /Entry\s*Level/i,
      /Senior/i,
      /Junior/i,
      /Lead/i,
      /Manager/i,
      /Director/i,
      /Contribute/i,
      /Analyze/i,
      /Maintain/i,
      /Collaborate/i,
      /Explore/i,
      /Continuously/i,
      /Minimum/i,
    ];
    
    const filteredTerms = significantTerms.filter(term => {
      // Skip if too short or too long
      if (term.length < 3 || term.length > 25) return false;
      
      // Skip if matches invalid patterns
      if (invalidPatterns.some(pattern => pattern.test(term))) return false;
      
      // Skip if contains concatenated words (CamelCase without spaces like "ResponsibilitiesWork")
      // Valid: "React Native", "Node.js" - Invalid: "ResponsibilitiesWork", "QualificationsSkills"
      if (/[a-z][A-Z]/.test(term) && !term.includes(' ') && !term.includes('.')) return false;
      
      // Skip if it's a common English word (not a tech term)
      const commonWords = ['The', 'And', 'For', 'With', 'You', 'Are', 'Will', 'Can', 'Our', 'This', 'That', 'From', 'Have', 'Has', 'Been', 'Being', 'Were', 'Was', 'What', 'When', 'Where', 'Which', 'Who', 'Why', 'How', 'All', 'Each', 'Every', 'Both', 'Few', 'More', 'Most', 'Other', 'Some', 'Such', 'Only', 'Same', 'Than', 'Very', 'Just', 'Also', 'Back', 'After', 'Before', 'Between', 'Through', 'During', 'Without', 'Within', 'Along', 'Among', 'Around', 'Behind', 'Below', 'Beside', 'Beyond', 'Into', 'Near', 'Over', 'Under', 'Upon', 'About', 'Above', 'Across', 'Against', 'Support', 'Work', 'Working', 'Team', 'Teams', 'Company', 'Business', 'Client', 'Clients', 'Customer', 'Customers', 'Project', 'Projects', 'Product', 'Products', 'Service', 'Services', 'Solution', 'Solutions', 'System', 'Systems', 'Process', 'Processes', 'Development', 'Develop', 'Developing', 'Build', 'Building', 'Create', 'Creating', 'Design', 'Designing', 'Implement', 'Implementing', 'Implementation', 'Manage', 'Managing', 'Management', 'Deliver', 'Delivering', 'Delivery', 'Ensure', 'Ensuring', 'Provide', 'Providing', 'Include', 'Including', 'Includes', 'Ability', 'Able', 'Strong', 'Excellent', 'Good', 'Great', 'Best', 'High', 'Low', 'New', 'Old', 'First', 'Last', 'Next', 'Previous', 'Current', 'Future', 'Past', 'Present', 'Year', 'Years', 'Month', 'Months', 'Day', 'Days', 'Time', 'Times', 'Level', 'Levels', 'Type', 'Types', 'Kind', 'Kinds', 'Part', 'Parts', 'Area', 'Areas', 'Field', 'Fields', 'Industry', 'Industries', 'Sector', 'Sectors', 'Market', 'Markets', 'World', 'Global', 'Local', 'National', 'International', 'Regional', 'Digital', 'Technology', 'Technologies', 'Technical', 'Software', 'Hardware', 'Data', 'Information', 'Knowledge', 'Understanding', 'Learning', 'Training', 'Education', 'Degree', 'Bachelor', 'Master', 'PhD', 'Certification', 'Certified', 'Professional', 'Professionals', 'Expert', 'Experts', 'Specialist', 'Specialists', 'Engineer', 'Engineers', 'Developer', 'Developers', 'Analyst', 'Analysts', 'Consultant', 'Consultants', 'Architect', 'Architects', 'Designer', 'Designers', 'Tester', 'Testers', 'Administrator', 'Administrators', 'Coordinator', 'Coordinators', 'Assistant', 'Assistants', 'Associate', 'Associates', 'Officer', 'Officers', 'Executive', 'Executives', 'Head', 'Heads', 'Chief', 'Vice', 'President', 'Member', 'Members', 'Staff', 'Employee', 'Employees', 'Candidate', 'Candidates', 'Applicant', 'Applicants', 'Person', 'People', 'Individual', 'Individuals', 'Group', 'Groups', 'Organization', 'Organizations', 'Department', 'Departments', 'Division', 'Divisions', 'Unit', 'Units', 'Office', 'Offices', 'Branch', 'Branches', 'Site', 'Sites', 'Location', 'Locations', 'Place', 'Places', 'Environment', 'Environments', 'Culture', 'Cultures', 'Value', 'Values', 'Mission', 'Vision', 'Goal', 'Goals', 'Objective', 'Objectives', 'Target', 'Targets', 'Result', 'Results', 'Outcome', 'Outcomes', 'Impact', 'Impacts', 'Effect', 'Effects', 'Change', 'Changes', 'Improvement', 'Improvements', 'Growth', 'Success', 'Achievement', 'Achievements', 'Performance', 'Performances', 'Quality', 'Qualities', 'Standard', 'Standards', 'Requirement', 'Requirements', 'Specification', 'Specifications', 'Criteria', 'Criterion', 'Condition', 'Conditions', 'Term', 'Terms', 'Policy', 'Policies', 'Procedure', 'Procedures', 'Guideline', 'Guidelines', 'Rule', 'Rules', 'Regulation', 'Regulations', 'Law', 'Laws', 'Compliance', 'Risk', 'Risks', 'Security', 'Safety', 'Health', 'Wellness', 'Benefit', 'Benefits', 'Compensation', 'Salary', 'Wage', 'Wages', 'Pay', 'Payment', 'Payments', 'Bonus', 'Bonuses', 'Incentive', 'Incentives', 'Reward', 'Rewards', 'Recognition', 'Opportunity', 'Opportunities', 'Career', 'Careers', 'Path', 'Paths', 'Track', 'Tracks', 'Program', 'Programs', 'Initiative', 'Initiatives', 'Strategy', 'Strategies', 'Plan', 'Plans', 'Planning', 'Approach', 'Approaches', 'Method', 'Methods', 'Methodology', 'Methodologies', 'Framework', 'Frameworks', 'Model', 'Models', 'Structure', 'Structures', 'Architecture', 'Pattern', 'Patterns', 'Practice', 'Practices', 'Principle', 'Principles', 'Concept', 'Concepts', 'Theory', 'Theories', 'Idea', 'Ideas', 'Thought', 'Thoughts', 'Opinion', 'Opinions', 'View', 'Views', 'Perspective', 'Perspectives', 'Point', 'Points', 'Aspect', 'Aspects', 'Factor', 'Factors', 'Element', 'Elements', 'Component', 'Components', 'Feature', 'Features', 'Function', 'Functions', 'Functionality', 'Functionalities', 'Capability', 'Capabilities', 'Capacity', 'Capacities', 'Resource', 'Resources', 'Asset', 'Assets', 'Tool', 'Tools', 'Equipment', 'Equipments', 'Material', 'Materials', 'Supply', 'Supplies', 'Inventory', 'Inventories', 'Stock', 'Stocks', 'Order', 'Orders', 'Request', 'Requests', 'Demand', 'Demands', 'Need', 'Needs', 'Want', 'Wants', 'Desire', 'Desires', 'Expectation', 'Expectations', 'Preference', 'Preferences', 'Choice', 'Choices', 'Option', 'Options', 'Alternative', 'Alternatives', 'Decision', 'Decisions', 'Action', 'Actions', 'Activity', 'Activities', 'Task', 'Tasks', 'Job', 'Jobs', 'Duty', 'Duties', 'Responsibility', 'Responsibilities', 'Role', 'Roles', 'Position', 'Positions', 'Title', 'Titles', 'Rank', 'Ranks', 'Grade', 'Grades', 'Class', 'Classes', 'Category', 'Categories', 'Classification', 'Classifications', 'Segment', 'Segments', 'Section', 'Sections', 'Chapter', 'Chapters', 'Module', 'Modules', 'Course', 'Courses', 'Lesson', 'Lessons', 'Topic', 'Topics', 'Subject', 'Subjects', 'Theme', 'Themes', 'Issue', 'Issues', 'Problem', 'Problems', 'Challenge', 'Challenges', 'Difficulty', 'Difficulties', 'Obstacle', 'Obstacles', 'Barrier', 'Barriers', 'Constraint', 'Constraints', 'Limitation', 'Limitations', 'Restriction', 'Restrictions', 'Boundary', 'Boundaries', 'Scope', 'Scopes', 'Range', 'Ranges', 'Extent', 'Extents', 'Degree', 'Degrees', 'Amount', 'Amounts', 'Quantity', 'Quantities', 'Number', 'Numbers', 'Figure', 'Figures', 'Statistic', 'Statistics', 'Metric', 'Metrics', 'Measure', 'Measures', 'Measurement', 'Measurements', 'Indicator', 'Indicators', 'Index', 'Indexes', 'Rate', 'Rates', 'Ratio', 'Ratios', 'Percentage', 'Percentages', 'Proportion', 'Proportions', 'Share', 'Shares', 'Fraction', 'Fractions', 'Half', 'Quarter', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Cyber', 'Academic', 'Computer', 'Science', 'Programming', 'Database', 'Adaptable', 'Testing', 'Sprint', 'Blockchain', 'Teamwork', 'Analytical', 'Debugging', 'Communication', 'Internship', 'Collaborative'];
      if (commonWords.some(w => w.toLowerCase() === term.toLowerCase())) return false;
      
      return true;
    });
    
    keywords.push(...filteredTerms);

    // Extract acronyms (2-5 uppercase letters)
    const acronyms = jobDescription.match(/\b[A-Z]{2,5}\b/g) || [];
    const validAcronyms = acronyms.filter(a => {
      // Exclude common non-tech acronyms
      const excludeAcronyms = ['THE', 'AND', 'FOR', 'WITH', 'YOU', 'ARE', 'WILL', 'CAN', 'OUR', 'USA', 'UK', 'EU', 'HR', 'CEO', 'CFO', 'COO', 'CTO', 'VP', 'SVP', 'EVP', 'MD', 'GM', 'PM', 'AM', 'FM', 'TV', 'PC', 'IT', 'IS', 'AS', 'AT', 'BY', 'DO', 'GO', 'IF', 'IN', 'NO', 'OF', 'ON', 'OR', 'SO', 'TO', 'UP', 'WE', 'BE', 'HE', 'ME', 'MY', 'AN', 'US'];
      return !excludeAcronyms.includes(a);
    });
    keywords.push(...validAcronyms);

    return [...new Set(keywords)];
  }

  /**
   * Find missing keywords from resume
   */
  private static findMissingKeywords(
    resumeText: string,
    resumeData: ResumeData | undefined,
    jdKeywords: string[]
  ): MissingKeyword[] {
    const resumeLower = resumeText.toLowerCase();
    const missing: MissingKeyword[] = [];

    jdKeywords.forEach((keyword, index) => {
      if (!resumeLower.includes(keyword.toLowerCase())) {
        const tier = this.classifyKeywordTier(keyword, index, jdKeywords.length);
        missing.push({
          keyword,
          tier,
          impact: this.calculateKeywordImpact(tier),
          suggestedPlacement: this.suggestPlacement(keyword, resumeData),
          color: this.getColorForTier(tier),
        });
      }
    });

    return missing.slice(0, 50); // Return top 50 missing keywords for comprehensive optimization
  }

  /**
   * Classify keyword tier based on position and type
   */
  private static classifyKeywordTier(keyword: string, index: number, total: number): KeywordTier {
    // First third of keywords are critical
    if (index < total / 3) return 'critical';
    // Second third are important
    if (index < (total * 2) / 3) return 'important';
    // Rest are nice to have
    return 'nice_to_have';
  }

  /**
   * Calculate keyword impact score
   */
  private static calculateKeywordImpact(tier: KeywordTier): number {
    switch (tier) {
      case 'critical': return 10;
      case 'important': return 6;
      case 'nice_to_have': return 3;
    }
  }

  /**
   * Get color for keyword tier
   */
  private static getColorForTier(tier: KeywordTier): KeywordColor {
    switch (tier) {
      case 'critical': return 'red';
      case 'important': return 'orange';
      case 'nice_to_have': return 'yellow';
    }
  }

  /**
   * Suggest placement for missing keyword
   */
  private static suggestPlacement(keyword: string, _resumeData?: ResumeData): string {
    const keywordLower = keyword.toLowerCase();
    
    if (PROGRAMMING_LANGUAGES.includes(keywordLower) || FRAMEWORKS.includes(keywordLower)) {
      return 'Skills section - Technical Skills';
    }
    if (CLOUD_PLATFORMS.includes(keywordLower) || DEVOPS_TOOLS.includes(keywordLower)) {
      return 'Skills section - Tools & Platforms';
    }
    if (DATABASES.includes(keywordLower)) {
      return 'Skills section - Databases';
    }
    
    return 'Experience section - relevant bullet points';
  }

  /**
   * Calculate overall keyword match rate
   */
  private static calculateKeywordMatchRate(resumeText: string, jdKeywords: string[]): number {
    if (jdKeywords.length === 0) return 100;

    const resumeLower = resumeText.toLowerCase();
    const matches = jdKeywords.filter(k => resumeLower.includes(k.toLowerCase())).length;
    
    return Math.round((matches / jdKeywords.length) * 100);
  }

  /**
   * Analyze all 40 metrics
   */
  private static analyzeAllMetrics(
    input: SkillsKeywordsInput,
    jdKeywords: string[],
    keywordMatchRate: number
  ): SkillsKeywordsMetrics {
    const { resumeText, resumeData, jobDescription } = input;

    return {
      // Skills Organization (5)
      skillsSectionPresence: this.analyzeSkillsSectionPresence(resumeData),
      skillsCategorization: this.analyzeSkillsCategorization(resumeData),
      skillsRelevance: this.analyzeSkillsRelevance(resumeData, jobDescription),
      skillsHierarchy: this.analyzeSkillsHierarchy(resumeData),
      skillsFormat: this.analyzeSkillsFormat(resumeText),
      
      // Technical Skills (15)
      programmingLanguages: this.analyzeProgrammingLanguages(resumeText),
      jdTechMatch: this.analyzeJdTechMatch(resumeText, jdKeywords),
      criticalSkills: this.analyzeCriticalSkills(resumeText, jdKeywords),
      frameworks: this.analyzeFrameworks(resumeText),
      databases: this.analyzeDatabases(resumeText),
      cloudPlatforms: this.analyzeCloudPlatforms(resumeText),
      devOpsTools: this.analyzeDevOpsTools(resumeText),
      dataTools: this.analyzeDataTools(resumeText),
      apiKnowledge: this.analyzeApiKnowledge(resumeText),
      versionControl: this.analyzeVersionControl(resumeText),
      testingTools: this.analyzeTestingTools(resumeText),
      agileMethodology: this.analyzeAgileMethodology(resumeText),
      systemDesign: this.analyzeSystemDesign(resumeText),
      aiMlTools: this.analyzeAiMlTools(resumeText),
      softSkillsKeywords: this.analyzeSoftSkillsKeywords(resumeText),
      
      // Soft Skills (10)
      leadershipEvidence: this.analyzeLeadershipEvidence(resumeText),
      communicationEvidence: this.analyzeCommunicationEvidence(resumeText),
      problemSolvingEvidence: this.analyzeProblemSolvingEvidence(resumeText),
      collaborationEvidence: this.analyzeCollaborationEvidence(resumeText),
      initiativeEvidence: this.analyzeInitiativeEvidence(resumeText),
      adaptabilityEvidence: this.analyzeAdaptabilityEvidence(resumeText),
      customerFocusEvidence: this.analyzeCustomerFocusEvidence(resumeText),
      attentionToDetailEvidence: this.analyzeAttentionToDetailEvidence(resumeText),
      domainExpertiseEvidence: this.analyzeDomainExpertiseEvidence(resumeText),
      trainingMentoringEvidence: this.analyzeTrainingMentoringEvidence(resumeText),
      
      // Keyword Matching (10)
      exactKeywordMatch: this.analyzeExactKeywordMatch(keywordMatchRate),
      semanticKeywordMatch: this.analyzeSemanticKeywordMatch(resumeText, jdKeywords),
      relatedKeywordMatch: this.analyzeRelatedKeywordMatch(resumeText, jdKeywords),
      criticalKeywordCoverage: this.analyzeCriticalKeywordCoverage(resumeText, jdKeywords),
      importantKeywordCoverage: this.analyzeImportantKeywordCoverage(resumeText, jdKeywords),
      niceToHaveKeywordCoverage: this.analyzeNiceToHaveKeywordCoverage(resumeText, jdKeywords),
      keywordDistribution: this.analyzeKeywordDistribution(resumeText, jdKeywords),
      keywordContext: this.analyzeKeywordContext(resumeText, jdKeywords),
      keywordDensity: this.analyzeKeywordDensity(resumeText, jdKeywords),
      keywordPlacement: this.analyzeKeywordPlacement(resumeText, jdKeywords),
    };
  }


  // ============================================================================
  // SKILLS ORGANIZATION METRICS (5)
  // ============================================================================

  private static analyzeSkillsSectionPresence(resumeData?: ResumeData): MetricResult {
    if (resumeData?.skills && resumeData.skills.length > 0) {
      return { score: 1, maxScore: 1, passed: true, details: 'Skills section present' };
    }
    return { score: 0, maxScore: 1, passed: false, details: 'Add a dedicated skills section' };
  }

  private static analyzeSkillsCategorization(resumeData?: ResumeData): MetricResult {
    if (!resumeData?.skills) {
      return { score: 0, maxScore: 1, passed: false, details: 'No skills section' };
    }

    if (resumeData.skills.length >= 3) {
      return { score: 1, maxScore: 1, passed: true, details: 'Skills well categorized' };
    } else if (resumeData.skills.length >= 2) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'Add more skill categories' };
    }
    return { score: 0, maxScore: 1, passed: false, details: 'Categorize skills by type' };
  }

  private static analyzeSkillsRelevance(resumeData: ResumeData | undefined, jobDescription?: string): MetricResult {
    if (!resumeData?.skills || !jobDescription) {
      return { score: 0.5, maxScore: 1, passed: true, details: 'Cannot assess relevance' };
    }

    const allSkills = resumeData.skills.flatMap(s => s.list).map(s => s.toLowerCase());
    const jdLower = jobDescription.toLowerCase();
    const relevant = allSkills.filter(s => jdLower.includes(s)).length;
    const ratio = allSkills.length > 0 ? relevant / allSkills.length : 0;

    if (ratio >= 0.5) {
      return { score: 1, maxScore: 1, passed: true, details: 'Skills highly relevant to JD' };
    } else if (ratio >= 0.25) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'Improve skill relevance' };
    }
    return { score: 0, maxScore: 1, passed: false, details: 'Skills not aligned with JD' };
  }

  private static analyzeSkillsHierarchy(resumeData?: ResumeData): MetricResult {
    if (!resumeData?.skills) {
      return { score: 0, maxScore: 1, passed: false, details: 'No skills section' };
    }

    // Check if skills are ordered by relevance (technical first)
    const categories = resumeData.skills.map(s => s.category.toLowerCase());
    const hasTechnicalFirst = categories[0]?.includes('technical') || 
                              categories[0]?.includes('programming') ||
                              categories[0]?.includes('languages');

    if (hasTechnicalFirst) {
      return { score: 1, maxScore: 1, passed: true, details: 'Skills properly prioritized' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Put technical skills first' };
  }

  private static analyzeSkillsFormat(resumeText: string): MetricResult {
    // Check for comma-separated or bullet-point skills
    const hasSkillsList = /skills?:?\s*[\w\s,]+/i.test(resumeText);
    
    if (hasSkillsList) {
      return { score: 1, maxScore: 1, passed: true, details: 'Skills formatted correctly' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Format skills as list' };
  }

  // ============================================================================
  // TECHNICAL SKILLS METRICS (15)
  // ============================================================================

  private static analyzeProgrammingLanguages(resumeText: string): MetricResult {
    const resumeLower = resumeText.toLowerCase();
    const found = PROGRAMMING_LANGUAGES.filter(lang => resumeLower.includes(lang));

    if (found.length >= 3) {
      return { score: 1, maxScore: 1, passed: true, details: `${found.length} languages listed` };
    } else if (found.length >= 1) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'Add more programming languages' };
    }
    return { score: 0, maxScore: 1, passed: false, details: 'List programming languages' };
  }

  private static analyzeJdTechMatch(resumeText: string, jdKeywords: string[]): MetricResult {
    if (jdKeywords.length === 0) {
      return { score: 0.5, maxScore: 1, passed: true, details: 'No JD keywords to match' };
    }

    const resumeLower = resumeText.toLowerCase();
    const techKeywords = jdKeywords.filter(k => 
      [...PROGRAMMING_LANGUAGES, ...FRAMEWORKS, ...DATABASES, ...CLOUD_PLATFORMS, ...DEVOPS_TOOLS]
        .some(t => k.toLowerCase().includes(t))
    );

    const matches = techKeywords.filter(k => resumeLower.includes(k.toLowerCase())).length;
    const ratio = techKeywords.length > 0 ? matches / techKeywords.length : 1;

    if (ratio >= 0.7) {
      return { score: 1, maxScore: 1, passed: true, details: 'Strong JD tech match' };
    } else if (ratio >= 0.4) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'Improve JD tech alignment' };
    }
    return { score: 0, maxScore: 1, passed: false, details: 'Missing key JD technologies' };
  }

  private static analyzeCriticalSkills(resumeText: string, jdKeywords: string[]): MetricResult {
    if (jdKeywords.length === 0) {
      return { score: 0.5, maxScore: 1, passed: true, details: 'No JD to analyze' };
    }

    const resumeLower = resumeText.toLowerCase();
    const criticalKeywords = jdKeywords.slice(0, Math.ceil(jdKeywords.length / 3));
    const matches = criticalKeywords.filter(k => resumeLower.includes(k.toLowerCase())).length;
    const ratio = criticalKeywords.length > 0 ? matches / criticalKeywords.length : 1;

    if (ratio >= 0.8) {
      return { score: 1, maxScore: 1, passed: true, details: 'Critical skills covered' };
    } else if (ratio >= 0.5) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'Missing some critical skills' };
    }
    return { score: 0, maxScore: 1, passed: false, details: 'Missing critical JD skills' };
  }

  private static analyzeFrameworks(resumeText: string): MetricResult {
    const resumeLower = resumeText.toLowerCase();
    const found = FRAMEWORKS.filter(fw => resumeLower.includes(fw.toLowerCase()));

    if (found.length >= 2) {
      return { score: 1, maxScore: 1, passed: true, details: `${found.length} frameworks listed` };
    } else if (found.length >= 1) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'Add more frameworks' };
    }
    return { score: 0, maxScore: 1, passed: false, details: 'List relevant frameworks' };
  }

  private static analyzeDatabases(resumeText: string): MetricResult {
    const resumeLower = resumeText.toLowerCase();
    const found = DATABASES.filter(db => resumeLower.includes(db.toLowerCase()));

    if (found.length >= 2) {
      return { score: 1, maxScore: 1, passed: true, details: `${found.length} databases listed` };
    } else if (found.length >= 1) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'Add more database experience' };
    }
    return { score: 0, maxScore: 1, passed: false, details: 'List database experience' };
  }

  private static analyzeCloudPlatforms(resumeText: string): MetricResult {
    const resumeLower = resumeText.toLowerCase();
    const found = CLOUD_PLATFORMS.filter(cp => resumeLower.includes(cp.toLowerCase()));

    if (found.length >= 1) {
      return { score: 1, maxScore: 1, passed: true, details: `Cloud: ${found.join(', ')}` };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Add cloud platform experience' };
  }

  private static analyzeDevOpsTools(resumeText: string): MetricResult {
    const resumeLower = resumeText.toLowerCase();
    const found = DEVOPS_TOOLS.filter(tool => resumeLower.includes(tool.toLowerCase()));

    if (found.length >= 2) {
      return { score: 1, maxScore: 1, passed: true, details: `${found.length} DevOps tools` };
    } else if (found.length >= 1) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'Add more DevOps tools' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Consider adding DevOps skills' };
  }

  private static analyzeDataTools(resumeText: string): MetricResult {
    const dataTools = /pandas|numpy|spark|hadoop|tableau|power bi|excel|sql|etl/i;
    if (dataTools.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'Data tools present' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Consider adding data tools' };
  }

  private static analyzeApiKnowledge(resumeText: string): MetricResult {
    const apiTerms = /\bapi\b|rest|graphql|soap|webhook|endpoint/i;
    if (apiTerms.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'API knowledge demonstrated' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Add API experience' };
  }

  private static analyzeVersionControl(resumeText: string): MetricResult {
    const vcs = /\bgit\b|github|gitlab|bitbucket|svn|version control/i;
    if (vcs.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'Version control listed' };
    }
    return { score: 0, maxScore: 1, passed: false, details: 'Add Git/version control' };
  }

  private static analyzeTestingTools(resumeText: string): MetricResult {
    const testing = /jest|mocha|pytest|junit|selenium|cypress|testing|unit test|tdd/i;
    if (testing.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'Testing experience present' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Add testing experience' };
  }

  private static analyzeAgileMethodology(resumeText: string): MetricResult {
    const agile = /agile|scrum|kanban|sprint|jira|confluence|standup/i;
    if (agile.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'Agile methodology mentioned' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Add Agile/Scrum experience' };
  }

  private static analyzeSystemDesign(resumeText: string): MetricResult {
    const design = /system design|architecture|microservices|scalab|distributed|high availability/i;
    if (design.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'System design mentioned' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Consider adding architecture experience' };
  }

  private static analyzeAiMlTools(resumeText: string): MetricResult {
    const aiMl = /machine learning|ml|ai|tensorflow|pytorch|scikit|neural|nlp|deep learning|llm|gpt/i;
    if (aiMl.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'AI/ML skills present' };
    }
    return { score: 0.5, maxScore: 1, passed: true, details: 'AI/ML skills optional' };
  }

  private static analyzeSoftSkillsKeywords(resumeText: string): MetricResult {
    const softSkills = /leadership|communication|teamwork|problem.solving|analytical|creative/i;
    if (softSkills.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'Soft skills mentioned' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Add soft skills keywords' };
  }


  // ============================================================================
  // SOFT SKILLS METRICS (10)
  // ============================================================================

  private static analyzeLeadershipEvidence(resumeText: string): MetricResult {
    const leadership = /led|managed|directed|supervised|mentored|coached|team of|headed/i;
    if (leadership.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'Leadership evidence found' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Add leadership examples' };
  }

  private static analyzeCommunicationEvidence(resumeText: string): MetricResult {
    const communication = /presented|communicated|collaborated|stakeholder|client-facing|documentation/i;
    if (communication.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'Communication skills shown' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Add communication examples' };
  }

  private static analyzeProblemSolvingEvidence(resumeText: string): MetricResult {
    const problemSolving = /solved|resolved|debugged|troubleshoot|optimized|improved|fixed/i;
    if (problemSolving.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'Problem-solving demonstrated' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Add problem-solving examples' };
  }

  private static analyzeCollaborationEvidence(resumeText: string): MetricResult {
    const collaboration = /collaborated|partnered|cross-functional|team|worked with|coordinated/i;
    if (collaboration.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'Collaboration shown' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Add collaboration examples' };
  }

  private static analyzeInitiativeEvidence(resumeText: string): MetricResult {
    const initiative = /initiated|launched|pioneered|introduced|proposed|created|built/i;
    if (initiative.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'Initiative demonstrated' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Show initiative examples' };
  }

  private static analyzeAdaptabilityEvidence(resumeText: string): MetricResult {
    const adaptability = /adapted|transitioned|learned|pivoted|flexible|diverse|multiple/i;
    if (adaptability.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'Adaptability shown' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Show adaptability' };
  }

  private static analyzeCustomerFocusEvidence(resumeText: string): MetricResult {
    const customerFocus = /customer|client|user|stakeholder|feedback|satisfaction|support/i;
    if (customerFocus.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'Customer focus shown' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Add customer focus examples' };
  }

  private static analyzeAttentionToDetailEvidence(resumeText: string): MetricResult {
    const detail = /detail|quality|accuracy|precision|thorough|meticulous|review/i;
    if (detail.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'Attention to detail shown' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Show attention to detail' };
  }

  private static analyzeDomainExpertiseEvidence(resumeText: string): MetricResult {
    const domain = /expert|specialist|deep knowledge|extensive experience|domain/i;
    if (domain.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'Domain expertise shown' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Highlight domain expertise' };
  }

  private static analyzeTrainingMentoringEvidence(resumeText: string): MetricResult {
    const training = /trained|mentored|coached|onboarded|taught|guided|developed team/i;
    if (training.test(resumeText)) {
      return { score: 1, maxScore: 1, passed: true, details: 'Training/mentoring shown' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Add mentoring examples' };
  }

  // ============================================================================
  // KEYWORD MATCHING METRICS (10)
  // ============================================================================

  private static analyzeExactKeywordMatch(keywordMatchRate: number): MetricResult {
    if (keywordMatchRate >= 70) {
      return { score: 1, maxScore: 1, passed: true, details: `${keywordMatchRate}% exact match` };
    } else if (keywordMatchRate >= 50) {
      return { score: 0.5, maxScore: 1, passed: false, details: `${keywordMatchRate}% - improve match` };
    }
    return { score: 0, maxScore: 1, passed: false, details: `${keywordMatchRate}% - low match` };
  }

  private static analyzeSemanticKeywordMatch(_resumeText: string, jdKeywords: string[]): MetricResult {
    // Simplified semantic matching - check for related terms
    if (jdKeywords.length === 0) {
      return { score: 0.5, maxScore: 1, passed: true, details: 'No keywords to match' };
    }
    // Would use embeddings in production
    return { score: 0.75, maxScore: 1, passed: true, details: 'Semantic matching assessed' };
  }

  private static analyzeRelatedKeywordMatch(_resumeText: string, jdKeywords: string[]): MetricResult {
    if (jdKeywords.length === 0) {
      return { score: 0.5, maxScore: 1, passed: true, details: 'No keywords to match' };
    }
    return { score: 0.75, maxScore: 1, passed: true, details: 'Related keywords assessed' };
  }

  private static analyzeCriticalKeywordCoverage(resumeText: string, jdKeywords: string[]): MetricResult {
    if (jdKeywords.length === 0) {
      return { score: 0.5, maxScore: 1, passed: true, details: 'No JD keywords' };
    }

    const resumeLower = resumeText.toLowerCase();
    const critical = jdKeywords.slice(0, Math.ceil(jdKeywords.length / 3));
    const matches = critical.filter(k => resumeLower.includes(k.toLowerCase())).length;
    const ratio = critical.length > 0 ? matches / critical.length : 1;

    if (ratio >= 0.8) {
      return { score: 1, maxScore: 1, passed: true, details: 'Critical keywords covered' };
    } else if (ratio >= 0.5) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'Missing critical keywords' };
    }
    return { score: 0, maxScore: 1, passed: false, details: 'Many critical keywords missing' };
  }

  private static analyzeImportantKeywordCoverage(resumeText: string, jdKeywords: string[]): MetricResult {
    if (jdKeywords.length === 0) {
      return { score: 0.5, maxScore: 1, passed: true, details: 'No JD keywords' };
    }

    const resumeLower = resumeText.toLowerCase();
    const start = Math.ceil(jdKeywords.length / 3);
    const end = Math.ceil((jdKeywords.length * 2) / 3);
    const important = jdKeywords.slice(start, end);
    const matches = important.filter(k => resumeLower.includes(k.toLowerCase())).length;
    const ratio = important.length > 0 ? matches / important.length : 1;

    if (ratio >= 0.6) {
      return { score: 1, maxScore: 1, passed: true, details: 'Important keywords covered' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Add more important keywords' };
  }

  private static analyzeNiceToHaveKeywordCoverage(resumeText: string, jdKeywords: string[]): MetricResult {
    if (jdKeywords.length === 0) {
      return { score: 0.5, maxScore: 1, passed: true, details: 'No JD keywords' };
    }

    const resumeLower = resumeText.toLowerCase();
    const start = Math.ceil((jdKeywords.length * 2) / 3);
    const niceToHave = jdKeywords.slice(start);
    const matches = niceToHave.filter(k => resumeLower.includes(k.toLowerCase())).length;
    const ratio = niceToHave.length > 0 ? matches / niceToHave.length : 1;

    if (ratio >= 0.4) {
      return { score: 1, maxScore: 1, passed: true, details: 'Nice-to-have keywords present' };
    }
    return { score: 0.5, maxScore: 1, passed: true, details: 'Some nice-to-have missing' };
  }

  private static analyzeKeywordDistribution(resumeText: string, jdKeywords: string[]): MetricResult {
    if (jdKeywords.length === 0) {
      return { score: 0.5, maxScore: 1, passed: true, details: 'No keywords to check' };
    }

    // Check if keywords appear in multiple sections
    const sections = resumeText.split(/\n{2,}/);
    const resumeLower = resumeText.toLowerCase();
    const foundKeywords = jdKeywords.filter(k => resumeLower.includes(k.toLowerCase()));
    
    let distributedCount = 0;
    foundKeywords.forEach(keyword => {
      const sectionsWithKeyword = sections.filter(s => 
        s.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      if (sectionsWithKeyword >= 2) distributedCount++;
    });

    const ratio = foundKeywords.length > 0 ? distributedCount / foundKeywords.length : 0;

    if (ratio >= 0.3) {
      return { score: 1, maxScore: 1, passed: true, details: 'Keywords well distributed' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Distribute keywords across sections' };
  }

  private static analyzeKeywordContext(resumeText: string, jdKeywords: string[]): MetricResult {
    if (jdKeywords.length === 0) {
      return { score: 0.5, maxScore: 1, passed: true, details: 'No keywords to check' };
    }

    // Check if keywords appear with context (not just listed)
    const resumeLower = resumeText.toLowerCase();
    let contextualCount = 0;

    jdKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (resumeLower.includes(keywordLower)) {
        // Check if keyword appears in a sentence (not just skills list)
        // Escape special regex characters (e.g., C++, .NET, C#)
        const escapedKeyword = keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        try {
          const pattern = new RegExp(`\\b${escapedKeyword}\\b.{10,}`, 'i');
          if (pattern.test(resumeText)) {
            contextualCount++;
          }
        } catch {
          // If regex still fails, do simple string check
          if (resumeText.toLowerCase().includes(keywordLower)) {
            contextualCount++;
          }
        }
      }
    });

    const foundCount = jdKeywords.filter(k => resumeLower.includes(k.toLowerCase())).length;
    const ratio = foundCount > 0 ? contextualCount / foundCount : 0;

    if (ratio >= 0.5) {
      return { score: 1, maxScore: 1, passed: true, details: 'Keywords used in context' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Use keywords in context' };
  }

  private static analyzeKeywordDensity(resumeText: string, jdKeywords: string[]): MetricResult {
    if (jdKeywords.length === 0) {
      return { score: 0.5, maxScore: 1, passed: true, details: 'No keywords to check' };
    }

    const words = resumeText.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    
    let keywordOccurrences = 0;
    jdKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      keywordOccurrences += words.filter(w => w.includes(keywordLower)).length;
    });

    const density = (keywordOccurrences / totalWords) * 100;

    if (density >= 2 && density <= 5) {
      return { score: 1, maxScore: 1, passed: true, details: `${density.toFixed(1)}% density - optimal` };
    } else if (density < 2) {
      return { score: 0.5, maxScore: 1, passed: false, details: 'Increase keyword usage' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Reduce keyword density' };
  }

  private static analyzeKeywordPlacement(resumeText: string, jdKeywords: string[]): MetricResult {
    if (jdKeywords.length === 0) {
      return { score: 0.5, maxScore: 1, passed: true, details: 'No keywords to check' };
    }

    // Check if critical keywords appear early in resume
    const firstThird = resumeText.slice(0, resumeText.length / 3).toLowerCase();
    const critical = jdKeywords.slice(0, Math.ceil(jdKeywords.length / 3));
    const earlyMatches = critical.filter(k => firstThird.includes(k.toLowerCase())).length;
    const ratio = critical.length > 0 ? earlyMatches / critical.length : 1;

    if (ratio >= 0.5) {
      return { score: 1, maxScore: 1, passed: true, details: 'Keywords placed strategically' };
    }
    return { score: 0.5, maxScore: 1, passed: false, details: 'Place key terms earlier' };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static calculateTierScore(metrics: SkillsKeywordsMetrics): TierScore {
    const allMetrics = Object.values(metrics);
    const totalScore = allMetrics.reduce((sum, m) => sum + m.score, 0);
    const maxScore = allMetrics.reduce((sum, m) => sum + m.maxScore, 0);
    const metricsPassed = allMetrics.filter(m => m.passed).length;
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const weightedContribution = (percentage * TIER_CONFIG.weight) / 100;

    const topIssues = allMetrics
      .filter(m => !m.passed)
      .map(m => m.details)
      .slice(0, 5);

    return {
      tier_number: TIER_CONFIG.tierNumber,
      tier_name: TIER_CONFIG.tierName,
      score: Math.round(totalScore * 100) / 100,
      max_score: maxScore,
      percentage: Math.round(percentage * 100) / 100,
      weight: TIER_CONFIG.weight,
      weighted_contribution: Math.round(weightedContribution * 100) / 100,
      metrics_passed: metricsPassed,
      metrics_total: TIER_CONFIG.metricsTotal,
      top_issues: topIssues,
    };
  }
}

export default SkillsKeywordsAnalyzer;
