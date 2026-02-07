/**
 * Centralized Skills Taxonomy
 * Single source of truth for ATS-friendly skill categorization
 * Used across all services to ensure consistent skill categorization
 */

// ATS-Friendly Category Names (must match Gemini service output)
export const SKILL_CATEGORIES = {
  PROGRAMMING_LANGUAGES: 'Programming Languages',
  FRONTEND_TECHNOLOGIES: 'Frontend Technologies',
  BACKEND_TECHNOLOGIES: 'Backend Technologies',
  DATABASES: 'Databases',
  CLOUD_AND_DEVOPS: 'Cloud & DevOps',
  DATA_SCIENCE_AND_ML: 'Data Science & ML',
  TOOLS_AND_PLATFORMS: 'Tools & Platforms',
  TESTING_AND_QA: 'Testing & QA',
  SOFT_SKILLS: 'Soft Skills'
} as const;

// Type for category names
export type SkillCategoryName = typeof SKILL_CATEGORIES[keyof typeof SKILL_CATEGORIES];

// Programming Languages - ONLY actual programming languages (NOT markup/styling languages)
export const PROGRAMMING_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php',
  'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'lua', 'dart', 'elixir', 'clojure',
  'haskell', 'f#', 'objective-c', 'assembly', 'cobol', 'fortran', 'pascal', 'vb.net',
  'sql', 'bash', 'powershell', 'shell', 'groovy', 'julia'
];

// Frontend Technologies - Frameworks, libraries, and tools for frontend development
export const FRONTEND_TECHNOLOGIES = [
  'react', 'react.js', 'angular', 'vue', 'vue.js', 'svelte', 'next.js', 'nuxt.js',
  'gatsby', 'ember', 'backbone', 'jquery', 'bootstrap', 'tailwind', 'tailwind css',
  'material-ui', 'mui', 'ant design', 'chakra ui', 'semantic ui', 'bulma',
  'sass', 'scss', 'less', 'styled-components', 'emotion', 'webpack', 'vite',
  'rollup', 'parcel', 'gulp', 'grunt', 'babel', 'html5', 'css3', 'responsive design'
];

// Backend Technologies - Frameworks, libraries, and tools for backend development
export const BACKEND_TECHNOLOGIES = [
  'node.js', 'express', 'express.js', 'fastify', 'koa', 'nest.js', 'nestjs',
  'django', 'flask', 'fastapi', 'spring', 'spring boot', 'hibernate', 'struts',
  '.net', 'asp.net', 'entity framework', 'rails', 'ruby on rails', 'sinatra',
  'laravel', 'symfony', 'codeigniter', 'graphql', 'rest', 'restful', 'rest api',
  'restful api', 'soap', 'grpc', 'microservices', 'api', 'api development',
  'websockets', 'socket.io', 'redis pub/sub'
];

// Databases - All database systems and data storage technologies
export const DATABASES = [
  'mysql', 'postgresql', 'postgres', 'sqlite', 'mongodb', 'redis', 'elasticsearch',
  'cassandra', 'dynamodb', 'couchdb', 'neo4j', 'influxdb', 'oracle', 'oracle db',
  'sql server', 'mariadb', 'firebase', 'firestore', 'supabase', 'planetscale',
  'cockroachdb', 'clickhouse', 'snowflake', 'bigquery', 'nosql', 'rds', 'aurora'
];

// Cloud & DevOps - Cloud platforms AND DevOps tools (combined for ATS compatibility)
export const CLOUD_AND_DEVOPS = [
  // Cloud Platforms
  'aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp', 'google cloud',
  'google cloud platform', 'digital ocean', 'digitalocean', 'heroku', 'vercel',
  'netlify', 'cloudflare', 'linode', 'vultr', 'oracle cloud', 'ibm cloud',
  'alibaba cloud', 'aws lambda', 'azure functions', 'cloud functions', 'ec2', 's3',
  // DevOps Tools
  'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'puppet', 'chef', 'vagrant',
  'jenkins', 'gitlab ci', 'github actions', 'circleci', 'travis ci', 'bamboo',
  'helm', 'istio', 'prometheus', 'grafana', 'elk stack', 'datadog', 'new relic',
  'ci/cd', 'continuous integration', 'continuous deployment', 'devops', 'infrastructure as code',
  'iac', 'cloudformation', 'arm templates'
];

