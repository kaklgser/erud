/**
 * LowScoreOptimizerCTA Component
 * Shows prominent recommendation when score < 40 to use JD-based optimizer
 */

import React from 'react';

interface LowScoreOptimizerCTAProps {
  score: number;
  onNavigateToOptimizer?: () => void;
}

export const LowScoreOptimizerCTA: React.FC<LowScoreOptimizerCTAProps> = ({
  score,
  onNavigateToOptimizer,
}) => {
  // Only show for scores below 40
  if (score >= 40) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-start gap-4">
        <div className="text-4xl">🚀</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">
            Boost Your Score with AI Optimization
          </h3>
          <p className="text-purple-100 mb-4">
            Your current score of <strong>{score}</strong> is below the competitive threshold. 
            Our JD-based optimizer can help you improve your resume to better match the job requirements.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-sm font-medium">Keyword Optimization</div>
              <div className="text-xs text-purple-200">Add missing JD keywords</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl mb-1">✍️</div>
              <div className="text-sm font-medium">Bullet Rewriting</div>
              <div className="text-xs text-purple-200">Power verbs & metrics</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl mb-1">📈</div>
              <div className="text-sm font-medium">Score Improvement</div>
              <div className="text-xs text-purple-200">Typical +20-40 points</div>
            </div>
          </div>

          <button
            onClick={onNavigateToOptimizer}
            className="bg-white text-purple-600 font-bold py-3 px-6 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
          >
            <span>Optimize My Resume</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LowScoreOptimizerCTA;
