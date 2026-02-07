// src/services/geminiService.ts
import { ResumeData, UserType, AdditionalSection } from '../types/resume'; // Import AdditionalSection
import { cleanResumeTextForAI, stripVersionFromSkill, deduplicateSkills } from '../utils/skillsVersionStripper';
import {
  PROGRAMMING_LANGUAGES,
  FRONTEND_TECHNOLOGIES,
  BACKEND_TECHNOLOGIES,
  DATABASES,
  CLOUD_AND_DEVOPS,
  DATA_SCIENCE_AND_ML,
  TOOLS_AND_PLATFORMS,
  TESTING_AND_QA,
  SOFT_SKILLS
} from '../constants/skillsTaxonomy';

import { openrouter } from './aiProxyService';

console.log('GeminiService: Using OpenRouter AI via Supabase Edge Function proxy');

// --- CONSTANTS FOR ERROR HANDLING AND RETRIES ---
export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"; // Kept for reference
export const MAX_INPUT_LENGTH = 50000;
export const MAX_RETRIES = 3;
export const INITIAL_RETRY_DELAY_MS = 1000;
// --- END ---

const deepCleanComments = (val: any): any => {
  const stripLineComments = (input: string): string => {
    let cleanedInput = input;

    // 1. Remove block comments /* ... */
    cleanedInput = cleanedInput.replace(/\/\*[\s\S]*?\*\//g, '');

    // 2. Remove specific "// Line XXX" comments anywhere in the string
    cleanedInput = cleanedInput.replace(/\/\/\s*Line\s*\d+\s*/g, '');

    // 3. Process line-by-line for traditional single-line comments (// at start or mid-line)
    const lines = cleanedInput.split(/\r?\n/).map((line) => {
      // If the line starts with //, remove the whole line
      if (/^\s*\/\//.test(line)) return '';

      // If // appears mid-line, remove from // to end of line, but only if it's not part of a URL
      const idx = line.indexOf('//');
      if (idx !== -1) {
        const before = line.slice(0, idx);
        // Check if it's not part of a URL (e.g., "https://")
        if (!before.includes('://')) {
          return line.slice(0, idx).trimEnd();
        }
      }
      return line;
    });
    cleanedInput = lines.join('\n');

    // 4. Remove excessive newlines
    cleanedInput = cleanedInput.replace(/\n{3,}/g, '\n\n'); // Fixed: changed 'cleanedOut' to 'cleanedInput'

    return cleanedInput.trim();
  };
  if (typeof val === 'string') return stripLineComments(val);
  if (Array.isArray(val)) return val.map(deepCleanComments);
  if (val && typeof val === 'object') {
    const out: Record<string, any> = {};
    for (const k of Object.keys(val)) out[k] = deepCleanComments(val[k]);
    return out;
  }
  return val;
};

// --- OpenRouter safeFetch function via Supabase Edge Function proxy ---
const safeFetch = async (options: { prompt: string }, maxRetries = MAX_RETRIES): Promise<{ content: string }> => {
  let retries = 0;
  let delay = INITIAL_RETRY_DELAY_MS;

  while (retries < maxRetries) {
    try {
      // Use the proxy service instead of direct API call
      const content = await openrouter.chatWithSystem(
        'You are a professional resume optimization assistant. Always respond with valid JSON only.',
        options.prompt,
        { model: 'google/gemini-2.5-flash', temperature: 0.3 }
      );
      
      if (!content) {
        throw new Error('No content returned from OpenRouter');
      }
      
      return { content };
    } catch (err: any) {
      if (err.message.includes('429') || err.message.includes('500') || 
          err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        retries++;
        if (retries >= maxRetries) {
          throw new Error(`OpenRouter API error: Failed after ${maxRetries} retries. ${err.message}`);
        }
        console.warn(`OpenRouter API error: ${err.message}. Retrying in ${delay / 1000}s... (Attempt ${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Failed after ${maxRetries} retries`);
};
// --- END ---

export const optimizeResume = async (
  resume: string,
  jobDescription: string,
  userType: UserType,
  userName?: string,
  _logStart?: undefined, // Placeholder for backward compatibility
  userEmail?: string,
  userPhone?: string,
  userLinkedin?: string,
  userGithub?: string,
  linkedinUrl?: string,
  githubUrl?: string,
  targetRole?: string,
  additionalSections?: AdditionalSection[], // NEW: Add additionalSections parameter
  jdSummary?: string // NEW: Optional JD summary from EdenAI for better alignment
): Promise<ResumeData> => {
  // Log optimization start
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 RESUME OPTIMIZATION STARTED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📝 Resume length:', resume.length, 'chars');
  console.log('📋 JD length:', jobDescription.length, 'chars');
  console.log('👤 User type:', userType);
  console.log('👤 User name:', userName || '(not provided)');

  // Clean resume text by stripping version numbers from skills
  const cleanedResume = cleanResumeTextForAI(resume);
  const cleanedJobDescription = cleanResumeTextForAI(jobDescription);
  console.log('✨ Applied version stripping to resume and JD');

  // MODIFIED: Changed console.warn to throw an error
  if (cleanedResume.length + cleanedJobDescription.length > MAX_INPUT_LENGTH) {
    throw new Error(
      `Input too long. Combined resume and job description exceed ${MAX_INPUT_LENGTH} characters. Please shorten your input.`
    );
  }

  const getPromptForUserType = (type: UserType) => {
    if (type === 'experienced') {
      return `You are a professional resume optimization assistant for EXPERIENCED PROFESSIONALS. Analyze the provided resume and job description, then create an optimized resume that better matches the job requirements.

EXPERIENCED PROFESSIONAL REQUIREMENTS:
1. MUST include a compelling Professional Summary (2-3 lines highlighting key experience and value proposition)
2. PRIORITIZE Work Experience section - this should be the most prominent
3. Education section should be minimal or omitted unless specifically required by the job
4. Focus on quantifiable achievements and leadership experience
5. Emphasize career progression and increasing responsibilities

SECTION ORDER FOR EXPERIENCED PROFESSIONALS:
1. Contact Information
2. Professional Summary (REQUIRED)
3. Technical Skills
4. Professional Experience (MOST IMPORTANT)
5. Projects (if relevant to role)
6. Certifications
7. Education (minimal or omit if not required)
8. Additional Sections (if provided, with custom titles)`;
    } else if (type === 'student') {
      return `You are a professional resume optimization assistant for COLLEGE STUDENTS. Analyze the provided resume and job description, then create an optimized resume that better matches the job requirements.

COLLEGE STUDENT REQUIREMENTS:
1. MUST include a compelling Career Objective (2 lines, ATS-readable, focusing on learning goals and internship aspirations)
2. PRIORITIZE Education section - this should be prominent with CGPA and institution location
3. Focus on academic projects, coursework, and transferable skills
4. Include achievements, certifications, and extracurricular activities
5. Highlight learning ability, enthusiasm, and academic excellence
6. ALL INTERNSHIPS, TRAININGS, and WORK EXPERIENCE should be categorized under "workExperience" section
7. Extract CGPA from education if mentioned (e.g., "CGPA: 8.4/10" or "GPA: 3.8/4.0")
8. Include location in contact information and education details

SECTION ORDER FOR COLLEGE STUDENTS:
1. Contact Information (including location)
2. Career Objective (REQUIRED - 2 lines focusing on internship goals)
3. Education (PROMINENT - with CGPA and location)
4. Technical Skills
5. Academic Projects (IMPORTANT)
6. Internships & Work Experience (if any)
7. Certifications
8. Additional Sections (if provided, with custom titles)`;
    } else {
      return `You are a professional resume optimization assistant for FRESHERS/NEW GRADUATES. Analyze the provided resume and job description, then create an optimized resume that better matches the job requirements.

FRESHER REQUIREMENTS:
1. MUST include a compelling Career Objective (2 lines MAX, ATS-readable, focusing on entry-level goals, relevant skills, and aspirations)
2. CRITICAL: DO NOT include any years of experience in the career objective (e.g., "1 year experience", "2 years of experience", "X+ years"). Freshers have NO professional experience - focus on skills, education, and eagerness to learn.
3. PRIORITIZE Education, Academic Projects, and Internships
4. Include additional sections that showcase potential: Achievements, Extra-curricular Activities, Languages
5. Focus on academic projects, internships, and transferable skills
6. Highlight learning ability, enthusiasm, and relevant coursework
7. ALL INTERNSHIPS, TRAININGS, and WORK EXPERIENCE should be categorized under "workExperience" section
8. Extract CGPA from education if mentioned (e.g., "CGPA: 8.4/10")

CAREER OBJECTIVE FOR FRESHERS - CRITICAL RULES:
- NEVER mention "X years of experience" or any experience duration
- Focus on: skills learned, technologies known, career goals, eagerness to contribute
- Example GOOD: "Motivated Computer Science graduate seeking entry-level software developer role to apply React and Node.js skills in building scalable applications."
- Example BAD: "Software developer with 1 year experience seeking..." (WRONG - freshers don't have years of experience)

SECTION ORDER FOR FRESHERS:
1. Contact Information
2. Career Objective (REQUIRED - 2 lines focusing on entry-level goals, NO experience years)
3. Technical Skills
4. Education (PROMINENT)
5. Internships & Work Experience (IMPORTANT - includes all internships, trainings, and work)
6. Academic Projects (IMPORTANT)
7. Certifications
8. Additional Sections (if provided, with custom titles)`;
    }
  };

  const promptContent = `${getPromptForUserType(userType)}

CRITICAL REQUIREMENTS FOR BULLET POINTS:
1. Each bullet point MUST be concise, containing maximum 9-10 words only.
2. Include at least 30 relevant keywords from the job description across all bullet points.
3. Use STRONG ACTION VERBS only (no weak verbs like "helped", "assisted", "worked on", "was responsible for", "participated in", "involved in", "contributed to")
4. Start each bullet with powerful verbs like: Developed, Implemented, Architected, Optimized, Engineered, Designed, Led, Managed, Created, Built, Delivered, Achieved, Increased, Reduced, Streamlined, Automated, Transformed, Executed, Spearheaded, Established
5. Ensure no word is repeated more than twice across all bullet points within a section.

QUANTIFIED ACHIEVEMENTS - MANDATORY (CRITICAL):
6. EVERY bullet point MUST contain at least ONE quantified metric. NO EXCEPTIONS.
7. If original resume has metrics, PRESERVE them exactly (40%, $1M, 10,000+ users).
8. If original resume has NO metrics, GENERATE realistic metrics based on:
   - Role type (intern vs senior)
   - Company size (startup vs enterprise)
   - Industry standards
9. Types of metrics to use (vary across bullets):
   - Percentages: "improved by 35%", "reduced by 40%", "increased by 25%"
   - Numbers: "10,000+ users", "50+ APIs", "100+ test cases", "5 team members"
   - Time: "within 2 weeks", "3x faster", "reduced from 5 days to 1 day"
   - Currency: "$50K savings", "$1M revenue impact"
   - Scale: "serving 1M+ requests/day", "processing 10K transactions"
10. METRIC PLACEMENT: Put the metric at the END of the bullet for impact.
    GOOD: "Developed REST APIs using Node.js, reducing response time by 40%"
    BAD: "Developed REST APIs using Node.js for the backend system"
11. For freshers/students with no metrics, use realistic estimates:
    - "Improved page load time by 30%" (for frontend projects)
    - "Reduced API response time by 25%" (for backend work)
    - "Achieved 95% test coverage" (for testing)
    - "Processed 1000+ records daily" (for data work)
    - "Collaborated with 5+ team members" (for teamwork)

12. Focus on tangible RESULTS and measurable IMPACT, not just tasks or responsibilities.
13. MANDATORY: Each work experience entry MUST have EXACTLY 3 bullet points - no more, no less.
14. MANDATORY: Each project entry MUST have EXACTLY 2-3 bullet points - no less than 2.
15. All section titles MUST be in ALL CAPS (e.g., WORK EXPERIENCE, EDUCATION, PROJECTS).
16. Dates should be on the same line as roles/education, using the exact format "Jan 2023 – Mar 2024".
17. Integrate keywords naturally and contextually within sentences, avoiding keyword stuffing.
18. Ensure at least 70% of resume keywords match the job description for better ATS compatibility.
19. Avoid using subjective adjectives like "passionate", "dedicated", or "hardworking" unless backed by achievements.
20. If user provides minimal information for work experience, EXPAND and GENERATE 3 meaningful bullets with metrics.

METRIC PRESERVATION RULES (CRITICAL - DO NOT VIOLATE):
1. PRESERVE ALL NUMERIC METRICS from the original resume EXACTLY as they appear
2. If a bullet contains "40% improvement", "10,000+ users", "$1M revenue", or any quantifiable metric, it MUST appear in the optimized bullet
3. DO NOT change, round, or approximate any numbers (e.g., don't change "10,000" to "10K" or "40%" to "substantial")
4. If you cannot naturally integrate a metric while rewriting, keep the original phrasing
5. Metrics include: percentages (40%), multipliers (2x), currency ($1M), scale (10,000+), time (3 months), quantities (5 engineers)
6. NEVER remove impact metrics to make room for keywords

CONTEXTUAL KEYWORD INSERTION RULES:
1. Maximum 2 job description keywords per bullet point
2. Only insert keywords where they fit the SEMANTIC CONTEXT of the original bullet
3. Do NOT insert keywords at the start of bullets (avoid keyword stuffing detection)
4. If a bullet is about backend systems, only add backend-related JD keywords (not frontend/AI terms)
5. If semantic context doesn't match, DO NOT force keyword insertion
6. Use keyword variations and synonyms to maintain natural flow

STAR FORMAT ENFORCEMENT (EVERY BULLET MUST FOLLOW THIS):
1. Format: [Action Verb] + [What you did] + [Technology/Tool] + [Quantified Result]
2. EVERY bullet MUST end with a metric (%, number, time, or scale)
3. Examples of CORRECT bullets:
   - "Developed REST APIs using Node.js and Express, reducing response time by 40%"
   - "Built React dashboard for analytics, serving 5,000+ daily active users"
   - "Automated deployment pipeline with Jenkins, cutting release time from 2 hours to 15 minutes"
   - "Implemented caching with Redis, improving query performance by 60%"
   - "Led team of 4 developers to deliver project 2 weeks ahead of schedule"
4. Examples of WRONG bullets (NO METRICS - DO NOT GENERATE THESE):
   - "Developed REST APIs using Node.js and Express" (missing metric)
   - "Built React dashboard for analytics" (missing metric)
   - "Worked on deployment pipeline" (weak verb + no metric)
5. If you cannot add a metric, the bullet is INCOMPLETE - add one!

WORD VARIETY - NO REPETITION (CRITICAL FOR ATS):
1. NEVER use the same action verb to start more than 2 bullets across the ENTIRE resume
2. NEVER repeat the same word more than 3 times across all bullets (excluding common words like "the", "and", "with")
3. Use SYNONYMS to vary your vocabulary:
   - Instead of "Developed" multiple times, use: Built, Created, Engineered, Designed, Implemented, Constructed
   - Instead of "Improved" multiple times, use: Enhanced, Optimized, Boosted, Elevated, Refined, Streamlined
   - Instead of "Managed" multiple times, use: Led, Directed, Oversaw, Coordinated, Supervised, Administered
   - Instead of "Analyzed" multiple times, use: Evaluated, Assessed, Examined, Investigated, Reviewed
   - Instead of "Collaborated" multiple times, use: Partnered, Teamed, Cooperated, Worked with, Joined forces
4. Track your word usage - if you've used "developed" twice, switch to "built" or "created"
5. Each bullet should feel UNIQUE - avoid repetitive sentence structures
6. BAD EXAMPLE (repetitive):
   - "Developed REST APIs using Node.js..."
   - "Developed frontend components using React..."
   - "Developed database schemas using PostgreSQL..."
7. GOOD EXAMPLE (varied):
   - "Engineered REST APIs using Node.js..."
   - "Built responsive frontend components using React..."
   - "Designed optimized database schemas using PostgreSQL..."

HALLUCINATION PREVENTION:
1. ONLY use technologies, tools, and frameworks mentioned in the original resume OR job description
2. DO NOT invent project names, company names, or technical terms
3. If the resume mentions "React", do not add "Angular" unless it's in the JD and contextually relevant
4. Stick to facts from the original resume - enhance presentation, not content

PROJECT STRUCTURING REQUIREMENTS (MANDATORY):
1. EVERY project MUST follow this exact structure:
   - Project Title with Role (e.g., "E-commerce Platform - Backend Developer")
   - One-line problem statement or context
   - 2-3 impact bullets with VERB + TECH + IMPACT + METRIC pattern
   - One mandatory "Tech Used:" bullet listing ALL technologies

2. "Tech Used:" bullet MUST include:
   - Main programming languages (e.g., Java, Python, JavaScript)
   - Frameworks and libraries (e.g., React, Spring Boot, Django)
   - Databases (e.g., MySQL, PostgreSQL, MongoDB)
   - Infrastructure/DevOps tools (e.g., Docker, Kubernetes, AWS, Jenkins)
   - Architecture patterns when relevant (e.g., microservices, REST API, event-driven)

3. Example compliant project:
   Payment Gateway Integration - Backend Developer
   Built secure payment processing system for e-commerce platform.
   • Developed RESTful API using Node.js and Express handling 50,000+ daily transactions
   • Implemented fraud detection algorithms reducing false positives by 45%
   • Integrated Stripe and PayPal APIs achieving 99.9% uptime
   • Tech Used: Node.js, Express, MongoDB, Redis, Docker, AWS Lambda, Stripe API, RESTful architecture

CERTIFICATION EXPANSION REQUIREMENTS:
1. Expand ALL abbreviated certification names to full official titles
2. Examples of correct expansions:
   - "AWS Certified" → "AWS Certified Solutions Architect - Associate"
   - "Azure Fundamentals" → "Microsoft Certified: Azure Fundamentals"
   - "CKA" → "Certified Kubernetes Administrator (CKA)"
   - "PMP" → "Project Management Professional (PMP)"
3. Include certification provider in the title (AWS, Microsoft, Google Cloud, etc.)
4. Add level designation when applicable (Associate, Professional, Expert, Specialist)

JOB TITLE PLACEMENT REQUIREMENTS (CRITICAL):
1. Job title from JD MUST appear in these locations:
   - In the targetRole field (header section)
   - In the first sentence of Professional Summary or Career Objective
   - At least once in Work Experience role titles OR Project titles
2. Use exact job title wording from the JD when possible
3. If job title is "Senior Java Developer", mention "Java Developer" role explicitly

KEYWORD FREQUENCY REQUIREMENTS:
1. Extract top 5-10 technical skills from the job description
2. Each top skill should appear 4-6 times naturally across:
   - Skills section (1 time)
   - Summary/Objective (0-1 times)
   - Work Experience bullets (1-2 times)
   - Projects bullets (2-3 times)
3. Distribute keywords across different sections, not clustered
4. Ensure keywords fit semantic context of each bullet

WORD COUNT REQUIREMENTS (STRICT):
1. Professional Summary: 40-60 words
2. Career Objective: 30-50 words
3. Each bullet point: maximum 10 words
4. Total resume target: 400-650 words
5. DO NOT exceed these limits

SKILLS REQUIREMENTS: (Generate comprehensive skills based on the resume content and job description)
1. Include at least 6-8 distinct skill categories.
2. Each category should contain 5-8 specific, relevant skills.
4. Match skills to job requirements and industry standards
5. Include both technical and soft skills relevant to the role
6.TO GENERATE SOFT SKILLS according jd

CERTIFICATIONS REQUIREMENTS (CRITICAL):
1. For EACH certification, provide a concise 15-word description in the 'description' field
2. Description MUST explain what the certification validates or demonstrates
3. Example format:
   - title: "AWS Certified Solutions Architect - Associate"
   - description: "Validates expertise in designing distributed systems and deploying applications on AWS cloud infrastructure."
4. NEVER leave description empty or as "..."

SOCIAL LINKS REQUIREMENTS - CRITICAL:
1. LinkedIn URL: "${linkedinUrl || ''}" - ONLY include if this is NOT empty
2. GitHub URL: "${githubUrl || ''}" - ONLY include if this is NOT empty
3. If LinkedIn URL is empty (""), set linkedin field to empty string ""
4. If GitHub URL is empty (""), set github field to empty string ""
5. DO NOT create, modify, or generate any social media links
6. Use EXACTLY what is provided - no modifications

TARGET ROLE INFORMATION:
${targetRole ? `Target Role: "${targetRole}"` : 'No specific target role provided'}

CONDITIONAL SECTION GENERATION: (Ensure these sections are generated based on user type)
${userType === 'experienced' ? `
- Professional Summary: REQUIRED - Create a compelling 2-3 line summary
- Education: MINIMAL or OMIT unless specifically required by job
- Focus heavily on work experience and achievements
- Omit or minimize fresher-specific sections
` : userType === 'student' ? `
- Career Objective: REQUIRED - Create a compelling 2-line objective focusing on internship goals
- Education: PROMINENT - include degree, institution, year, CGPA, and location
- Academic Projects: IMPORTANT - treat as main experience section
- Work Experience: Include any internships, part-time jobs, or training
- Achievements: Include academic awards, competitions, rankings
- Languages Known: Include if present (list languages with proficiency levels if available)
- Location: Include in contact information and education details
` : `
- Professional Summary: OPTIONAL - only if candidate has relevant internships/experience
- Career Objective: REQUIRED - Create a compelling 2-line objective focusing on entry-level goals. CRITICAL: DO NOT include any "X years of experience" - freshers have no professional experience years.
- Education: INCLUDE CGPA if mentioned in original resume (e.g., "CGPA: 8.4/10") and date format ex;2021-2024 
- Academic Projects: IMPORTANT - treat as main experience section
- Work Experience: COMBINE all internships, trainings, and work experience under this single section
- Certifications
- Achievements: Include if present in original resume (academic awards, competitions, etc.)
- Extra-curricular Activities: Include if present (leadership roles, clubs, volunteer work)
- Languages Known: Include if present (list languages with proficiency levels if available)
- Personal Details (if present in original resume)`
}

IMPORTANT: Follow the exact structure provided below. Only include sections that have actual content.

Rules:
1. Only respond with valid JSON
2. Use the exact structure provided below
3. Rewrite bullet points following the CRITICAL REQUIREMENTS above
4. Generate comprehensive skills section based on resume and job description
5. Only include sections that have meaningful content
6. If optional sections don't exist in original resume, set them as empty arrays or omit
7. Ensure all dates are in proper format (e.g., "Jan 2023 – Mar 2024")
8. Use professional language and industry-specific keywords from the job description
9. For LinkedIn and GitHub, use EXACTLY what is provided - empty string if not provided
10. The "name" field in the JSON should ONLY contain the user's name. The "email", "phone", "linkedin", "github", and "location" fields MUST NOT contain the user's name or any part of it. The user's name should appear ONLY in the dedicated "name" field.
11. CRITICAL: ALWAYS include the "projects" section in your response. If the original resume has projects, optimize them. If no projects exist, create 1-2 relevant projects based on the skills and job description.
12. CRITICAL: The "projects" array MUST NOT be empty. Every resume needs at least 1 project to demonstrate practical skills.
11. NEW: If 'additionalSections' are provided, include them in the output JSON with their custom titles and optimized bullet points. Apply all bullet point optimization rules to these sections as well.

JSON Structure:
{
  "name": "${userName || '...'}",
  "location": "...", 
  "phone": "${userPhone || '...'}",
  "email": "${userEmail || '...'}",
  "linkedin": "${userLinkedin || linkedinUrl || '...'}",
  "github": "${userGithub || githubUrl || '...'}",
  "targetRole": "${targetRole || '...'}",
  ${userType === 'experienced' ? '"summary": "...",' : ''}
  ${userType === 'student' ? '"careerObjective": "...",' : ''}
  ${userType === 'fresher' ? '"careerObjective": "...",' : ''}
  "education": [
    {"degree": "...", "school": "...", "year": "...", "cgpa": "...", "location": "..."}
  ],
  "workExperience": [
    {"role": "...", "company": "...", "year": "...", "bullets": ["...", "...", "..."]}
  ],
  "projects": [
    {"title": "...", "bullets": ["...", "...", "..."]}
  ],
  "skills": [
    {"category": "Programming Languages", "count": 6, "list": ["JavaScript", "TypeScript", "Python", "Java", "SQL", "Go"]},
    {"category": "Frontend Technologies", "count": 6, "list": ["React", "Angular", "Vue.js", "HTML5", "CSS3", "Tailwind CSS"]},
    {"category": "Backend Technologies", "count": 5, "list": ["Node.js", "Express", "Django", "Spring Boot", "GraphQL"]},
    {"category": "Databases", "count": 5, "list": ["PostgreSQL", "MongoDB", "Redis", "MySQL", "DynamoDB"]},
    {"category": "Cloud & DevOps", "count": 6, "list": ["AWS", "Docker", "Kubernetes", "Jenkins", "CI/CD", "Terraform"]},
    {"category": "Data Science & ML", "count": 5, "list": ["TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-learn"]},
    {"category": "Tools & Platforms", "count": 5, "list": ["Git", "GitHub", "Jira", "Postman", "VS Code"]},
    {"category": "Testing & QA", "count": 4, "list": ["Jest", "Pytest", "Selenium", "Cypress"]},
    {"category": "Soft Skills", "count": 5, "list": ["Leadership", "Communication", "Problem-solving", "Teamwork", "Agile"]}
  ],

CRITICAL SKILL CATEGORIZATION RULES - YOU MUST FOLLOW THESE EXACTLY:
1. Programming Languages: ONLY actual programming languages (JavaScript, TypeScript, Python, Java, C++, Go, etc.)
   - DO NOT include: HTML, CSS, React, Angular, Vue, Express, Docker, Kubernetes, AWS, Azure, TensorFlow
2. Frontend Technologies: React, Angular, Vue.js, HTML5, CSS3, Tailwind, Bootstrap, Next.js, etc.
3. Backend Technologies: Node.js, Express, Django, Flask, Spring Boot, FastAPI, etc.
4. Databases: MySQL, PostgreSQL, MongoDB, Redis, Elasticsearch, etc.
5. Cloud & DevOps: AWS, Azure, Docker, Kubernetes, Terraform, Jenkins, CI/CD, etc.
6. Data Science & ML: TensorFlow, PyTorch, Keras, Pandas, NumPy, Scikit-learn, Jupyter, Spark, etc.
7. Tools & Platforms: Git, GitHub, Jira, VS Code, Postman, etc.
8. Testing & QA: Jest, Pytest, Selenium, Cypress, JUnit, Mocha, etc.
9. Soft Skills: Leadership, Communication, Teamwork, Problem-solving, etc.

CRITICAL: REMOVE VERSION NUMBERS FROM ALL SKILLS:
- "Python 3.11" → "Python"
- "React 18" → "React"
- "Node.js 20" → "Node.js"
- "Java 11" → "Java"

EXAMPLES OF CORRECT CATEGORIZATION:
- JavaScript, Python, Java → Programming Languages
- React, Angular, Vue.js, Next.js → Frontend Technologies
- Express, Django, Spring Boot → Backend Technologies
- Docker, Kubernetes, AWS, Terraform → Cloud & DevOps
- TensorFlow, PyTorch, Pandas → Data Science & ML
- MySQL, MongoDB, PostgreSQL → Databases
- Git, GitHub, Jira, VS Code → Tools & Platforms
- Jest, Pytest, Selenium → Testing & QA
  "certifications": [
    {"title": "AWS Certified Solutions Architect", "description": "Validates expertise in designing distributed systems on AWS cloud infrastructure."},
    {"title": "Google Cloud Professional", "description": "Demonstrates proficiency in deploying and managing applications on Google Cloud Platform."}
  ],
  ${additionalSections && additionalSections.length > 0 ? '"additionalSections": [' : ''}
  ${additionalSections && additionalSections.length > 0 ? '{"title": "...", "bullets": ["...", "...", "..."]}' : ''}
  ${additionalSections && additionalSections.length > 0 ? ']' : ''}
}
Resume:
${cleanedResume}

Job Description:
${cleanedJobDescription}
${jdSummary ? `
JD SUMMARY (for alignment focus):
${jdSummary}
` : ''}
User Type: ${userType.toUpperCase()}

LinkedIn URL provided: ${linkedinUrl || 'NONE - leave empty'}
GitHub URL provided: ${githubUrl || 'NONE - leave empty'}
${additionalSections && additionalSections.length > 0 ? `Additional Sections Provided: ${JSON.stringify(additionalSections)}` : ''}`;

  const response = await safeFetch({ prompt: promptContent });
  let raw = response.content;
  if (!raw) throw new Error("No content returned from EdenAI");

  const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
  let cleanedResult: string;
  if (jsonMatch && jsonMatch[1]) {
    cleanedResult = jsonMatch[1].trim();
  } else {
    cleanedResult = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  }

  try {
    let parsedResult = JSON.parse(cleanedResult);

    parsedResult = deepCleanComments(parsedResult);

    const EMPTY_TOKEN_RE = /^(?:n\/a|not\s*specified|none)$/i;
    const deepClean = (val: any): any => {
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return EMPTY_TOKEN_RE.test(trimmed) ? '' : trimmed;
      }
      if (Array.isArray(val)) return val.map(deepClean);
      if (val && typeof val === 'object') {
        const out: Record<string, any> = {};
        for (const k of Object.keys(val)) out[k] = deepClean(val[k]);
        return out;
      }
      return val;
    };
    parsedResult = deepClean(parsedResult);

    if (parsedResult.skills && Array.isArray(parsedResult.skills)) {
      console.log('🛠️ Processing skills...');
      console.log('   - Raw skills from AI:', JSON.stringify(parsedResult.skills));
      
      // Use centralized taxonomy (imported from skillsTaxonomy.ts)
      // NO hardcoded arrays - single source of truth!

      // Reorganize skills into proper categories (including new ML/AI category)
      const reorganizedSkills: Record<string, string[]> = {
        'Programming Languages': [],
        'Frontend Technologies': [],
        'Backend Technologies': [],
        'Databases': [],
        'Cloud & DevOps': [],
        'Data Science & ML': [],
        'Testing & QA': [],
        'Tools & Platforms': [],
        'Soft Skills': []
      };
      
      // Helper function to extract skills from various formats
      const extractSkillsFromCategory = (skillCat: any): string[] => {
        // Handle array of strings directly
        if (Array.isArray(skillCat)) {
          return skillCat.filter((s: any) => typeof s === 'string');
        }
        // Handle object with 'list' property
        if (skillCat && skillCat.list && Array.isArray(skillCat.list)) {
          return skillCat.list.filter((s: any) => typeof s === 'string');
        }
        // Handle object with 'skills' property
        if (skillCat && skillCat.skills && Array.isArray(skillCat.skills)) {
          return skillCat.skills.filter((s: any) => typeof s === 'string');
        }
        // Handle comma-separated string
        if (typeof skillCat === 'string') {
          return skillCat.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        return [];
      };
      
      // Process all skills from all categories
      parsedResult.skills.forEach((skillCat: any) => {
        const skills = extractSkillsFromCategory(skillCat);
        
        skills.forEach((rawSkill: string) => {
          if (!rawSkill || typeof rawSkill !== 'string') return;

          // Strip version numbers from skills
          const skill = stripVersionFromSkill(rawSkill);
          const skillLower = skill.toLowerCase().trim();
          if (!skillLower) return;

          // CRITICAL: Check in priority order (most specific first)
          // This prevents misclassification (e.g., React going to Programming Languages)

          // 1. Check Data Science & ML FIRST (before programming languages to prevent TensorFlow→Python confusion)
          if (DATA_SCIENCE_AND_ML.some(ml => skillLower === ml || skillLower.includes(ml))) {
            if (!reorganizedSkills['Data Science & ML'].includes(skill)) {
              reorganizedSkills['Data Science & ML'].push(skill);
            }
            return;
          }

          // 2. Check soft skills (highest priority for non-technical)
          if (SOFT_SKILLS.some(s => skillLower.includes(s))) {
            if (!reorganizedSkills['Soft Skills'].includes(skill)) {
              reorganizedSkills['Soft Skills'].push(skill);
            }
            return;
          }

          // 3. Check Frontend Technologies (before programming languages to catch React, Angular, etc.)
          if (FRONTEND_TECHNOLOGIES.some(f => skillLower === f || skillLower.includes(f))) {
            if (!reorganizedSkills['Frontend Technologies'].includes(skill)) {
              reorganizedSkills['Frontend Technologies'].push(skill);
            }
            return;
          }

          // 4. Check Backend Technologies
          if (BACKEND_TECHNOLOGIES.some(b => skillLower === b || skillLower.includes(b))) {
            if (!reorganizedSkills['Backend Technologies'].includes(skill)) {
              reorganizedSkills['Backend Technologies'].push(skill);
            }
            return;
          }

          // 5. Check Cloud & DevOps (before Tools to catch Docker, AWS, etc.)
          if (CLOUD_AND_DEVOPS.some(c => skillLower === c || skillLower.includes(c))) {
            if (!reorganizedSkills['Cloud & DevOps'].includes(skill)) {
              reorganizedSkills['Cloud & DevOps'].push(skill);
            }
            return;
          }

          // 6. Check Databases
          if (DATABASES.some(d => skillLower === d || skillLower.includes(d))) {
            if (!reorganizedSkills['Databases'].includes(skill)) {
              reorganizedSkills['Databases'].push(skill);
            }
            return;
          }

          // 7. Check Testing & QA
          if (TESTING_AND_QA.some(t => skillLower === t || skillLower.includes(t))) {
            if (!reorganizedSkills['Testing & QA'].includes(skill)) {
              reorganizedSkills['Testing & QA'].push(skill);
            }
            return;
          }

          // 8. Check Programming Languages (AFTER frameworks to avoid misclassification)
          if (PROGRAMMING_LANGUAGES.some(l => skillLower === l || skillLower.includes(l))) {
            if (!reorganizedSkills['Programming Languages'].includes(skill)) {
              reorganizedSkills['Programming Languages'].push(skill);
            }
            return;
          }

          // 9. Check Tools & Platforms
          if (TOOLS_AND_PLATFORMS.some(t => skillLower === t || skillLower.includes(t))) {
            if (!reorganizedSkills['Tools & Platforms'].includes(skill)) {
              reorganizedSkills['Tools & Platforms'].push(skill);
            }
            return;
          }

          // 10. Default to Tools & Platforms for unmatched technical skills
          if (!reorganizedSkills['Tools & Platforms'].includes(skill)) {
            reorganizedSkills['Tools & Platforms'].push(skill);
          }
        });
      });
      
      // Convert back to array format, only include non-empty categories
      // Order categories in a logical way
      const categoryOrder = [
        'Programming Languages',
        'Frontend Technologies',
        'Backend Technologies',
        'Databases',
        'Cloud & DevOps',
        'Data Science & ML',
        'Testing & QA',
        'Tools & Platforms',
        'Soft Skills'
      ];
      
      parsedResult.skills = categoryOrder
        .filter(category => reorganizedSkills[category].length > 0)
        .map(category => ({
          category,
          count: reorganizedSkills[category].length,
          list: reorganizedSkills[category]
        }));
      
      console.log('   - Reorganized skills:', parsedResult.skills.map((s: any) => `${s.category}: ${s.count}`));
      
      // Ensure we have at least some basic categories if skills are too few
      if (parsedResult.skills.length < 3) {
        console.log('   ⚠️ Too few skill categories after reorganization, may need to check AI response format');
        // If reorganization resulted in too few categories, it might be better to keep original
        // This can happen if AI returned skills in a format we didn't expect
      }
    }

    if (parsedResult.certifications && Array.isArray(parsedResult.certifications)) {
      // Generate default descriptions for common certifications
      const certDescriptions: Record<string, string> = {
        'aws': 'Validates expertise in designing and deploying scalable systems on Amazon Web Services.',
        'azure': 'Demonstrates proficiency in Microsoft Azure cloud services and solutions architecture.',
        'gcp': 'Certifies knowledge of Google Cloud Platform infrastructure and application development.',
        'kubernetes': 'Validates skills in deploying, managing, and scaling containerized applications.',
        'docker': 'Demonstrates expertise in containerization and Docker ecosystem technologies.',
        'pmp': 'Certifies project management expertise following PMI standards and best practices.',
        'scrum': 'Validates understanding of Scrum framework and agile project management methodologies.',
        'cissp': 'Demonstrates advanced knowledge in information security and cybersecurity practices.',
        'comptia': 'Validates foundational IT skills and technical knowledge for IT professionals.',
        'oracle': 'Certifies expertise in Oracle database administration and development.',
        'salesforce': 'Demonstrates proficiency in Salesforce CRM platform and ecosystem.',
        'terraform': 'Validates infrastructure as code skills using HashiCorp Terraform.',
      };
      
      parsedResult.certifications = parsedResult.certifications
        .map((cert: any) => {
          if (typeof cert === 'string') {
            const certLower = cert.toLowerCase();
            let description = '';
            for (const [key, desc] of Object.entries(certDescriptions)) {
              if (certLower.includes(key)) {
                description = desc;
                break;
              }
            }
            return { title: cert.trim(), description };
          }
          if (cert && typeof cert === 'object') {
            const title =
              (typeof cert.title === 'string' && cert.title) ||
              (typeof cert.name === 'string' && cert.name) ||
              (typeof cert.certificate === 'string' && cert.certificate) ||
              (typeof cert.issuer === 'string' && cert.issuer) ||
              (typeof cert.provider === 'string' && cert.provider) ||
              '';
            let description =
              (typeof cert.description === 'string' && cert.description) ||
              '';
            
            // Generate description if empty or placeholder
            if (!description || description === '...' || description.length < 10) {
              const titleLower = title.toLowerCase();
              for (const [key, desc] of Object.entries(certDescriptions)) {
                if (titleLower.includes(key)) {
                  description = desc;
                  break;
                }
              }
              // Default description if no match
              if (!description || description.length < 10) {
                description = `Professional certification validating expertise in ${title.split(' ').slice(0, 3).join(' ')}.`;
              }
            }
            
            if (!title) return null;
            return { title: title.trim(), description: description.trim() };
          }
          return { title: String(cert), description: 'Professional certification demonstrating technical expertise.' };
        })
        .filter(Boolean);
    }

    if (parsedResult.workExperience && Array.isArray(parsedResult.workExperience)) {
      console.log('📝 Processing work experience bullets...');
      
      // Filter valid entries and ensure minimum 3 bullets per work experience
      parsedResult.workExperience = parsedResult.workExperience
        .filter((work: any) => work && work.role && work.company && work.year)
        .map((work: any) => {
          // Ensure bullets array exists
          if (!work.bullets || !Array.isArray(work.bullets)) {
            work.bullets = [];
          }
          
          console.log(`   - ${work.role} at ${work.company}: ${work.bullets.length} bullets`);
          
          // Generate role-specific bullets based on the actual role
          const roleLower = (work.role || '').toLowerCase();
          const isDataRole = roleLower.includes('data') || roleLower.includes('analyst');
          const isFrontend = roleLower.includes('frontend') || roleLower.includes('front-end') || roleLower.includes('ui');
          const isBackend = roleLower.includes('backend') || roleLower.includes('back-end') || roleLower.includes('server');
          const isFullStack = roleLower.includes('full') || roleLower.includes('stack');
          const isIntern = roleLower.includes('intern');
          
          let contextBullets: string[] = [];
          
          if (isDataRole) {
            contextBullets = [
              `Analyzed large datasets using Python and SQL, identifying key insights that improved business decisions by 25%.`,
              `Developed interactive dashboards and reports using Power BI/Tableau, enabling real-time data visualization for stakeholders.`,
              `Implemented data cleaning and ETL pipelines, reducing data processing time by 40% and improving data quality.`,
              `Collaborated with cross-functional teams to gather requirements and deliver data-driven solutions on schedule.`,
              `Automated repetitive data tasks using Python scripts, saving 10+ hours of manual work weekly.`
            ];
          } else if (isFrontend) {
            contextBullets = [
              `Developed responsive web applications using React.js and modern CSS frameworks, improving user experience by 35%.`,
              `Implemented reusable UI components and design systems, reducing development time by 30% across projects.`,
              `Optimized frontend performance through code splitting and lazy loading, achieving 50% faster page load times.`,
              `Collaborated with UX designers to translate wireframes into pixel-perfect, accessible interfaces.`,
              `Integrated RESTful APIs and managed application state using Redux/Context API for seamless data flow.`
            ];
          } else if (isBackend) {
            contextBullets = [
              `Designed and developed RESTful APIs using Node.js/Python, handling 10,000+ daily requests with 99.9% uptime.`,
              `Implemented database optimization strategies, reducing query response time by 45% and improving scalability.`,
              `Built microservices architecture with Docker and Kubernetes, enabling seamless deployment and scaling.`,
              `Developed authentication and authorization systems using JWT and OAuth, ensuring secure user access.`,
              `Created automated testing suites achieving 85% code coverage, reducing production bugs by 40%.`
            ];
          } else if (isFullStack) {
            contextBullets = [
              `Developed end-to-end web applications using React.js frontend and Node.js backend, serving 5,000+ users.`,
              `Designed and implemented database schemas in PostgreSQL/MongoDB, optimizing data retrieval by 35%.`,
              `Built CI/CD pipelines using GitHub Actions, reducing deployment time from hours to minutes.`,
              `Implemented responsive designs and RESTful APIs, ensuring seamless user experience across devices.`,
              `Collaborated with product teams to deliver features on schedule, maintaining high code quality standards.`
            ];
          } else if (isIntern) {
            contextBullets = [
              `Developed 5+ production features using React.js and Node.js, contributing to 15% increase in user engagement.`,
              `Collaborated with senior developers to implement new functionality, improving application performance by 20%.`,
              `Wrote 50+ unit tests achieving 80% code coverage, reducing production bugs by 30%.`,
              `Built RESTful APIs handling 1,000+ daily requests, ensuring 99% uptime during internship period.`,
              `Automated 3 manual processes using Python scripts, saving team 8+ hours weekly.`
            ];
          } else {
            contextBullets = [
              `Developed and maintained software applications, improving system performance by 30% and reliability by 25%.`,
              `Delivered 10+ features on schedule, collaborating with cross-functional teams of 8+ members.`,
              `Implemented automated testing achieving 85% code coverage, reducing production bugs by 40%.`,
              `Optimized database queries and caching, reducing API response time by 45%.`,
              `Led technical initiatives impacting 5,000+ users, enhancing team productivity by 20%.`
            ];
          }
          
          // Add bullets until we have exactly 3
          while (work.bullets.length < 3) {
            const availableBullets = contextBullets.filter(b => 
              !work.bullets.some((existing: string) => 
                existing.toLowerCase().slice(0, 30) === b.toLowerCase().slice(0, 30)
              )
            );
            
            if (availableBullets.length > 0) {
              work.bullets.push(availableBullets[0]);
              contextBullets = contextBullets.filter(b => b !== availableBullets[0]);
            } else {
              // Fallback with metric if all context bullets are used
              work.bullets.push(`Delivered ${work.role} responsibilities on schedule, achieving 95% stakeholder satisfaction.`);
            }
          }
          
          // Ensure exactly 3 bullets
          work.bullets = work.bullets.slice(0, 3);
          
          console.log(`   - After processing: ${work.bullets.length} bullets`);
          
          return work;
        });
    }

    if (parsedResult.projects && Array.isArray(parsedResult.projects)) {
      // Filter valid entries and ensure minimum 2 bullets per project
      parsedResult.projects = parsedResult.projects
        .filter((project: any) => project && project.title)
        .map((project: any) => {
          // Ensure bullets array exists
          if (!project.bullets || !Array.isArray(project.bullets)) {
            project.bullets = [];
          }
          
          const defaultProjectBullets = [
            `Designed and implemented core features using modern technologies, reducing development time by 30%.`,
            `Optimized application performance achieving 40% faster load times and improved user experience.`,
            `Deployed application with CI/CD pipeline, ensuring 99.9% uptime and serving 1,000+ users.`
          ];
          
          // Add bullets until we have at least 2
          let bulletIndex = 0;
          while (project.bullets.length < 2 && bulletIndex < defaultProjectBullets.length) {
            const newBullet = defaultProjectBullets[bulletIndex];
            if (!project.bullets.some((b: string) => b.toLowerCase().includes(newBullet.toLowerCase().slice(0, 20)))) {
              project.bullets.push(newBullet);
            }
            bulletIndex++;
          }
          
          // Ensure max 3 bullets
          project.bullets = project.bullets.slice(0, 3);
          
          return project;
        })
        .filter((project: any) => project.bullets && project.bullets.length > 0);
    }

    // ========================================================================
    // POST-PROCESSING: ENSURE ALL BULLETS HAVE QUANTIFIED METRICS
    // ========================================================================
    console.log('📊 Post-processing: Ensuring all bullets have quantified metrics...');
    
    const hasMetricPattern = /\d+%|\$\d+|\d+\s*(users?|customers?|clients?|team|people|million|k\b|x\b|hours?|days?|weeks?|months?|engineers?|developers?|projects?|apis?|requests?|transactions?)/i;
    
    const metricsToAdd = [
      ', improving efficiency by 35%',
      ', reducing processing time by 40%',
      ', achieving 95% accuracy',
      ', serving 1,000+ users',
      ', with 99.9% uptime',
      ', increasing performance by 30%',
      ', reducing errors by 50%',
      ', handling 5,000+ daily requests',
      ', cutting development time by 25%',
      ', improving user engagement by 45%',
    ];
    
    let metricIdx = 0;
    
    // Add metrics to work experience bullets that don't have them
    if (parsedResult.workExperience && Array.isArray(parsedResult.workExperience)) {
      parsedResult.workExperience.forEach((exp: any) => {
        if (exp.bullets && Array.isArray(exp.bullets)) {
          exp.bullets = exp.bullets.map((bullet: string) => {
            if (!hasMetricPattern.test(bullet)) {
              const metric = metricsToAdd[metricIdx % metricsToAdd.length];
              metricIdx++;
              // Remove trailing period and add metric
              const cleanBullet = bullet.replace(/\.?\s*$/, '');
              console.log(`   📈 Adding metric to work bullet: "${cleanBullet.slice(0, 40)}..." -> "${metric}"`);
              return `${cleanBullet}${metric}.`;
            }
            return bullet;
          });
        }
      });
    }
    
    // Add metrics to project bullets that don't have them
    if (parsedResult.projects && Array.isArray(parsedResult.projects)) {
      parsedResult.projects.forEach((project: any) => {
        if (project.bullets && Array.isArray(project.bullets)) {
          project.bullets = project.bullets.map((bullet: string) => {
            if (!hasMetricPattern.test(bullet)) {
              const metric = metricsToAdd[metricIdx % metricsToAdd.length];
              metricIdx++;
              // Remove trailing period and add metric
              const cleanBullet = bullet.replace(/\.?\s*$/, '');
              console.log(`   📈 Adding metric to project bullet: "${cleanBullet.slice(0, 40)}..." -> "${metric}"`);
              return `${cleanBullet}${metric}.`;
            }
            return bullet;
          });
        }
      });
    }
    
    console.log(`   ✅ Added metrics to ${metricIdx} bullets`);
    // ========================================================================

    if (parsedResult.additionalSections && Array.isArray(parsedResult.additionalSections)) {
      parsedResult.additionalSections = parsedResult.additionalSections.filter(
        (section: any) => section && section.title && section.bullets && section.bullets.length > 0
      );
    }


    parsedResult.name = userName || parsedResult.name || '';

    parsedResult.linkedin = userLinkedin || parsedResult.linkedin || '';
    parsedResult.github = userGithub || parsedResult.github || '';

    if (userEmail) {
      parsedResult.email = userEmail;
    } else if (parsedResult.email) {
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
      const match = String(parsedResult.email).match(emailRegex);
      parsedResult.email = match && match[0] ? match[0] : '';
    } else {
      parsedResult.email = '';
    }

    if (userPhone) {
      parsedResult.phone = userPhone;
    } else if (parsedResult.phone) {
      const phoneRegex = /(\+?\d{1,3}[-.\s]?)(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
      const match = String(parsedResult.phone).match(phoneRegex);
      parsedResult.phone = match && match[0] ? match[0] : '';
    } else {
      parsedResult.phone = '';
    }
parsedResult.summary = String(parsedResult.summary || '');
parsedResult.careerObjective = String(parsedResult.careerObjective || '');
    parsedResult.origin = 'jd_optimized';

    // Log optimization results
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ RESUME OPTIMIZATION COMPLETED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('👤 Name:', parsedResult.name || '(missing)');
    console.log('📧 Email:', parsedResult.email || '(missing)');
    console.log('📱 Phone:', parsedResult.phone || '(missing)');
    console.log('🔗 LinkedIn:', parsedResult.linkedin || '(missing)');
    console.log('🐙 GitHub:', parsedResult.github || '(missing)');
    console.log('📍 Location:', parsedResult.location || '(missing)');
    console.log('🎯 Target Role:', parsedResult.targetRole || '(missing)');
    console.log('📝 Summary:', parsedResult.summary ? `${parsedResult.summary.slice(0, 50)}...` : '(missing)');
    console.log('🎓 Education entries:', parsedResult.education?.length || 0);
    console.log('💼 Work experience entries:', parsedResult.workExperience?.length || 0);
    console.log('🚀 Projects:', parsedResult.projects?.length || 0);
    console.log('🛠️ Skill categories:', parsedResult.skills?.length || 0);
    console.log('📜 Certifications:', parsedResult.certifications?.length || 0);
    
    // Log missing sections
    const missingSections: string[] = [];
    if (!parsedResult.name) missingSections.push('Name');
    if (!parsedResult.email) missingSections.push('Email');
    if (!parsedResult.phone) missingSections.push('Phone');
    if (!parsedResult.summary && !parsedResult.careerObjective) missingSections.push('Summary/Objective');
    if (!parsedResult.education?.length) missingSections.push('Education');
    if (!parsedResult.workExperience?.length) missingSections.push('Work Experience');
    if (!parsedResult.projects?.length) missingSections.push('Projects');
    if (!parsedResult.skills?.length) missingSections.push('Skills');
    
    if (missingSections.length > 0) {
      console.warn('⚠️ MISSING SECTIONS:', missingSections.join(', '));
      
      // Add placeholder projects if missing (will be replaced by original in enhancedJdOptimizerService)
      if (!parsedResult.projects || parsedResult.projects.length === 0) {
        console.log('📝 Adding placeholder for projects section - will be populated from original resume');
        parsedResult.projects = [];
      }
      
      // Add placeholder skills if missing (will be replaced by original in enhancedJdOptimizerService)
      if (!parsedResult.skills || parsedResult.skills.length === 0) {
        console.log('📝 Adding placeholder for skills section - will be populated from original resume');
        parsedResult.skills = [];
      }
    } else {
      console.log('✅ All sections populated');
    }
    console.log('═══════════════════════════════════════════════════════════');

    return parsedResult;
  } catch (err) {
    console.error('JSON parsing error:', err);
    console.error('Raw response attempted to parse:', cleanedResult);
    throw new Error('Invalid JSON response from EdenAI');
  }
};

// --- RE-ADDED: generateMultipleAtsVariations function ---
export const generateMultipleAtsVariations = async (
  sectionType: 'summary' | 'careerObjective' | 'workExperienceBullets' | 'projectBullets' | 'skillsList' | 'certifications' | 'achievements' | 'additionalSectionBullets',
  data: any,
  modelOverride?: string,
  variationCount: number = 3,
  draftText?: string // NEW: Optional draft text to polish
): Promise<string[][]> => { // Changed return type to string[][]
  // --- NEW: Input Length Validation ---
  const combinedInputLength = JSON.stringify(data).length + (draftText?.length || 0);
  if (combinedInputLength > MAX_INPUT_LENGTH) {
    throw new Error(
      `Input for variations too long (${combinedInputLength} characters). ` +
      `The maximum allowed is ${MAX_INPUT_LENGTH} characters. Please shorten your input.`
    );
  }
  // --- END NEW ---

  const getPromptForMultipleVariations = (type: string, sectionData: any, count: number, draft?: string) => {
    const baseInstructions = `
CRITICAL ATS OPTIMIZATION RULES:
1. Use strong action verbs and industry keywords
2. Focus on quantifiable achievements and impact
3. Keep content concise
4. Avoid personal pronouns ("I", "my")
`;

    if (draft) {
      // If draft text is provided, instruct AI to polish it
      switch (type) {
        case 'summary':
          return `You are an expert resume writer specializing in ATS optimization for experienced professionals.
Generate ${count} distinctly different polished professional summary variations based on the following draft:
Draft: "${draft}"
${baseInstructions}
Each summary should be 2-3 sentences (50-80 words max).
Return ONLY a JSON array with exactly ${count} variations: ["summary1", "summary2", "summary3"]`;
        case 'careerObjective':
          return `You are an expert resume writer specializing in ATS optimization for entry-level professionals and students.
Generate ${count} distinctly different polished career objective variations based on the following draft:
Draft: "${draft}"
${baseInstructions}
Each objective should be 2 sentences (30-50 words max) and have a different approach:
- Variation 1: Learning and growth-focused
- Variation 2: Skills and contribution-focused
- Variation 3: Career goals and enthusiasm-focused
Return ONLY a JSON array with exactly ${count} variations: ["objective1", "objective2", "objective3"]`;
        // Other sections already handle their "draft" via `sectionData` fields.
      }
    }

    // Existing logic for generating from scratch
    switch (type) {
      case 'summary':
        return `You are an expert resume writer specializing in ATS optimization for experienced professionals.
Generate ${count} distinctly different professional summary variations based on:
- User Type: ${sectionData.userType}
- Target Role: ${sectionData.targetRole || 'General Professional Role'}
- Experience: ${JSON.stringify(sectionData.experience || [])}
${baseInstructions}
Each summary should be 2-3 sentences (50-80 words max) and have a different focus:
- Variation 1: Achievement-focused with metrics
- Variation 2: Skills and expertise-focused
- Variation 3: Leadership and impact-focused
Return ONLY a JSON array with exactly ${count} variations: ["summary1", "summary2", "summary3"]`;

      case 'careerObjective':
        return `You are an expert resume writer specializing in ATS optimization for entry-level professionals and students.
Generate ${count} distinctly different career objective variations based on:
- User Type: ${sectionData.userType}
- Target Role: ${sectionData.targetRole || 'Entry-level Professional Position'}
- Education: ${JSON.stringify(sectionData.education || [])}
${baseInstructions}
Each objective should be 2 sentences (30-50 words max) and have a different approach:
- Variation 1: Learning and growth-focused
- Variation 2: Skills and contribution-focused
- Variation 3: Career goals and enthusiasm-focused
Return ONLY a JSON array with exactly ${count} variations: ["objective1", "objective2", "objective3"]`;

      case 'workExperienceBullets': // MODIFIED PROMPT: Generate individual bullet points
        return `You are an expert resume writer specializing in ATS optimization.
The following are DRAFT bullet points provided by the user for a work experience entry. Your task is to POLISH and REWRITE these drafts, maintaining their core meaning and achievements, while strictly adhering to the ATS optimization rules. If the drafts are very short or generic, expand upon them using the provided role, company, and duration context.

DRAFT BULLET POINTS TO POLISH:
${sectionData.description}

CONTEXT:
- Role: ${sectionData.role}
- Company: ${sectionData.company}
- Duration: ${sectionData.year}
- User Type: ${sectionData.userType}

CRITICAL ATS OPTIMIZATION RULES:
1. Each bullet point MUST be concise with maximum 10 words.
2. Start each bullet with STRONG ACTION VERBS (Developed, Implemented, Led, Managed, Optimized, Achieved, Increased, Reduced)
3. NO weak verbs (helped, assisted, worked on, responsible for)
4. Include quantifiable achievements and metrics
5. Use industry-standard keywords
6. Focus on impact and results, not just responsibilities
7. Avoid repetitive words across bullets
8. Make each bullet distinct and valuable

Generate exactly ${count} individual polished bullet points.
Return ONLY a JSON array of strings, where each string is a single polished bullet point:
["polished_bullet_point_1", "polished_bullet_point_2", "polished_bullet_point_3", ...]`;

      case 'projectBullets': // MODIFIED PROMPT: Generate individual bullet points
        return `You are an expert resume writer specializing in ATS optimization.
The following are DRAFT bullet points provided by the user for a project entry. Your task is to POLISH and REWRITE these drafts, maintaining their core meaning and achievements, while strictly adhering to the ATS optimization rules. If the drafts are very short or generic, expand upon them using the provided project title, tech stack, and user type context.

DRAFT BULLET POINTS TO POLISH:
${sectionData.description}

CONTEXT:
- Project Title: ${sectionData.title}
- Tech Stack: ${sectionData.techStack || 'Modern technologies'}
- User Type: ${sectionData.userType}

CRITICAL ATS OPTIMIZATION RULES:
1. Each bullet point MUST be concise with maximum 10 words.
2. Start with STRONG ACTION VERBS (Developed, Built, Implemented, Designed, Created, Architected)
3. Include specific technologies mentioned in tech stack
4. Focus on technical achievements and impact
5. Include quantifiable results where possible
6. Use industry-standard technical keywords
7. Highlight problem-solving and innovation
8. Make each bullet showcase different aspects

Generate exactly ${count} individual polished bullet points.
Return ONLY a JSON array of strings, where each string is a single polished bullet point:
["polished_bullet_point_1", "polished_bullet_point_2", "polished_bullet_point_3", ...]`;

      case 'additionalSectionBullets': // NEW/MODIFIED PROMPT FOR POLISHING
        return `You are an expert resume writer specializing in ATS optimization.

The following are DRAFT bullet points provided by the user for a custom section. Your task is to POLISH and REWRITE these drafts, maintaining their core meaning and achievements, while strictly adhering to the ATS optimization rules. If the drafts are very short or generic, expand upon them using the provided section title and user type context.

DRAFT BULLET POINTS TO POLISH:
${sectionData.details}

CONTEXT:
- Section Title: ${sectionData.title}
- User Type: ${sectionData.userType}

CRITICAL ATS OPTIMIZATION RULES:
1. Each bullet point MUST be concise with maximum 10 words.
2. Start with STRONG ACTION VERBS (e.g., Awarded, Recognized, Achieved, Led, Volunteered, Fluent in)
3. Focus on achievements, contributions, or relevant details for the section type
4. Use industry-standard keywords where applicable
5. Quantify results where possible
6. Avoid repetitive words across bullets
7. Make each bullet distinct and valuable

Generate exactly ${count} individual polished bullet points.
Return ONLY a JSON array of strings, where each string is a single polished bullet point:
["polished_bullet_point_1", "polished_bullet_point_2", "polished_bullet_point_3", ...]`;

      case 'certifications': // NEW/MODIFIED PROMPT FOR POLISHING
        return `You are an expert resume writer specializing in ATS optimization.

Given the following certification details and context:
- Current Certification Title: "${sectionData.currentCertTitle || 'Not provided'}"
- Current Certification Description: "${sectionData.currentCertDescription || 'Not provided'}"
- Target Role: ${sectionData.targetRole || 'Professional Role'}
- Current Skills: ${JSON.stringify(sectionData.skills || [])}
- Job Description Context: ${sectionData.jobDescription || 'General professional context'}

Your task is to generate ${count} distinctly different polished and ATS-friendly titles for this certification.
Each title should be concise, professional, and highlight the most relevant aspect of the certification for a resume.
If the provided title/description is generic, make the generated titles more impactful and specific.

Return ONLY a JSON array with exactly ${count} polished certification titles: ["Polished Title 1", "Polished Title 2", "Polished Title 3"]`;

      case 'achievements':
        return `You are an expert resume writer specializing in ATS optimization.

Generate ${count} different achievement variations based on:
- User Type: ${sectionData.userType}
- Experience Level: ${sectionData.experienceLevel || 'Professional'}
- Target Role: ${sectionData.targetRole || 'Professional Role'}
- Context: ${sectionData.context || 'General professional achievements'}

${baseInstructions}

Each achievement MUST be 2 lines and between 15-20 words.
Each variation should include 3-4 quantified achievements:
- Variation 1: Performance and results-focused
- Variation 2: Leadership and team impact-focused
- Variation 3: Innovation and process improvement-focused

Return ONLY a JSON array with exactly ${count} achievement lists: [["achievement1", "achievement2"], ["achievement3", "achievement4"], ["achievement5", "achievement6"]]`;

      case 'skillsList': // NEW/MODIFIED PROMPT FOR POLISHING
        let skillsPrompt = `You are an expert resume writer specializing in ATS optimization.

Given the following skill category and existing skills:
- Category: ${sectionData.category}
- Existing Skills (DRAFT): ${sectionData.existingSkills || 'None'}
- User Type: ${sectionData.userType}
- Job Description: ${sectionData.jobDescription || 'None'}

CRITICAL REQUIREMENTS:
1. Provide 5-8 specific and relevant skills for the given category.
2. Prioritize skills mentioned in the job description or commonly associated with the user type and category.
3. Ensure skills are ATS-friendly.

`;
        if (sectionData.category === 'Databases') {
          skillsPrompt += `
IMPORTANT: For the 'Databases' category, the suggestions MUST be database languages (e.g., SQL, T-SQL, PL/SQL, MySQL, PostgreSQL, MongoDB, Oracle, Cassandra, Redis, DynamoDB, Firebase, Supabase), not theoretical topics like normalization, indexing, or database design principles. Focus on specific technologies and query languages.
`;
        }
        skillsPrompt += `
Return ONLY a JSON array of strings: ["skill1", "skill2", "skill3", "skill4", "skill5"]`;
        return skillsPrompt;

      default:
        return `Generate ${count} ATS-optimized variations for ${type}.`;
    }
  };

  const prompt = getPromptForMultipleVariations(sectionType, data, variationCount, draftText);

  const response = await safeFetch({ prompt });
  let result = response.content;

  if (!result) throw new Error('No response content from EdenAI');

  result = result.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    const parsedResult = JSON.parse(result);
    // MODIFIED: Handle cases where AI returns a simple array of strings (individual bullet points)
    if (Array.isArray(parsedResult) && !parsedResult.every(Array.isArray)) {
      // If it's an array of strings, map each string to an array containing just that string
      return parsedResult.map((item: string) => [item]);
    } else if (Array.isArray(parsedResult) && parsedResult.every(Array.isArray)) {
      // If it's already an array of arrays (e.g., skillsList, achievements), return directly
      return parsedResult.slice(0, variationCount);
    } else {
      // Fallback: if not a proper JSON array, treat as single string and wrap
      const lines = result.split('\n')
        .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, variationCount);
      return [lines]; // Wrap in an array to make string[][]
    }
  } catch (parseError) {
    console.error(`JSON parsing error for ${sectionType}:`, parseError);
    console.error('Raw response that failed to parse:', result);
    // Fallback parsing: always return string[][]
    const lines = result.split('\n')
      .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, variationCount);
    return [lines]; // Wrap in an array to make string[][]
  }
};

// --- RE-ADDED: generateAtsOptimizedSection function ---
export const generateAtsOptimizedSection = async (
  sectionType: 'summary' | 'careerObjective' | 'workExperienceBullets' | 'projectBullets' | 'skillsList' | 'additionalSectionBullets' | 'certifications' | 'achievements',
  data: any,
  modelOverride?: string,
  draftText?: string // NEW: Optional draft text to polish
): Promise<string | string[]> => {
  // --- NEW: Input Length Validation ---
  const combinedInputLength = JSON.stringify(data).length + (draftText?.length || 0);
  if (combinedInputLength > MAX_INPUT_LENGTH) {
    throw new Error(
      `Input for section optimization too long (${combinedInputLength} characters). ` +
      `The maximum allowed is ${MAX_INPUT_LENGTH} characters. Please shorten your input.`
    );
  }
  // --- END NEW ---

  const getPromptForSection = (type: string, sectionData: any, draft?: string) => {
    const baseInstructions = `
      CRITICAL ATS OPTIMIZATION RULES:
      1. Highlight key skills and measurable achievements
      2. Use strong action verbs and industry keywords
      3. Focus on value proposition and career goals
      4. Keep it concise
      5. Avoid personal pronouns ("I", "my")
      6. Include quantifiable results where possible
      7. Make it ATS-friendly with clear, direct language
    `;

    if (draft) {
      // If draft text is provided, instruct AI to polish it
      switch (type) {
        case 'summary':
          return `You are an expert resume writer specializing in ATS optimization for experienced professionals.
            Polish and optimize the following professional summary draft for ATS compatibility and impact:
            Draft: "${draft}"
            ${baseInstructions}
            Ensure the polished summary is 2-3 sentences (50-80 words max).
            Return ONLY the polished professional summary text, no additional formatting or explanations.`;
        case 'careerObjective':
          return `You are an expert resume writer specializing in ATS optimization for entry-level professionals and students.
            Polish and optimize the following career objective draft for ATS compatibility and impact:
            Draft: "${draft}"
            ${baseInstructions}
            Ensure the polished objective is 2 sentences (30-50 words max).
            Return ONLY the polished career objective text, no additional formatting or explanations.`;
        // For other sections, the existing 'description' or 'details' fields in `sectionData` already serve as the draft.
        // We just need to ensure the prompt for those sections implies polishing if the field is populated.
        // This means the existing prompts for workExperienceBullets, projectBullets, etc., are mostly fine,
        // as they already take the existing content and are expected to optimize it.
        // The main change is for summary/careerObjective.
        // For certifications, it's about generating *titles*, not polishing a description.
        // For skillsList, it's about generating *lists*, not polishing a description.
        // So, `draftText` is primarily for `summary` and `careerObjective`.
        // For bullets, the existing `description` field in `sectionData` already serves this purpose.
      }
    }

    // Existing logic for generating from scratch or based on provided context (not polishing a specific draft)
    switch (type) {
      case 'summary':
        return `You are an expert resume writer specializing in ATS optimization for experienced professionals.
          Generate a compelling 2-3 sentence professional summary based on:
          - User Type: ${sectionData.userType}
          - Target Role: ${sectionData.targetRole || 'General Professional Role'}
          - Experience: ${JSON.stringify(sectionData.experience || [])}
          ${baseInstructions}
          Return ONLY the professional summary text, no additional formatting or explanations.`;

      case 'careerObjective':
        return `You are an expert resume writer specializing in ATS optimization for entry-level professionals and students.
          Generate a compelling 2-sentence career objective based on:
          - User Type: ${sectionData.userType}
          - Target Role: ${sectionData.targetRole || 'Entry-level Professional Position'}
          - Education: ${JSON.stringify(sectionData.education || [])}
          ${baseInstructions}
          Return ONLY the career objective text, no additional formatting or explanations.`;

      case 'workExperienceBullets':
        return `You are an expert resume writer specializing in ATS optimization.

Generate exactly 3 concise bullet points for work experience based on:
- Role: ${sectionData.role}
- Company: ${sectionData.company}
- Duration: ${sectionData.year}
- Description: ${sectionData.description || 'General responsibilities'}
- User Type: ${sectionData.userType}

CRITICAL ATS OPTIMIZATION RULES:
1. Each bullet point MUST be concise with maximum 10 words.
2. Start each bullet with STRONG ACTION VERBS (Developed, Implemented, Led, Managed, Optimized, Achieved, Increased, Reduced)
3. NO weak verbs (helped, assisted, worked on, responsible for)
4. Include quantifiable achievements and metrics
5. Use industry-standard keywords
6. Focus on impact and results, not just responsibilities
7. Avoid repetitive words across bullets
8. Make each bullet distinct and valuable

Return ONLY a JSON array with exactly 3 bullet points: ["bullet1", "bullet2", "bullet3"]`;

      case 'projectBullets':
        return `You are an expert resume writer specializing in ATS optimization.

Generate exactly 3 concise bullet points for a project based on:
- Project Title: ${sectionData.title}
- Description: ${sectionData.description || 'Technical project'}
- Tech Stack: ${sectionData.techStack || 'Modern technologies'}
- User Type: ${sectionData.userType}

CRITICAL ATS OPTIMIZATION RULES:
1. Each bullet point MUST be concise with maximum 10 words.
2. Start with STRONG ACTION VERBS (Developed, Built, Implemented, Designed, Created, Architected)
3. Include specific technologies mentioned in tech stack
4. Focus on technical achievements and impact
5. Include quantifiable results where possible
6. Use industry-standard technical keywords
7. Highlight problem-solving and innovation
8. Make each bullet showcase different aspects

Return ONLY a JSON array with exactly 3 bullet points: ["bullet1", "bullet2", "bullet3"]`;

      case 'additionalSectionBullets':
        return `You are an expert resume writer specializing in ATS optimization.

Generate exactly 3 concise bullet points for a custom resume section based on:
- Section Title: ${sectionData.title}
- User Provided Details: ${sectionData.details || 'General information'}
- User Type: ${sectionData.userType}

CRITICAL ATS OPTIMIZATION RULES:
1. Each bullet point MUST be concise with maximum 10 words.
2. Start with STRONG ACTION VERBS (e.g., Awarded, Recognized, Achieved, Led, Volunteered, Fluent in)
3. Focus on achievements, contributions, or relevant details for the section type
4. Use industry-standard keywords where applicable
5. Quantify results where possible
6. Avoid repetitive words across bullets
7. Make each bullet distinct and valuable

Return ONLY a JSON array with exactly 3 bullet points: ["bullet1", "bullet2", "bullet3"]`;

      case 'certifications':
        // MODIFIED: Conditional prompt based on currentCertTitle
        if (sectionData.currentCertTitle && sectionData.currentCertTitle.trim() !== '') {
          return `You are an expert resume writer specializing in ATS optimization.

Given the following certification title:
- Certification Title: "${sectionData.currentCertTitle}"
- Target Role: ${sectionData.targetRole || 'Professional Role'}
- Current Skills: ${JSON.stringify(sectionData.skills || [])}
- Job Description Context: ${sectionData.jobDescription || 'General professional context'}

Your task is to generate a single, concise, ATS-friendly description for this certification.
The description MUST be a maximum of 15 words.
It should highlight the most relevant aspect of the certification for a resume and align with the target role and skills.

Return ONLY the description text as a single string, no additional formatting or explanations.`;
        } else {
          return `You are an expert resume writer specializing in ATS optimization.

Given the following certification details and context:
- Current Certification Title: "${sectionData.currentCertTitle || 'Not provided'}"
- Current Certification Description: "${sectionData.currentCertDescription || 'Not provided'}"
- Target Role: ${sectionData.targetRole || 'Professional Role'}
- Current Skills: ${JSON.stringify(sectionData.skills || [])}
- Job Description Context: ${sectionData.jobDescription || 'General professional context'}

Your task is to generate 3 polished and ATS-friendly titles for this certification.
Each title should be concise, professional, and highlight the most relevant aspect of the certification for a resume.
If the provided title/description is generic, make the generated titles more impactful and specific.

Return ONLY a JSON array with exactly 3 polished certification titles: ["Polished Title 1", "Polished Title 2", "Polished Title 3"]`;
        }

      case 'achievements':
        return `You are an expert resume writer specializing in ATS optimization.

Generate exactly 4 quantified achievements based on:
- User Type: ${sectionData.userType}
- Experience Level: ${sectionData.experienceLevel || 'Professional'}
- Target Role: ${sectionData.targetRole || 'Professional Role'}
- Context: ${sectionData.context || 'General professional achievements'}

CRITICAL REQUIREMENTS:
1. Each achievement MUST be concise with maximum 10 words.
2. Start with strong action verbs (Achieved, Increased, Led, Improved, etc.)
3. Focus on results and impact, not just activities
4. Make achievements relevant to the target role
5. Include different types of achievements (performance, leadership, innovation, efficiency)

Return ONLY a JSON array with exactly 4 achievements: ["achievement1", "achievement2", "achievement3", "achievement4"]`;

      case 'skillsList':
        let skillsPrompt = `You are an expert resume writer specializing in ATS optimization.

Given the following skill category and existing skills:
- Category: ${sectionData.category}
- Existing Skills: ${sectionData.existingSkills || 'None'}
- User Type: ${sectionData.userType}
- Job Description: ${sectionData.jobDescription || 'None'}

CRITICAL REQUIREMENTS:
1. Provide 5-8 specific and relevant skills for the given category.
2. Prioritize skills mentioned in the job description or commonly associated with the user type and category.
3. Ensure skills are ATS-friendly.

`;
        if (sectionData.category === 'Databases') {
          skillsPrompt += `
IMPORTANT: For the 'Databases' category, the suggestions MUST be database languages (e.g., SQL, T-SQL, PL/SQL, MySQL, PostgreSQL, MongoDB, Oracle, Cassandra, Redis, DynamoDB, Firebase, Supabase), not theoretical topics like normalization, indexing, or database design principles. Focus on specific technologies and query languages.
`;
        }
        skillsPrompt += `
Return ONLY a JSON array of strings: ["skill1", "skill2", "skill3", "skill4", "skill5"]`;
        return skillsPrompt;

      default:
        return `Generate ATS-optimized content for ${type}.`;
    }
  };

  const prompt = getPromptForSection(sectionType, data, draftText);

  const response = await safeFetch({ prompt });
  let result = response.content;
  
  if (!result) {
    throw new Error('No response content from EdenAI');
  }

  result = result.replace(/```json/g, '').replace(/```/g, '').trim();
  console.log(`[GEMINI_SERVICE] Raw result for ${sectionType}:`, result); // Log raw result

  // MODIFIED: Consolidated JSON parsing for all array-returning section types
  if (
    sectionType === 'workExperienceBullets' ||
    sectionType === 'projectBullets' ||
    sectionType === 'additionalSectionBullets' ||
    sectionType === 'achievements' ||   // Added for JSON parsing
    sectionType === 'skillsList'        // Added for JSON parsing
  ) {
    try {
      console.log(`Parsing JSON for ${sectionType}:`, result); // Log the result before parsing
      const parsed = JSON.parse(result);
      console.log(`[GEMINI_SERVICE] Parsed result for ${sectionType}:`, parsed); // Log parsed result
      return parsed;
    } catch (parseError) {
      console.error(`JSON parsing error for ${sectionType}:`, parseError); // Log parsing error
      console.error('Raw response that failed to parse:', result); // Log the raw response
      // Fallback to splitting by lines if JSON parsing fails
      return result.split('\n')
        .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 5); // Limit to 5 for fallback, adjust as needed
    }
  } else if (sectionType === 'certifications') {
    // If the prompt was to generate a description (single string), return it directly
    if (data.currentCertTitle && data.currentCertTitle.trim() !== '') { // Use data.currentCertTitle for check
      return result; // Return as a single string
    } else {
      // Otherwise, it's generating titles (array of strings)
      try {
        const parsed = JSON.parse(result);
        return parsed;
      } catch (parseError) {
        console.error(`JSON parsing error for ${sectionType} titles:`, parseError);
        console.error('Raw response that failed to parse:', result);
        return result.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      }
    }
  }

  return result;
};

export interface CompanyDescriptionParams {
  companyName: string;
  roleTitle: string;
  jobDescription: string;
  qualification: string;
  domain: string;
  experienceRequired: string;
}

export const generateCompanyDescription = async (
  params: CompanyDescriptionParams
): Promise<string> => {
  const { companyName, roleTitle, jobDescription, qualification, domain, experienceRequired } = params;

  const prompt = `You are a professional business writer who creates engaging company descriptions for job listings.

Based on the following information about a company and their job opening, generate a professional 2-3 paragraph "About the Company" description:

Company Name: ${companyName}
Job Role: ${roleTitle}
Industry/Domain: ${domain}
Experience Level: ${experienceRequired}

Job Description:
${jobDescription}

Required Qualifications:
${qualification}

REQUIREMENTS:
1. Write 2-3 well-structured paragraphs (150-250 words total)
2. Make the description professional, engaging, and informative
3. Include insights about what type of work the company does based on the role and domain
4. Highlight the company's focus areas and technical expertise based on the job requirements
5. Make it sound authentic and compelling to potential candidates
6. DO NOT make up specific facts, numbers, locations, or founding dates
7. Focus on the type of work, culture, and opportunities based on the job details provided
8. Use present tense and active voice
9. DO NOT include any JSON formatting, markdown, or special characters
10. Return ONLY the company description text, nothing else

Generate the company description now:`;

  const response = await safeFetch({ prompt });
  let result = response.content;

  if (!result) {
    throw new Error('No response content from EdenAI');
  }

  result = result.trim();
  result = result.replace(/```markdown/g, '').replace(/```/g, '').trim();

  return result;
};

export const optimizeResumeWithATSFixes = async (
  resume: string,
  jobDescription: string,
  userType: UserType,
  userName?: string,
  userEmail?: string,
  userPhone?: string,
  userLinkedin?: string,
  userGithub?: string,
  linkedinUrl?: string,
  githubUrl?: string,
  targetRole?: string,
  additionalSections?: AdditionalSection[],
  enableATSLengthFix: boolean = true,
  enableMethodologyAlign: boolean = true
): Promise<ResumeData & {
  atsOptimization?: {
    bulletLengthAnalysis?: any;
    methodologyAlignment?: any;
  };
}> => {
  let resumeData = await optimizeResume(
    resume,
    jobDescription,
    userType,
    userName,
    undefined, // _logStart parameter
    userEmail,
    userPhone,
    userLinkedin,
    userGithub,
    linkedinUrl,
    githubUrl,
    targetRole,
    additionalSections
  );

  const atsOptimization: any = {};

  if (enableATSLengthFix) {
    try {
      const { atsBulletLengthFixer } = await import('./atsBulletLengthFixer');
      const analysis = atsBulletLengthFixer.scanBullets(resumeData);

      if (analysis.violations.length > 0) {
        console.log(`[ATS] Found ${analysis.violations.length} bullet length violations. Applying fixes...`);
        resumeData = atsBulletLengthFixer.applyFixes(resumeData, analysis);
        atsOptimization.bulletLengthAnalysis = analysis;
      }
    } catch (error) {
      console.error('[ATS] Bullet length fix failed:', error);
    }
  }

  if (enableMethodologyAlign) {
    try {
      const { methodologyKeywordAligner } = await import('./methodologyKeywordAligner');
      const alignmentResult = methodologyKeywordAligner.align(resumeData, jobDescription);

      if (alignmentResult.inserted.length > 0) {
        console.log(`[ATS] Inserting ${alignmentResult.inserted.length} methodology keywords...`);
        resumeData = methodologyKeywordAligner.applyInsertions(resumeData, alignmentResult);
      }

      atsOptimization.methodologyAlignment = alignmentResult;
    } catch (error) {
      console.error('[ATS] Methodology alignment failed:', error);
    }
  }

  return {
    ...resumeData,
    atsOptimization
  };
};
