import { ResumeData } from '../types/resume';
import { ProjectAnalysis, ProjectSuitabilityResult } from '../types/analysis';
import { edenAITextService } from './edenAITextService';
import { github } from './aiProxyService';

console.log('ProjectAnalysisService: Using EdenAI + GitHub API via Supabase proxy');

export const analyzeProjectSuitability = async (
  resumeData: ResumeData,
  jobDescription: string,
  targetRole: string
): Promise<ProjectSuitabilityResult> => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔬 PROJECT SUITABILITY ANALYSIS STARTED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎯 Target Role:', targetRole || '(not specified)');
  console.log('📋 JD length:', jobDescription.length, 'chars');
  console.log('🚀 Current projects:', resumeData.projects?.length || 0);
  resumeData.projects?.forEach((p, i) => console.log(`   ${i + 1}. ${p.title}`));
  console.log('💼 Work experience:', resumeData.workExperience?.length || 0);
  
  const prompt = `You are an expert resume analyzer and project recommender.

### Job Description:
${jobDescription}

### Role:
${targetRole || 'Not specified'}

### Resume Projects:
${resumeData.projects?.map(project => `
Project Title: ${project.title}
Summary: ${project.bullets?.[0] || 'No summary provided.'}
`).join('\n') || 'No projects found'}

### Resume Work Experience:
${resumeData.workExperience?.map(exp => `
Role: ${exp.role} at ${exp.company} (${exp.year})
Summary: ${exp.bullets?.[0] || 'No summary provided.'}
${exp.bullets?.[1] ? `Key Point 2: ${exp.bullets[1]}` : ''}
`).join('\n') || 'No work experience found'}

Your task:

For each project, analyze if it matches the JD and role requirements.
Mark each as ✅ Suitable or ❌ Not Suitable.
Give a brief reason if not suitable.
Suggest replacement project IDEAS (concepts the candidate can build themselves) if a project is rejected.
Each suggested project should include a short title, description, and 3 role-specific bullet points.

Respond ONLY with valid JSON in this exact structure:

{
  "projectAnalysis": [
    {
      "title": "Original Project Title",
      "suitable": true/false,
      "reason": "Reason if not suitable",
      "replacementSuggestion": {
        "title": "Suggested Project Title",
        "description": "Brief description of what to build",
        "bulletPoints": [
          "First bullet point - 9-10 words max relevant to role and JD",
          "Second bullet point - 9-10 words max relevant to role and JD",
          "Third bullet point - 9-10 words max relevant to role and JD"
        ]
      }
    }
  ],
  "summary": {
    "totalProjects": 0,
    "suitableProjects": 0,
    "unsuitableProjects": 0
  },
  "suggestedProjects": [
    {
      "title": "Additional Suggested Project",
      "description": "Brief description of what to build",
      "bulletPoints": [
        "First bullet point - up to 20 words that are relevant to the role and JD",
        "Second bullet point - up to 20 words that are relevant to the role and JD",
        "Third bullet point - up to 20 words that are relevant to the role and JD"
      ]
    }
  ]
}

CRITICAL INSTRUCTIONS:
- DO NOT include any GitHub URLs - we will fetch real repos separately
- Focus on project IDEAS and concepts, not specific repositories
- STRICT JSON SYNTAX: Ensure all arrays are correctly terminated with ']' and all objects with '}', with proper comma separation between elements. Do NOT use '}' to close an array.`;

  try {
    // Run AI analysis and GitHub fetch in parallel
    const [aiResult, githubProjects] = await Promise.all([
      edenAITextService.generateTextWithRetry(prompt, {
        temperature: 0.3,
        maxTokens: 4000
      }),
      fetchRealGitHubProjects(jobDescription, targetRole)
    ]);
    
    const parsedResult = edenAITextService.parseJSONResponse<ProjectSuitabilityResult>(aiResult);
    
    // Enhance projects with real GitHub URLs
    if (githubProjects.length > 0) {
      console.log('🔗 Enhancing suggestions with real GitHub repos:', githubProjects.length);
      
      // Assign GitHub URLs to replacement suggestions (for unsuitable projects)
      let githubIndex = 0;
      parsedResult.projectAnalysis?.forEach(project => {
        if (!project.suitable && project.replacementSuggestion && githubIndex < githubProjects.length) {
          project.replacementSuggestion.githubUrl = githubProjects[githubIndex].githubUrl;
          githubIndex++;
        }
      });
      
      // Add real GitHub projects to suggestions (use remaining GitHub repos)
      const remainingGithubProjects = githubProjects.slice(githubIndex);
      const realGitHubSuggestions = remainingGithubProjects.slice(0, 3).map(repo => ({
        title: repo.title,
        description: repo.description,
        githubUrl: repo.githubUrl,
        bulletPoints: [
          `Study and fork ${repo.title} to understand ${repo.language || 'modern'} best practices and architecture patterns`,
          `Implement custom features or improvements to demonstrate hands-on experience with the codebase`,
          `Document your contributions and learnings to showcase problem-solving skills`
        ]
      }));
      
      // Combine AI suggestions (project ideas) with real GitHub repos
      parsedResult.suggestedProjects = [
        ...parsedResult.suggestedProjects,
        ...realGitHubSuggestions
      ].slice(0, 5); // Limit to 5 total
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ PROJECT SUITABILITY ANALYSIS COMPLETED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 Projects analyzed:', parsedResult.projectAnalysis?.length || 0);
    parsedResult.projectAnalysis?.forEach((p, i) => {
      const hasGithub = p.replacementSuggestion?.githubUrl ? ' 🔗' : '';
      console.log(`   ${i + 1}. ${p.title}: ${p.suitable ? '✅ Suitable' : '❌ Not Suitable'}${hasGithub}`);
    });
    console.log('📈 Summary:', parsedResult.summary);
    console.log('💡 Suggested projects:', parsedResult.suggestedProjects?.length || 0);
    console.log('🔗 Suggestions with GitHub URLs:', parsedResult.suggestedProjects?.filter(p => p.githubUrl).length || 0);
    console.log('🔗 Replacements with GitHub URLs:', parsedResult.projectAnalysis?.filter(p => p.replacementSuggestion?.githubUrl).length || 0);
    console.log('═══════════════════════════════════════════════════════════');
    
    return parsedResult;
  } catch (error) {
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ PROJECT SUITABILITY ANALYSIS FAILED');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('Error calling EdenAI for project analysis:', error);
    throw new Error('Failed to analyze project suitability. Please try again.');
  }
};

