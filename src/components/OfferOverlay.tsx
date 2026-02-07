// src/components/OfferOverlay.tsx
import React, { useEffect, useState } from "react";
import { X, Sparkles, CheckCircle, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

interface OfferOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onAction?: () => void;
  targetPath?: string;
  ctaLabel?: string;
  imageSrc?: string;
  fit?: "cover" | "contain";
}

export const OfferOverlay: React.FC<OfferOverlayProps> = ({
  isOpen,
  onClose,
  onAction,
  targetPath = "/optimizer",
  imageSrc = "https://img.sanishtech.com/u/d3c3a0693f8dfeff84478ac6f4b44977.png",
  ctaLabel = "Optimize Resume Now",
  fit = "cover"
}) => {
  const navigate = useNavigate();
  const { isChristmasMode } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 550);
    return () => clearTimeout(timer);
  }, []);

  const handleActionClick = () => {
    if (onAction) {
      onAction();
    } else {
      navigate(targetPath);
    }
    onClose();
  };

  const features = [
    "Instant JD-based tailoring",
    "Keyword density fixes",
    "Project impact rewrites",
    "Recruiter-ready formatting"
  ];

  const tags = [
    "Instant ATS score",
    "Keyword gap fixes",
    "Project rewriting",
    "Tailored to any JD"
  ];

  return (
    <AnimatePresence>
      {isOpen && ready && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-[95vw] sm:max-w-2xl lg:max-w-3xl my-auto"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Glow Effect - Hidden on mobile for performance */}
            <div className={`pointer-events-none absolute -inset-2 sm:-inset-3 rounded-2xl sm:rounded-3xl blur-2xl sm:blur-3xl opacity-40 sm:opacity-60 hidden sm:block ${
              isChristmasMode
                ? 'bg-gradient-to-r from-red-500/40 via-green-500/40 to-emerald-500/40'
                : 'bg-gradient-to-r from-emerald-500/40 via-cyan-500/40 to-teal-500/40'
            }`} />

            {/* Main Card */}
            <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl border shadow-2xl ${
              isChristmasMode
                ? 'border-green-500/30 bg-slate-900'
                : 'border-emerald-500/30 bg-slate-900'
            }`}>
              {/* Background Image with Overlay - Hidden on mobile for performance */}
              <div className="absolute inset-0 hidden sm:block">
                <img
                  src={imageSrc}
                  alt="PrimoBoostAI offer"
                  className={`h-full w-full object-${fit} opacity-15`}
                  loading="lazy"
                />
                <div className={`absolute inset-0 ${
                  isChristmasMode
                    ? 'bg-gradient-to-br from-slate-900/98 via-slate-900/95 to-green-900/90'
                    : 'bg-gradient-to-br from-slate-900/98 via-slate-900/95 to-emerald-900/90'
                }`} />
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                aria-label="Close offer"
                className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all duration-200 ${
                  isChristmasMode
                    ? 'bg-slate-800/90 active:bg-red-500/20 text-slate-300 active:text-red-400 border border-slate-700/50'
                    : 'bg-slate-800/90 active:bg-emerald-500/20 text-slate-300 active:text-emerald-400 border border-slate-700/50'
                }`}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Content */}
              <div className="relative flex flex-col gap-4 p-4 sm:p-6 md:p-8 max-h-[80vh] overflow-y-auto">
                {/* Main Content - Single Column on Mobile */}
                <div className="space-y-4">
                  {/* Badge */}
                  <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold backdrop-blur-md ${
                    isChristmasMode
                      ? 'bg-green-500/15 border border-green-500/30 text-green-300'
                      : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>PrimoBoost AI Optimizer</span>
                  </div>

                  {/* Headline */}
                  <div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
                      Your Resume Isn't Getting Shortlisted?
                    </h3>
                    <p className={`text-lg sm:text-xl md:text-2xl font-semibold mt-1 ${
                      isChristmasMode ? 'text-green-400' : 'text-emerald-400'
                    }`}>
                      Fix it in 60 Seconds.
                    </p>
                  </div>

                  {/* Description - Hidden on very small screens */}
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    ATS score, missing keywords, weak projects - PrimoBoost AI finds and fixes everything before recruiters ever see your resume.
                  </p>

                  {/* Tags - Scrollable on mobile */}
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {tags.map((item) => (
                      <span
                        key={item}
                        className="rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm bg-slate-800/60 border border-slate-700/50 text-slate-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* Features Card - Inline on mobile */}
                  <div className={`rounded-xl p-4 backdrop-blur-md ${
                    isChristmasMode
                      ? 'bg-slate-800/50 border border-green-500/20'
                      : 'bg-slate-800/50 border border-emerald-500/20'
                  }`}>
                    {/* ATS Score Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-300 font-medium">ATS Score Boost</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isChristmasMode
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        +25 pts avg
                      </span>
                    </div>

                    <hr className={`mb-3 ${
                      isChristmasMode ? 'border-green-500/20' : 'border-emerald-500/20'
                    }`} />

                    {/* Features List - Compact on mobile */}
                    <div>
                      <p className="font-semibold text-white text-sm mb-2">What you get</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {features.map((line) => (
                          <li key={line} className="flex items-center gap-2">
                            <CheckCircle className={`w-4 h-4 flex-shrink-0 ${
                              isChristmasMode ? 'text-green-400' : 'text-emerald-400'
                            }`} />
                            <span className="text-xs sm:text-sm text-slate-300">{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* CTA Buttons - Full width on mobile */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 pt-1">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleActionClick}
                      className={`group flex items-center justify-center gap-2 h-11 sm:h-12 px-5 sm:px-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 w-full sm:w-auto ${
                        isChristmasMode
                          ? 'bg-gradient-to-r from-red-500 via-emerald-500 to-green-600 active:shadow-green-500/40'
                          : 'bg-gradient-to-r from-emerald-500 to-cyan-500 active:shadow-emerald-500/40'
                      }`}
                    >
                      <span className="text-sm sm:text-base">{ctaLabel}</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>

                    <button
                      onClick={onClose}
                      className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors h-10 px-4"
                    >
                      Not now
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Gradient Line */}
              <div className={`absolute inset-x-0 bottom-0 h-1 ${
                isChristmasMode
                  ? 'bg-gradient-to-r from-red-500 via-green-500 to-emerald-500'
                  : 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-teal-500'
              }`} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
