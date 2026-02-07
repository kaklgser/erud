import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Target, BarChart3, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { LoadingAnimation } from './LoadingAnimation';
import { ATSScoreChecker16Parameter, ATSScore16Parameter } from '../services/atsScoreChecker16Parameter';
import { ExtractionResult } from '../types/resume';

interface ATSScoreChecker16ParameterProps {
  onNavigateBack: () => void;
}

export const ATSScoreChecker16ParameterComponent: React.FC<ATSScoreChecker16ParameterProps> = ({
  onNavigateBack
}) => {
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scoreResult, setScoreResult] = useState<ATSScore16Parameter | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [useOCR, setUseOCR] = useState(true);

  const handleFileUpload = (result: ExtractionResult, file?: File) => {
    setExtractionResult(result);
    setUploadedFile(file || null);
    setScoreResult(null);
    setCurrentStep(1);
    
    // Auto-detect if OCR might be needed
    if (file) {
      const isImageFile = file.type.startsWith('image/');
      const isLargePDF = file.type === 'application/pdf' && file.size > 5000000; // 5MB+
      setUseOCR(isImageFile || isLargePDF);
    }
  };

  const analyzeResume = async () => {
    if (!extractionResult) return;

    setIsAnalyzing(true);
    try {
      let result: ATSScore16Parameter;
      
      if (useOCR && uploadedFile) {
        // Use enhanced processing with OCR
        result = await ATSScoreChecker16Parameter.evaluateResumeWithOCR(
          uploadedFile,
          jobDescription.trim() || undefined
        );
      } else {
        // Use text-only processing
        result = await ATSScoreChecker16Parameter.evaluateResumeTextOnly(
          extractionResult.text,
          jobDescription.trim() || undefined,
          extractionResult.filename
        );
      }
      
      setScoreResult(result);
      setCurrentStep(2);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
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
            16-Parameter ATS Score Checker
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Professional ATS evaluation using the industry-standard 16-parameter weighted model.
            Get deterministic, metric-driven scores that simulate real Applicant Tracking Systems.
          </p>
        </motion.div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[
              { step: 0, icon: FileText, label: 'Upload Resume' },
              { step: 1, icon: Target, label: 'Job Description (Optional)' },
              { step: 2, icon: BarChart3, label: 'ATS Score Results' }
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
                Add a job description for JD-based scoring, or leave blank for general ATS evaluation.
              </p>
              
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here for targeted ATS analysis..."
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
                      {uploadedFile.type.startsWith('image/') && (
                        <div className="text-xs text-yellow-400">
                          Image file - OCR recommended
                        </div>
                      )}
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

        {/* Step 2: Results */}
        {currentStep === 2 && scoreResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            {/* Overall Score Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{scoreResult.overallScore}/100</div>
                  <div className="text-gray-300">Overall Score</div>
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
              </div>
              
              <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                <p className="text-gray-300">{scoreResult.summary}</p>
                
                {/* Processing Mode Indicator */}
                <div className="mt-3 flex items-center text-sm">
                  <span className="text-gray-400">Processing Mode:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    useOCR && uploadedFile 
                      ? 'bg-blue-900/50 text-blue-300' 
                      : 'bg-gray-900/50 text-gray-300'
                  }`}>
                    {useOCR && uploadedFile ? 'Enhanced (OCR + Layout)' : 'Text-Only'}
                  </span>
                  {uploadedFile && (
                    <span className="ml-2 text-xs text-gray-500">
                      • File: {uploadedFile.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 16 Parameter Breakdown */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8 mb-8">
              <h3 className="text-2xl font-semibold mb-6">
                16-Parameter Breakdown 
                <span className="text-sm text-green-400 ml-2">
                  ✅ ({Object.keys(scoreResult.scores).length} parameters)
                </span>
              </h3>
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
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths and Improvements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {scoreResult.strengths.map((strength, index) => (
                    <li key={index} className="text-gray-300 flex items-start">
                      <span className="text-green-400 mr-2">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 text-yellow-400 mr-2" />
                  Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {scoreResult.areasToImprove.map((area, index) => (
                    <li key={index} className="text-gray-300 flex items-start">
                      <span className="text-yellow-400 mr-2">•</span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Missing Keywords */}
            {(scoreResult.missingKeywords.critical.length > 0 || 
              scoreResult.missingKeywords.important.length > 0 || 
              scoreResult.missingKeywords.optional.length > 0) && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
                <h3 className="text-xl font-semibold mb-6">Missing Keywords</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {scoreResult.missingKeywords.critical.length > 0 && (
                    <div>
                      <h4 className="text-red-400 font-semibold mb-3 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Critical
                      </h4>
                      <ul className="space-y-1">
                        {scoreResult.missingKeywords.critical.map((keyword, index) => (
                          <li key={index} className="text-gray-300 text-sm bg-red-900/20 px-2 py-1 rounded">
                            {keyword}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {scoreResult.missingKeywords.important.length > 0 && (
                    <div>
                      <h4 className="text-yellow-400 font-semibold mb-3">Important</h4>
                      <ul className="space-y-1">
                        {scoreResult.missingKeywords.important.map((keyword, index) => (
                          <li key={index} className="text-gray-300 text-sm bg-yellow-900/20 px-2 py-1 rounded">
                            {keyword}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {scoreResult.missingKeywords.optional.length > 0 && (
                    <div>
                      <h4 className="text-blue-400 font-semibold mb-3">Optional</h4>
                      <ul className="space-y-1">
                        {scoreResult.missingKeywords.optional.map((keyword, index) => (
                          <li key={index} className="text-gray-300 text-sm bg-blue-900/20 px-2 py-1 rounded">
                            {keyword}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center mt-8 space-x-4">
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setScoreResult(null);
                  setExtractionResult(null);
                  setJobDescription('');
                }}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Analyze Another Resume
              </button>
              <button
                onClick={() => {
                  const jsonResult = JSON.stringify(scoreResult, null, 2);
                  navigator.clipboard.writeText(jsonResult);
                  alert('Results copied to clipboard!');
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Copy JSON Results
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};