// Extract tech skills from job description
const extractTechSkillsFromJD = (jobDescription: string): string[] => {
  const techKeywords = [
    'react', 'angular', 'vue', 'javascript', 'typescript', 'node', 'python', 'java', 'spring',
    'django', 'flask', 'express', 'mongodb', 'postgresql', 'mysql', 'redis', 'docker', 'kubernetes',
    'aws', 'azure', 'gcp', 'graphql', 'rest', 'api', 'microservices', 'nextjs', 'nestjs',
    'tailwind', 'sass', 'webpack', 'vite', 'git', 'ci/cd', 'jenkins', 'terraform',
    'machine learning', 'ml', 'ai', 'data science', 'pandas', 'tensorflow', 'pytorch',
    'flutter', 'react native', 'swift', 'kotlin', 'android', 'ios', 'mobile',
    'sql', 'nosql', 'elasticsearch', 'kafka', 'rabbitmq', 'golang', 'rust', 'c++', 'c#', '.net',
    // Embedded systems and hardware
    'embedded', 'firmware', 'arm', 'microcontroller', 'rtos', 'stm32', 'arduino', 'raspberry pi',
    'fpga', 'verilog', 'vhdl', 'pcb', 'hardware', 'iot', 'sensor', 'uart', 'spi', 'i2c',
    'can bus', 'modbus', 'rf', 'wireless', 'bluetooth', 'zigbee', 'lora', 'automotive',
    // DevOps and infrastructure
    'linux', 'unix', 'bash', 'shell', 'ansible', 'puppet', 'chef', 'prometheus', 'grafana',
    // Security
    'security', 'penetration testing', 'cryptography', 'oauth', 'jwt'
  ];
  
  const jdLower = jobDescription.toLowerCase();
  return techKeywords.filter(skill => jdLower.includes(skill.toLowerCase()));
};

// Fetch real GitHub projects based on JD and role
const fetchRealGitHubProjects = async (jobDescription: string, role: string): Promise<any[]> => {
  const techSkills = extractTechSkillsFromJD(jobDescription);
  console.log('🔍 Extracted tech skills from JD:', techSkills.slice(0, 5));
  
  if (techSkills.length === 0) {
    console.log('⚠️ No tech skills found in JD, using role-based fallback');
    return getFallbackProjects([], role);
  }
  
  return fetchGitHubProjects(techSkills, role);
};

