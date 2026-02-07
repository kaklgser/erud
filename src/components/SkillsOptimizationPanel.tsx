/**
 * Skills Optimization Panel - Interactive component for cleaning and optimizing skills sections
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Zap, Target, Award } from 'lucide-react';
import SkillsOptimizationService, { SkillsOptimizationResult, OptimizedSkillCategories } from '../services/skillsOptimizationService';

interface SkillsOptimizationPanelProps {
  skillsText: string;
  jobDescription?: string;
  onOptimizedSkillsChange: (optimizedText: string) => void;
}

export const SkillsOptimizationPanel: React.FC<SkillsOptimizationPanelProps> = ({
  skillsText,
  jobDescription,
  onOptimizedSkillsChange
}) => {
  const [optimizationResult, setOptimizationResult] = useState<SkillsOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (skillsText.trim()) {
      optimizeSkills();
    }
  }, [skillsText, jobDescription]);

  const optimizeSkills = async () => {
    setIsOptimizing(true);
    try {
      const result = SkillsOptimizationService.optimizeSkills(skillsText, jobDescription);
      setOptimizationResult(result);
      
      // Auto-apply optimization
      const optimizedText = SkillsOptimizationService.generateOptimizedSkillsText(result.optimizedSkills);
      onOptimizedSkillsChange(optimizedText);
    } catch (error) {
      console.error('Skills optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (isOptimizing) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Optimizing skills section...</span>
        </div>
      </div>
    );
  }

  if (!optimizationResult) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>Add skills to your resume to see optimization suggestions</p>
        </div>
      </div>
    );
  }

  const { optimizedSkills, removedItems, recommendations, atsCompatibilityScore } = optimizationResult;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Skills Optimization</h3>
              <p className="text-sm text-gray-600">ATS-friendly skills structure</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full ${getScoreBgColor(atsCompatibilityScore)}`}>
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span className={`font-semibold ${getScoreColor(atsCompatibilityScore)}`}>
                {atsCompatibilityScore}/100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Issues Alert */}
      {(removedItems.companyNames.length > 0 || removedItems.domainsFromLanguages.length > 0) && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-red-800">Critical Issues Fixed</h4>
              <div className="mt-2 text-sm text-red-700">
                {removedItems.companyNames.length > 0 && (
                  <p>• Removed {removedItems.companyNames.length} company names that cause ATS keyword stuffing</p>
                )}
                {removedItems.domainsFromLanguages.length > 0 && (
                  <p>• Fixed {removedItems.domainsFromLanguages.length} domain keywords incorrectly listed as programming languages</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="p-6">
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div key={index} className="flex items-start space-x-3">
              {rec.includes('❌') ? (
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              ) : rec.includes('✅') ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              )}
              <p className="text-sm text-gray-700">{rec}</p>
            </div>
          ))}
        </div>

        {/* Toggle Details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showDetails ? 'Hide' : 'Show'} Optimization Details
        </button>

        {/* Detailed Breakdown */}
        {showDetails && (
          <div className="mt-4 space-y-4">
            {/* Optimized Categories - ATS-Friendly */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">ATS-Friendly Skills Structure</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(optimizedSkills).map(([category, skills]) => {
                  if (skills.length === 0) return null;

                  // Map category keys to ATS-friendly display names
                  const categoryDisplayNames: Record<string, string> = {
                    'programmingLanguages': 'Programming Languages',
                    'frontendTechnologies': 'Frontend Technologies',
                    'backendTechnologies': 'Backend Technologies',
                    'databases': 'Databases',
                    'cloudAndDevOps': 'Cloud & DevOps',
                    'toolsAndPlatforms': 'Tools & Platforms',
                    'testingAndQA': 'Testing & QA',
                    'softSkills': 'Soft Skills'
                  };

                  const categoryName = categoryDisplayNames[category] || category
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .trim();

                  return (
                    <div key={category} className="bg-gray-50 rounded-lg p-3">
                      <h5 className="text-xs font-medium text-gray-700 mb-2">{categoryName}</h5>
                      <div className="flex flex-wrap gap-1">
                        {skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Removed Items */}
            {(removedItems.companyNames.length > 0 ||
              removedItems.softSkillsFromTech.length > 0 ||
              removedItems.domainsFromLanguages.length > 0) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Items Cleaned Up</h4>
                <div className="space-y-2">
                  {removedItems.companyNames.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-3">
                      <h5 className="text-xs font-medium text-red-700 mb-1">Company Names Removed</h5>
                      <p className="text-xs text-red-600">{removedItems.companyNames.join(', ')}</p>
                    </div>
                  )}
                  {removedItems.domainsFromLanguages.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <h5 className="text-xs font-medium text-yellow-700 mb-1">Removed Domain Keywords</h5>
                      <p className="text-xs text-yellow-600">{removedItems.domainsFromLanguages.join(', ')}</p>
                    </div>
                  )}
                  {removedItems.softSkillsFromTech.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <h5 className="text-xs font-medium text-blue-700 mb-1">Moved to Soft Skills</h5>
                      <p className="text-xs text-blue-600">{removedItems.softSkillsFromTech.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsOptimizationPanel;