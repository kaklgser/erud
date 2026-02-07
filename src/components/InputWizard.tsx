// src/components/InputWizard.tsx
import React, { useState } from 'react';
import {
  Upload,
  FileText,
  User,
  Briefcase,
  Building2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Edit3,
  Target
} from 'lucide-react';
import { FileUpload } from './FileUpload';
import { InputSection } from './InputSection';
import { UserType } from '../types/resume';
import { User as AuthUser } from '../types/auth';
import { ExtractionResult, ScoringMode } from '../types/resume';
import { ParsedResume } from '../services/edenResumeParserService';

interface InputWizardProps {
  extractionResult: ExtractionResult;
  setExtractionResult: (value: ExtractionResult) => void;
  jobDescription: string;
  setJobDescription: (value: string) => void;
  targetRole: string;
  setTargetRole: (value: string) => void;
  userType: UserType;
  setUserType: (value: UserType) => void;
  scoringMode: ScoringMode;
  setScoringMode: (value: ScoringMode) => void;
  autoScoreOnUpload: boolean;
  setAutoScoreOnUpload: (value: boolean) => void;
  handleOptimize: () => void;
  isAuthenticated: boolean;
  onShowAuth: () => void;
  user: AuthUser | null;
  onShowProfile: (mode?: 'profile' | 'wallet') => void;
  onParsedResume?: (parsedResume: ParsedResume | null) => void; // NEW: EdenAI parsed resume callback
  // NEW: Payment check on upload
  onShowSubscriptionPlans?: (featureId?: string) => void;
  onShowSubscriptionPlansDirectly?: () => void; // Direct subscription plans (skip plan selection modal)
  onCreditCheckPassed?: () => void; // Callback when credits available - auto-trigger optimization
}

export const InputWizard: React.FC<InputWizardProps> = ({
  extractionResult,
  setExtractionResult,
  jobDescription,
  setJobDescription,
  targetRole,
  setTargetRole,
  userType,
  setUserType,
  scoringMode,
  setScoringMode,
  autoScoreOnUpload,
  setAutoScoreOnUpload,
  handleOptimize,
  isAuthenticated,
  onShowAuth,
  user,
  onShowProfile,
  onParsedResume, // NEW: EdenAI parsed resume callback
  onShowSubscriptionPlans,
  onCreditCheckPassed
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 'upload',
      title: 'Upload Resume',
      icon: <Upload className="w-5 h-5" />,
      component: (
        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-400" />
            Upload Resume
          </h2>
          <FileUpload 
            onFileUpload={setExtractionResult} 
            onParsedResume={onParsedResume}
            isAuthenticated={isAuthenticated}
            onShowAuth={onShowAuth}
            requireAuth={true}
            userId={user?.id}
            creditType="optimization"
            onShowSubscriptionPlans={onShowSubscriptionPlans}
            onCreditCheckPassed={onCreditCheckPassed}
          />
        </div>
      ),
      isValid: extractionResult.text.trim().length > 0
    },
    {
      id: 'details',
      title: 'Job Details',
      icon: <FileText className="w-5 h-5" />,
      component: (
        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Job Details
          </h2>
          <InputSection
            resumeText={extractionResult.text}
            jobDescription={jobDescription}
            onResumeChange={(text) => setExtractionResult({ ...extractionResult, text })}
            onJobDescriptionChange={setJobDescription}
          />
        </div>
      ),
      isValid: extractionResult.text.trim().length > 0 && jobDescription.trim().length >= 250
    },
    {
      id: 'role',
      title: 'Target Role',
      icon: <Target className="w-5 h-5" />,
      component: (
        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Target Role
            <span className="text-xs text-slate-500 font-normal">(Optional)</span>
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Role Title
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g., Senior Software Engineer, Product Manager..."
                className="input-base"
              />
              <p className="text-xs text-slate-500 mt-2">
                Specify the exact role title for more targeted optimization
              </p>
            </div>
            
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-sm text-slate-300">
                  <p className="font-medium mb-1 text-slate-200">📝 Profile Information</p>
                  <p className="text-slate-400">
                    Your name, email, phone, LinkedIn, and GitHub details will be automatically populated from your profile settings.
                  </p>
                </div>
              </div>
              {isAuthenticated && user && (
                <button
                  onClick={() => onShowProfile('profile')}
                  className="mt-4 w-full flex items-center justify-center gap-2 btn-secondary py-3 px-6 rounded-xl text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Update Your Details</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ),
      isValid: true
    },
    {
      id: 'experience',
      title: 'Experience Level',
      icon: <Building2 className="w-5 h-5" />,
      component: (
        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            Experience Level
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Student Button */}
            <button
              onClick={() => setUserType('student')}
              className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all cursor-pointer ${
                userType === 'student'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-emerald-glow'
                  : 'border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                userType === 'student' ? 'bg-emerald-500/20' : 'bg-slate-800'
              }`}>
                <User className={`w-6 h-6 ${userType === 'student' ? 'text-emerald-400' : 'text-slate-400'}`} />
              </div>
              <span className={`font-semibold mb-1 ${userType === 'student' ? 'text-emerald-400' : 'text-slate-200'}`}>Student</span>
              <span className="text-xs text-slate-400 text-center">Currently pursuing degree</span>
            </button>

            {/* Fresher Button */}
            <button
              onClick={() => setUserType('fresher')}
              className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all cursor-pointer ${
                userType === 'fresher'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-emerald-glow'
                  : 'border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                userType === 'fresher' ? 'bg-emerald-500/20' : 'bg-slate-800'
              }`}>
                <User className={`w-6 h-6 ${userType === 'fresher' ? 'text-emerald-400' : 'text-slate-400'}`} />
              </div>
              <span className={`font-semibold mb-1 ${userType === 'fresher' ? 'text-emerald-400' : 'text-slate-200'}`}>Fresher</span>
              <span className="text-xs text-slate-400 text-center">Recent graduate</span>
            </button>

            {/* Experienced Button */}
            <button
              onClick={() => setUserType('experienced')}
              className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all cursor-pointer ${
                userType === 'experienced'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-emerald-glow'
                  : 'border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                userType === 'experienced' ? 'bg-emerald-500/20' : 'bg-slate-800'
              }`}>
                <Briefcase className={`w-6 h-6 ${userType === 'experienced' ? 'text-emerald-400' : 'text-slate-400'}`} />
              </div>
              <span className={`font-semibold mb-1 ${userType === 'experienced' ? 'text-emerald-400' : 'text-slate-200'}`}>Experienced</span>
              <span className="text-xs text-slate-400 text-center">1+ years experience</span>
            </button>
          </div>

          <div className="mt-6 bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-200 mb-3">Why does this matter?</h4>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                <span><strong className="text-slate-300">Student:</strong> Prioritizes Education, Skills, and Projects</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                <span><strong className="text-slate-300">Fresher:</strong> Emphasizes Skills and Projects before Education</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                <span><strong className="text-slate-300">Experienced:</strong> Highlights Work Experience and Projects</span>
              </li>
            </ul>
          </div>
        </div>
      ),
      isValid: true
    },
    {
      id: 'optimize',
      title: 'Optimize',
      icon: <Sparkles className="w-5 h-5" />,
      component: (
        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Ready to Optimize
          </h2>
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-5 border border-slate-700/50">
              <h3 className="text-base font-semibold text-slate-200 mb-4">Review Your Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="font-medium text-slate-200 text-sm">Resume Uploaded</span>
                  </div>
                  <p className="text-slate-400 text-sm">{extractionResult.text.length.toLocaleString()} characters</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="font-medium text-slate-200 text-sm">Job Description</span>
                  </div>
                  <p className="text-slate-400 text-sm">{jobDescription.length.toLocaleString()} characters</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span className="font-medium text-slate-200 text-sm">Experience Level</span>
                  </div>
                  <p className="text-slate-400 text-sm capitalize">
                    {userType === 'student' ? 'College Student' : userType}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className="font-medium text-slate-200 text-sm">Target Role</span>
                  </div>
                  <p className="text-slate-400 text-sm">{targetRole || 'Not specified'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isAuthenticated) {
                  handleOptimize();
                } else {
                  onShowAuth();
                }
              }}
              disabled={!extractionResult.text.trim() || (scoringMode === 'jd_based' && (!jobDescription.trim() || !targetRole.trim()))}
              className={`w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 ${
                !extractionResult.text.trim() || (scoringMode === 'jd_based' && (!jobDescription.trim() || !targetRole.trim()))
                  ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                  : 'btn-primary shadow-emerald-glow hover:shadow-emerald-glow-lg'
              }`}
              type="button"
            >
              <Sparkles className="w-5 h-5" />
              <span>{isAuthenticated ? 'Optimize My Resume' : 'Sign In to Optimize'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {!isAuthenticated && (
              <p className="text-center text-sm text-slate-500">
                You need to be signed in to optimize your resume.
              </p>
            )}
          </div>
        </div>
      ),
      isValid: extractionResult.text.trim().length > 0 && (scoringMode === 'general' || (jobDescription.trim().length > 0 && targetRole.trim().length > 0))
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="container-responsive space-y-6 max-w-4xl mx-auto">
      {/* Header with Step Progress */}
      <div className="card-surface p-5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-100">Resume Optimization</h1>
          <div className="text-sm text-slate-400">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    index < currentStep
                      ? 'bg-emerald-500 text-white'
                      : index === currentStep
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-neon-cyan'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span className={`text-xs mt-2 font-medium text-center hidden sm:block ${
                  index <= currentStep ? 'text-slate-200' : 'text-slate-500'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-300 ${
                  index < currentStep ? 'bg-emerald-500' : 'bg-slate-700'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="transition-all duration-300 animate-fade-in">
        {currentStepData.component}
      </div>

      {/* Navigation Footer */}
      <div className="card-surface p-5">
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 ${
              currentStep === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'btn-secondary'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex-1 max-w-xs">
            <div className="text-center text-sm text-slate-400 mb-2">Progress</div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!currentStepData.isValid}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 ${
                !currentStepData.isValid
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'btn-primary'
              }`}
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-24" />
          )}
        </div>
      </div>
    </div>
  );
};
