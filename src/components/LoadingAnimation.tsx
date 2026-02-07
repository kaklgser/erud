// src/components/LoadingAnimation.tsx
import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Target, TrendingUp, Quote } from 'lucide-react';

// ATS Educational Content - Questions & Answers
const ATS_CONTENT = [
  {
    question: "What is ATS?",
    answer: "ATS (Applicant Tracking System) is recruitment software used by companies to collect, filter, and shortlist resumes automatically. It scans resume keywords, skills, experience, and formatting."
  },
  {
    question: "Why do companies use ATS?",
    answer: "Companies use ATS to manage high volumes of applications, automate shortlisting, reduce manual work, and ensure only the most relevant resumes reach recruiters."
  },
  {
    question: "What is an ATS-friendly resume?",
    answer: "An ATS-friendly resume is written in simple formatting, correct keywords, and clear sections so that software can read and understand it easily."
  },
  {
    question: "Why check ATS score before applying?",
    answer: "Checking your ATS score shows how well your resume matches the job description, helping you improve your chances of getting shortlisted."
  },
  {
    question: "What is ATS score?",
    answer: "ATS score is a percentage between 0–100 that shows how closely your resume aligns with the job description based on skills, keywords, experience, and formatting."
  },
  {
    question: "Does ATS score really matter?",
    answer: "Yes. Many companies shortlist only resumes that reach the minimum ATS cutoff (usually 70%+), so a higher score increases your chances."
  },
  {
    question: "Why apply only with ATS format?",
    answer: "ATS format ensures your resume is readable by automated systems. Complex designs, tables, or graphics may cause rejection before a human sees your resume."
  },
  {
    question: "What are the rules of ATS formatting?",
    answer: "Use simple fonts (Arial, Calibri), no images or graphics, no tables or text boxes, standard headings, keyword-rich content, save as PDF or DOCX."
  },
  {
    question: "How does ATS read your resume?",
    answer: "ATS extracts text, scans sections, searches keywords from the job description, and matches your skills with the job requirements."
  },
  {
    question: "What happens if you upload a non-ATS resume?",
    answer: "ATS may fail to read text, skip your skills, or misread your experience, lowering your score or rejecting your application automatically."
  },
  {
    question: "Why do recruiters rely on ATS?",
    answer: "ATS saves time, removes manual screening, prevents errors, and helps recruiters shortlist the top candidates faster."
  },
  {
    question: "What makes an ATS resume stronger?",
    answer: "Using correct job-related keywords, clean layout, consistent formatting, and a professional structure improves your ATS compatibility."
  },
  {
    question: "Keyword stuffing in ATS – Good or Bad?",
    answer: "Bad. ATS detects unnatural keyword repetition. Keywords must be placed naturally in skills, summary, and experience sections."
  },
  {
    question: "Which file format is best for ATS?",
    answer: "PDF (simple text-based) and DOCX are the safest and most widely accepted formats."
  },
  {
    question: "What keywords does ATS search for?",
    answer: "Hard skills, job title, tools/technologies, certifications, and required experience mentioned in the job description."
  },
  {
    question: "Why do job seekers fail ATS screening?",
    answer: "Because of complex designs, missing keywords, unclear formatting, and not tailoring the resume to the job description."
  },
  {
    question: "How to improve ATS score?",
    answer: "Match skills from the JD, use measurable achievements, maintain clean formatting, remove design-heavy elements, rewrite summary with relevant keywords."
  },
  {
    question: "Is ATS the same for all companies?",
    answer: "No. Each company uses different ATS tools like Workday, Taleo, Lever, Greenhouse, etc., but the screening process is similar."
  },
  {
    question: "How to check ATS Score in PrimoBoost AI?",
    answer: "Upload your resume → Upload the job description → The tool scans your keywords, formatting, skills match, and gives a score with suggestions to improve."
  },
  {
    question: "Why is PrimoBoost AI ATS checker helpful?",
    answer: "It gives instant feedback, highlights missing skills, fixes formatting issues, and increases your chances of getting shortlisted."
  },
  {
    question: "What is the ideal ATS score?",
    answer: "Aim for 75% or above to get maximum shortlisting chances."
  },
  {
    question: "How does PrimoBoost AI handle different job domains?",
    answer: "PrimoBoost AI automatically adjusts keywords, skills, and resume structure based on the domain — IT, analytics, management, marketing, finance, etc."
  },
  {
    question: "Can PrimoBoost AI optimize resumes for senior roles?",
    answer: "Yes. It rewrites bullet points to highlight leadership, metrics, strategy, and impact, making it suitable for both freshers and experienced profiles."
  },
  {
    question: "How does PrimoBoost AI help users who apply through LinkedIn or Naukri?",
    answer: "It improves keyword density and job relevance, increasing the chances of passing ATS filters before recruiters even see your profile."
  },
  {
    question: "Does PrimoBoost AI support multiple resume versions?",
    answer: "Yes — users can generate multiple ATS resumes from a single profile, each tailored to a specific job description."
  },
  {
    question: "What errors does PrimoBoost AI highlight that humans miss?",
    answer: "Hidden formatting issues, improper heading hierarchy, missing tech-stack keywords, grammar inconsistencies, and irrelevant phrases."
  },
  {
    question: "How does PrimoBoost AI ensure ATS readability?",
    answer: "By following strict formatting rules — no tables, no text boxes, clean fonts, correct margins, and machine-readable structure."
  },
  {
    question: "What is the keyword importance score?",
    answer: "It calculates how many high-impact skills are present/missing and tells you exactly which keywords to add for maximum ATS impact."
  },
  {
    question: "Can PrimoBoost AI rewrite long resumes into crisp ones?",
    answer: "Yes. It shortens unnecessary content and converts it into achievement-driven points that improve ATS readability."
  },
  {
    question: "Does PrimoBoost AI support certifications and projects?",
    answer: "Yes. It enhances project and certification descriptions to match the role requirements listed in the job description."
  },
  {
    question: "How does PrimoBoost AI reduce rejection rates?",
    answer: "By aligning your resume with the employer's filters, increasing both relevance and rank within ATS systems."
  },
  {
    question: "What does PrimoBoost AI's ATS score represent?",
    answer: "It tells you how compatible your resume is with the target job description in terms of keywords, formatting, skills, and clarity."
  },
  {
    question: "Why do recruiters prefer ATS-optimized resumes?",
    answer: "Because they are easier to read, contain relevant content, and match the exact role requirements."
  },
  {
    question: "Can PrimoBoost AI detect resume plagiarism?",
    answer: "Yes. It cleans redundant lines and rewrites repetitive points to maintain originality."
  },
  {
    question: "Does PrimoBoost AI help with LinkedIn optimization?",
    answer: "It suggests job-specific keywords that can also be used in your LinkedIn About section, headline, and experience descriptions."
  },
  {
    question: "How accurate is the ATS scoring in PrimoBoost AI?",
    answer: "The system uses AI-based parsing similar to real ATS tools used by top MNCs, providing high accuracy and reliability."
  },
  {
    question: "Does PrimoBoost AI personalize resumes based on career stage?",
    answer: "Yes — freshers, interns, developers, analysts, and managers all get customized resume formatting and keyword targeting."
  },
  {
    question: "How does PrimoBoost AI save time for job seekers?",
    answer: "It automates resume optimization, eliminating hours of manual editing, rewriting, and keyword searching."
  },
  {
    question: "Does PrimoBoost AI help users understand why they're not getting calls?",
    answer: "Yes. A low ATS score often explains low interview calls, and the tool highlights the exact gaps preventing shortlisting."
  },
  {
    question: "Can PrimoBoost AI help users apply more strategically?",
    answer: "Absolutely. By using the ATS score, users can decide which jobs they are best aligned with and improve their chances before applying."
  }
];

