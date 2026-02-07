import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Star,
  Clock,
  Calendar,
  CreditCard,
  ArrowRight,
  Shield,
  Users,
  Gift,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { sessionBookingService } from '../../services/sessionBookingService';
import type { SessionService } from '../../types/session';

interface SessionLandingPageProps {
  onShowAuth: (callback?: () => void) => void;
}

const steps = [
  { icon: <Calendar className="w-5 h-5" />, title: 'Pick a Date', desc: 'Choose your preferred date' },
  { icon: <Clock className="w-5 h-5" />, title: 'Select Time', desc: 'Pick an available slot' },
  { icon: <CreditCard className="w-5 h-5" />, title: 'Pay Securely', desc: 'Quick & safe payment' },
  { icon: <CheckCircle className="w-5 h-5" />, title: 'Session Confirmed', desc: 'Get bonus credits' },
];

export const SessionLandingPage: React.FC<SessionLandingPageProps> = ({ onShowAuth }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState<SessionService | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const svc = await sessionBookingService.getActiveService();
      setService(svc);
      setLoading(false);
    };
    load();
  }, []);

  const handleBookSlot = () => {
    if (!isAuthenticated) {
      onShowAuth(() => navigate('/session/book'));
      return;
    }
    navigate('/session/book');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-slate-400 text-lg">No sessions available at the moment.</p>
      </div>
    );
  }

  const priceInRupees = service.price / 100;

  return (
    <div className="min-h-screen pb-20 md:pl-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-5">
            <Star className="w-4 h-4" />
            <span>1-on-1 Expert Session</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            {service.title}
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {service.description}
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-[#0d1f2d] to-[#0a1a24] border border-slate-700/50 rounded-2xl overflow-hidden mb-10 sm:mb-14"
        >
          <div className="grid lg:grid-cols-5">
            {/* Left: Highlights */}
            <div className="lg:col-span-3 p-6 sm:p-8 lg:p-10">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
                What You Get
              </h2>
              <div className="space-y-4">
                {(service.highlights as string[]).map((highlight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-slate-200 text-base">{highlight}</span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 text-slate-300 text-sm">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 text-slate-300 text-sm">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Limited Slots</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 text-slate-300 text-sm">
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span>+{service.bonus_credits} JD Credits</span>
                </div>
              </div>
            </div>

            {/* Right: Price + CTA */}
            <div className="lg:col-span-2 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-t lg:border-t-0 lg:border-l border-slate-700/50 p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-center text-center">
              <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">One-time Session</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl sm:text-5xl font-bold text-white">
                  {'\u20B9'}{priceInRupees.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-slate-500 text-sm mb-6">One-time payment</p>

              <motion.button
                onClick={handleBookSlot}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full max-w-xs px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Book Slot
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <p className="text-slate-500 text-xs mt-4">
                Only {service.max_slots_per_day} slots available per day
              </p>
            </div>
          </div>
        </motion.div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-8">
            How It Works
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="relative bg-slate-800/40 border border-slate-700/40 rounded-xl p-5 text-center group hover:border-emerald-500/30 transition-colors"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto mb-3 group-hover:bg-emerald-500/20 transition-colors">
                  {step.icon}
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{step.title}</h3>
                <p className="text-slate-500 text-xs">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
