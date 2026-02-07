// src/components/pipeline/PipelineProgressIndicator.tsx
// Visual progress indicator for the 8-step pipeline

import React from 'react';
import { 
  FileText, 
  Search, 
  Edit, 
  FolderOpen, 
  RefreshCw, 
  PenTool, 
  Zap, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { PipelineStep, ProgressIndicator, PIPELINE_CONFIG } from '../../types/pipeline';

interface PipelineProgressIndicatorProps {
  progress: ProgressIndicator;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

const STEP_ICONS = {
  [PipelineStep.PARSE_RESUME]: FileText,
  [PipelineStep.ANALYZE_AGAINST_JD]: Search,
  [PipelineStep.MISSING_SECTIONS_MODAL]: Edit,
  [PipelineStep.PROJECT_ANALYSIS]: FolderOpen,
  [PipelineStep.RE_ANALYSIS]: RefreshCw,
  [PipelineStep.BULLET_REWRITING]: PenTool,
  [PipelineStep.FINAL_OPTIMIZATION]: Zap,
  [PipelineStep.OUTPUT_RESUME]: CheckCircle
};

export const PipelineProgressIndicator: React.FC<PipelineProgressIndicatorProps> = ({
  progress,
  className = '',
  showDetails = true,
  compact = false
}) => {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const getStepStatus = (step: PipelineStep): 'completed' | 'current' | 'pending' => {
    if (step < progress.currentStep) return 'completed';
    if (step === progress.currentStep) return 'current';
    return 'pending';
  };

  const getStepColor = (status: 'completed' | 'current' | 'pending'): string => {
    switch (status) {
      case 'completed': return 'text-emerald-500 bg-emerald-500/20 border-emerald-500/30';
      case 'current': return 'text-cyan-500 bg-cyan-500/20 border-cyan-500/30';
      case 'pending': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex-1 bg-slate-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress.percentageComplete}%` }}
          />
        </div>
        <span className="text-sm font-medium text-slate-300 min-w-[3rem]">
          {progress.percentageComplete}%
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Resume Optimization Progress</h3>
          <p className="text-sm text-slate-400">
            Step {progress.currentStep} of {progress.totalSteps}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-cyan-400">
            {progress.percentageComplete}%
          </div>
          {progress.estimatedTimeRemaining && (
            <div className="text-xs text-slate-400 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formatTime(progress.estimatedTimeRemaining)} remaining
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Progress</span>
          <span>{progress.percentageComplete}% Complete</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
            style={{ width: `${progress.percentageComplete}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
        </div>
      </div>

      {/* Current Step Info */}
      <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/30">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            {React.createElement(STEP_ICONS[progress.currentStep], {
              className: "w-4 h-4 text-cyan-400"
            })}
          </div>
          <div>
            <h4 className="font-medium text-slate-100">{progress.stepName}</h4>
            <p className="text-sm text-slate-400">{progress.stepDescription}</p>
          </div>
        </div>
        
        {progress.userActionRequired && progress.actionDescription && (
          <div className="flex items-center space-x-2 mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-300">{progress.actionDescription}</p>
          </div>
        )}
      </div>

      {/* Step List */}
      {showDetails && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-300 mb-3">All Steps</h4>
          {Object.values(PipelineStep)
            .filter(step => typeof step === 'number')
            .map((step) => {
              const stepNumber = step as PipelineStep;
              const status = getStepStatus(stepNumber);
              const Icon = STEP_ICONS[stepNumber];
              const colorClass = getStepColor(status);
              
              return (
                <div 
                  key={stepNumber}
                  className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                    status === 'current' ? 'bg-cyan-500/10' : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${colorClass}`}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      status === 'current' ? 'text-cyan-300' : 
                      status === 'completed' ? 'text-emerald-300' : 'text-slate-400'
                    }`}>
                      {PIPELINE_CONFIG.STEP_NAMES[stepNumber]}
                    </p>
                  </div>
                  {status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  )}
                  {status === 'current' && (
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default PipelineProgressIndicator;