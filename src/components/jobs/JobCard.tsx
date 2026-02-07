import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  Clock,
  Calendar,
  Users,
  Sparkles
} from 'lucide-react';
import { JobListing } from '../../types/jobs';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface JobCardProps {
  job: JobListing & {
    match_score?: number;
    match_reason?: string;
    skills_matched?: string[];
  };
  isAuthenticated: boolean;
  onShowAuth: () => void;
  onManualApply?: (job: JobListing) => void;
  onAutoApply?: (job: JobListing) => Promise<void>;
  onCompleteProfile?: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  isAuthenticated,
  onShowAuth,
  onManualApply,
  onAutoApply,
  onCompleteProfile,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const autoApplyEnabled = import.meta.env.VITE_ENABLE_AUTO_APPLY === 'true';

  // Debug logging for logo
  React.useEffect(() => {
    console.log('JobCard Debug:', {
      company: job.company_name,
      logo_url: job.company_logo_url,
      logo_old: job.company_logo,
      has_logo: !!(job.company_logo_url || job.company_logo)
    });
  }, [job]);

  const eligibleYearTags = useMemo(() => {
    const raw = job.eligible_years;
    if (!raw) return [];

    const tokens = Array.isArray(raw)
      ? raw
      : raw.includes(',') || raw.includes('|') || raw.includes('/')
        ? raw.split(/[,|/]/)
        : raw.split(/\s+/);

    return tokens
      .map((value) => value.trim())
      .filter((value, index, arr) => value.length > 0 && arr.indexOf(value) === index)
      .slice(0, 3);
  }, [job.eligible_years]);

  const handleCardClick = () => {
    navigate(`/jobs/${job.id}`);
  };

  const handleManualApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Redirect to details page for manual apply (better shareable path)
    navigate(`/jobs/${job.id}`);
  };

  const handleAutoApply = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!autoApplyEnabled) {
      return; // disabled with overlay
    }
    if (!isAuthenticated) {
      onShowAuth();
      return;
    }
    if (onAutoApply) {
      await onAutoApply(job);
    }
  };

  const skillTags = job.skills || [];
  const postedDaysAgo = Math.floor((Date.now() - new Date(job.posted_date).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleCardClick}
      className={`bg-slate-900/80 backdrop-blur-xl rounded-xl border ${
        job.match_score
          ? 'border-green-500/50 shadow-lg shadow-green-500/20'
          : 'border-slate-700/50'
      } hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer overflow-hidden`}
    >
      {job.match_score && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <Sparkles className="w-4 h-4" />
            <span className="font-bold text-lg">{job.match_score}% Match</span>
          </div>
          {job.match_reason && (
            <span className="text-white text-xs bg-white/20 px-2 py-1 rounded-full">
              AI Recommended
            </span>
          )}
        </div>
      )}
      <div className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          {/* Company Logo */}
          <div className="flex-shrink-0 w-16 h-16 sm:w-16 sm:h-16 bg-slate-800/50 rounded-lg border border-slate-700/50 flex items-center justify-center p-1 sm:p-2 overflow-hidden">
            {(job.company_logo_url || job.company_logo) ? (
              <img
                src={job.company_logo_url || job.company_logo}
                alt={`${job.company_name} logo`}
                className="w-full h-full object-contain object-center"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-full h-full rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">${job.company_name.charAt(0)}</div>`;
                  }
                }}
              />
            ) : (
              <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {job.company_name.charAt(0)}
              </div>
            )}
          </div>

          {/* Job Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1 truncate">
                  {job.role_title}
                </h3>
                <p className="text-sm text-slate-400 mb-2">
                  {job.company_name}
                </p>
              </div>

              {/* Commission Badge */}
              {job.user_has_applied && job.commission_percentage && job.commission_percentage > 0 && (
                <div className="flex-shrink-0 relative">
                  <svg className="w-10 h-10 transform -rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      fill="none"
                      className="text-slate-700"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 16}`}
                      strokeDashoffset={`${2 * Math.PI * 16 * (1 - job.commission_percentage / 100)}`}
                      className={job.user_application_method === 'auto' ? 'text-green-400' : 'text-cyan-400'}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-300">{Math.round(job.commission_percentage)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Job Details */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-slate-400 mb-2">
              <div className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{job.location_city || job.location_type}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Full-time</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-3.5 h-3.5" />
                <span>{job.experience_required}</span>
              </div>
              {eligibleYearTags.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{eligibleYearTags.join(' / ')}</span>
                </div>
              )}
            </div>

            {/* Skill Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {skillTags.slice(0, 6).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 rounded text-[11px] font-medium border border-cyan-500/30"
                >
                  {tag}
                </span>
              ))}
              {skillTags.length > 6 && (
                <span className="px-2 py-0.5 bg-slate-800/50 text-slate-400 rounded text-[11px] font-medium">
                  +{skillTags.length - 6}
                </span>
              )}
            </div>

            {/* Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-1.5">
                {job.has_referral && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded text-[10px] font-semibold flex items-center animate-pulse">
                    <Users className="w-2.5 h-2.5 mr-0.5" />
                    Referral
                  </span>
                )}
                {job.ai_polished && (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px] font-medium flex items-center border border-purple-500/30">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                    AI
                  </span>
                )}
                <span className="text-[11px] text-slate-500">
                  {postedDaysAgo === 0 ? 'Today' : `${postedDaysAgo}d ago`}
                </span>
              </div>

              {/* Apply Buttons */}
              <div className="flex items-center sm:space-x-2 gap-2 sm:gap-0">
                {job.is_active ? (
                  <>
                    <button
                      onClick={handleAutoApply}
                      disabled={!autoApplyEnabled}
                      aria-disabled={!autoApplyEnabled}
                      className={`relative px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all duration-200 w-auto flex items-center space-x-1 ${autoApplyEnabled ? 'hover:from-emerald-400 hover:to-green-400 hover:shadow-emerald-500/30' : 'opacity-60 cursor-not-allowed'}`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto Apply</span>
                      {!autoApplyEnabled && (
                        <span className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center text-[10px] font-semibold">
                          Coming soon
                        </span>
                      )}
                    </button>
                    <button
                      onClick={handleManualApply}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm font-semibold hover:from-cyan-400 hover:to-blue-400 shadow-md hover:shadow-cyan-500/30 transition-all duration-200 w-full sm:w-auto"
                    >
                      Manual Apply
                    </button>
                  </>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2 bg-slate-700/50 text-slate-400 rounded-lg text-sm font-semibold cursor-not-allowed border border-slate-600/50 w-full sm:w-auto"
                  >
                    Expired
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
