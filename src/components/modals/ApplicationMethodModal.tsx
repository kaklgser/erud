import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  ExternalLink,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Target,
  Info,
} from 'lucide-react';
import { JobListing } from '../../types/jobs';

interface ApplicationMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobListing;
  onManualApply: () => void;
  onAIOptimizedApply: () => void;
  onScoreCheck: () => void;
}

type OptionKey = 'optimize' | 'score' | 'direct';

type TooltipState = {
  key: OptionKey;
  x: number;
  y: number;
};

interface ActionDefinition {
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  badge?: string;
  badgeClass?: string;
  gradient: string;
  icon: React.ReactNode;
  ctaLabel: string;
  onAction: () => void;
  emphasis?: 'primary' | 'info' | 'danger';
}

export const ApplicationMethodModal: React.FC<ApplicationMethodModalProps> = ({
  isOpen,
  onClose,
  job,
  onManualApply,
  onAIOptimizedApply,
  onScoreCheck,
}) => {
  const [active, setActive] = useState<OptionKey>('optimize');
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const update = () => {
      if (typeof window !== 'undefined') {
        setIsSmallScreen(window.innerWidth < 768); // Tailwind md breakpoint
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const actions: Record<OptionKey, ActionDefinition> = useMemo(
    () => ({
      optimize: {
        title: 'Optimize Resume with AI',
        subtitle: 'Boost your shortlist chances',
        description:
          '',
        highlights: [
          `ATS-ready formatting tuned for ${job.domain} roles`,
          `Keyword alignment with the ${job.role_title} job description`,
          'Instant access to optimized PDF and DOCX downloads',
        ],
        badge: 'Recommended',
        badgeClass:
          'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        gradient: 'from-purple-600 to-pink-600',
        icon: (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-xl text-white">
            <Sparkles className="w-6 h-6" />
          </div>
        ),
        ctaLabel: 'Start Optimization',
        onAction: onAIOptimizedApply,
        emphasis: 'primary',
      },
      score: {
        title: 'Score Against This Job',
        subtitle: 'See ATS compatibility first',
        description:
          "Already have a resume ready? Benchmark it in seconds. You'll see ATS score, keyword coverage, and the exact gaps to fix before applying.",
        highlights: [
          'Detailed ATS score with keyword match percentage',
          'Spots missing skills, tools, and depth of experience',
          'Best diagnostic step before investing effort in optimization',
        ],
        badge: 'Best Insight',
        badgeClass: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
        gradient: 'from-blue-500 to-cyan-500',
        icon: (
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl text-white">
            <Target className="w-6 h-6" />
          </div>
        ),
        ctaLabel: 'Check ATS Score',
        onAction: onScoreCheck,
        emphasis: 'info',
      },
      direct: {
        title: 'Apply Directly (Risky)',
        subtitle: 'Skip prep and go straight to the portal',
        description:
          "This will take you to the company application site without tailoring. Use only if you're confident your resume already beats ATS filters.",
        highlights: [
          "High rejection risk when keywords don't match",
          'No feedback on missing skills or accomplishments',
          "Often a wasted application if your resume is not tuned",
        ],
        badge: 'Use with caution',
        badgeClass: 'bg-red-500/20 text-red-300 border border-red-500/30',
        gradient: 'from-red-500 to-orange-500',
        icon: (
          <div className="bg-red-500/90 p-3 rounded-xl text-white">
            <ExternalLink className="w-6 h-6" />
          </div>
        ),
        ctaLabel: 'Continue to Company Site',
        onAction: onManualApply,
        emphasis: 'danger',
      },
    }),
    [job, onAIOptimizedApply, onManualApply, onScoreCheck]
  );

  useEffect(() => {
    if (!isOpen) {
      setTooltip(null);
    }
  }, [isOpen]);

  const anchorTooltip = (key: OptionKey, target: HTMLElement | null) => {
    if (isSmallScreen) return; // Disable floating tooltip on small screens
    if (typeof window === 'undefined' || !target) return;
    const rect = target.getBoundingClientRect();
    const tooltipWidth = 280;
    const margin = 16;
    const x = Math.min(
      Math.max(rect.left + rect.width / 2, tooltipWidth / 2 + margin),
      window.innerWidth - tooltipWidth / 2 - margin
    );
    const y = Math.max(rect.top - margin * 1.5, margin);
    setTooltip({ key, x, y });
  };

  const clearTooltip = () => setTooltip(null);

  const handleActionSwitch = (targetKey: OptionKey) => {
    setActive(targetKey);
    if (typeof document !== 'undefined') {
      const targetButton = document.querySelector<HTMLButtonElement>(
        `[data-option="${targetKey}"]`
      );
      if (targetButton) {
        targetButton.focus({ preventScroll: true });
        if (!isSmallScreen) anchorTooltip(targetKey, targetButton);
        return;
      }
    }
    clearTooltip();
  };

  if (!isOpen) return null;

  const renderTooltipContent = (key: OptionKey) => {
    const copyMap: Record<OptionKey, { title: string; body: string; iconClass: string; borderClass: string }> = {
      optimize: {
        title: 'Why optimize first?',
        body: 'Launch the AI rewrite tuned to this role. We add metrics, keywords, and formatting that keeps your resume in the recruiter short-list.',
        iconClass: 'text-purple-400',
        borderClass: 'border-purple-500/30 text-slate-200',
      },
      score: {
        title: "Need proof first?",
        body: 'Upload your resume for an instant ATS score, keyword coverage, and the gaps to fix before you apply.',
        iconClass: 'text-blue-400',
        borderClass: 'border-blue-500/30 text-slate-200',
      },
      direct: {
        title: 'Think twice before skipping prep',
        body: 'Blind applications get filtered out fast. Run the ATS check or let AI optimize first so the recruiter actually sees you.',
        iconClass: 'text-red-400',
        borderClass: 'border-red-500/30 text-red-300',
      },
    };

    const data = copyMap[key];
    return (
      <div className="w-64 sm:w-72">
        <div className={`relative bg-slate-800 border rounded-xl shadow-xl p-4 text-sm ${data.borderClass}`}>
          <div className="flex items-center gap-2 mb-2">
            <Info className={`w-4 h-4 ${data.iconClass}`} />
            <span className="font-semibold text-slate-100">{data.title}</span>
          </div>
          <p className="text-slate-300">{data.body}</p>
        </div>
      </div>
    );
  };

  const renderDetailHero = (key: OptionKey) => {
    const action = actions[key];
    const wrapperClass =
      action.emphasis === 'danger'
        ? 'border-red-500/30 bg-red-500/10'
        : action.emphasis === 'info'
          ? 'border-blue-500/30 bg-blue-500/10'
          : 'border-purple-500/30 bg-purple-500/10';

    return (
      <div className={`rounded-2xl border p-6 transition-all duration-300 ${wrapperClass}`}>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {action.icon}
              <div>
                {action.badge && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-1 ${action.badgeClass}`}>
                    {action.badge}
                  </span>
                )}
                <h3 className="text-xl font-bold text-slate-100">
                  {action.title}
                </h3>
                <p className="text-sm text-slate-400">{action.subtitle}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-4">{action.description}</p>
            {isSmallScreen && key === 'direct' && (
              <div className="mb-4">
                {renderTooltipContent('direct')}
              </div>
            )}
            <ul className="space-y-2">
              {action.highlights.map((point, index) => (
                <li key={index} className="flex items-start text-sm leading-relaxed text-slate-300">
                  {key === 'direct' ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                  ) : (
                    <CheckCircle
                      className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${
                        key === 'score'
                          ? 'text-blue-400'
                          : 'text-purple-400'
                      }`}
                    />
                  )}
                  {point}
                </li>
              ))}
            </ul>

            {key === 'direct' && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-sm font-semibold text-red-200">
                  Prefer a safer path?
                </p>
                <p className="text-xs text-red-300 mb-3">
                  Use our tools first to see exactly what the ATS expects before risking this application.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:w-auto"
                    onClick={() => handleActionSwitch('score')}
                  >
                    Check ATS Score First
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-400 sm:w-auto"
                    onClick={() => handleActionSwitch('optimize')}
                  >
                    Let AI Optimize For Me
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="md:w-48 flex-shrink-0">
            <button
              onClick={action.onAction}
              className={`w-full font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl ${
                key === 'direct'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white'
                  : key === 'score'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white'
              }`}
            >
              {key === 'optimize' && <Sparkles className="w-5 h-5" />}
              {key === 'score' && <Target className="w-5 h-5" />}
              {key === 'direct' && <ExternalLink className="w-5 h-5" />}
              <span>{action.ctaLabel}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {!isSmallScreen && tooltip && (
        <div
          className="fixed z-[70] pointer-events-none"
          style={{ top: tooltip.y, left: tooltip.x, transform: 'translateX(-50%)' }}
        >
          {renderTooltipContent(tooltip.key)}
        </div>
      )}

      <div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-700/50 animate-fadeIn">
          <div className="relative bg-gradient-to-r from-slate-800 to-slate-800/80 p-6 border-b border-slate-700/50">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors rounded-full hover:bg-slate-700/50"
              aria-label="Close application methods modal"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="pr-12">
              <h2 className="text-2xl font-bold text-slate-100 mb-2">
                Choose How You Want to Apply
              </h2>
              <p className="text-slate-300">
                Decide how you want to approach <strong className="text-slate-100">{job.role_title}</strong> at{' '}
                <strong className="text-slate-100">{job.company_name}</strong>. Benchmark or optimize first for the best reply rates.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {(Object.keys(actions) as OptionKey[]).map((key) => {
                const action = actions[key];
                const isActive = active === key;

                return (
                  <div key={key} className="relative">
                    <button
                      data-option={key}
                      type="button"
                      onMouseEnter={(event) => anchorTooltip(key, event.currentTarget)}
                      onMouseLeave={clearTooltip}
                      onFocus={(event) => anchorTooltip(key, event.currentTarget)}
                      onBlur={clearTooltip}
                      onClick={(event) => {
                        // Mobile: select and reveal details inline under this card
                        if (isSmallScreen) {
                          setActive(key);
                          return;
                        }
                        // Desktop: select and position tooltip
                        setActive(key);
                        anchorTooltip(key, event.currentTarget);
                      }}
                    className={`w-full rounded-xl border-2 px-4 py-4 text-left transition-all duration-300 flex items-center gap-3 backdrop-blur-sm bg-slate-800/50 ${
                      isActive
                        ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-2 ring-offset-2 ring-offset-slate-900 ring-emerald-500'
                        : 'border-slate-700 hover:border-emerald-500/50 hover:shadow-md'
                      }`}
                    >
                      {action.icon}
                      <div>
                        {action.badge && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-1 ${action.badgeClass}`}>
                            {action.badge}
                          </span>
                        )}
                        <h3 className="text-base font-semibold text-slate-100">{action.title}</h3>
                        <p className="text-xs text-slate-400">{action.subtitle}</p>
                      </div>
                    </button>
                    {isSmallScreen && isActive && (
                      <div className="mt-3">
                        {renderDetailHero(key)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop/tablet: show the detail hero below the options */}
            {!isSmallScreen && renderDetailHero(active)}

            <div className="mt-2 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
              <p className="text-sm text-blue-200">
                <strong className="text-blue-100">Tip:</strong> Candidates who benchmark their resume first and then optimize with AI see the highest shortlist rates. Use the insight flow before jumping straight to the company portal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