// Data Science & ML - Machine Learning, AI, and Data Science tools and frameworks
export const DATA_SCIENCE_AND_ML = [
  // ML/AI Frameworks
  'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn', 'xgboost', 'lightgbm',
  'catboost', 'hugging face', 'transformers', 'openai', 'langchain', 'llama',
  // Data Science Tools
  'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn', 'plotly', 'jupyter',
  'jupyter notebook', 'anaconda', 'spacy', 'nltk', 'opencv', 'pillow',
  // ML/AI Techniques
  'machine learning', 'deep learning', 'neural networks', 'cnn', 'rnn', 'lstm',
  'gpt', 'transformer', 'bert', 'computer vision', 'nlp', 'natural language processing',
  'reinforcement learning', 'supervised learning', 'unsupervised learning',
  // Big Data & Analytics
  'spark', 'apache spark', 'pyspark', 'hadoop', 'kafka', 'airflow', 'databricks',
  'tableau', 'power bi', 'looker', 'data analysis', 'data visualization',
  'statistical analysis', 'predictive modeling', 'data mining', 'feature engineering'
];

// Tools & Platforms - Development tools, version control, and general platforms
export const TOOLS_AND_PLATFORMS = [
  'git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial', 'jira', 'confluence',
  'slack', 'teams', 'microsoft teams', 'zoom', 'vscode', 'visual studio code',
  'intellij', 'eclipse', 'vim', 'emacs', 'sublime', 'atom', 'webstorm', 'pycharm',
  'postman', 'insomnia', 'swagger', 'openapi', 'npm', 'yarn', 'pnpm', 'pip',
  'maven', 'gradle', 'linux', 'unix', 'ubuntu', 'centos', 'debian', 'windows',
  'macos', 'bash', 'terminal', 'command line', 'cli', 'agile', 'scrum', 'kanban'
];

// Testing & QA - All testing tools, frameworks, and QA methodologies
export const TESTING_AND_QA = [
  // Automated Testing
  'jest', 'mocha', 'chai', 'jasmine', 'karma', 'cypress', 'selenium', 'playwright',
  'puppeteer', 'testcafe', 'junit', 'testng', 'pytest', 'unittest', 'rspec',
  'cucumber', 'behave', 'specflow', 'testing library', 'react testing library',
  'vitest', 'ava', 'tape', 'enzyme', 'sinon', 'supertest',
  // Testing Methodologies & QA
  'unit testing', 'integration testing', 'e2e testing', 'end-to-end testing',
  'test automation', 'manual testing', 'manual qa', 'regression testing',
  'test scripting', 'test cases', 'test planning', 'qa', 'quality assurance',
  'validation', 'verification', 'issue reporting', 'bug tracking', 'test coverage',
  'tdd', 'test-driven development', 'bdd', 'behavior-driven development',
  'performance testing', 'load testing', 'stress testing', 'security testing'
];

// Soft Skills - Non-technical skills and competencies
export const SOFT_SKILLS = [
  'leadership', 'communication', 'teamwork', 'team collaboration', 'collaboration',
  'problem solving', 'problem-solving', 'analytical thinking', 'critical thinking',
  'project management', 'time management', 'adaptability', 'flexibility',
  'creativity', 'innovation', 'mentoring', 'coaching', 'presentation',
  'presentation skills', 'negotiation', 'customer service', 'stakeholder management',
  'decision making', 'conflict resolution', 'multitasking', 'organizational skills',
  'attention to detail', 'work ethic', 'interpersonal skills', 'emotional intelligence'
];

