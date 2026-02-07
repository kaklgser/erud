const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface KnowledgeEntry {
  keywords: string[];
  response: string;
}

const knowledgeBase: KnowledgeEntry[] = [
  {
    keywords: ["what is primoboost", "about primoboost", "tell me about", "what does primoboost do", "primoboost ai"],
    response:
      "PrimoBoost AI is an AI-powered career platform that helps you optimize your resume for ATS systems, match with relevant jobs, and prepare for interviews.\n\nOur tools analyze your resume against job descriptions and provide actionable improvements to increase your interview callback rate.",
  },
  {
    keywords: ["optimize", "resume optimization", "improve resume", "fix resume", "enhance resume", "rewrite resume"],
    response:
      "To optimize your resume:\n\n1. Go to the Resume Optimizer from the AI Tools menu\n2. Upload your resume (PDF or text)\n3. Paste the job description you're targeting\n4. Our AI analyzes keyword alignment, ATS compatibility, and content quality\n5. Get specific suggestions to improve your match score\n\nThe optimizer checks 16 parameters including skills match, experience relevance, and formatting.",
  },
  {
    keywords: ["ats score", "score checker", "check score", "ats check", "resume score", "how good is my resume"],
    response:
      "The ATS Score Checker evaluates your resume across 16 key parameters:\n\n- Keyword matching with the job description\n- Skills alignment and gap analysis\n- Experience relevance scoring\n- Formatting and structure compliance\n- Content quality assessment\n\nUpload your resume and paste a job description to get your detailed score breakdown.",
  },
  {
    keywords: ["job", "jobs", "job listing", "latest jobs", "find jobs", "job search", "openings"],
    response:
      "We post fresh job listings daily across multiple industries and experience levels.\n\nVisit the Latest Jobs page to browse current openings. You can filter by role, location, and experience level. Each listing shows the full job description so you can optimize your resume specifically for that role.",
  },
  {
    keywords: ["price", "pricing", "plan", "subscription", "cost", "buy", "payment", "pay", "credit"],
    response:
      "Our plans (50% OFF - one-time purchase):\n\nLeader Plan - Rs.16,400 - 100 Resume Credits\nAchiever Plan - Rs.13,200 - 50 Resume Credits\nAccelerator Plan - Rs.11,600 - 25 Resume Credits\nStarter Plan - Rs.1,640 - 10 Resume Credits\nKickstart Plan - Rs.1,320 - 5 Resume Credits\n\nEach plan includes Resume Optimizations, ATS Score Checks, and Premium Support.\n\nFor billing inquiries, email primoboostai@gmail.com.",
  },
  {
    keywords: ["contact", "support", "help", "email", "reach", "talk to", "customer service"],
    response:
      "You can reach our support team at:\n\nEmail: primoboostai@gmail.com\n\nOur team typically responds within 2 minutes during business hours. For payment or billing issues, please include a screenshot of the issue in your email.",
  },
  {
    keywords: ["interview", "mock interview", "interview prep", "practice interview"],
    response:
      "PrimoBoost offers multiple interview preparation tools:\n\n- Mock Interviews with AI-generated questions based on your target role\n- Resume-Based Interviews that test you on your own experience\n- Smart Coding Interviews for technical roles\n- Real-time feedback and performance scoring\n\nFind these under the AI Tools menu.",
  },
  {
    keywords: ["portfolio", "portfolio builder", "create portfolio", "build portfolio"],
    response:
      "The Portfolio Builder helps you create a professional online portfolio showcasing your projects and skills.\n\nYou can add project descriptions, link to repositories, and organize your work in a clean, presentable format that you can share with potential employers.",
  },
  {
    keywords: ["linkedin", "linkedin message", "linkedin generator", "cold message", "outreach"],
    response:
      "The LinkedIn Message Generator creates personalized connection requests and outreach messages.\n\nIt uses the job description and your profile to craft compelling messages for recruiters and hiring managers, helping you stand out in their inbox.",
  },
  {
    keywords: ["webinar", "webinars", "live session", "workshop"],
    response:
      "We host regular webinars and live sessions on resume building, interview preparation, and career growth strategies.\n\nCheck the Webinars page for upcoming sessions. You can register and get reminders before each event.",
  },
  {
    keywords: ["guided builder", "build resume", "create resume", "resume builder", "new resume"],
    response:
      "The Guided Resume Builder walks you through creating a professional resume step by step.\n\nIt covers all essential sections: contact info, summary, experience, education, skills, projects, and certifications. Perfect for freshers or anyone starting from scratch.",
  },
  {
    keywords: ["gaming", "aptitude", "spatial reasoning", "cognitive", "game", "assessment"],
    response:
      "Our Gaming & Aptitude section helps you prepare for cognitive assessments used by top companies.\n\nAvailable games include Spatial Reasoning, Path Finder, Key Finder, and Bubble Selection - all modeled after real assessment tests used in hiring.",
  },
  {
    keywords: ["fresher", "no experience", "first job", "graduate", "entry level", "beginner"],
    response:
      "PrimoBoost is great for freshers! Here's how to get started:\n\n1. Use the Guided Resume Builder to create your first resume\n2. Highlight projects, internships, and coursework\n3. Use the ATS Score Checker to ensure your resume passes filters\n4. Browse Latest Jobs for entry-level openings\n5. Practice with Mock Interviews\n\nEven without work experience, a well-optimized resume makes a strong impression.",
  },
  {
    keywords: ["pdf", "export", "download", "save resume"],
    response:
      "You can export your optimized resume as a PDF directly from the preview panel.\n\nAfter optimization, click the Export/Download button to save your ATS-friendly resume ready for submission.",
  },
  {
    keywords: ["blog", "articles", "career tips", "resources"],
    response:
      "Visit our Blog for the latest career tips, resume writing guides, interview strategies, and industry insights.\n\nWe regularly publish content to help you stay ahead in your job search.",
  },
  {
    keywords: ["refund", "money back", "cancel", "cancellation"],
    response:
      "For refund requests or cancellation inquiries, please email primoboostai@gmail.com with your account details and a screenshot of your purchase.\n\nOur team will review and respond within 2 minutes during business hours.",
  },
  {
    keywords: ["how to use", "tutorial", "guide", "getting started", "start", "how it works"],
    response:
      "Getting started with PrimoBoost AI is easy:\n\n1. Sign up for a free account\n2. Upload your resume (PDF or paste text)\n3. Paste the job description you're targeting\n4. Get your ATS score and optimization suggestions\n5. Apply the improvements and export your optimized resume\n\nCheck the Tutorials page for detailed walkthroughs of each feature.",
  },
];

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

