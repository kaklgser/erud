import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Plus, Copy, ArrowRight } from 'lucide-react';
import { cleanSkillsSection, getSkillsRecommendations } from '../services/skillsCleanupService';

interface SkillsCleanupPanelProps {
  skillsText: string;
  jdText?: string;
  onApply?: (cleanedSkills: string) => void;
}

export const SkillsCleanupPanel: React.FC<SkillsCleanupPanelProps> = ({
  skillsText,
  jdText,
  onApply
}) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (skillsText) {
      const result = cleanSkillsSection(skillsText);
      setAnalysis(result);
      setRecommendations(getSkillsRecommendations(result, jdText));
    }
  }, [skillsText, jdText]);

  if (!analysis) {
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis.cleaned);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (onApply) {
      onApply(analysis.cleaned);
    }
  };

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-400/30 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-100">Skills Section Quality</h3>
          <div className="text-4xl font-bold text-emerald-400">{analysis.score}%</div>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${analysis.score}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
          />
        </div>
      </motion.div>

      {/* Issues Found */}
      {analysis.removed.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-red-500/10 border border-red-400/30 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-semibold text-slate-100 mb-3">Irrelevant Words Removed ({analysis.removed.length})</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.removed.slice(0, 10).map((word: string, i: number) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-3 py-1 bg-red-500/20 border border-red-400/30 rounded-full text-sm text-red-300 line-through"
                  >
                    {word}
                  </motion.span>
                ))}
                {analysis.removed.length > 10 && (
                  <span className="px-3 py-1 bg-red-500/20 border border-red-400/30 rounded-full text-sm text-red-300">
                    +{analysis.removed.length - 10} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Skills Added */}
      {analysis.added.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <Plus className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-semibold text-slate-100 mb-3">IBM-Critical Skills Added ({analysis.added.length})</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.added.map((skill: string, i: number) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-sm text-emerald-300"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-6"
        >
          <h4 className="font-semibold text-slate-100 mb-4">Recommendations</h4>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-3 text-sm text-slate-300"
              >
                <span className="text-amber-400 font-bold mt-0.5">{rec.startsWith('✓') ? '✓' : '⚠'}</span>
                <span>{rec.replace(/^[✓⚠]\s*/, '')}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Skills Categories - ATS-Friendly Structure */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6"
      >
        <h4 className="font-semibold text-slate-100 mb-4">ATS-Friendly Skills Structure</h4>
        <div className="space-y-3">
          {analysis.categories.programmingLanguages.length > 0 && (
            <div>
              <span className="text-emerald-400 font-semibold">Programming Languages:</span>
              <span className="text-slate-300 ml-2">{analysis.categories.programmingLanguages.join(', ')}</span>
            </div>
          )}
          {analysis.categories.frontendTechnologies?.length > 0 && (
            <div>
              <span className="text-emerald-400 font-semibold">Frontend Technologies:</span>
              <span className="text-slate-300 ml-2">{analysis.categories.frontendTechnologies.join(', ')}</span>
            </div>
          )}
          {analysis.categories.backendTechnologies?.length > 0 && (
            <div>
              <span className="text-emerald-400 font-semibold">Backend Technologies:</span>
              <span className="text-slate-300 ml-2">{analysis.categories.backendTechnologies.join(', ')}</span>
            </div>
          )}
          {analysis.categories.databases.length > 0 && (
            <div>
              <span className="text-emerald-400 font-semibold">Databases:</span>
              <span className="text-slate-300 ml-2">{analysis.categories.databases.join(', ')}</span>
            </div>
          )}
          {analysis.categories.cloudAndDevOps?.length > 0 && (
            <div>
              <span className="text-emerald-400 font-semibold">Cloud & DevOps:</span>
              <span className="text-slate-300 ml-2">{analysis.categories.cloudAndDevOps.join(', ')}</span>
            </div>
          )}
          {analysis.categories.testingAndQA?.length > 0 && (
            <div>
              <span className="text-emerald-400 font-semibold">Testing & QA:</span>
              <span className="text-slate-300 ml-2">{analysis.categories.testingAndQA.join(', ')}</span>
            </div>
          )}
          {analysis.categories.toolsAndPlatforms?.length > 0 && (
            <div>
              <span className="text-emerald-400 font-semibold">Tools & Platforms:</span>
              <span className="text-slate-300 ml-2">{analysis.categories.toolsAndPlatforms.join(', ')}</span>
            </div>
          )}
          {analysis.categories.softSkills?.length > 0 && (
            <div>
              <span className="text-emerald-400 font-semibold">Soft Skills:</span>
              <span className="text-slate-300 ml-2">{analysis.categories.softSkills.join(', ')}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCopy}
          className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 transition-all flex items-center justify-center gap-2"
        >
          <Copy className="w-5 h-5" />
          {copied ? 'Copied!' : 'Copy Cleaned Skills'}
        </motion.button>
        {onApply && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApply}
            className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            Apply to Resume
          </motion.button>
        )}
      </div>
    </div>
  );
};
