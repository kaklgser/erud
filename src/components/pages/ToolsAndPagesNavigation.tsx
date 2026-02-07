// src/components/pages/ToolsAndPagesNavigation.tsx
import React from 'react';
import {
  Home,
  Info,
  BookOpen,
  Phone,
  Target,
  TrendingUp,
  PlusCircle,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Users,
  Award,
  Crown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Subscription } from '../../types/payment';

interface ToolsAndPagesNavigationProps {
  onPageChange: (page: string) => void;
  isAuthenticated: boolean;
  onShowAuth: () => void;
  userSubscription: Subscription | null;
  onShowSubscriptionPlans: () => void;
}

interface FeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  onPageChange: (page: string) => void;
  isAuthenticated: boolean;
  onShowAuth: () => void;
  requiresAuth?: boolean;
  userSubscription: Subscription | null;
  onShowSubscriptionPlans: () => void;
  isTool?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  id,
  title,
  description,
  icon,
  colorClass,
  onPageChange,
  isAuthenticated,
  onShowAuth,
  requiresAuth = false,
  userSubscription,
  onShowSubscriptionPlans,
  isTool = false,
}) => {
  const handleCardClick = () => {
    if (requiresAuth && !isAuthenticated) {
      onShowAuth();
      return;
    }
    onPageChange(id);
  };

  const getUsageText = () => {
    if (!isAuthenticated) return null;
    if (id === 'guided-builder' || id === 'linkedin-generator') {
      return null;
    }
    if (!userSubscription) return <span className="text-xs font-medium text-red-400">No active plan</span>;

    let used: number | undefined;
    let total: number | undefined;

    switch (id) {
      case 'optimizer':
        used = userSubscription.optimizationsUsed;
        total = userSubscription.optimizationsTotal;
        break;
      case 'score-checker':
        used = userSubscription.scoreChecksUsed;
        total = userSubscription.scoreChecksTotal;
        break;
      case 'guided-builder':
        used = userSubscription.guidedBuildsUsed;
        total = userSubscription.guidedBuildsTotal;
        break;
      case 'linkedin-generator':
        used = userSubscription.linkedinMessagesUsed;
        total = userSubscription.linkedinMessagesTotal;
        break;
      default:
        return null;
    }

    if (used !== undefined && total !== undefined) {
      const remaining = total - used;
      if (total === Infinity) {
        return <span className="text-xs font-medium text-emerald-400">Unlimited</span>;
      } else if (remaining <= 0) {
        return <span className="text-xs font-medium text-red-400">Used all {total}</span>;
      } else {
        return <span className="text-xs font-medium text-emerald-400">{remaining} remaining</span>;
      }
    }
    return null;
  };

  const isDisabled = requiresAuth && !isAuthenticated;
  const usageText = getUsageText();
  const isUsageExhausted = usageText && usageText.props.className.includes('text-red');

  return (
    <button
      onClick={handleCardClick}
      disabled={isDisabled}
      className={`card-surface p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between transition-all duration-300 group rounded-2xl hover:border-emerald-500/30 hover:shadow-emerald-glow ${
        isDisabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
      } ${isUsageExhausted ? 'border-red-500/30 bg-red-500/5' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`rounded-xl p-3 bg-gradient-to-r ${colorClass} text-white transition-all duration-300 shadow-lg group-hover:scale-110 group-hover:shadow-emerald-glow flex-shrink-0`}>
          {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
        </div>
        <div className="text-left">
          <span className="text-base font-semibold text-slate-100 block">{title}</span>
          <p className="text-sm text-slate-400 mt-0.5">{description}</p>
          {usageText && <div className="mt-1">{usageText}</div>}
        </div>
      </div>
      <ArrowRight className={`w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-3 sm:mt-0 ${isDisabled ? 'opacity-50' : ''}`} />
    </button>
  );
};

export const ToolsAndPagesNavigation: React.FC<ToolsAndPagesNavigationProps> = ({
  onPageChange,
  isAuthenticated,
  onShowAuth,
  userSubscription,
  onShowSubscriptionPlans,
}) => {
  const { user } = useAuth();

  const tools = [
    {
      id: 'optimizer',
      title: 'JD-Based Optimizer',
      description: 'Upload your resume and a job description to get a perfectly tailored resume.',
      icon: <Target />,
      colorClass: 'from-emerald-500 to-cyan-500',
      requiresAuth: false,
      isTool: true,
    },
    {
      id: 'score-checker',
      title: 'Resume Score Check',
      description: 'Get an instant ATS score with detailed analysis and improvement suggestions.',
      icon: <TrendingUp />,
      colorClass: 'from-purple-500 to-pink-500',
      requiresAuth: true,
      isTool: true,
    },
    {
      id: 'guided-builder',
      title: 'Guided Resume Builder',
      description: 'Create a professional resume from scratch with our step-by-step AI-powered builder.',
      icon: <PlusCircle />,
      colorClass: 'from-green-500 to-emerald-500',
      requiresAuth: true,
      isTool: true,
    },
    {
      id: 'linkedin-generator',
      title: 'Outreach Message Generator',
      description: 'Generate personalized messages for networking, referrals, and cold outreach.',
      icon: <MessageCircle />,
      colorClass: 'from-orange-500 to-red-500',
      requiresAuth: true,
      isTool: true,
    },
    {
      id: 'ats-16-parameter',
      title: '16-Parameter ATS Checker',
      description: 'Professional ATS evaluation using industry-standard 16-parameter weighted model.',
      icon: <Award />,
      colorClass: 'from-blue-500 to-purple-500',
      requiresAuth: false,
      isTool: true,
    },
    {
      id: 'ats-16-parameter-advanced',
      title: 'Advanced 16-Parameter ATS',
      description: 'Enhanced ATS checker with analytics, benchmarks, history tracking, and smart recommendations.',
      icon: <Crown />,
      colorClass: 'from-purple-500 to-pink-500',
      requiresAuth: false,
      isTool: true,
    },
  ];

  const pages = [
    {
      id: 'new-home',
      title: 'Home',
      description: 'Return to the main dashboard and feature overview.',
      icon: <Home />,
      colorClass: 'from-blue-500 to-indigo-500',
    },
    {
      id: 'about',
      title: 'About Us',
      description: 'Learn more about our mission, vision, and the team behind PrimoBoost AI.',
      icon: <Info />,
      colorClass: 'from-purple-500 to-fuchsia-500',
    },
    {
      id: 'tutorials',
      title: 'Tutorials',
      description: 'Access video guides and resources to master resume optimization.',
      icon: <BookOpen />,
      colorClass: 'from-pink-500 to-rose-500',
    },
    {
      id: 'contact',
      title: 'Contact Us',
      description: 'Get in touch with our support team for any questions or assistance.',
      icon: <Phone />,
      colorClass: 'from-teal-500 to-cyan-500',
    },
    {
      id: 'profile',
      title: 'Profile Settings',
      description: 'Manage your personal information, social links, and account settings.',
      icon: <Users />,
      colorClass: 'from-gray-500 to-slate-500',
      requiresAuth: true,
    },
    {
      id: 'wallet',
      title: 'Referral & Wallet',
      description: 'Track your referral earnings and manage your wallet balance.',
      icon: <Award />,
      colorClass: 'from-yellow-500 to-orange-500',
      requiresAuth: true,
    },
    {
      id: 'subscription-plans',
      title: 'Subscription Plans',
      description: 'View and upgrade your subscription plan to unlock more features.',
      icon: <Crown />,
      colorClass: 'from-indigo-500 to-blue-500',
      requiresAuth: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] py-8">
      <div className="container-responsive max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-8 text-center">
          Explore All Features & Pages
        </h1>

        <div className="mb-10">
          <h2 className="text-xl font-bold text-slate-100 mb-5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            AI-Powered Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool) => (
              <FeatureCard
                key={tool.id}
                {...tool}
                onPageChange={onPageChange}
                isAuthenticated={isAuthenticated}
                onShowAuth={onShowAuth}
                userSubscription={userSubscription}
                onShowSubscriptionPlans={onShowSubscriptionPlans}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-5 flex items-center gap-2">
            <Home className="w-5 h-5 text-cyan-400" />
            Other Pages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pages.map((page) => (
              <FeatureCard
                key={page.id}
                {...page}
                onPageChange={onPageChange}
                isAuthenticated={isAuthenticated}
                onShowAuth={onShowAuth}
                userSubscription={userSubscription}
                onShowSubscriptionPlans={onShowSubscriptionPlans}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
