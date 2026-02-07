/**
 * RedFlagsDisplay Component
 * Displays detected red flags with severity and auto-reject warning
 */

import React from 'react';
import { RedFlag } from '../../types/resume';

interface RedFlagsDisplayProps {
  redFlags: RedFlag[];
  totalPenalty: number;
  autoRejectRisk: boolean;
}

const getSeverityColor = (severity: RedFlag['severity']): string => {
  switch (severity) {
    case 'critical': return 'bg-red-100 border-red-500 text-red-800';
    case 'high': return 'bg-orange-100 border-orange-500 text-orange-800';
    case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
    case 'low': return 'bg-gray-100 border-gray-400 text-gray-700';
  }
};

const getSeverityIcon = (severity: RedFlag['severity']): string => {
  switch (severity) {
    case 'critical': return '🚨';
    case 'high': return '⚠️';
    case 'medium': return '⚡';
    case 'low': return 'ℹ️';
  }
};

const RedFlagCard: React.FC<{ flag: RedFlag }> = ({ flag }) => {
  const colorClass = getSeverityColor(flag.severity);
  const icon = getSeverityIcon(flag.severity);

  return (
    <div className={`rounded-lg border-l-4 p-3 ${colorClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-medium text-sm">{flag.name}</span>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded bg-white/50">
          {flag.penalty} pts
        </span>
      </div>
      <p className="text-xs mt-1 opacity-80">{flag.description}</p>
      <p className="text-xs mt-2 font-medium">
        💡 {flag.recommendation}
      </p>
    </div>
  );
};

export const RedFlagsDisplay: React.FC<RedFlagsDisplayProps> = ({
  redFlags,
  totalPenalty,
  autoRejectRisk,
}) => {
  const criticalFlags = redFlags.filter(f => f.severity === 'critical');
  const highFlags = redFlags.filter(f => f.severity === 'high');
  const otherFlags = redFlags.filter(f => f.severity !== 'critical' && f.severity !== 'high');

  if (redFlags.length === 0) {
    return (
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          <div>
            <h3 className="font-semibold text-green-800">No Red Flags Detected</h3>
            <p className="text-sm text-green-600">Your resume looks clean!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Red Flags ({redFlags.length})
        </h3>
        <span className="text-sm font-bold text-red-600">
          Penalty: {totalPenalty} pts
        </span>
      </div>

      {autoRejectRisk && (
        <div className="bg-red-600 text-white rounded-lg p-4 flex items-center gap-3">
          <span className="text-3xl">🚨</span>
          <div>
            <h4 className="font-bold">Auto-Reject Risk!</h4>
            <p className="text-sm opacity-90">
              Multiple critical red flags detected. Your resume may be automatically rejected by ATS systems.
            </p>
          </div>
        </div>
      )}

      {criticalFlags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-red-700">Critical Issues</h4>
          {criticalFlags.map((flag, i) => (
            <RedFlagCard key={`critical-${i}`} flag={flag} />
          ))}
        </div>
      )}

      {highFlags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-orange-700">High Priority</h4>
          {highFlags.map((flag, i) => (
            <RedFlagCard key={`high-${i}`} flag={flag} />
          ))}
        </div>
      )}

      {otherFlags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-600">Other Issues</h4>
          {otherFlags.map((flag, i) => (
            <RedFlagCard key={`other-${i}`} flag={flag} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RedFlagsDisplay;
