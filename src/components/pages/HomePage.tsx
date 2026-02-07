
import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import {
  FileText,
  PlusCircle,
  Target,
  ArrowRight,
  Sparkles,
  CheckCircle,
  TrendingUp,
  Star,
  Users,
  Zap,
  Award,
  Instagram,
  Linkedin,
  MessageCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Gamepad2,
  AlertCircle,
  X,
  MousePointer2
} from 'lucide-react';
import { Card } from "../common/Card";
import { PageSidebar } from "../navigation/PageSidebar";

// Define the type for a feature object
interface Feature {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  requiresAuth: boolean;
  highlight?: boolean;
  gradient: string;
  accent: 'teal' | 'mint' | 'amber' | 'gold' | 'violet' | 'rose';
  tag?: string;
}

interface HomePageProps {
  isAuthenticated: boolean;
  onShowAuth: () => void;
  onShowSubscriptionPlans: (featureId?: string, expandAddons?: boolean) => void;
  onShowSubscriptionPlansDirectly: () => void;
  userSubscription: any;
}

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

// WhatsApp brand icon
const WhatsappIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19.11 17.37c-.26-.13-1.52-.75-1.75-.84-.23-.09-.4-.13-.57.13s-.66.84-.81 1.01c-.15.17-.3.19-.56.06-.26-.13-1.08-.4-2.06-1.27-.76-.67-1.27-1.49-1.42-1.75-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.57-1.37-.78-1.88-.2-.48-.4-.41-.57-.42l-.49-.01c-.17 0-.45.06-.69.32-.23.26-.91.89-.91 2.17s.94 2.52 1.07 2.7c.13.17 1.85 2.83 4.49 3.97.63.27 1.12.43 1.5.55.63.2 1.21.17 1.66.1.51-.08 1.52-.62 1.73-1.21.21-.59.21-1.09.15-1.21-.06-.12-.24-.19-.5-.32z" />
    <path d="M26.72 5.28A13.5 13.5 0 0 0 4.47 21.06L3 29l8.11-1.42A13.49 13.49 0 1 0 26.72 5.28zM16.5 27A10.47 10.47 0 0 1 8.3 24.3l-.29-.18-4.91.85.84-4.8-.19-.31A10.5 10.5 0 1 1 16.5 27z" />
  </svg>
);

// Animated gradient orb component - Professional subtle effect
const GradientOrb: React.FC<{ className?: string; delay?: number }> = ({ className, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
    animate={{
      scale: [1, 1.1, 1],
      opacity: [0.08, 0.15, 0.08],
    }}
    transition={{
      duration: 10,
      repeat: Infinity,
      delay,
      ease: "easeInOut"
    }}
  />
);

// Scroll indicator component
const ScrollIndicator: React.FC = () => (
  <motion.div
    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.5, duration: 0.5 }}
  >
    <span className="text-xs text-slate-400 uppercase tracking-widest">Scroll to explore</span>
    <motion.div
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <MousePointer2 className="w-5 h-5 text-emerald-400" />
    </motion.div>
  </motion.div>
);

// Stagger animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const }
  }
};