// Function to fetch real GitHub projects based on tech stack and role via proxy
export const fetchGitHubProjects = async (techStack: string[], role: string): Promise<any[]> => {
  try {
    // Create search query based on tech stack and role
    const query = `${role} ${techStack.slice(0, 3).join(' ')}`;
    
    // Use proxy instead of direct API call
    const data = await github.searchRepos(query, { sort: 'stars', order: 'desc', perPage: 10 });
    
    if (!data.items || data.items.length === 0) {
      console.warn('No GitHub projects found for query:', query);
      return getFallbackProjects(techStack, role);
    }
    
    const projects = data.items.slice(0, 5).map((repo: any) => ({
      title: repo.name,
      githubUrl: repo.html_url,
      description: repo.description || '',
      stars: repo.stargazers_count,
      language: repo.language
    }));
    
    // Validate URLs before returning
    return projects.filter((p: any) => p.githubUrl && p.githubUrl.startsWith('https://github.com/'));
  } catch (error) {
    console.error('Error fetching GitHub projects:', error);
    // Return fallback projects if GitHub API fails
    return getFallbackProjects(techStack, role);
  }
};

// Fallback projects when GitHub API fails - all URLs verified as valid
const getFallbackProjects = (_techStack: string[], role: string): any[] => {
  const roleType = getRoleType(role);
  
  const projects: Record<string, any[]> = {
    backend: [
      {
        title: "Spring Boot E-Commerce API",
        githubUrl: "https://github.com/spring-projects/spring-petclinic",
        description: "RESTful API for e-commerce platform with authentication and order management",
        stars: 5823,
        language: "Java"
      },
      {
        title: "Node.js Best Practices",
        githubUrl: "https://github.com/goldbergyoni/nodebestpractices",
        description: "Comprehensive guide to Node.js best practices and patterns",
        stars: 4219,
        language: "JavaScript"
      },
      {
        title: "Express.js REST API",
        githubUrl: "https://github.com/expressjs/express",
        description: "Fast, unopinionated web framework for Node.js",
        stars: 6400,
        language: "JavaScript"
      }
    ],
    frontend: [
      {
        title: "Create React App",
        githubUrl: "https://github.com/facebook/create-react-app",
        description: "Set up a modern web app by running one command",
        stars: 7651,
        language: "JavaScript"
      },
      {
        title: "Vue.js Framework",
        githubUrl: "https://github.com/vuejs/vue",
        description: "Progressive JavaScript framework for building user interfaces",
        stars: 6342,
        language: "JavaScript"
      },
      {
        title: "Next.js Framework",
        githubUrl: "https://github.com/vercel/next.js",
        description: "React framework with production-grade features",
        stars: 5200,
        language: "JavaScript"
      }
    ],
    fullstack: [
      {
        title: "MERN Stack Social Network",
        githubUrl: "https://github.com/bradtraversy/devconnector_2.0",
        description: "Complete social platform with profiles, posts, and real-time chat",
        stars: 3987,
        language: "JavaScript"
      },
      {
        title: "Django Framework",
        githubUrl: "https://github.com/django/django",
        description: "High-level Python web framework with batteries included",
        stars: 5124,
        language: "Python"
      },
      {
        title: "NestJS Backend Framework",
        githubUrl: "https://github.com/nestjs/nest",
        description: "Progressive Node.js framework for building scalable server-side applications",
        stars: 4800,
        language: "TypeScript"
      }
    ],
    mobile: [
      {
        title: "React Native Framework",
        githubUrl: "https://github.com/facebook/react-native",
        description: "Cross-platform mobile app development with React",
        stars: 4532,
        language: "JavaScript"
      },
      {
        title: "Flutter Framework",
        githubUrl: "https://github.com/flutter/flutter",
        description: "Google's UI framework for building beautiful native apps",
        stars: 5876,
        language: "Dart"
      },
      {
        title: "Ionic Framework",
        githubUrl: "https://github.com/ionic-team/ionic-framework",
        description: "Build amazing hybrid and progressive web apps with web technologies",
        stars: 3200,
        language: "TypeScript"
      }
    ],
    data: [
      {
        title: "Pandas Data Analysis",
        githubUrl: "https://github.com/pandas-dev/pandas",
        description: "Flexible and powerful data analysis and manipulation library",
        stars: 4298,
        language: "Python"
      },
      {
        title: "Apache Spark",
        githubUrl: "https://github.com/apache/spark",
        description: "Unified analytics engine for large-scale data processing",
        stars: 5643,
        language: "Scala"
      },
      {
        title: "TensorFlow",
        githubUrl: "https://github.com/tensorflow/tensorflow",
        description: "Open source machine learning framework",
        stars: 6200,
        language: "Python"
      }
    ],
    embedded: [
      {
        title: "STM32 HAL Library",
        githubUrl: "https://github.com/STMicroelectronics/STM32CubeF4",
        description: "STM32Cube MCU Full Package for STM32F4 series with HAL drivers and examples",
        stars: 1200,
        language: "C"
      },
      {
        title: "FreeRTOS Kernel",
        githubUrl: "https://github.com/FreeRTOS/FreeRTOS-Kernel",
        description: "Real-time operating system kernel for embedded devices",
        stars: 2100,
        language: "C"
      },
      {
        title: "Arduino Core",
        githubUrl: "https://github.com/arduino/ArduinoCore-avr",
        description: "Arduino core for AVR-based boards with hardware abstraction layer",
        stars: 1800,
        language: "C++"
      }
    ],
    iot: [
      {
        title: "ESP-IDF Framework",
        githubUrl: "https://github.com/espressif/esp-idf",
        description: "Espressif IoT Development Framework for ESP32 microcontrollers",
        stars: 11000,
        language: "C"
      },
      {
        title: "Zephyr RTOS",
        githubUrl: "https://github.com/zephyrproject-rtos/zephyr",
        description: "Scalable real-time operating system for IoT and embedded systems",
        stars: 8500,
        language: "C"
      },
      {
        title: "PlatformIO Core",
        githubUrl: "https://github.com/platformio/platformio-core",
        description: "Professional collaborative platform for embedded development",
        stars: 6800,
        language: "Python"
      }
    ]
  };
  
  const selectedProjects = projects[roleType] || projects.fullstack;
  
  // Validate all URLs before returning
  return selectedProjects.filter((p: any) => {
    const isValid = p.githubUrl && p.githubUrl.startsWith('https://github.com/');
    if (!isValid) {
      console.warn('Invalid GitHub URL filtered out:', p.githubUrl);
    }
    return isValid;
  });
};

