/**
 * Resume Optimizer 16-Parameter Panel
 * 
 * Shows users exactly what they need to improve across all 16 ATS parameters
 * to get better scores and more interviews.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  BarChart3,
  Zap,
  Star,
  ChevronDown,
  ChevronUp,
  Play,
  Award
} from 'lucide-react';

import ResumeOptimizer16ParameterService, {
  OptimizationPlan,
  ParameterOptimizationSuggestion
} from '../services/resumeOptimizer16ParameterService';

interface ResumeOptimizer16ParameterPanelProps {
  resumeText: string;
  jobDescription?: string;
  filename?: string;
  file?: File;
  onOptimizationStart?: () => void;
  className?: string;
}

export const ResumeOptimizer16ParameterPanel: React.FC<ResumeOptimizer16ParameterPanelProps> = ({
  resumeText,
  jobDescription,
  filename,
  file,
  onOptimizationStart,
  className = ''
}) => {
  const [optimizationPlan, setOptimizationPlan] = useState<OptimizationPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedParameter, setExpandedParameter] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  // Load optimization plan
  useEffect(() => {
    if (resumeText.trim()) {
      loadOptimizationPlan();
    }
  }, [resumeText, jobDescription]);

  const loadOptimizationPlan = async () => {
    setIsLoading(true);
    try {
      const plan = await ResumeOptimizer16ParameterService.generateOptimizationPlan(
        resumeText,
        jobDescription,
        filename,
        file
      );
      setOptimizationPlan(plan);
    } catch (error) {
      console.error('Failed to generate optimization plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-400 bg-red-500/10 border-red-400/30';
      case 'High': return 'text-orange-400 bg-orange-500/10 border-orange-400/30';
      case 'Medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-400/30';
      case 'Low': return 'text-green-400 bg-green-500/10 border-green-400/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-400/30';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Critical': return <AlertTriangle className="w-4 h-4" />;
      case 'High': return <TrendingUp className="w-4 h-4" />;
      case 'Medium': return <Target className="w-4 h-4" />;
      case 'Low': return <CheckCircle className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400';
      case 'Moderate': return 'text-yellow-400';
      case 'Advanced': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const toggleParameterExpansion = (parameter: string) => {
    setExpandedParameter(expandedParameter === parameter ? null : parameter);
  };

  const markActionCompleted = (action: string) => {
    const newCompleted = new Set(completedActions);
    if (newCompleted.has(action)) {
      newCompleted.delete(action);
    } else {
      newCompleted.add(action);
    }
    setCompletedActions(newCompleted);
  };

  if (isLoading) {
    return (
      <div className={`bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-indigo-400/30 p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-300">Analyzing 16 ATS parameters...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!optimizationPlan) {
    return (
      <div className={`bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 ${className}`}>
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Ready to Optimize</h3>
          <p className="text-slate-400">Upload your resume to get personalized optimization recommendations</p>
        </div>
      </div>
    );
  }

  const completedCount = completedActions.size;
  const totalActions = optimizationPlan.priorityActions.length;
  const progressPercentage = totalActions > 0 ? (completedCount / totalActions) * 100 : 0;

  return (
    <div className={`bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-indigo-400/30 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 border-b border-indigo-400/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/40">
              <Target className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">16-Parameter Optimization Plan</h2>
              <p className="text-slate-400 text-sm">Targeted improvements for maximum ATS score</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-400">
              {optimizationPlan.currentOverallScore}/100
            </div>
            <div className="text-xs text-slate-400">Current Score</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Score Improvement Potential */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {optimizationPlan.targetOverallScore}
              </div>
              <div className="text-sm text-slate-400">Target Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">
                +{optimizationPlan.potentialImprovement}
              </div>
              <div className="text-sm text-slate-400">Potential Gain</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getDifficultyColor(optimizationPlan.difficultyLevel)}`}>
                {optimizationPlan.difficultyLevel}
              </div>
              <div className="text-sm text-slate-400">Difficulty</div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">Estimated time: {optimizationPlan.estimatedTimeToComplete}</span>
            </div>
            {onOptimizationStart && (
              <button
                onClick={onOptimizationStart}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-400 hover:to-purple-400 transition-all duration-300 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Optimization
              </button>
            )}
          </div>
        </motion.div>

        {/* Priority Actions Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Priority Actions
            </h3>
            <div className="text-sm text-slate-400">
              {completedCount}/{totalActions} completed
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-700/50 rounded-full h-2 mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="h-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
            />
          </div>

          <div className="space-y-3">
            {optimizationPlan.priorityActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 cursor-pointer ${
                  completedActions.has(action)
                    ? 'bg-emerald-500/10 border-emerald-400/30'
                    : 'bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50'
                }`}
                onClick={() => markActionCompleted(action)}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all duration-300 ${
                  completedActions.has(action)
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-slate-400 hover:border-slate-300'
                }`}>
                  {completedActions.has(action) && (
                    <CheckCircle className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className={`text-sm flex-1 transition-all duration-300 ${
                  completedActions.has(action)
                    ? 'text-emerald-300 line-through'
                    : 'text-slate-300'
                }`}>
                  {action}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Parameter Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50"
        >
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Parameter Breakdown
          </h3>

          <div className="space-y-3">
            {optimizationPlan.parameterSuggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.parameter}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.03 }}
                className="border border-slate-700/50 rounded-lg overflow-hidden"
              >
                {/* Parameter Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                  onClick={() => toggleParameterExpansion(suggestion.parameter)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(suggestion.priority)}`}>
                        <div className="flex items-center gap-1">
                          {getPriorityIcon(suggestion.priority)}
                          {suggestion.priority}
                        </div>
                      </div>
                      <span className="font-medium text-slate-200">{suggestion.parameter}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-200">
                          {suggestion.currentScore}/{suggestion.maxScore}
                        </div>
                        <div className="text-xs text-slate-400">
                          {suggestion.percentage}%
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-20 bg-slate-700/50 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            suggestion.percentage >= 80 ? 'bg-emerald-500' :
                            suggestion.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(suggestion.percentage, 100)}%` }}
                        />
                      </div>
                      
                      {expandedParameter === suggestion.parameter ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedParameter === suggestion.parameter && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-slate-700/50"
                    >
                      <div className="p-4 space-y-4">
                        {/* Quick Fixes */}
                        {suggestion.quickFixes.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              Quick Fixes
                            </h4>
                            <div className="space-y-2">
                              {suggestion.quickFixes.map((fix, fixIndex) => (
                                <div key={fixIndex} className="flex items-start gap-2 text-sm text-slate-300">
                                  <ArrowRight className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                  {fix}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Detailed Suggestions */}
                        <div>
                          <h4 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Improvement Suggestions
                          </h4>
                          <div className="space-y-2">
                            {suggestion.suggestions.map((sug, sugIndex) => (
                              <div key={sugIndex} className="flex items-start gap-2 text-sm text-slate-300">
                                <Star className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                {sug}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Examples */}
                        {suggestion.examples.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                              <Award className="w-4 h-4" />
                              Examples
                            </h4>
                            <div className="space-y-2">
                              {suggestion.examples.map((example, exampleIndex) => (
                                <div key={exampleIndex} className="text-sm text-slate-300 bg-slate-700/30 p-3 rounded-lg">
                                  {example}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResumeOptimizer16ParameterPanel;