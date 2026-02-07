// src/components/pages/PricingPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Check,
  Star,
  Zap,
  Crown,
  Target,
  TrendingUp,
  PlusCircle,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Award,
  Shield,
  Clock,
  Users,
  CheckCircle,
  X,
  Info,
  Wrench // Added Wrench icon for Resume Fix Pack
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AnimatedCard, GradientButton, SectionHeader, FloatingParticles, ChristmasSnow } from '../ui';
import { paymentService } from '../../services/paymentService';
import { SubscriptionPlan } from '../../types/payment';

interface PricingPageProps {
  onShowAuth: () => void;
  onShowSubscriptionPlans: (featureId?: string, expandAddons?: boolean) => void; // Updated prop signature
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onShowAuth,
  onShowSubscriptionPlans
}) => {
  const { isAuthenticated } = useAuth();
  const { isChristmasMode, colors } = useTheme();
  const plans: SubscriptionPlan[] = paymentService.getPlans();

  // Countdown Timer State
  const calculateTimeLeft = () => {
    // Set your offer end date here (e.g., September 1, 2025)
    const difference = +new Date('2025-09-01T00:00:00') - +new Date();
    let timeLeft: { hours?: number; minutes?: number; seconds?: number } = {};

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  const timerComponents: JSX.Element[] = [];

  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval as keyof typeof timeLeft]) {
      return;
    }

    timerComponents.push(
      <span key={interval} className="text-xl sm:text-2xl font-bold text-white">
        {String(timeLeft[interval as keyof typeof timeLeft]).padStart(2, '0')}
        <span className="text-base sm:text-lg font-medium ml-1 mr-2">{interval.charAt(0).toUpperCase()}</span>
      </span>
    );
  });

  const getPlanIcon = (iconType: string) => {
    switch (iconType) {
      case 'crown': return <Crown className="w-6 h-6" />;
      case 'zap': return <Zap className="w-6 h-6" />;
      case 'rocket': return <Award className="w-6 h-6" />; // Changed from Award to Rocket
      case 'target': return <Target className="w-6 h-6" />;
      case 'wrench': return <Wrench className="w-6 h-6" />;
      case 'check_circle': return <CheckCircle className="w-6 h-6" />;
      default: return <Sparkles className="w-6 h-6" />;
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      isChristmasMode
        ? 'bg-gradient-to-b from-[#1a0a0f] via-[#0f1a0f] to-[#070b14]'
        : 'bg-gradient-to-b from-[#0a1e1e] via-[#0d1a1a] to-[#070b14]'
    }`}>
      {/* Radial Glow Overlay */}
      <div className={`pointer-events-none absolute inset-0 ${
        isChristmasMode
          ? 'bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(34,197,94,0.15),transparent_50%)]'
          : 'bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.15),transparent_50%)]'
      }`} />

      {/* Floating Particles */}
      <FloatingParticles count={15} />

      {/* Christmas Snow */}
      {isChristmasMode && <ChristmasSnow count={40} />}
      {/* Hero Section */}
      <div className="relative z-10 overflow-hidden">
        <div className="container mx-auto px-4 py-20 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl ${
              isChristmasMode
                ? 'bg-gradient-to-br from-red-500 via-yellow-400 to-green-600 shadow-green-500/50'
                : 'bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-emerald-500/50'
            }`}>
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white tracking-tight">
              Choose Your{' '}
              <span className={`block bg-gradient-to-r bg-clip-text text-transparent ${
                isChristmasMode
                  ? 'from-red-400 via-yellow-400 to-green-400'
                  : 'from-emerald-400 via-cyan-400 to-teal-400'
              }`}>
                Success Plan
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-300 mb-8 leading-relaxed">
              Flexible pricing for every career stage. Start free, upgrade when you need more power.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Plans Section */}
      <div className="relative z-10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Countdown Banner */}
            <AnimatedCard glow className={`p-4 sm:p-6 text-center mb-12 ${
              isChristmasMode
                ? 'bg-gradient-to-r from-red-600 to-green-600 border-red-500/50'
                : 'bg-gradient-to-r from-orange-600 to-red-600 border-orange-500/50'
            }`}>
              <p className="text-lg sm:text-xl font-bold mb-2">Launch Offer 🎉</p>
              {timerComponents.length ? (
                <div className="flex justify-center items-center">
                  <Clock className="w-6 h-6 sm:w-8 h-8 mr-2" />
                  <span className="text-xl sm:text-2xl font-bold">Offer ends in:</span>
                  {timerComponents}
                </div>
              ) : (
                <span className="text-xl sm:text-2xl font-bold">Offer has ended!</span>
              )}
            </AnimatedCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <AnimatedCard
                  key={plan.id}
                  glow={plan.popular}
                  hoverLift={plan.popular ? 12 : 8}
                  delay={index * 0.1}
                  className={`relative ${
                    plan.popular ? 'ring-2 ring-emerald-400/50 shadow-emerald-glow-lg' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <span className={`px-6 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse ${
                        isChristmasMode
                          ? 'bg-gradient-to-r from-red-500 to-green-500'
                          : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                      } text-white`}>
                        {plan.id === 'career_boost_plus' ? 'Most Popular' : 'Best Value'}
                      </span>
                    </div>
                  )}

                  <div className="p-8">
                    <div className="text-center mb-8">
                      <div className={`bg-gradient-to-r ${plan.gradient} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg`}>
                        {getPlanIcon(plan.icon)}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <p className="text-slate-300 mb-4">{plan.optimizations} Credits</p>

                      {/* Price Display */}
                      <div className="flex flex-col items-center mb-2">
                        <span className="text-sm text-red-400 line-through">₹{plan.mrp}</span>
                        <div className="flex items-center">
                          <span className="text-4xl font-bold text-white">₹{plan.price}</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                            isChristmasMode
                              ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                          }`}>
                            {plan.discountPercentage}% OFF
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm">One-time purchase</p>
                    </div>

                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <Check className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
                            isChristmasMode ? 'text-green-400' : 'text-emerald-400'
                          }`} />
                          <span className="text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <GradientButton
                      onClick={() => {
                        if (isAuthenticated) {
                          onShowSubscriptionPlans(plan.id, false);
                        } else {
                          onShowAuth();
                        }
                      }}
                      variant={plan.popular ? 'primary' : 'secondary'}
                      size="lg"
                      className="w-full"
                    >
                      {isAuthenticated ? 'Select Plan' : 'Sign Up & Select'}
                    </GradientButton>
                  </div>
                </AnimatedCard>
              ))}
            </div>

            {/* Microcopy below buttons */}
            <p className="text-center text-sm text-slate-400 mt-8">
              Inclusive of GST where applicable. Limited-time launch offer.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Strip */}
      <div className="relative z-10 py-8">
        <AnimatedCard glow className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 text-center">
            <div className="flex items-center space-x-2 text-slate-300">
              <Users className={`w-5 h-5 ${
                isChristmasMode ? 'text-green-400' : 'text-emerald-400'
              }`} />
              <span>Loved by 10,000+ job seekers</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span>Avg. rating 4.8/5</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <CheckCircle className={`w-5 h-5 ${
                isChristmasMode ? 'text-green-400' : 'text-emerald-400'
              }`} />
              <span>ATS-friendly outputs</span>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
};
