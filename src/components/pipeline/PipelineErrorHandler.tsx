// src/components/pipeline/PipelineErrorHandler.tsx
// Error handling and recovery UI for pipeline failures

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft, 
  Info, 
  X,
  CheckCircle,
  Clock
} from 'lucide-react';
import { PipelineStep, ErrorRecoveryStrategy, PIPELINE_CONFIG } from '../../types/pipeline';

interface PipelineErrorHandlerProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
  step: PipelineStep;
  retryCount: number;
  maxRetries: number;
  recoveryStrategy?: ErrorRecoveryStrategy;
  onRetry: () => void;
  onRollback: () => void;
  onApplyFallback: (fallbackOption: string) => void;
  className?: string;
}

export const PipelineErrorHandler: React.FC<PipelineErrorHandlerProps> = ({
  isOpen,
  onClose,
  error,
  step,
  retryCount,
  maxRetries,
  recoveryStrategy,
  onRetry,
  onRollback,
  onApplyFallback,
  className = ''
}) => {
  const [selectedFallback, setSelectedFallback] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);

  if (!isOpen) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleFallback = () => {
    if (selectedFallback) {
      onApplyFallback(selectedFallback);
    }
  };

  const canRetry = retryCount < maxRetries;
  const stepName = PIPELINE_CONFIG.STEP_NAMES[step];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-700 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Pipeline Error</h2>
              <p className="text-sm text-slate-400">Error in step: {stepName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Details */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <h3 className="font-medium text-red-300 mb-2">Error Details</h3>
            <p className="text-sm text-red-200">{error}</p>
          </div>

          {/* Retry Information */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-slate-200">Retry Status</h3>
              <span className="text-sm text-slate-400">
                Attempt {retryCount + 1} of {maxRetries + 1}
              </span>
            </div>
            
            <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  retryCount >= maxRetries ? 'bg-red-500' : 'bg-amber-500'
                }`}
                style={{ width: `${((retryCount + 1) / (maxRetries + 1)) * 100}%` }}
              />
            </div>

            {canRetry ? (
              <div className="flex items-center space-x-2 text-sm text-amber-300">
                <Clock className="w-4 h-4" />
                <span>Automatic retry available</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-sm text-red-300">
                <AlertTriangle className="w-4 h-4" />
                <span>Maximum retries exceeded</span>
              </div>
            )}
          </div>

          {/* Recovery Options */}
          {recoveryStrategy && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="font-medium text-slate-200 mb-3">Recovery Options</h3>
              
              {/* User Notification */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-200">{recoveryStrategy.userNotification}</p>
                </div>
              </div>

              {/* Fallback Options */}
              {recoveryStrategy.fallbackOptions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-300">Available Fallback Options:</h4>
                  <div className="space-y-2">
                    {recoveryStrategy.fallbackOptions.map((option, index) => (
                      <label 
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="fallback"
                          value={option}
                          checked={selectedFallback === option}
                          onChange={(e) => setSelectedFallback(e.target.value)}
                          className="text-cyan-500 focus:ring-cyan-500"
                        />
                        <span className="text-sm text-slate-200 capitalize">
                          {option.replace(/_/g, ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress Preservation Notice */}
          {recoveryStrategy?.progressPreservation && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <p className="text-sm text-emerald-200">
                  Your progress has been saved and will be preserved during recovery.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700 bg-slate-800/30">
          <button
            onClick={onRollback}
            className="flex items-center space-x-2 px-4 py-2 text-slate-300 hover:text-slate-100 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <div className="flex items-center space-x-3">
            {/* Fallback Button */}
            {recoveryStrategy && recoveryStrategy.fallbackOptions.length > 0 && (
              <button
                onClick={handleFallback}
                disabled={!selectedFallback}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 disabled:text-slate-400 text-white rounded-lg transition-colors"
              >
                Apply Fallback
              </button>
            )}

            {/* Retry Button */}
            <button
              onClick={handleRetry}
              disabled={!canRetry || isRetrying}
              className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:text-slate-400 text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>
                {isRetrying ? 'Retrying...' : canRetry ? 'Retry' : 'Max Retries Reached'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineErrorHandler;