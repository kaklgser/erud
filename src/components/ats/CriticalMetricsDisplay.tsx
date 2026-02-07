/**
 * CriticalMetricsDisplay Component
 * Displays the Big 5 critical metrics prominently
 */

import React from 'react';
import { CriticalMetrics, CriticalMetricScore } from '../../types/resume';

interface CriticalMetricsDisplayProps {
  criticalMetrics: CriticalMetrics;
}

const getStatusColor = (status: CriticalMetricScore['status']): string => {
  switch (status) {
    case 'excellent': return 'text-green-600 bg-green-100';
    case 'good': return 'text-blue-600 bg-blue-100';
    case 'fair': return 'text-yellow-600 bg-yellow-100';
    case 'poor': return 'text-red-600 bg-red-100';
  }
};

const getStatusIcon = (status: CriticalMetricScore['status']): string => {
  switch (status) {
    case 'excellent': return '✓';
    case 'good': return '○';
    case 'fair': return '△';
    case 'poor': return '✗';
  }
};

const MetricCard: React.FC<{ 
  name: string; 
  metric: CriticalMetricScore;
  icon: string;
}> = ({ name, metric, icon }) => {
  const statusClass = getStatusColor(metric.status);
  const statusIcon = getStatusIcon(metric.status);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-medium text-gray-800 text-sm">{name}</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
          {statusIcon} {metric.status}
        </span>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              metric.status === 'excellent' ? 'bg-green-500' :
              metric.status === 'good' ? 'bg-blue-500' :
              metric.status === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${metric.percentage}%` }}
          />
        </div>
        <span className="text-sm font-bold text-gray-700">
          {metric.score.toFixed(1)}/{metric.max_score}
        </span>
      </div>
      
      <p className="text-xs text-gray-500">{metric.details}</p>
    </div>
  );
};

export const CriticalMetricsDisplay: React.FC<CriticalMetricsDisplayProps> = ({ criticalMetrics }) => {
  const metrics = [
    { key: 'jd_keywords_match', name: 'JD Keywords Match', icon: '🔑' },
    { key: 'technical_skills_alignment', name: 'Technical Skills', icon: '💻' },
    { key: 'quantified_results_presence', name: 'Quantified Results', icon: '📊' },
    { key: 'job_title_relevance', name: 'Job Title Relevance', icon: '🎯' },
    { key: 'experience_relevance', name: 'Experience Relevance', icon: '📋' },
  ];

  const totalScore = criticalMetrics.total_critical_score;
  const maxTotal = 19;
  const totalPercentage = (totalScore / maxTotal) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Big 5 Critical Metrics
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Total:</span>
          <span className={`text-lg font-bold ${
            totalPercentage >= 80 ? 'text-green-600' :
            totalPercentage >= 60 ? 'text-blue-600' :
            totalPercentage >= 40 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {totalScore.toFixed(1)}/{maxTotal}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {metrics.map(({ key, name, icon }) => (
          <MetricCard
            key={key}
            name={name}
            metric={criticalMetrics[key as keyof Omit<CriticalMetrics, 'total_critical_score'>]}
            icon={icon}
          />
        ))}
      </div>
    </div>
  );
};

export default CriticalMetricsDisplay;