function findBestMatch(query: string): string | null {
  const normalized = normalizeText(query);
  const words = normalized.split(/\s+/);

  let bestScore = 0;
  let bestResponse: string | null = null;

  for (const entry of knowledgeBase) {
    let score = 0;
    for (const keyword of entry.keywords) {
      const kwNorm = normalizeText(keyword);
      if (normalized.includes(kwNorm)) {
        score += kwNorm.split(/\s+/).length * 3;
      } else {
        const kwWords = kwNorm.split(/\s+/);
        for (const kw of kwWords) {
          if (words.includes(kw)) {
            score += 1;
          }
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestResponse = entry.response;
    }
  }

  return bestScore >= 1 ? bestResponse : null;
}

async function tryAIResponse(userMessage: string): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service: "openrouter",
        action: "chat_with_system",
        systemPrompt: `You are PrimoBoost AI, the support assistant for PrimoBoostAI.in - an AI-powered resume optimization and career platform.

Rules:
- Keep responses under 5 lines, conversational and professional.
- Never use markdown formatting, bold, asterisks, or emojis.
- Answer questions about resume optimization, job listings, interview prep, pricing, and platform features.
- For payment/billing issues, direct users to email primoboostai@gmail.com.

Pricing (50% OFF, one-time purchase):
Leader Plan - Rs.16,400 - 100 Resume Credits
Achiever Plan - Rs.13,200 - 50 Resume Credits
Accelerator Plan - Rs.11,600 - 25 Resume Credits
Starter Plan - Rs.1,640 - 10 Resume Credits
Kickstart Plan - Rs.1,320 - 5 Resume Credits`,
        userPrompt: userMessage,
        model: "google/gemini-2.5-flash",
        temperature: 0.4,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

export async function getChatResponse(userMessage: string): Promise<string> {
  const localMatch = findBestMatch(userMessage);

  const aiResponse = await tryAIResponse(userMessage);
  if (aiResponse) return aiResponse;

  if (localMatch) return localMatch;

  return "I can help you with resume optimization, ATS scores, job listings, interview prep, pricing, and more.\n\nCould you rephrase your question? Or feel free to email primoboostai@gmail.com for personalized support.";
}
