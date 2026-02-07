import React, { useState, useEffect } from 'react';
import { ResumeData, UserType } from '../types/resume';
import { resumeComplianceService, ComplianceReport, ComplianceIssue } from '../services/resumeComplianceService';
import { resumeComparisonService, BeforeAfterExample } from '../services/resumeComparisonService';
import { metricEnhancerService, MetricSuggestion } from '../services/metricEnhancerService';
import { skillsOptimizerService } from '../services/skillsOptimizerService';
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Award,
  FileText,
  Zap
} from 'lucide-react';

interface ResumeComplianceDashboardProps {
  resumeData: ResumeData;
  userType: UserType;
  jobDescription?: string;
  onApplyFix?: (fixedResume: ResumeData) => void;
}

export const ResumeComplianceDashboard: React.FC<ResumeComplianceDashboardProps> = ({
  resumeData,
  userType,
  jobDescription,
  onApplyFix
}) => {
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [beforeAfterExamples, setBeforeAfterExamples] = useState<BeforeAfterExample[]>([]);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'issues' | 'examples' | 'metrics'>('issues');

  useEffect(() => {
    analyzeCompliance();
  }, [resumeData, userType, jobDescription]);

  const analyzeCompliance = () => {
    const report = resumeComplianceService.analyzeCompliance(resumeData, userType, jobDescription);
    setComplianceReport(report);

    const comparison = resumeComparisonService.generateBeforeAfterExamples(
      resumeData,
      report.issues,
      userType,
      jobDescription
    );
    setBeforeAfterExamples(comparison.examples);
  };

  const toggleIssue = (issueId: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <Info className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-500/50 dark:text-red-300';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-500/50 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-500/50 dark:text-yellow-300';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-500/50 dark:text-blue-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  };

  if (!complianceReport) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Analyzing ATS compliance...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Header */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-dark-200 dark:to-dark-300 rounded-2xl p-6 border border-gray-200 dark:border-dark-400">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              ATS Compliance Score
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Based on Ultimate ATS Resume Rulebook
            </p>
          </div>
          <div className="text-center">
            <div className={`text-6xl font-bold ${getScoreColor(complianceReport.overallScore)}`}>
              {complianceReport.overallScore}
              <span className="text-2xl">%</span>
            </div>
            <div className="text-lg font-semibold text-gray-600 dark:text-gray-300 mt-2">
              Grade: {getScoreGrade(complianceReport.overallScore)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="w-full bg-gray-200 dark:bg-dark-400 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                complianceReport.overallScore >= 80
                  ? 'bg-green-500'
                  : complianceReport.overallScore >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${complianceReport.overallScore}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Needs Work (0-60%)</span>
            <span>Good (60-80%)</span>
            <span>Excellent (80-100%)</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {complianceReport.passedChecks}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Passed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {complianceReport.issues.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Issues</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {complianceReport.sectionsAnalyzed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sections</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-dark-400">
        <div className="flex space-x-8">
          {['issues', 'examples', 'metrics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab === 'issues' && 'Issues & Fixes'}
              {tab === 'examples' && 'Before → After'}
              {tab === 'metrics' && 'Metrics Analysis'}
            </button>
          ))}
        </div>
      </div>

      {/* Issues Tab */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          {complianceReport.issues.length === 0 ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/50 rounded-xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
                Perfect ATS Compliance!
              </h3>
              <p className="text-green-700 dark:text-green-400">
                Your resume follows all ATS rulebook guidelines. No issues found.
              </p>
            </div>
          ) : (
            complianceReport.issues.map(issue => (
              <div
                key={issue.id}
                className={`border rounded-xl overflow-hidden transition-all ${getSeverityColor(issue.severity)}`}
              >
                <button
                  onClick={() => toggleIssue(issue.id)}
                  className="w-full p-4 flex items-start justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start space-x-3 flex-1">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold">{issue.title}</h4>
                      <p className="text-sm mt-1 opacity-90">{issue.description}</p>
                      {issue.currentValue && (
                        <div className="mt-2 text-xs">
                          <span className="font-medium">Current:</span> {issue.currentValue}
                        </div>
                      )}
                    </div>
                  </div>
                  {expandedIssues.has(issue.id) ? (
                    <ChevronUp className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 flex-shrink-0" />
                  )}
                </button>

                {expandedIssues.has(issue.id) && issue.expectedValue && (
                  <div className="border-t border-current/20 p-4 bg-white/30 dark:bg-black/30">
                    <div className="space-y-2">
                      <div>
                        <span className="font-semibold text-sm">Expected:</span>
                        <p className="mt-1 text-sm">{issue.expectedValue}</p>
                      </div>
                      <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        Apply Fix
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Recommendations */}
          {complianceReport.recommendations.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/50 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Quick Recommendations
              </h3>
              <ul className="space-y-2">
                {complianceReport.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-blue-800 dark:text-blue-300 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Examples Tab */}
      {activeTab === 'examples' && (
        <div className="space-y-6">
          {beforeAfterExamples.map((example, idx) => (
            <div key={idx} className="bg-white dark:bg-dark-200 rounded-xl border border-gray-200 dark:border-dark-400 overflow-hidden">
              <div className="bg-gray-50 dark:bg-dark-300 px-6 py-4 border-b border-gray-200 dark:border-dark-400">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-500" />
                  {example.issueTitle}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{example.explanation}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 p-6">
                {/* Before */}
                <div className="space-y-2">
                  <div className="flex items-center text-red-600 dark:text-red-400 font-medium text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    BEFORE
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/50 rounded-lg p-4">
                    <pre className="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-mono">
                      {example.before}
                    </pre>
                  </div>
                </div>

                {/* After */}
                <div className="space-y-2">
                  <div className="flex items-center text-green-600 dark:text-green-400 font-medium text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    AFTER
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/50 rounded-lg p-4">
                    <pre className="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-mono">
                      {example.after}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <MetricsAnalysisPanel resumeData={resumeData} />
        </div>
      )}
    </div>
  );
};

// Separate component for metrics analysis
const MetricsAnalysisPanel: React.FC<{ resumeData: ResumeData }> = ({ resumeData }) => {
  const [metricsReport, setMetricsReport] = useState<any>(null);

  useEffect(() => {
    const report = metricEnhancerService.analyzeAndSuggestMetrics(resumeData);
    setMetricsReport(report);
  }, [resumeData]);

  if (!metricsReport) return null;

  return (
    <div className="space-y-6">
      {/* Metrics Summary */}
      <div className="bg-white dark:bg-dark-200 rounded-xl border border-gray-200 dark:border-dark-400 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
          Metrics Analysis
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {metricsReport.totalBullets}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Bullets</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {metricsReport.bulletsWithMetrics}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">With Metrics</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {metricsReport.bulletsNeedingMetrics}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Need Metrics</div>
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-dark-400 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${
              metricsReport.metricsPercentage >= 70 ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${metricsReport.metricsPercentage}%` }}
          />
        </div>
        <div className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
          {Math.round(metricsReport.metricsPercentage)}% of bullets have metrics (Target: 70%+)
        </div>
      </div>

      {/* Metric Suggestions */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Suggested Improvements</h4>
        {metricsReport.suggestions.slice(0, 5).map((suggestion: MetricSuggestion, idx: number) => (
          <div
            key={idx}
            className="bg-white dark:bg-dark-200 rounded-xl border border-gray-200 dark:border-dark-400 p-4"
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {suggestion.itemTitle}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Original:</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">{suggestion.originalBullet}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Enhanced:</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">{suggestion.enhancedBullet}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  💡 {suggestion.placeholder}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