export const HomePage: React.FC<HomePageProps> = ({
  isAuthenticated,
  onShowAuth,
  onShowSubscriptionPlans,
  onShowSubscriptionPlansDirectly,
  userSubscription
}) => {
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const navigate = useNavigate();
  useAuth(); // Keep context connection
  const [globalResumesCreated, setGlobalResumesCreated] = useState<number>(60070);
  const [scoreChecksCompleted, setScoreChecksCompleted] = useState<number>(500070);
  const [isChristmasMode] = useState(() => {
    const month = new Date().getMonth();
    return month === 11;
  });

  // Refs for scroll animations
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  
  // Scroll progress for parallax
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  // InView hooks for sections
  const isHeroInView = useInView(heroRef, { once: true, amount: 0.3 });
  const isFeaturesInView = useInView(featuresRef, { once: true, amount: 0.2 });
  const isStatsInView = useInView(statsRef, { once: true, amount: 0.3 });

  useEffect(() => {
    const fetchGlobalCount = async () => {
      try {
        const count = await authService.getGlobalResumesCreatedCount();
        setGlobalResumesCreated(count);
      } catch (error) {
        console.error('HomePage: Error fetching global resumes count:', error);
      }
    };
    fetchGlobalCount();
  }, []);

  useEffect(() => {
    const base = 500070;
    const hydrateCount = () => {
      const stored = parseInt(localStorage.getItem('scoreCheckCount') || '0', 10);
      const safeStored = isNaN(stored) ? 0 : stored;
      setScoreChecksCompleted(base + safeStored);
    };
    hydrateCount();

    const handleScoreCheckEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ total?: number }>).detail;
      const total = typeof detail?.total === 'number' ? detail.total : null;
      if (total !== null) {
        setScoreChecksCompleted(base + total);
      } else {
        hydrateCount();
      }
    };

    window.addEventListener('score-check-completed', handleScoreCheckEvent);
    return () => window.removeEventListener('score-check-completed', handleScoreCheckEvent);
  }, []);

  const isFeatureAvailable = (featureId: string) => {
    if (featureId === 'linkedin-generator' || featureId === 'mock-interview' || featureId === 'portfolio-builder' || featureId === '/gaming') {
      return true;
    }
    if (!isAuthenticated) return false;
    if (!userSubscription) return false;

    switch (featureId) {
      case 'optimizer':
        return userSubscription.optimizationsTotal > userSubscription.optimizationsUsed;
      case 'score-checker':
        return userSubscription.scoreChecksTotal > userSubscription.scoreChecksUsed;
      case 'guided-builder':
        return userSubscription.guidedBuildsTotal > userSubscription.guidedBuildsUsed;
      default:
        return false;
    }
  };

  const handleFeatureClick = (feature: Feature) => {
    if (!isAuthenticated && feature.requiresAuth) {
      onShowAuth();
      return;
    }

    const freeFeatures = ['linkedin-generator', 'mock-interview', 'portfolio-builder', 'gaming'];
    const isFreeFeature = freeFeatures.includes(feature.id);

    if (isAuthenticated && feature.requiresAuth && !isFreeFeature && !isFeatureAvailable(feature.id)) {
      onShowSubscriptionPlans(feature.id);
      return;
    }

    if (isAuthenticated || !feature.requiresAuth) {
      navigate(feature.id);
    }
  };

  const features: Feature[] = [
    {
      id: 'optimizer',
      title: 'JD-Based Optimizer',
      description: 'Upload your resume and a job description to get a perfectly tailored resume.',
      icon: <Target className="w-6 h-6" />,
      requiresAuth: false,
      highlight: true,
      gradient: 'from-emerald-500/15 via-emerald-500/5 to-cyan-500/10',
      accent: 'teal',
      tag: 'Recommended',
    },
    {
      id: 'score-checker',
      title: 'Resume Score Check',
      description: 'Get an instant ATS score with detailed analysis and improvement suggestions.',
      icon: <TrendingUp className="w-6 h-6" />,
      requiresAuth: false,
      gradient: 'from-emerald-400/12 via-teal-400/4 to-emerald-500/10',
      accent: 'mint',
    },
    {
      id: 'guided-builder',
      title: 'Guided Resume Builder',
      description: 'Create a professional resume from scratch with our step-by-step AI-powered builder.',
      icon: <PlusCircle className="w-6 h-6" />,
      requiresAuth: false,
      gradient: 'from-amber-400/15 via-orange-400/6 to-amber-500/10',
      accent: 'amber',
    },
    {
      id: 'linkedin-generator',
      title: 'Outreach Message Generator',
      description: 'Generate personalized messages for networking, referrals, and cold outreach.',
      icon: <MessageCircle className="w-6 h-6" />,
      requiresAuth: true,
      gradient: 'from-yellow-400/15 via-amber-300/8 to-orange-300/10',
      accent: 'gold',
    },
    {
      id: 'mock-interview',
      title: 'AI Mock Interview (Beta)',
      description: 'Practice interviews with AI-powered feedback in a realistic meet-style environment.',
      icon: <Sparkles className="w-6 h-6" />,
      requiresAuth: true,
      highlight: true,
      gradient: 'from-indigo-500/15 via-purple-500/6 to-indigo-500/12',
      accent: 'violet',
      tag: 'Recommended',
    },
    {
      id: 'gaming',
      title: 'Gaming Aptitude',
      description: 'Test your problem-solving skills with Path Finder games for top consulting companies.',
      icon: <Gamepad2 className="w-6 h-6" />,
      requiresAuth: true,
      highlight: false,
      gradient: 'from-pink-500/15 via-rose-500/6 to-fuchsia-500/12',
      accent: 'rose',
    }
  ];

  // Professional refined accent styles with subtle effects
  const accentStyles: Record<Feature['accent'], {
    bg: string;
    overlay: string;
    border: string;
    shadow: string;
    iconBg: string;
    iconColor: string;
    badge: string;
    arrow: string;
    glow: string;
  }> = {
    teal: {
      bg: 'bg-slate-900/80',
      overlay: 'bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(6,182,212,0.08),transparent_32%)]',
      border: 'border border-slate-700/50 hover:border-emerald-500/30',
      shadow: 'shadow-lg',
      iconBg: 'bg-emerald-500/10 border border-emerald-400/30',
      iconColor: 'text-emerald-300',
      badge: 'bg-emerald-600 text-emerald-50',
      arrow: 'text-emerald-300 bg-emerald-500/10',
      glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]'
    },
    mint: {
      bg: 'bg-slate-900/80',
      overlay: 'bg-[radial-gradient(circle_at_10%_10%,rgba(45,212,191,0.1),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(74,222,128,0.08),transparent_32%)]',
      border: 'border border-slate-700/50 hover:border-emerald-400/30',
      shadow: 'shadow-lg',
      iconBg: 'bg-emerald-400/10 border border-emerald-300/30',
      iconColor: 'text-emerald-300',
      badge: 'bg-emerald-500 text-slate-900',
      arrow: 'text-emerald-300 bg-emerald-400/10',
      glow: 'group-hover:shadow-[0_0_30px_rgba(45,212,191,0.1)]'
    },
    amber: {
      bg: 'bg-slate-900/80',
      overlay: 'bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.1),transparent_34%),radial-gradient(circle_at_85%_0%,rgba(251,146,60,0.08),transparent_32%)]',
      border: 'border border-slate-700/50 hover:border-amber-500/30',
      shadow: 'shadow-lg',
      iconBg: 'bg-amber-500/10 border border-amber-400/30',
      iconColor: 'text-amber-300',
      badge: 'bg-amber-500 text-slate-900',
      arrow: 'text-amber-300 bg-amber-400/10',
      glow: 'group-hover:shadow-[0_0_30px_rgba(251,191,36,0.1)]'
    },
    gold: {
      bg: 'bg-slate-900/80',
      overlay: 'bg-[radial-gradient(circle_at_25%_15%,rgba(234,179,8,0.1),transparent_35%),radial-gradient(circle_at_90%_5%,rgba(250,204,21,0.08),transparent_32%)]',
      border: 'border border-slate-700/50 hover:border-yellow-500/30',
      shadow: 'shadow-lg',
      iconBg: 'bg-yellow-400/10 border border-yellow-300/30',
      iconColor: 'text-yellow-300',
      badge: 'bg-yellow-500 text-slate-900',
      arrow: 'text-yellow-300 bg-yellow-400/10',
      glow: 'group-hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]'
    },
    violet: {
      bg: 'bg-slate-900/80',
      overlay: 'bg-[radial-gradient(circle_at_15%_25%,rgba(129,140,248,0.1),transparent_34%),radial-gradient(circle_at_85%_5%,rgba(236,72,153,0.06),transparent_32%)]',
      border: 'border border-slate-700/50 hover:border-indigo-500/30',
      shadow: 'shadow-lg',
      iconBg: 'bg-indigo-500/10 border border-indigo-400/30',
      iconColor: 'text-indigo-300',
      badge: 'bg-indigo-600 text-indigo-50',
      arrow: 'text-indigo-300 bg-indigo-500/10',
      glow: 'group-hover:shadow-[0_0_30px_rgba(129,140,248,0.1)]'
    },
    rose: {
      bg: 'bg-slate-900/80',
      overlay: 'bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.1),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(236,72,153,0.08),transparent_32%)]',
      border: 'border border-slate-700/50 hover:border-pink-500/30',
      shadow: 'shadow-lg',
      iconBg: 'bg-pink-500/10 border border-pink-400/30',
      iconColor: 'text-pink-300',
      badge: 'bg-pink-600 text-pink-50',
      arrow: 'text-pink-300 bg-pink-500/10',
      glow: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.1)]'
    }
  };

  // Professional stats with refined styling
  const stats = [
    {
      number: scoreChecksCompleted.toLocaleString(),
      label: 'Resume Score Checks',
      icon: <TrendingUp className="w-5 h-5" />,
      microcopy: 'Completed by members to optimize their resumes',
      accentBg: 'from-emerald-500/8 to-cyan-500/8',
      accentRing: 'border-slate-700/40',
      accentText: 'text-emerald-400'
    },
    {
      number: globalResumesCreated.toLocaleString(),
      label: 'Resumes Created',
      icon: <FileText className="w-5 h-5" />,
      microcopy: 'Trusted by thousands of job seekers worldwide',
      accentBg: 'from-sky-500/8 to-indigo-500/8',
      accentRing: 'border-slate-700/40',
      accentText: 'text-sky-400'
    },
    {
      number: '95%',
      label: 'Success Rate',
      icon: <TrendingUp className="w-5 h-5" />,
      microcopy: 'Achieved by our AI-driven approach',
      accentBg: 'from-emerald-500/8 to-lime-500/8',
      accentRing: 'border-slate-700/40',
      accentText: 'text-emerald-400'
    },
    {
      number: '4.9/5',
      label: 'User Rating',
      icon: <Star className="w-5 h-5" />,
      microcopy: 'From satisfied professionals worldwide',
      accentBg: 'from-amber-500/8 to-orange-500/8',
      accentRing: 'border-slate-700/40',
      accentText: 'text-amber-400'
    }
  ];

  return (
    <div 
      className="relative min-h-screen text-slate-100 overflow-hidden bg-gradient-to-b from-[#02221E] to-[#042A24]"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Page Sidebar for quick navigation */}
      <PageSidebar />
      
      {/* Gradient overlay matching reference */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-br from-[#02221E]/50 via-[#042A24]/10 to-transparent" />
        <div className="absolute top-10 right-1/3 w-[900px] h-[520px] bg-[radial-gradient(circle_at_60%_40%,rgba(0,230,184,0.16),transparent_55%)] blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[620px] h-[420px] bg-[radial-gradient(circle_at_80%_80%,rgba(0,210,131,0.18),transparent_55%)] blur-2xl" />
      </div>

      {/* Main content with left margin for sidebar on desktop */}
      <div className="relative lg:ml-16">

        {/* Hero Section */}
        <section ref={heroRef} className="relative min-h-[100vh] flex items-center overflow-hidden">
          <motion.div 
            style={{ y: heroY, opacity: heroOpacity }}
            className="container-responsive pt-24 pb-20 lg:pt-32 lg:pb-28"
          >
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* LEFT: Messaging */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate={isHeroInView ? "visible" : "hidden"}
                className="space-y-6 lg:space-y-8"
              >
                {/* Badge - Larger like pic 2 */}
                <motion.div variants={itemVariants}>
                  <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm bg-[rgba(0,230,184,0.12)] border border-[rgba(0,230,184,0.4)] text-[#00E6B8]">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">AI-Powered Resume Intelligence</span>
                  </div>
                </motion.div>

                {/* Main Headline - Bold italic like reference */}
                <motion.h1 
                  variants={itemVariants}
                  className="text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.15] text-white"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  <span>Turn Any Job</span>
                  <br />
                  <span>Description Into Your</span>
                  <span className="block mt-2 text-[#00E6B8]">
                    Perfect Resume
                  </span>
                </motion.h1>

                {/* Subheadline - Larger like pic 2 */}
                <motion.p 
                  variants={itemVariants}
                  className="text-base leading-relaxed max-w-lg text-[#C4CFDE]"
                >
                  Upload your resume + paste a JD. Our AI instantly reorders sections,
                  highlights missing keywords, and optimizes bullet points for ATS systems.
                </motion.p>

                {/* CTAs - Larger buttons like pic 2 */}
                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-2">
                  <motion.button
                    onClick={() => navigate('/optimizer')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group h-14 px-7 rounded-full text-base font-semibold flex items-center justify-center gap-3 bg-[#00D283] hover:brightness-110 text-white transition-all duration-200 shadow-[0_0_12px_rgba(0,230,184,0.4)]"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Generate JD-Based Resume</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>

                  <motion.button
                    onClick={() => navigate('/score-checker')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group h-14 px-7 rounded-full text-base font-semibold flex items-center justify-center gap-3 border border-[#4F5D75] bg-[#111C2E] hover:brightness-110 text-white transition-all duration-200"
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span>Check My ATS Score</span>
                  </motion.button>
                </motion.div>

                {/* Trust Indicators - Larger like pic 2 */}
                <motion.div 
                  variants={itemVariants}
                  className="flex flex-wrap items-center gap-6 pt-4 text-sm text-[#C4CFDE]"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#00E6B8]" />
                    <span>{globalResumesCreated.toLocaleString()}+ resumes optimized</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-[#FFC043] fill-[#FFC043]" />
                    <span>4.9/5 rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#C4CFDE]" />
                    <span>10K+ active users</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* RIGHT: Resume vs JD Visual */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 50 }}
                animate={isHeroInView ? { opacity: 1, scale: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" as const }}
                className="relative lg:h-[550px] flex items-center justify-center"
              >

                {/* Main Container */}
                <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl px-4 sm:px-0">
                  {/* LEFT: Job Description Card */}
                  <motion.div
                    whileHover={{ y: -6, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="relative bg-[#0D1B2A] border border-[#0D1B2A] rounded-3xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-blue-300" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">Job Description</div>
                        <div className="text-xs text-[#C4CFDE]">Senior Frontend Engineer</div>
                      </div>
                    </div>

                    {/* Keyword rows styled like Resume card rows */}
                    <div className="space-y-2">
                      {['React', 'TypeScript', 'Tailwind CSS', 'REST APIs', 'Git'].map((keyword, i) => (
                        <motion.div
                          key={keyword}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="flex items-center justify-between px-3 py-2 bg-[#111C2E] border border-[#1F2A3C] rounded-lg"
                        >
                          <span className="text-xs font-medium text-[#C4CFDE]">{keyword}</span>
                          <CheckCircle className="w-4 h-4 text-[#00E6B8]" />
                        </motion.div>
                      ))}
                    </div>

                    {/* Animated arrow */}
                    <motion.div
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -right-6 sm:-right-8 top-1/2 -translate-y-1/2 hidden md:block text-[#00E6B8]"
                    >
                      <ArrowRight className="w-6 h-6" />
                    </motion.div>
                  </motion.div>

                  {/* RIGHT: Optimized Resume Card */}
                  <motion.div
                    whileHover={{ y: -6, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="relative bg-[#0D1B2A] rounded-3xl p-4 sm:p-6 backdrop-blur-xl border border-[#0D1B2A] shadow-[0_20px_50px_rgba(0,0,0,0.28),_0_0_18px_rgba(0,255,153,0.2)]"
                  >
                    <div className="flex items-center gap-3 mb-4 relative">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#00E6B8]/15">
                        <FileText className="w-5 h-5 text-[#00E6B8]" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">Your Resume</div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-[#00E6B8]">Optimized</div>
                          <div className="w-2 h-2 rounded-full animate-pulse bg-[#00E6B8]" />
                        </div>
                      </div>
                    </div>

                    {/* Resume sections */}
                    <div className="space-y-2 relative">
                      {['SKILLS', 'EXPERIENCE', 'PROJECTS', 'EDUCATION'].map((section, i) => (
                        <motion.div
                          key={section}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + i * 0.15 }}
                          className="flex items-center justify-between px-3 py-2 bg-[#111C2E] border border-[#1F2A3C] rounded-lg"
                        >
                          <span className="text-xs font-medium text-[#C4CFDE]">{section}</span>
                          <CheckCircle className="w-4 h-4 text-[#00E6B8]" />
                        </motion.div>
                      ))}
                    </div>

                    {/* ATS Score Badge */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
                      className="absolute -top-4 -right-4 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center font-bold text-base sm:text-lg text-white bg-gradient-to-br from-[#00D283] to-[#00E6B8] shadow-lg"
                    >
                      <motion.div
                        animate={{ boxShadow: ['0 0 0 0 rgba(0,230,184,0.6)', '0 0 0 15px rgba(0,230,184,0)', '0 0 0 0 rgba(0,230,184,0)'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        className="absolute inset-0 rounded-full"
                      />
                      <span className="relative z-10">95%</span>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <ScrollIndicator />
        </section>


        {/* Stats Section - Professional refined styling */}
        <section ref={statsRef} className="relative py-12 sm:py-16">
          <div className="container-responsive">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate={isStatsInView ? "visible" : "hidden"}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto"
            >
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                    <Card
                    padding="lg"
                    className="card-surface text-left flex flex-col sm:flex-row items-start gap-3 sm:gap-4 bg-[#0D1B2A]/80 border border-[#1f2a3c] shadow-lg hover:bg-[#0D1B2A] hover:border-[#2a3a4f] transition-all duration-300 group h-full backdrop-blur-sm"
                  >
                    <motion.div
                      className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-b ${stat.accentBg} ${stat.accentRing} border flex-shrink-0`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {React.cloneElement(stat.icon, { className: `w-4 h-4 sm:w-5 sm:h-5 ${stat.accentText}` })}
                    </motion.div>
                    <div className="space-y-0.5 sm:space-y-1 min-w-0">
                      <div className="text-xl sm:text-2xl font-bold text-white leading-tight truncate">
                        {stat.number}
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-[#C4CFDE] leading-snug">
                        {stat.label}
                      </div>
                      <p className="text-[10px] sm:text-xs text-[#C4CFDE] leading-relaxed hidden sm:block">
                        {stat.microcopy}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Resume Elements Animation Section */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-slate-950 to-[#0a0f1c]">
          <div className="container-responsive">
            {/* Section Header */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 sm:mb-16 space-y-4"
            >
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
                isChristmasMode
                  ? 'bg-gradient-to-r from-red-500/10 to-green-500/10 border border-red-400/30 text-red-300'
                  : 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-300'
              }`}>
                <Zap className="w-4 h-4" />
                <span>AI-Powered Section Reordering</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white px-4">
                We Automatically Reorder Resume Sections
                <span className={`block mt-2 text-transparent bg-clip-text ${
                  isChristmasMode
                    ? 'bg-gradient-to-r from-red-300 via-emerald-300 to-green-400'
                    : 'bg-gradient-to-r from-cyan-300 to-blue-400'
                }`}>
                  Following ATS Best Practices
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto px-4">
                Based on your experience level and the job description, our AI rearranges
                your resume sections to maximize ATS compatibility and recruiter impact.
              </p>
            </motion.div>

            {/* Before/After Comparison */}
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 max-w-6xl mx-auto px-4 sm:px-0">
              {/* BEFORE Column */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-white">Before Optimization</div>
                    <div className="text-sm text-red-400">Wrong section order</div>
                  </div>
                </div>

                {[
                  { title: 'EDUCATION', subtitle: 'B.Tech Computer Science (Final Year)', wrong: true },
                  { title: 'PROJECTS', subtitle: '1 mini project listed', wrong: true },
                  { title: 'SKILLS', subtitle: 'Basic HTML, CSS, JavaScript', wrong: true },
                  { title: 'HOBBIES', subtitle: 'Movies, music, etc.', wrong: true },
                  { title: 'PERSONAL DETAILS', subtitle: 'Full address, date of birth at the top', wrong: true },
                ].map((section, i) => (
                  <motion.div
                    key={`before-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`relative p-3 sm:p-4 rounded-xl border backdrop-blur ${
                      section.wrong
                        ? 'bg-red-500/5 border-red-500/30'
                        : 'bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white text-sm sm:text-base">{section.title}</div>
                        <div className="text-xs sm:text-sm text-slate-400">{section.subtitle}</div>
                      </div>
                      {section.wrong && <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />}
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* AFTER Column */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                    isChristmasMode ? 'bg-green-500/20' : 'bg-emerald-500/20'
                  }`}>
                    <CheckCircle className={`w-5 h-5 sm:w-6 sm:h-6 ${isChristmasMode ? 'text-green-400' : 'text-emerald-400'}`} />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-white">After Optimization</div>
                    <div className={`text-sm ${isChristmasMode ? 'text-green-400' : 'text-emerald-400'}`}>ATS-compliant order</div>
                  </div>
                </div>

                {[
                  { title: 'SKILLS', subtitle: 'React, TypeScript, Tailwind CSS…', highlight: true },
                  { title: 'PROJECTS', subtitle: '3 academic & personal projects', highlight: true },
                  { title: 'EDUCATION', subtitle: 'B.Tech Computer Science', highlight: false },
                  { title: 'CERTIFICATIONS', subtitle: 'Frontend / coding certifications', highlight: false },
                ].map((section, i) => (
                  <motion.div
                    key={`after-${i}`}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className={`relative p-3 sm:p-4 rounded-xl border backdrop-blur overflow-hidden ${
                      section.highlight
                        ? isChristmasMode
                          ? 'bg-green-500/10 border-green-400/40 shadow-lg shadow-green-500/20'
                          : 'bg-emerald-500/10 border-emerald-400/40 shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <div className="font-semibold text-white text-sm sm:text-base">{section.title}</div>
                        <div className="text-xs sm:text-sm text-slate-400">{section.subtitle}</div>
                      </div>
                      <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${isChristmasMode ? 'text-green-400' : 'text-emerald-400'}`} />
                    </div>

                    {section.highlight && (
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-r ${
                          isChristmasMode
                            ? 'from-green-400/0 via-green-400/10 to-green-400/0'
                            : 'from-emerald-400/0 via-emerald-400/10 to-emerald-400/0'
                        }`}
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      />
                    )}
                  </motion.div>
                ))}

                {/* ATS Score Indicator */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border ${
                    isChristmasMode
                      ? 'bg-green-500/10 border-green-400/40'
                      : 'bg-emerald-500/10 border-emerald-400/40'
                  }`}
                >
                  <TrendingUp className={`w-5 h-5 sm:w-6 sm:h-6 ${isChristmasMode ? 'text-green-400' : 'text-emerald-400'}`} />
                  <div>
                    <div className={`text-xs sm:text-sm font-medium ${isChristmasMode ? 'text-green-300' : 'text-emerald-300'}`}>ATS Score Increased</div>
                    <div className="text-xl sm:text-2xl font-bold text-white">72% → 95%</div>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Keyword Matching Demo */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-12 sm:mt-16 p-6 sm:p-8 bg-slate-900/70 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl mx-auto"
            >
              <div className="text-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Keyword Matching & Highlighting
                </h3>
                <p className="text-sm sm:text-base text-slate-300">
                  We identify missing keywords and highlight where to add them
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <div className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wide">
                    Missing Keywords
                  </div>
                  {['Responsive Design', 'CI/CD', 'Agile'].map((keyword, i) => (
                    <motion.div
                      key={keyword}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="px-3 sm:px-4 py-2 bg-amber-500/10 border border-amber-400/30 rounded-lg text-amber-300 font-medium text-sm sm:text-base"
                    >
                      {keyword}
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wide">
                    Matched Keywords
                  </div>
                  {['React', 'TypeScript', 'REST APIs'].map((keyword, i) => (
                    <motion.div
                      key={keyword}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className={`px-3 sm:px-4 py-2 rounded-lg font-medium flex items-center gap-2 border text-sm sm:text-base ${
                        isChristmasMode
                          ? 'bg-green-500/10 border-green-400/30 text-green-300'
                          : 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {keyword}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>


        {/* Main Features Section */}
        <section ref={featuresRef} className="relative container-responsive py-12 sm:py-16 lg:py-20">
          <div className="absolute inset-0 -z-10 bg-[#0a0f1c] rounded-[32px] blur-3xl opacity-80" />
          <div className="relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12 space-y-3 px-4"
            >
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Comprehensive Tools</p>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">All-in-One Resume Intelligence Platform</h3>
              <p className="text-sm sm:text-base text-slate-400 max-w-3xl mx-auto leading-relaxed">From JD-based optimization to mock interviews, everything you need to land your dream job.</p>
            </motion.div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate={isFeaturesInView ? "visible" : "hidden"}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
            >
              {features.map((feature) => {
                let remainingCount: number | null = null;
                if (isAuthenticated && userSubscription) {
                  switch (feature.id) {
                    case 'optimizer':
                      remainingCount = userSubscription.optimizationsTotal - userSubscription.optimizationsUsed;
                      break;
                    case 'score-checker':
                      remainingCount = userSubscription.scoreChecksTotal - userSubscription.scoreChecksUsed;
                      break;
                    default:
                      remainingCount = null;
                  }
                }
                const accent = accentStyles[feature.accent];

                return (
                  <motion.div
                    key={feature.id}
                    variants={itemVariants}
                    whileHover={feature.requiresAuth && !isAuthenticated ? undefined : { y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      as="button"
                      onClick={() => handleFeatureClick(feature)}
                      padding="lg"
                      className={`group relative w-full overflow-hidden text-left transition-all duration-500 ${accent.bg} ${accent.border} ${accent.shadow} ${accent.glow} backdrop-blur-xl ${
                        feature.requiresAuth && !isAuthenticated ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                      } ${feature.highlight ? 'ring-2 ring-emerald-400/60 ring-offset-0' : ''}`}
                    >
                      {/* Background overlay */}
                      <div className={`absolute inset-0 ${accent.overlay} transition-opacity duration-300 group-hover:opacity-80`} />
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-10 group-hover:opacity-20 transition-opacity duration-300" />
                      
                      {/* Shimmer effect for highlighted cards */}
                      {feature.highlight && (
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                        />
                      )}

                      {/* Tag badge */}
                      {feature.tag && (
                        <div className="absolute -top-3 left-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg ${accent.badge}`}>
                            <Check className="w-3 h-3 mr-1" />
                            {feature.tag}
                          </span>
                        </div>
                      )}

                      {/* Content */}
                      <div className="relative flex items-start gap-3 sm:gap-4">
                        <motion.div
                          className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl ${accent.iconBg} ${accent.iconColor} transition-all duration-300 flex-shrink-0`}
                          whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                        >
                          {React.cloneElement(feature.icon, {
                            className: `w-5 h-5 sm:w-6 sm:h-6 ${accent.iconColor}`
                          })}
                        </motion.div>

                        <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm sm:text-base font-semibold text-white leading-snug group-hover:text-emerald-300 transition-colors duration-300">
                              {feature.title}
                            </span>
                            {feature.requiresAuth && !isAuthenticated && (
                              <span className="text-[10px] sm:text-[11px] uppercase tracking-wide text-amber-200 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200/30 animate-pulse">
                                Sign in
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed group-hover:text-slate-200 transition-colors duration-300 line-clamp-2">
                            {feature.description}
                          </p>
                          {isAuthenticated && userSubscription && remainingCount !== null && remainingCount > 0 && (
                            <p className="text-xs font-medium text-emerald-200 animate-pulse">
                              {remainingCount} remaining
                            </p>
                          )}
                        </div>

                        <motion.div
                          className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full ${accent.arrow} border border-white/10 flex-shrink-0`}
                          whileHover={{ x: 4, scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <ArrowRight className={`w-3 h-3 sm:w-4 sm:h-4 transition-all duration-300 group-hover:text-emerald-300 ${feature.requiresAuth && !isAuthenticated ? 'opacity-60' : ''}`} />
                        </motion.div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Companies Marquee Section */}
        <section className="relative isolate overflow-hidden py-12 sm:py-16 bg-slate-950 border-y border-slate-800/40">
          <GradientOrb className="w-64 h-64 -top-24 -left-24 bg-cyan-400/20" delay={1} />
          <GradientOrb className="w-72 h-72 -bottom-24 -right-24 bg-purple-400/20" delay={3} />
          
          <style>{`
            @keyframes marqueeX { from { transform: translateX(0); } to { transform: translateX(-50%); } }
            .marquee-track { animation: marqueeX 28s linear infinite; }
            .marquee-track.fast { animation-duration: 22s; }
            .marquee:hover .marquee-track { animation-play-state: paused; }
          `}</style>

          <div className="container-responsive">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-6 sm:mb-8"
            >
              <h4 className="text-base sm:text-lg lg:text-xl font-semibold text-white">Top Companies Our Users Apply To</h4>
              <p className="text-xs sm:text-sm text-slate-400">Trusted by candidates interviewing at leading global brands</p>
            </motion.div>

            {(() => {
              const companies = [
                'Google','Microsoft','Amazon','Meta','Netflix','Apple','NVIDIA','OpenAI','Uber','Airbnb',
                'Stripe','Coinbase','Salesforce','Adobe','Oracle','IBM','Intel','Samsung','Dell','HP',
                'Accenture','Infosys','TCS','Wipro','Capgemini','Zoho','Flipkart','Paytm','Swiggy','Zomato'
              ];
              const chip = (name: string, i: number) => (
                <span
                  key={name + i}
                  className="mx-1.5 sm:mx-2 my-1.5 sm:my-2 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 text-slate-200 shadow-sm border border-white/10 backdrop-blur hover:bg-white/10 transition-colors"
                >
                  <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                  <span className="text-xs sm:text-sm font-medium">{name}</span>
                </span>
              );
              return (
                <div className="space-y-3 sm:space-y-4">
                  <div className="marquee overflow-hidden">
                    <div className="marquee-track whitespace-nowrap flex items-center">
                      {[...companies, ...companies].map((c, i) => chip(c, i))}
                    </div>
                  </div>
                  <div className="marquee overflow-hidden">
                    <div className="marquee-track fast whitespace-nowrap flex items-center">
                      {[...companies.slice(10), ...companies.slice(10)].map((c, i) => chip(c, i))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Explore Jobs CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="mt-8 sm:mt-10"
            >
              <div className="max-w-4xl mx-auto rounded-2xl p-4 sm:p-6 bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
                <div className="text-center sm:text-left">
                  <h5 className="text-sm sm:text-base lg:text-lg font-semibold text-white">Explore Job Openings</h5>
                  <p className="text-xs sm:text-sm text-slate-400">Find roles at top companies and apply with your optimized resume.</p>
                </div>
                <motion.button
                  onClick={() => navigate('/jobs')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all text-sm sm:text-base whitespace-nowrap"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Latest Jobs
                  <ArrowRight className="w-4 h-4 ml-2" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>


        {/* Plans Section */}
        {isAuthenticated && (
          <section className="bg-slate-950 py-12 sm:py-16 border-b border-slate-800/40">
            <div className="container-responsive">
              <div className="max-w-2xl mx-auto mb-8 sm:mb-10">
                <div className="relative inline-block text-left w-full">
                  <motion.button
                    onClick={() => setShowPlanDetails(!showPlanDetails)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full bg-white/5 text-slate-100 font-semibold py-3 px-4 sm:px-6 rounded-xl flex items-center justify-between shadow-sm border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <span className="flex items-center text-sm sm:text-base">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300 mr-2" />
                      {userSubscription ? (
                        <span>
                          Optimizations Left:{' '}
                          <span className="font-bold">
                            {userSubscription.optimizationsTotal - userSubscription.optimizationsUsed}
                          </span>
                        </span>
                      ) : (
                        <span>No Active Plan. Upgrade to use all features.</span>
                      )}
                    </span>
                    {showPlanDetails ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
                  </motion.button>

                  <AnimatePresence>
                    {showPlanDetails && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-10 mt-2 w-full origin-top-right rounded-xl bg-[#0c111b] shadow-2xl border border-white/10"
                      >
                        <div className="py-1">
                          {userSubscription ? (
                            <>
                              <div className="block px-4 py-2 text-sm text-slate-200">
                                <p className="font-semibold">{userSubscription.name} Plan</p>
                                <p className="text-xs text-slate-400">Details for your current subscription.</p>
                              </div>
                              <hr className="my-1 border-white/10" />
                              <div className="px-4 py-2 text-sm text-slate-200 space-y-1">
                                <div className="flex justify-between items-center">
                                  <span>Optimizations:</span>
                                  <span className="font-medium">{userSubscription.optimizationsTotal - userSubscription.optimizationsUsed} / {userSubscription.optimizationsTotal}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Score Checks:</span>
                                  <span className="font-medium">{userSubscription.scoreChecksTotal - userSubscription.scoreChecksUsed} / {userSubscription.scoreChecksTotal}</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="block px-4 py-2 text-sm text-slate-200">
                              You currently don't have an active subscription.
                            </div>
                          )}
                          <div className="p-4 border-t border-white/10">
                            <button
                              onClick={() => onShowSubscriptionPlans(undefined, true)}
                              className="w-full btn-primary py-2"
                            >
                              {userSubscription ? 'Upgrade Plan' : 'Choose Your Plan'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="text-center mt-8 sm:mt-12">
                <motion.button
                  onClick={onShowSubscriptionPlansDirectly}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-secondary px-6 sm:px-8 py-2.5 sm:py-3 border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 text-sm sm:text-base"
                >
                  View All Plans & Add-ons
                </motion.button>
              </div>
            </div>
          </section>
        )}

        {/* AI Technology Section */}
        <section className="relative overflow-hidden text-white py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-slate-900 via-slate-950 to-[#020617]">
          <GradientOrb className="w-64 h-64 -top-24 -left-24 bg-fuchsia-500/20" delay={0} />
          <GradientOrb className="w-72 h-72 -bottom-24 -right-24 bg-cyan-500/20" delay={2} />

          <div className="container-responsive">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center mb-10 sm:mb-12"
            >
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-3 bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                Powered by Advanced AI Technology
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-slate-300 px-4">
                Our intelligent system understands ATS requirements, job market trends, and recruiter preferences to give you the competitive edge.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {[
                {
                  icon: <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-300" />,
                  title: 'AI-Powered Analysis',
                  description: 'Advanced algorithms analyze and optimize your resume',
                  color: 'yellow',
                  bg: 'bg-cyan-500/15'
                },
                {
                  icon: <Award className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-300" />,
                  title: 'ATS Optimization',
                  description: 'Ensure your resume passes all screening systems',
                  color: 'emerald',
                  bg: 'bg-indigo-500/15'
                },
                {
                  icon: <Users className="w-7 h-7 sm:w-8 sm:h-8 text-fuchsia-300" />,
                  title: 'Expert Approved',
                  description: 'Formats trusted by recruiters worldwide',
                  color: 'fuchsia',
                  bg: 'bg-fuchsia-500/15'
                }
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="text-center rounded-2xl sm:rounded-3xl p-5 sm:p-6 backdrop-blur-sm bg-white/5 border border-white/10 shadow-xl hover:shadow-2xl hover:border-white/20 transition-all duration-300"
                >
                  <div className="relative mx-auto mb-4 sm:mb-5">
                    <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto flex items-center justify-center ${card.bg}`}>
                      {card.icon}
                    </div>
                  </div>
                  <h4 className={`font-semibold mb-2 text-base sm:text-lg text-${card.color}-300`}>{card.title}</h4>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{card.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-0 bg-slate-950/90 backdrop-blur border-t border-slate-800/40">
          <div className="h-0.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500" />
          <div className="container-responsive py-6 sm:py-8">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 sm:gap-6">
              {/* Brand */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow ring-1 ring-white/10">
                  <img
                    src="https://res.cloudinary.com/dlkovvlud/image/upload/w_200,c_fill,ar_1:1,g_auto,r_max,b_rgb:262c35/v1751536902/a-modern-logo-design-featuring-primoboos_XhhkS8E_Q5iOwxbAXB4CqQ_HnpCsJn4S1yrhb826jmMDw_nmycqj.jpg"
                    alt="PrimoBoost AI"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">PrimoBoost AI</p>
                  <p className="text-xs text-slate-400">Resume Intelligence</p>
                </div>
              </div>

              {/* Copyright */}
              <div className="text-xs sm:text-sm text-slate-400 text-center md:text-left order-3 md:order-2">
                © {new Date().getFullYear()} PrimoBoost AI. All rights reserved.
              </div>

              {/* Socials */}
              <div className="flex items-center gap-2 sm:gap-3 order-2 md:order-3">
                {[
                  { href: 'https://instagram.com/primoboostai', icon: <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />, color: 'pink', label: 'Instagram' },
                  { href: 'https://linkedin.com/company/primoboost-ai', icon: <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />, color: 'cyan', label: 'LinkedIn' },
                  { href: 'https://wa.me/0000000000', icon: <WhatsappIcon className="w-4 h-4 sm:w-5 sm:h-5" />, color: 'emerald', label: 'WhatsApp' }
                ].map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/10 text-${social.color}-300 bg-white/5 hover:bg-white/10 hover:ring-2 hover:ring-${social.color}-300/40 transition-all`}
                    aria-label={social.label}
                    title={social.label}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
