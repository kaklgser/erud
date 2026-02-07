/**
 * TierScoresDisplay Component
 * Displays all 10 tier scores with progress bars and top issues
 */

import React from 'react';
import { TierScores, TierScore } from '../../types/resume';

interface TierScoresDisplayProps {
  tierScores: TierScores;
  compact?: boolean;
}

const getTierColor = (percentage: number): string => {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-yellow-500';
  if (percentage >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

const getTierBgColor = (percentage: number): string => {
  if (percentage >= 80) return 'bg-green-100';
  if (percentage >= 60) return 'bg-yellow-100';
  if (percentage >= 40) return 'bg-orange-100';
  return 'bg-red-100';
};

const TierScoreCard: React.FC<{ tier: TierScore; compact?: boolean }> = ({ tier, compact }) => {
  const barColor = getTierColor(tier.percentage);
  const bgColor = getTierBgColor(tier.percentage);

  return (
    <div className={`${bgColor} rounded-lg p-3 ${compact ? 'p-2' : 'p-3'}`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`font-medium text-gray-800 ${compact ? 'text-xs' : 'text-sm'}`}>
          {tier.tier_name}
        </span>
        <span className={`font-bold ${compact ? 'text-xs' : 'text-sm'}`}>
          {tier.percentage}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${tier.percentage}%` }}
        />
      </div>
      
      {!compact && tier.top_issues.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-600 truncate" title={tier.top_issues[0]}>
            ⚠️ {tier.top_issues[0]}
          </p>
        </div>
      )}
      
      {!compact && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{tier.metrics_passed}/{tier.metrics_total} metrics</span>
          <span>Weight: {tier.weight}%</span>
        </div>
      )}
    </div>
  );
};

export const TierScoresDisplay: React.FC<TierScoresDisplayProps> = ({ tierScores, compact = false }) => {
  const tiers: TierScore[] = [
    tierScores.basic_structure,
    tierScores.content_structure,
    tierScores.experience,
    tierScores.education,
    tierScores.certifications,
    tierScores.skills_keywords,
    tierScores.projects,
    tierScores.red_flags,
    tierScores.competitive,
    tierScores.culture_fit,
    tierScores.qualitative,
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        Tier Analysis (220+ Metrics)
      </h3>
      
      <div className={`grid ${compact ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-3'}`}>
        {tiers.map((tier) => (
          <TierScoreCard key={tier.tier_number} tier={tier} compact={compact} />
        ))}
      </div>
    </div>
  );
};

export default TierScoresDisplay;
