/**
 * MissingKeywordsBadge Component
 * Displays color-coded missing keywords sorted by impact
 */

import React from 'react';
import { MissingKeyword } from '../../types/resume';

interface MissingKeywordsBadgeProps {
  keywords: MissingKeyword[];
  maxDisplay?: number;
}

const getKeywordStyle = (color: MissingKeyword['color']): string => {
  switch (color) {
    case 'red': return 'bg-red-100 text-red-800 border-red-300';
    case 'orange': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  }
};

const getTierLabel = (tier: MissingKeyword['tier']): string => {
  switch (tier) {
    case 'critical': return 'Critical';
    case 'important': return 'Important';
    case 'nice_to_have': return 'Nice to Have';
  }
};

const KeywordBadge: React.FC<{ keyword: MissingKeyword }> = ({ keyword }) => {
  const style = getKeywordStyle(keyword.color);

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${style}`}
      title={`Add to: ${keyword.suggestedPlacement} | Impact: ${keyword.impact.toFixed(1)}`}
    >
      <span>{keyword.keyword}</span>
    </div>
  );
};

export const MissingKeywordsBadge: React.FC<MissingKeywordsBadgeProps> = ({
  keywords,
  maxDisplay = 15,
}) => {
  // Sort by impact (highest first)
  const sortedKeywords = [...keywords].sort((a, b) => b.impact - a.impact);
  const displayKeywords = sortedKeywords.slice(0, maxDisplay);
  const remaining = sortedKeywords.length - maxDisplay;

  // Group by tier
  const critical = displayKeywords.filter(k => k.tier === 'critical');
  const important = displayKeywords.filter(k => k.tier === 'important');
  const niceToHave = displayKeywords.filter(k => k.tier === 'nice_to_have');

  if (keywords.length === 0) {
    return (
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-center gap-2">
          <span className="text-xl">✅</span>
          <span className="text-green-800 font-medium">All key keywords found!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Missing Keywords ({keywords.length})
        </h3>
        <div className="flex gap-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-400"></span>
            Critical
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-orange-400"></span>
            Important
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            Nice to Have
          </span>
        </div>
      </div>

      {critical.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-red-700">
            🔴 Critical ({critical.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {critical.map((kw, i) => (
              <KeywordBadge key={`critical-${i}`} keyword={kw} />
            ))}
          </div>
        </div>
      )}

      {important.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-orange-700">
            🟠 Important ({important.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {important.map((kw, i) => (
              <KeywordBadge key={`important-${i}`} keyword={kw} />
            ))}
          </div>
        </div>
      )}

      {niceToHave.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-yellow-700">
            🟡 Nice to Have ({niceToHave.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {niceToHave.map((kw, i) => (
              <KeywordBadge key={`nice-${i}`} keyword={kw} />
            ))}
          </div>
        </div>
      )}

      {remaining > 0 && (
        <p className="text-xs text-gray-500">
          +{remaining} more keywords not shown
        </p>
      )}

      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Add these keywords naturally throughout your resume, 
          especially in your summary, skills section, and experience bullets.
        </p>
      </div>
    </div>
  );
};

export default MissingKeywordsBadge;