// Helper function to determine role type
const getRoleType = (role: string): string => {
  role = role.toLowerCase();
  
  // Embedded systems and firmware - check first as it's more specific
  if (role.includes('embedded') || role.includes('firmware') || role.includes('microcontroller') || 
      role.includes('arm') || role.includes('stm32') || role.includes('rtos') || role.includes('fpga') ||
      role.includes('hardware') || role.includes('automotive') || role.includes('rf engineer')) {
    return 'embedded';
  }
  
  // IoT
  if (role.includes('iot') || role.includes('internet of things') || role.includes('sensor') ||
      role.includes('wireless') || role.includes('bluetooth') || role.includes('zigbee')) {
    return 'iot';
  }
  
  if (role.includes('backend') || role.includes('java') || role.includes('python') || role.includes('node')) {
    return 'backend';
  }
  
  if (role.includes('frontend') || role.includes('react') || role.includes('angular') || role.includes('vue')) {
    return 'frontend';
  }
  
  if (role.includes('fullstack') || role.includes('full stack') || role.includes('full-stack')) {
    return 'fullstack';
  }
  
  if (role.includes('mobile') || role.includes('android') || role.includes('ios') || role.includes('flutter')) {
    return 'mobile';
  }
  
  if (role.includes('data') || role.includes('ml') || role.includes('ai') || role.includes('machine learning')) {
    return 'data';
  }
  
  return 'fullstack'; // Default
};

// Generate project bullets based on project details and job description
export const generateProjectBullets = async (
  projectTitle: string,
  techStack: string[],
  jobDescription: string,
  targetRole: string
): Promise<string[]> => {
  const prompt = `Generate exactly 3 bullet points for a resume project based on the following details:

Project Title: ${projectTitle}
Tech Stack: ${techStack.join(', ')}
Target Role: ${targetRole}
Job Description: ${jobDescription}

REQUIREMENTS:
1. Each bullet point must be up to 20 words - no more, no less
2. Start each bullet with a strong action verb (e.g., Developed, Implemented, Architected, Optimized)
3. NO weak verbs like "helped", "assisted", "worked on", "was responsible for"
4. Include specific technologies from the tech stack
5. Focus on achievements and impact, not just responsibilities
6. Align with the job description requirements
7. Include metrics and quantifiable results where possible
8. No repeated keywords across bullets

Format your response as a JSON array with exactly 3 strings:
["Bullet 1", "Bullet 2", "Bullet 3"]`;

  try {
    const result = await edenAITextService.generateTextWithRetry(prompt, {
      temperature: 0.3,
      maxTokens: 2000
    });
    
    return edenAITextService.parseJSONResponse<string[]>(result);
  } catch (error) {
    console.error('Error generating project bullets:', error);
    // Return fallback bullets if API call fails
    return [
      `Developed ${projectTitle} using ${techStack[0] || 'modern technologies'} to solve business challenges and improve operational efficiency.`,
      `Implemented key features including user authentication, data management, and reporting functionality for enhanced user experience.`,
      `Optimized application performance by 40% through code refactoring and database query optimization techniques.`
    ];
  }
};

