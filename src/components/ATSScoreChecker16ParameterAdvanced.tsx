import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Target, BarChart3, CheckCircle, AlertCircle, TrendingUp, 
  Download, History, Trophy, Lightbulb, Award, Clock
} from 'lucide-react';
import { FileUpload } from './FileUpload';
import { LoadingAnimation } from './LoadingAnimation';
import { ATSScoreChecker16Parameter, ATSScore16Parameter } from '../services/atsScoreChecker16Parameter';
import { 
  ATSScoreChecker16ParameterEnhanced, 
  ImprovementSuggestion, 
  BenchmarkData, 
  ScoreHistory 
} from '../services/atsScoreChecker16ParameterEnhanced';
import { ExtractionResult } from '../types/resume';

interface ATSScoreChecker16ParameterAdvancedProps {
  onNavigateBack: () => void;
}

export const ATSScoreChecker16ParameterAdvanced: React.FC<ATSScoreChecker16ParameterAdvancedProps> = ({
  onNavigateBack
}) => {
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scoreResult, setScoreResult] = useState<ATSScore16Parameter | null>(null);
  const [improvements, setImprovements] = useState<ImprovementSuggestion[]>([]);
  const [benchmark, setBenchmark] = useState<BenchmarkData | undefined>(undefined);
  const [previousScore, setPreviousScore] = useState<ATSScore16Parameter | undefined>(undefined);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [useOCR, setUseOCR] = useState(true);
  const [activeTab, setActiveTab] = useState<'results' | 'improvements' | 'benchmark' | 'history'>('results');
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);

  useEffect(() => {
    // Load score history on component mount
    setScoreHistory(ATSScoreChecker16ParameterEnhanced.getScoreHistory());
  }, []);

  const handleFileUpload = (result: ExtractionResult, file?: File) => {
    setExtractionResult(result);
    setUploadedFile(file || null);
    setScoreResult(null);
    setCurrentStep(1);
    
    // Auto-detect if OCR might be needed
    if (file) {
      const isImageFile = file.type.startsWith('image/');
      const isLargePDF = file.type === 'application/pdf' && file.size > 5000000;
      setUseOCR(isImageFile || isLargePDF);
    }
  };

  const analyzeResume = async () => {
    if (!extractionResult) return;

    setIsAnalyzing(true);
    try {
      const result = await ATSScoreChecker16ParameterEnhanced.evaluateResumeEnhanced(
        extractionResult.text,
        jobDescription.trim() || undefined,
        extractionResult.filename,
        uploadedFile || undefined,
        useOCR,
        true // Track history
      );
      
      setScoreResult(result.score);
      setImprovements(result.improvements);
      setBenchmark(result.benchmark);
      setPreviousScore(result.previousScore);
      setCurrentStep(2);
      setActiveTab('results');
      
      // Refresh history
      setScoreHistory(ATSScoreChecker16ParameterEnhanced.getScoreHistory());
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportResults = (format: 'json' | 'csv' | 'report') => {
    if (!scoreResult) return;
    
    let content: string;
    let filename: string;
    let mimeType: string;
    
    if (format === 'report') {
      content = ATSScoreChecker16ParameterEnhanced.generateDetailedReport(
        scoreResult, improvements, benchmark, previousScore
      );
      filename = `ats-report-${Date.now()}.md`;
      mimeType = 'text/markdown';
    } else {
      content = ATSScoreChecker16ParameterEnhanced.exportScoreData(scoreResult, format);
      filename = `ats-score-${Date.now()}.${format}`;
      mimeType = format === 'json' ? 'application/json' : 'text/csv';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMatchQualityColor = (quality: string) => {
    switch (quality) {
      case 'Excellent': return 'text-green-500';
      case 'Good': return 'text-blue-500';
      case 'Adequate': return 'text-yellow-500';
      case 'Poor': return 'text-orange-500';
      case 'Inadequate': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <button
            onClick={onNavigateBack}
            className="mb-4 text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Tools
          </button>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Advanced 16-Parameter ATS Score Checker
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Professional ATS evaluation with advanced analytics, improvement tracking, and industry benchmarks.
          </p>
        </motion.div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[
              { step: 0, icon: FileText, label: 'Upload Resume' },
              { step: 1, icon: Target, label: 'Job Description' },
              { step: 2, icon: BarChart3, label: 'Advanced Results' }
            ].map(({ step, icon: Icon, label }) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${currentStep >= step ? 'bg-blue-500' : 'bg-gray-600'}
                  transition-colors duration-300
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="ml-2 text-sm text-gray-300">{label}</span>
                {step < 2 && <div className="w-8 h-px bg-gray-600 ml-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 0: File Upload */}
        {currentStep === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
              <h2 className="text-2xl font-semibold mb-6 text-center">Upload Your Resume</h2>
              <FileUpload onFileUpload={handleFileUpload} />
              
              {/* Score History Preview */}
              {scoreHistory.length > 0 && (
                <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <History className="w-5 h-5 mr-2" />
                    Recent Analysis History
                  </h3>
                  <div className="space-y-2">
                    {scoreHistory.slice(0, 3).map((entry, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">{entry.filename}</span>
                        <span className="text-blue-400">{entry.score.overallScore}/100</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 1: Job Description */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
              <h2 className="text-2xl font-semibold mb-6">Job Description (Optional)</h2>
              <p className="text-gray-300 mb-4">
                Add a job description for JD-based scoring with industry benchmarks and targeted improvements.
              </p>
              
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here for advanced ATS analysis with benchmarks..."
                className="w-full h-40 bg-slate-700 border border-slate-600 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500"
              />
              
              {/* OCR Controls */}
              {uploadedFile && (
                <div className="mt-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Processing Options
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useOCR}
                          onChange={(e) => setUseOCR(e.target.checked)}
                          className="mr-3 w-4 h-4 text-blue-600 bg-slate-600 border-slate-500 rounded focus:ring-blue-500"
                        />
                        <span className="text-white">
                          Use Enhanced Processing (OCR + Layout Analysis)
                        </span>
                      </label>
                      <p className="text-sm text-gray-400 mt-1 ml-7">
                        {useOCR 
                          ? 'Recommended for image files, scanned PDFs, or complex layouts'
                          : 'Uses basic text extraction only'
                        }
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-300">
                        File: {uploadedFile.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentStep(0)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={analyzeResume}
                  disabled={isAnalyzing}
                  className="px-8 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center"
                >
                  {isAnalyzing ? (
                    <>
                      <LoadingAnimation />
                      <span className="ml-2">Analyzing...</span>
                    </>
                  ) : (
                    'Analyze Resume'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Advanced Results */}
        {currentStep === 2 && scoreResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            {/* Overall Score Card with Progress */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{scoreResult.overallScore}/100</div>
                  <div className="text-gray-300">Overall Score</div>
                  {previousScore && (
                    <div className="text-sm mt-1">
                      <span className={`${scoreResult.overallScore > previousScore.overallScore ? 'text-green-400' : 'text-red-400'}`}>
                        {scoreResult.overallScore > previousScore.overallScore ? '+' : ''}
                        {scoreResult.overallScore - previousScore.overallScore}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-semibold mb-2 ${getMatchQualityColor(scoreResult.matchQuality)}`}>
                    {scoreResult.matchQuality}
                  </div>
                  <div className="text-gray-300">Match Quality</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold mb-2 text-green-400">{scoreResult.interviewChance}</div>
                  <div className="text-gray-300">Shortlist Chances</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-semibold mb-2 ${
                    scoreResult.confidence === 'High' ? 'text-green-400' :
                    scoreResult.confidence === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {scoreResult.confidence}
                  </div>
                  <div className="text-gray-300">Confidence</div>
                </div>
                {benchmark && (
                  <div className="text-center">
                    <div className="text-xl font-semibold mb-2 text-purple-400">
                      {scoreResult.overallScore >= benchmark.topPercentileScore ? 'Top 10%' :
                       scoreResult.overallScore >= benchmark.averageScore ? 'Above Avg' : 'Below Avg'}
                    </div>
                    <div className="text-gray-300">Industry Rank</div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                <p className="text-gray-300">{scoreResult.summary}</p>
                
                {/* Processing Mode Indicator */}
                <div className="mt-3 flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-400">Processing Mode:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      useOCR && uploadedFile 
                        ? 'bg-blue-900/50 text-blue-300' 
                        : 'bg-gray-900/50 text-gray-300'
                    }`}>
                      {useOCR && uploadedFile ? 'Enhanced (OCR + Layout)' : 'Text-Only'}
                    </span>
                  </div>
                  
                  {/* Export Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => exportResults('json')}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors flex items-center"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      JSON
                    </button>
                    <button
                      onClick={() => exportResults('csv')}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition-colors flex items-center"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      CSV
                    </button>
                    <button
                      onClick={() => exportResults('report')}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs transition-colors flex items-center"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Report
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 mb-8">
              <div className="flex border-b border-slate-600">
                {[
                  { id: 'results', label: '16 Parameters', icon: BarChart3 },
                  { id: 'improvements', label: 'Improvements', icon: Lightbulb },
                  { id: 'benchmark', label: 'Benchmark', icon: Award },
                  { id: 'history', label: 'History', icon: Clock }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`flex items-center px-6 py-4 font-medium transition-colors ${
                      activeTab === id
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-8">
                <AnimatePresence mode="wait">
                  {/* Results Tab */}
                  {activeTab === 'results' && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h3 className="text-2xl font-semibold mb-6">16-Parameter Breakdown</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(scoreResult.scores).map(([key, score]) => {
                          const maxScores: Record<string, number> = {
                            keywordMatch: 25, skillsAlignment: 20, experienceRelevance: 15,
                            technicalCompetencies: 12, educationScore: 10, quantifiedAchievements: 8,
                            employmentHistory: 8, industryExperience: 7, jobTitleMatch: 6,
                            careerProgression: 6, certifications: 5, formatting: 5,
                            contentQuality: 4, grammar: 3, resumeLength: 2, filenameQuality: 2
                          };
                          
                          const maxScore = maxScores[key] || 5;
                          const percentage = (score / maxScore) * 100;
                          
                          return (
                            <div key={key} className="bg-slate-700/50 rounded-lg p-4">
                              <div className="text-sm text-gray-300 mb-1 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </div>
                              <div className={`text-xl font-semibold ${getScoreColor(score, maxScore)}`}>
                                {score}/{maxScore}
                              </div>
                              <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    percentage >= 80 ? 'bg-green-500' :
                                    percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                              {benchmark && benchmark.parameterBenchmarks[key] && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Avg: {benchmark.parameterBenchmarks[key].average}/{maxScore}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Improvements Tab */}
                  {activeTab === 'improvements' && (
                    <motion.div
                      key="improvements"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h3 className="text-2xl font-semibold mb-6">Improvement Suggestions</h3>
                      <div className="space-y-4">
                        {improvements.map((improvement, index) => (
                          <div key={index} className="bg-slate-700/50 rounded-lg p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="text-lg font-semibold text-white">{improvement.parameter}</h4>
                                <div className="text-sm text-gray-400">
                                  Current: {improvement.currentScore}/{improvement.maxScore} • 
                                  Potential: +{improvement.expectedImprovement} points
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(improvement.priority)}`}>
                                  {improvement.priority.toUpperCase()}
                                </span>
                                <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                                  {improvement.difficulty}
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-300">{improvement.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Benchmark Tab */}
                  {activeTab === 'benchmark' && (
                    <motion.div
                      key="benchmark"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h3 className="text-2xl font-semibold mb-6">Industry Benchmark</h3>
                      {benchmark ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-slate-700/50 rounded-lg p-6">
                            <h4 className="text-lg font-semibold mb-4">Position Overview</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-300">Role:</span>
                                <span className="text-white font-medium">{benchmark.role}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Industry:</span>
                                <span className="text-white font-medium">{benchmark.industry}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Your Score:</span>
                                <span className="text-blue-400 font-bold">{scoreResult.overallScore}/100</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Industry Average:</span>
                                <span className="text-yellow-400">{benchmark.averageScore}/100</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Top Percentile:</span>
                                <span className="text-green-400">{benchmark.topPercentileScore}/100</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-slate-700/50 rounded-lg p-6">
                            <h4 className="text-lg font-semibold mb-4">Performance Analysis</h4>
                            <div className="space-y-3">
                              <div className="text-center p-4 rounded-lg bg-slate-600/50">
                                <div className="text-2xl font-bold mb-2">
                                  {scoreResult.overallScore >= benchmark.topPercentileScore ? (
                                    <span className="text-green-400">🏆 Top 10%</span>
                                  ) : scoreResult.overallScore >= benchmark.averageScore ? (
                                    <span className="text-blue-400">📈 Above Average</span>
                                  ) : (
                                    <span className="text-yellow-400">📊 Below Average</span>
                                  )}
                                </div>
                                <p className="text-gray-300 text-sm">
                                  {scoreResult.overallScore >= benchmark.topPercentileScore
                                    ? 'Excellent! Your resume is in the top percentile for this role.'
                                    : scoreResult.overallScore >= benchmark.averageScore
                                    ? 'Good performance! Above industry average with room for improvement.'
                                    : 'Focus on key improvements to reach industry standards.'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-400">Add a job description to see industry benchmarks</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* History Tab */}
                  {activeTab === 'history' && (
                    <motion.div
                      key="history"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h3 className="text-2xl font-semibold mb-6">Score History</h3>
                      {scoreHistory.length > 0 ? (
                        <div className="space-y-4">
                          {scoreHistory.map((entry, index) => (
                            <div key={index} className="bg-slate-700/50 rounded-lg p-6">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="text-lg font-semibold text-white">{entry.filename}</h4>
                                  <div className="text-sm text-gray-400">
                                    {entry.timestamp.toLocaleString()}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-blue-400">
                                    {entry.score.overallScore}/100
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    {entry.score.matchQuality}
                                  </div>
                                </div>
                              </div>
                              {entry.improvements && entry.improvements.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-600">
                                  <p className="text-sm text-gray-400 mb-2">Top Improvements:</p>
                                  <div className="text-sm text-gray-300">
                                    {entry.improvements.slice(0, 2).join(' • ')}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Clock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-400">No analysis history yet</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setScoreResult(null);
                  setExtractionResult(null);
                  setJobDescription('');
                  setActiveTab('results');
                }}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Analyze Another Resume
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};