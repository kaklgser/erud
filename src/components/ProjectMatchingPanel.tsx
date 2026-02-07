// src/components/ProjectMatchingPanel.tsx
// Enhanced Project Matching Panel with GitHub Suggestions

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  AlertTriangle,
  Github,
  Star,
  ExternalLink,
  Target,
  Lightbulb,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Code,
  BookOpen
} from 'lucide-react';
import { ResumeData } from '../types/resume';
import { ProjectMatchResult, extractJdKeywords, matchProjectsToJd, JdKeywords } from '../services/projectMatchingEngine';
import { SuggestedRepoProject, suggestProjectsForJd, generateProjectIdeas } from '../services/githubProjectSuggestionService';

interface ProjectMatchingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  jobDescription: string;
  jdSummary?: string;
  onContinue: () => void;
}

export const ProjectMatchingPanel: React.FC<ProjectMatchingPanelProps> = ({
  isOpen,
  onClose,
  resumeData,
  jobDescription,
  jdSummary,
  onContinue
}) => {
  const [loading, setLoading] = useState(false);
  const [projectMatches, setProjectMatches] = useState<ProjectMatchResult[]>([]);
  const [githubSuggestions, setGithubSuggestions] = useState<SuggestedRepoProject[]>([]);
  const [jdKeywords, setJdKeywords] = useState<JdKeywords | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [showGithubSuggestions, setShowGithubSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && resumeData && jobDescription) {
      analyzeProjects();
    }
  }, [isOpen, resumeData, jobDescription]);

  const analyzeProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Extract JD keywords
      const keywords = extractJdKeywords(jobDescription);
      setJdKeywords(keywords);
      
      // Match projects to JD
      const matches = await matchProjectsToJd(resumeData, jobDescription, jdSummary);
      setProjectMatches(matches);
      
      // Get GitHub suggestions
      try {
        const suggestions = await suggestProjectsForJd(keywords);
        if (suggestions.length > 0) {
          setGithubSuggestions(suggestions);
        } else {
          // Fallback to generated ideas
          const ideas = generateProjectIdeas(keywords);
          setGithubSuggestions(ideas);
        }
      } catch (githubError) {
        console.warn('GitHub suggestions failed, using generated ideas:', githubError);
        const ideas = generateProjectIdeas(keywords);
        setGithubSuggestions(ideas);
      }
    } catch (err: any) {
      console.error('Project analysis error:', err);
      setError(err.message || 'Failed to analyze projects');
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (percentage: number): string => {
    if (percentage >= 70) return 'text-emerald-400';
    if (percentage >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getMatchBg = (percentage: number): string => {
    if (percentage >= 70) return 'bg-emerald-500/10 border-emerald-500/30';
    if (percentage >= 50) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return 'text-emerald-400 bg-emerald-500/10';
      case 'intermediate': return 'text-amber-400 bg-amber-500/10';
      case 'advanced': return 'text-red-400 bg-red-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Project-JD Match Analysis</h2>
              <p className="text-sm text-slate-400">See how your projects align with the job requirements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-4 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
              <p className="text-slate-400">Analyzing your projects against the JD...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <p className="text-slate-300">{error}</p>
              <button
                onClick={analyzeProjects}
                className="mt-4 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* JD Keywords Summary */}
              {jdKeywords && jdKeywords.techSkills.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <Code className="w-4 h-4 text-cyan-400" />
                    Key Skills from JD
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {jdKeywords.techSkills.slice(0, 12).map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Your Projects Ranking */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Your Projects Ranked by JD Match
                </h3>
                
                {projectMatches.length === 0 ? (
                  <div className="text-center py-6 bg-slate-800/30 rounded-xl border border-slate-700">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-slate-400">No projects found in your resume</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projectMatches.map((match, index) => (
                      <div
                        key={match.project.name}
                        className={`rounded-xl border transition-all ${getMatchBg(match.matchPercentage)}`}
                      >
                        <button
                          onClick={() => setExpandedProject(
                            expandedProject === match.project.name ? null : match.project.name
                          )}
                          className="w-full p-4 flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-slate-500">#{index + 1}</span>
                            <div>
                              <h4 className="font-medium text-white">{match.project.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                {match.aiLabel && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    match.aiLabel === 'high_match' ? 'bg-emerald-500/20 text-emerald-300' :
                                    match.aiLabel === 'medium_match' ? 'bg-amber-500/20 text-amber-300' :
                                    'bg-red-500/20 text-red-300'
                                  }`}>
                                    {match.aiLabel.replace('_', ' ')}
                                  </span>
                                )}
                                <span className="text-xs text-slate-500">
                                  {match.matchedSkills.length} skills matched
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-2xl font-bold ${getMatchColor(match.matchPercentage)}`}>
                              {match.matchPercentage}%
                            </span>
                            {expandedProject === match.project.name ? (
                              <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </button>
                        
                        {expandedProject === match.project.name && (
                          <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3">
                            {/* Matched Skills */}
                            {match.matchedSkills.length > 0 && (
                              <div>
                                <p className="text-xs text-slate-500 mb-2">Matched Skills:</p>
                                <div className="flex flex-wrap gap-1">
                                  {match.matchedSkills.map((skill, i) => (
                                    <span key={i} className="px-2 py-0.5 text-xs rounded bg-emerald-500/20 text-emerald-300">
                                      <CheckCircle className="w-3 h-3 inline mr-1" />
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Missing Skills */}
                            {match.missingSkills.length > 0 && (
                              <div>
                                <p className="text-xs text-slate-500 mb-2">Missing from JD:</p>
                                <div className="flex flex-wrap gap-1">
                                  {match.missingSkills.slice(0, 8).map((skill, i) => (
                                    <span key={i} className="px-2 py-0.5 text-xs rounded bg-amber-500/10 text-amber-300">
                                      {skill}
                                    </span>
                                  ))}
                                  {match.missingSkills.length > 8 && (
                                    <span className="px-2 py-0.5 text-xs rounded bg-slate-700 text-slate-400">
                                      +{match.missingSkills.length - 8} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Recommendations */}
                            {match.recommendations.length > 0 && (
                              <div className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                  <Lightbulb className="w-3 h-3" />
                                  Recommendations:
                                </p>
                                <ul className="space-y-1">
                                  {match.recommendations.map((rec, i) => (
                                    <li key={i} className="text-xs text-slate-300">• {rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* GitHub Project Suggestions */}
              <div>
                <button
                  onClick={() => setShowGithubSuggestions(!showGithubSuggestions)}
                  className="w-full flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Github className="w-5 h-5 text-slate-400" />
                    <div className="text-left">
                      <h3 className="text-sm font-medium text-white">Recommended Projects for This JD</h3>
                      <p className="text-xs text-slate-500">Inspiration projects to build (not your existing work)</p>
                    </div>
                  </div>
                  {showGithubSuggestions ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                
                {showGithubSuggestions && (
                  <div className="mt-3 space-y-3">
                    {githubSuggestions.length === 0 ? (
                      <p className="text-center text-slate-500 py-4">No suggestions available</p>
                    ) : (
                      githubSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="bg-slate-800/30 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-white">{suggestion.name}</h4>
                                {suggestion.url && (
                                  <a
                                    href={suggestion.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-400 hover:text-emerald-400 transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                              <p className="text-sm text-slate-400 mb-2 line-clamp-2">
                                {suggestion.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                {suggestion.language && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                                    {suggestion.language}
                                  </span>
                                )}
                                <span className={`text-xs px-2 py-0.5 rounded ${getDifficultyColor(suggestion.difficulty)}`}>
                                  {suggestion.difficulty}
                                </span>
                                {suggestion.stars > 0 && (
                                  <span className="text-xs text-amber-400 flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-current" />
                                    {suggestion.stars.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <p className="text-xs text-emerald-400">
                              <Sparkles className="w-3 h-3 inline mr-1" />
                              {suggestion.reason}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                      <p className="text-xs text-amber-300 flex items-start gap-2">
                        <BookOpen className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          These are inspiration projects to help you build relevant experience. 
                          Do not claim these as your own work on your resume.
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={onContinue}
            disabled={loading}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Continue to Optimization
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectMatchingPanel;