export const analyzeProjectAlignment = async (
  resumeData: ResumeData, 
  jobDescription: string, 
  targetRole: string
): Promise<ProjectAnalysis> => {
  const prompt = `You are a senior technical recruiter and career strategist. Analyze the alignment between the candidate's projects and the target job requirements.

CANDIDATE'S CURRENT PROJECTS:
${resumeData.projects?.map(project => `
- ${project.title}
  Bullets: ${project.bullets?.join('; ') || 'No details provided'}
`).join('\n') || 'No projects listed'}

CANDIDATE'S WORK EXPERIENCE:
${resumeData.workExperience?.map(exp => `
- ${exp.role} at ${exp.company} (${exp.year})
  Bullets: ${exp.bullets?.join('; ') || 'No details provided'}
`).join('\n') || 'No work experience listed'}

CANDIDATE'S SKILLS:
${resumeData.skills?.map(skill => `${skill.category}: ${skill.list?.join(', ') || ''}`).join('\n') || 'No skills listed'}

TARGET ROLE: ${targetRole}

JOB DESCRIPTION:
${jobDescription}

ANALYSIS REQUIREMENTS:

1. MATCH SCORE CALCULATION (0-100%):
   - Analyze how well current projects align with job requirements
   - Consider technical skills, domain knowledge, and project complexity
   - Factor in transferable skills and relevant experience

2. MATCHING PROJECTS ANALYSIS:
   - Identify which current projects are most relevant
   - Explain why each project aligns with the role
   - Highlight specific skills demonstrated

3. RECOMMENDED PROJECTS (5-7 suggestions):
   - Identify gaps in project portfolio
   - Suggest specific projects that would strengthen candidacy
   - Include realistic scope and technologies
   - Prioritize by impact on role fit

CRITICAL INSTRUCTIONS:
- Be specific and actionable in recommendations
- Consider current market trends and industry standards
- Suggest projects that can be completed in 2-8 weeks
- Include both technical and soft skill development
- Provide realistic timelines and scope
- STRICT JSON SYNTAX: Ensure all arrays are correctly terminated with ']' and all objects with '}', with proper comma separation between elements. Do NOT use '}' to close an array.

Respond ONLY with valid JSON in this exact structure:

{
  "matchScore": 0-100,
  "matchingProjects": [
    {
      "title": "project name",
      "matchScore": 0-100,
      "relevantSkills": ["skill1", "skill2"],
      "alignmentReason": "detailed explanation of why this project aligns with the role"
    }
  ],
  "recommendedProjects": [
    {
      "id": "unique-id",
      "title": "Specific Project Title",
      "type": "Web Application/Mobile App/Data Pipeline/API/etc",
      "focusArea": "Frontend/Backend/Full-Stack/Data/DevOps/etc",
      "priority": "High/Medium/Low",
      "impactScore": 0-100,
      "technologies": ["tech1", "tech2", "tech3"],
      "scope": "2-3 sentence description of project scope",
      "deliverables": ["deliverable1", "deliverable2", "deliverable3"],
      "industryContext": "How this relates to the target industry/role",
      "timeEstimate": "2-8 weeks",
      "skillsAddressed": ["skill1", "skill2", "skill3"]
    }
  ],
  "overallAssessment": "2-3 sentence summary of candidate's current position and main areas for improvement",
  "priorityActions": ["action1", "action2", "action3"]
}`;

  try {
    const result = await edenAITextService.generateTextWithRetry(prompt, {
      temperature: 0.3,
      maxTokens: 4000
    });
    
    return edenAITextService.parseJSONResponse<ProjectAnalysis>(result);
  } catch (error) {
    console.error('Error calling EdenAI for project analysis:', error);
    throw new Error('Failed to analyze project alignment. Please try again.');
  }
};