// Category Skills Map for easy lookup
export const CATEGORY_SKILLS_MAP: Record<SkillCategoryName, string[]> = {
  [SKILL_CATEGORIES.PROGRAMMING_LANGUAGES]: PROGRAMMING_LANGUAGES,
  [SKILL_CATEGORIES.FRONTEND_TECHNOLOGIES]: FRONTEND_TECHNOLOGIES,
  [SKILL_CATEGORIES.BACKEND_TECHNOLOGIES]: BACKEND_TECHNOLOGIES,
  [SKILL_CATEGORIES.DATABASES]: DATABASES,
  [SKILL_CATEGORIES.CLOUD_AND_DEVOPS]: CLOUD_AND_DEVOPS,
  [SKILL_CATEGORIES.DATA_SCIENCE_AND_ML]: DATA_SCIENCE_AND_ML,
  [SKILL_CATEGORIES.TOOLS_AND_PLATFORMS]: TOOLS_AND_PLATFORMS,
  [SKILL_CATEGORIES.TESTING_AND_QA]: TESTING_AND_QA,
  [SKILL_CATEGORIES.SOFT_SKILLS]: SOFT_SKILLS
};

// Special case mappings for proper display names
export const SKILL_DISPLAY_NAMES: Record<string, string> = {
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'c++': 'C++',
  'c#': 'C#',
  'node.js': 'Node.js',
  'next.js': 'Next.js',
  'vue.js': 'Vue.js',
  'react.js': 'React',
  'angular.js': 'Angular',
  'asp.net': 'ASP.NET',
  'vb.net': 'VB.NET',
  'f#': 'F#',
  'objective-c': 'Objective-C',
  'html': 'HTML',
  'css': 'CSS',
  'html5': 'HTML5',
  'css3': 'CSS3',
  'sql': 'SQL',
  'rest': 'REST',
  'soap': 'SOAP',
  'api': 'API',
  'aws': 'AWS',
  'gcp': 'GCP',
  'ui': 'UI',
  'ux': 'UX',
  'ci/cd': 'CI/CD',
  'k8s': 'Kubernetes',
  'iac': 'Infrastructure as Code',
  'tdd': 'Test-Driven Development',
  'bdd': 'Behavior-Driven Development',
  'qa': 'QA'
};

/**
 * Categorize a skill into the correct ATS-friendly category
 * @param skill - The skill to categorize (case-insensitive)
 * @returns The category name or null if not found
 */
export function categorizeSkill(skill: string): SkillCategoryName | null {
  const skillLower = skill.toLowerCase().trim();

  // Check each category in priority order
  // Order matters! Check more specific categories first to prevent false matches

  // 1. Check Data Science & ML FIRST (most specific)
  if (DATA_SCIENCE_AND_ML.some(ml => skillLower.includes(ml))) {
    return SKILL_CATEGORIES.DATA_SCIENCE_AND_ML;
  }

  // 2. Check Frontend Technologies BEFORE Programming Languages
  // Prevents "React" from matching as programming language
  if (FRONTEND_TECHNOLOGIES.some(tech => skillLower.includes(tech))) {
    return SKILL_CATEGORIES.FRONTEND_TECHNOLOGIES;
  }

  // 3. Check Backend Technologies BEFORE Programming Languages
  // Prevents "Express" from being miscategorized
  if (BACKEND_TECHNOLOGIES.some(tech => skillLower.includes(tech))) {
    return SKILL_CATEGORIES.BACKEND_TECHNOLOGIES;
  }

  // 4. Check Databases BEFORE Programming Languages
  // Prevents "SQL" databases from being miscategorized
  if (DATABASES.some(db => skillLower.includes(db))) {
    return SKILL_CATEGORIES.DATABASES;
  }

  // 5. Check Testing & QA BEFORE Programming Languages
  if (TESTING_AND_QA.some(test => skillLower.includes(test))) {
    return SKILL_CATEGORIES.TESTING_AND_QA;
  }

  // 6. NOW check Programming Languages with EXACT matching only
  // Use exact match to prevent "java" from matching "javascript"
  if (PROGRAMMING_LANGUAGES.some(lang => {
    // Exact match or word boundary match
    return skillLower === lang ||
           skillLower === `${lang}.js` || // Handle Node.js style names
           skillLower.split(/[\s,\/]+/).includes(lang); // Word boundary
  })) {
    return SKILL_CATEGORIES.PROGRAMMING_LANGUAGES;
  }

  // 7. Check Cloud & DevOps
  if (CLOUD_AND_DEVOPS.some(tool => skillLower.includes(tool))) {
    return SKILL_CATEGORIES.CLOUD_AND_DEVOPS;
  }

  // 8. Check Tools & Platforms
  if (TOOLS_AND_PLATFORMS.some(tool => skillLower.includes(tool))) {
    return SKILL_CATEGORIES.TOOLS_AND_PLATFORMS;
  }

  // 9. Check Soft Skills (least specific)
  if (SOFT_SKILLS.some(soft => skillLower.includes(soft))) {
    return SKILL_CATEGORIES.SOFT_SKILLS;
  }

  return null;
}

/**
 * Format a skill name for proper display
 * Strips version numbers and applies proper capitalization
 * @param skill - The skill to format
 * @returns Formatted skill name without version numbers
 */
export function formatSkillName(skill: string): string {
  let cleaned = skill.trim();

  // STEP 1: Strip version numbers
  // Remove patterns like "3.11", "20.x", "v5", "18", etc.
  cleaned = cleaned.replace(/\s+v?\d+(\.\d+)?(\.\d+)?\.?x?\s*$/i, '');

  // Remove parenthetical versions: "Python (3.11)" → "Python"
  cleaned = cleaned.replace(/\s*\([^)]*\d+[^)]*\)/g, '');

  // Remove trailing version numbers with space: "React 18" → "React"
  // But preserve skills like "ES6" or "HTML5" (no space before number)
  if (!/^[A-Z]{2,}\d+$/i.test(cleaned)) {
    cleaned = cleaned.replace(/\s+\d+$/g, '');
  }

  // STEP 2: Normalize common variations
  const normalizations: Record<string, string> = {
    'reactjs': 'react',
    'react.js': 'react',
    'vuejs': 'vue.js',
    'nodejs': 'node.js',
    'nextjs': 'next.js',
    'expressjs': 'express',
    'typescript': 'typescript',
    'javascript': 'javascript'
  };

  const lowerCleaned = cleaned.toLowerCase();
  if (normalizations[lowerCleaned]) {
    cleaned = normalizations[lowerCleaned];
  }

  // STEP 3: Apply special display names
  const skillLower = cleaned.toLowerCase().trim();
  if (SKILL_DISPLAY_NAMES[skillLower]) {
    return SKILL_DISPLAY_NAMES[skillLower];
  }

  // STEP 4: Default formatting - capitalize first letter of each word
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get all skills for a specific category
 * @param category - The category name
 * @returns Array of skills in that category
 */
export function getSkillsForCategory(category: SkillCategoryName): string[] {
  return CATEGORY_SKILLS_MAP[category] || [];
}

/**
 * Validate if a skill is correctly categorized
 * @param skill - The skill to validate
 * @param category - The claimed category
 * @returns True if correctly categorized, false otherwise
 */
export function validateSkillCategory(skill: string, category: SkillCategoryName): boolean {
  const correctCategory = categorizeSkill(skill);
  return correctCategory === category;
}

/**
 * Get category order for ATS-friendly resume structure
 * @returns Ordered array of category names
 */
export function getCategoryOrder(): SkillCategoryName[] {
  return [
    SKILL_CATEGORIES.PROGRAMMING_LANGUAGES,
    SKILL_CATEGORIES.FRONTEND_TECHNOLOGIES,
    SKILL_CATEGORIES.BACKEND_TECHNOLOGIES,
    SKILL_CATEGORIES.DATABASES,
    SKILL_CATEGORIES.CLOUD_AND_DEVOPS,
    SKILL_CATEGORIES.DATA_SCIENCE_AND_ML,
    SKILL_CATEGORIES.TESTING_AND_QA,
    SKILL_CATEGORIES.TOOLS_AND_PLATFORMS,
    SKILL_CATEGORIES.SOFT_SKILLS
  ];
}