// Powerful Quotes
const QUOTES = [
  "PrimoBoost AI — your shortcut to a recruiter-ready resume.",
  "Don't guess your ATS score — know it instantly with PrimoBoost.",
  "PrimoBoost AI turns weak resumes into strong opportunities.",
  "Beat ATS. Impress recruiters. Start with PrimoBoost AI.",
  "Your resume deserves technology. PrimoBoost AI makes it future-ready.",
  "From zero clarity to 90% ATS match — that's the power of PrimoBoost.",
  "Every keyword matters. PrimoBoost finds the ones you miss.",
  "Your next job might depend on your ATS score — check it on PrimoBoost AI.",
  "Smarter resume. Higher score. Better results — thanks to PrimoBoost AI.",
  "PrimoBoost AI helps you compete with confidence."
];

interface LoadingAnimationProps {
  message?: string;
  submessage?: string;
  type?: 'optimization' | 'analysis' | 'generation' | 'payment';
  adImageUrl?: string;
  adImageAlt?: string;
  showATSContent?: boolean;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  message = "Processing...",
  submessage = "Please wait while we work our magic",
  type = 'optimization',
  adImageUrl = "https://res.cloudinary.com/dvue2zenh/image/upload/v1759911969/becodghsmp77ugtnq4li.png",
  adImageAlt = "Referral Program Promo",
  showATSContent = true
}) => {
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  // Rotate ATS content every 5 seconds
  useEffect(() => {
    if (!showATSContent) return;

    const contentInterval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentContentIndex((prev) => (prev + 1) % ATS_CONTENT.length);
        setCurrentQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        setFadeIn(true);
      }, 300);
    }, 5000);

    return () => clearInterval(contentInterval);
  }, [showATSContent]);

  const getIcon = () => {
    switch (type) {
      case 'optimization': return <Target className="w-10 h-10" />;
      case 'analysis': return <TrendingUp className="w-10 h-10" />;
      case 'generation': return <Sparkles className="w-10 h-10" />;
      case 'payment': return <Zap className="w-10 h-10" />;
      default: return <Sparkles className="w-10 h-10" />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'optimization': return 'from-emerald-500 to-cyan-500';
      case 'analysis': return 'from-purple-500 to-pink-500';
      case 'generation': return 'from-green-500 to-emerald-500';
      case 'payment': return 'from-orange-500 to-red-500';
      default: return 'from-emerald-500 to-cyan-500';
    }
  };

  const currentContent = ATS_CONTENT[currentContentIndex];
  const currentQuote = QUOTES[currentQuoteIndex];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b14] p-4">
      <div className="card-surface p-8 text-center max-w-lg w-full transform transition-all duration-500">
        
        {/* Animated Icon */}
        <div className={`bg-gradient-to-r ${getGradient()} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white animate-pulse shadow-emerald-glow`}>
          {getIcon()}
        </div>

        {/* Animated Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 bg-gradient-to-r ${getGradient()} rounded-full animate-bounce`}
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>

        {/* Messages */}
        <h2 className="text-xl font-bold text-slate-100 mb-2">{message}</h2>
        <p className="text-slate-400 mb-6 text-sm">{submessage}</p>

        {/* ATS Educational Content */}
        {showATSContent && (
          <div 
            className={`mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* Question */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">Q</span>
              </div>
              <p className="text-left text-emerald-300 font-semibold text-sm">
                {currentContent.question}
              </p>
            </div>
            
            {/* Answer */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                <span className="text-slate-300 text-sm font-bold">A</span>
              </div>
              <p className="text-left text-slate-300 text-sm leading-relaxed">
                {currentContent.answer}
              </p>
            </div>
          </div>
        )}

        {/* Rotating Quote */}
        {showATSContent && (
          <div 
            className={`mb-6 flex items-center gap-2 justify-center transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
          >
            <Quote className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-amber-300 text-sm italic">
              "{currentQuote}"
            </p>
          </div>
        )}

        {/* Promo Banner with Link */}
        {adImageUrl && (
          <div className="mb-6">
            <a href="https://primoboostai.in/refer" target="_blank" rel="noopener noreferrer">
              <img
                src={adImageUrl}
                alt={adImageAlt}
                className="w-full rounded-xl shadow-lg object-cover hover:scale-[1.02] transition duration-300 ease-in-out border border-slate-700/50"
              />
            </a>
            <p className="text-xs text-slate-500 mt-2">Invite your friend & earn rewards 🎁</p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4 overflow-hidden">
          <div 
            className={`bg-gradient-to-r ${getGradient()} h-1.5 rounded-full`} 
            style={{ 
              width: '100%',
              animation: 'shimmer 2s ease-in-out infinite'
            }} 
          />
        </div>

        {/* Content Counter */}
        {showATSContent && (
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === currentContentIndex % 5 ? 'bg-emerald-400 w-3' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        )}

        <p className="text-xs text-slate-500">
          {showATSContent 
            ? "Learn about ATS while we process your resume..."
            : "This may take a few moments as we process complex data and apply advanced algorithms."
          }
        </p>
      </div>
    </div>
  );
};
