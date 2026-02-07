import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Target,
  MessageSquare,
  Hammer,
  Loader2,
  Crown,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { paymentService } from '../../services/paymentService';
import { Subscription } from '../../types/payment';
import { useNavigate } from 'react-router-dom';

export const ProfileUsageTab: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;
    try {
      const sub = await paymentService.getUserSubscription(user.id);
      setSubscription(sub);
    } catch (err) {
      console.error('Error loading subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#00E6B8] mr-2" />
        <span className="text-slate-400">Loading usage data...</span>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-16 bg-[#0a1a24] rounded-xl border border-[#0c1d25]">
        <Crown className="w-14 h-14 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-200 mb-2">No Active Plan</h3>
        <p className="text-slate-400 mb-6 max-w-sm mx-auto">
          Subscribe to a plan to start optimizing your resume and tracking your progress.
        </p>
        <button
          onClick={() => navigate('/pricing')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[rgba(0,230,184,0.15)] text-[#00E6B8] rounded-lg hover:bg-[rgba(0,230,184,0.25)] transition-colors text-sm font-medium"
        >
          <Crown className="w-4 h-4" /> View Plans
        </button>
      </div>
    );
  }

  const getDaysRemaining = () => {
    const end = new Date(subscription.endDate);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const creditTypes = [
    {
      label: 'Resume Optimizations',
      used: subscription.optimizationsUsed,
      total: subscription.optimizationsTotal,
      icon: <Zap className="w-5 h-5" />,
      color: '#00E6B8',
    },
    {
      label: 'Score Checks',
      used: subscription.scoreChecksUsed,
      total: subscription.scoreChecksTotal,
      icon: <Target className="w-5 h-5" />,
      color: '#38bdf8',
    },
    {
      label: 'LinkedIn Messages',
      used: subscription.linkedinMessagesUsed,
      total: subscription.linkedinMessagesTotal,
      icon: <MessageSquare className="w-5 h-5" />,
      color: '#a78bfa',
    },
    {
      label: 'Guided Builds',
      used: subscription.guidedBuildsUsed,
      total: subscription.guidedBuildsTotal,
      icon: <Hammer className="w-5 h-5" />,
      color: '#fb923c',
    },
  ];

  const daysLeft = getDaysRemaining();

  return (
    <div className="space-y-6">
      <div className="bg-[#0a1a24] rounded-xl border border-[#0c1d25] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[rgba(0,230,184,0.1)] flex items-center justify-center">
              <Crown className="w-5 h-5 text-[#00E6B8]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-200">
                {subscription.planId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </h3>
              <p className="text-xs text-slate-500">
                {subscription.status === 'active' ? 'Active' : 'Expired'} &middot; {daysLeft} days remaining
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
            subscription.status === 'active'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}>
            {subscription.status === 'active' ? 'Active' : 'Expired'}
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-500">
          <span>Started: {new Date(subscription.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span>Expires: {new Date(subscription.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Credit Usage</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {creditTypes.map((ct) => {
            const remaining = ct.total - ct.used;
            const pct = ct.total > 0 ? (ct.used / ct.total) * 100 : 0;
            return (
              <motion.div
                key={ct.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a1a24] rounded-xl border border-[#0c1d25] p-4 hover:border-[rgba(0,230,184,0.15)] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: ct.color + '15', color: ct.color }}>
                      {ct.icon}
                    </div>
                    <span className="text-sm font-medium text-slate-300">{ct.label}</span>
                  </div>
                  <span className="text-xs text-slate-500">{ct.used}/{ct.total}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-700"
                    style={{ width: pct + '%', backgroundColor: ct.color }}
                  />
                </div>
                <p className="text-xs mt-2" style={{ color: remaining === 0 ? '#f87171' : '#64748b' }}>
                  {remaining === 0 ? 'All credits used' : remaining + ' remaining'}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
