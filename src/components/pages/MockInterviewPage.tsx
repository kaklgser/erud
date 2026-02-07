import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AnimatedCard, GradientButton, FloatingParticles, ChristmasSnow } from '../ui';
import { InterviewSetupWizard } from '../interview/InterviewSetupWizard';
import { MockInterviewRoom } from '../interview/MockInterviewRoom';
import { InterviewSummaryReport } from '../interview/InterviewSummaryReport';
import { InterviewConfig } from '../../types/interview';
import { UserResume } from '../../types/resumeInterview';
import { ArrowLeft, Sparkles } from 'lucide-react';

// Animated gradient orb component
const GradientOrb: React.FC<{ className?: string; delay?: number }> = ({ className, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.5, 0.3],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      delay,
      ease: "easeInOut"
    }}
  />
);

type FlowStage = 'welcome' | 'setup' | 'interview' | 'summary';

interface MockInterviewPageProps {
  isAuthenticated: boolean;
  onShowAuth: () => void;
}

export const MockInterviewPage: React.FC<MockInterviewPageProps> = ({
  isAuthenticated,
  onShowAuth
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isChristmasMode, colors } = useTheme();
  const [currentStage, setCurrentStage] = useState<FlowStage>('welcome');
  const [interviewConfig, setInterviewConfig] = useState<InterviewConfig | null>(null);
  const [selectedResume, setSelectedResume] = useState<UserResume | null>(null);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);

  const handleBack = () => {
    navigate(-1);
  };

  const handleStartInterview = () => {
    if (!isAuthenticated) {
      onShowAuth();
      return;
    }
    setCurrentStage('setup');
  };

  const handleConfigComplete = (config: InterviewConfig, resume: UserResume) => {
    setInterviewConfig(config);
    setSelectedResume(resume);
    setCurrentStage('interview');
    // Add session=active to URL to hide sidebar during interview
    navigate('/mock-interview?session=active', { replace: true });
  };

  const handleInterviewComplete = (sessionId: string) => {
    setCompletedSessionId(sessionId);
    setCurrentStage('summary');
    // Remove session parameter when interview ends
    navigate('/mock-interview', { replace: true });
  };

  const handleRetakeInterview = () => {
    setCurrentStage('welcome');
    setInterviewConfig(null);
    setSelectedResume(null);
    setCompletedSessionId(null);
    // Remove session parameter
    navigate('/mock-interview', { replace: true });
  };

  const handleBackToSetup = () => {
    setCurrentStage('setup');
  };

  const renderWelcomeScreen = () => (
    <div className="relative min-h-screen bg-gradient-to-b from-[#0a1e1e] via-[#0d1a1a] to-[#070b14] text-slate-100 lg:pl-16 overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <GradientOrb className="w-[500px] h-[500px] -top-40 -left-40 bg-indigo-500/20" delay={0} />
        <GradientOrb className="w-[400px] h-[400px] top-1/3 -right-40 bg-purple-500/15" delay={2} />
        <GradientOrb className="w-[300px] h-[300px] bottom-20 left-1/4 bg-cyan-500/10" delay={4} />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-12">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleBack}
          className="lg:hidden flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </motion.button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-[0_25px_80px_rgba(99,102,241,0.15)] border border-indigo-400/30 p-8 md:p-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.4)]">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-100">
                AI Mock Interview
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Beta Version - Practice with AI-Powered Feedback
              </p>
            </div>
          </div>

          <div className="max-w-none mb-8">
            <p className="text-lg text-slate-300 mb-4">
              Welcome to PrimoBoost AI's Mock Interview Practice Tool. Get real-time feedback from our AI interviewer and improve your interview skills.
            </p>

            <div className="bg-indigo-500/10 border border-indigo-400/30 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-indigo-200 mb-3">
                How It Works:
              </h3>
              <ol className="space-y-2 text-slate-300">
                <li>1. Upload your resume for personalized questions</li>
                <li>2. Choose interview category (Technical or HR)</li>
                <li>3. Set duration and preferences</li>
                <li>4. Answer questions in a meet-style interview environment</li>
                <li>5. Get comprehensive AI feedback and improvement tips</li>
              </ol>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-4"
              >
                <h4 className="font-semibold text-emerald-200 mb-2">
                  ✅ Features Available
                </h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Resume-Based Questions</li>
                  <li>• Audio/Video Recording</li>
                  <li>• Real-time Speech-to-Text</li>
                  <li>• AI Feedback on Every Answer</li>
                  <li>• Detailed Performance Reports</li>
                </ul>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4"
              >
                <h4 className="font-semibold text-purple-200 mb-2">
                  🎯 What You'll Practice
                </h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Technical Concepts</li>
                  <li>• Behavioral Questions</li>
                  <li>• HR Questions</li>
                  <li>• Communication Skills</li>
                  <li>• Confidence Building</li>
                </ul>
              </motion.div>
            </div>

            <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-200">
                <strong>Note:</strong> Resume upload is mandatory. Your resume will be analyzed to provide personalized interview questions. We recommend using Chrome or Edge for the best experience.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (!isAuthenticated) {
                  onShowAuth();
                } else {
                  navigate('/realistic-interview');
                }
              }}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white py-4 text-lg font-semibold flex items-center justify-center gap-2 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all"
            >
              <Sparkles className="w-5 h-5" />
              {isAuthenticated ? 'Start Interview' : 'Sign In to Start'}
            </motion.button>

            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-4"
            >
              <h4 className="font-semibold text-emerald-200 mb-2 flex items-center gap-2">
                ✨ New: Enhanced Realistic Interview
              </h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Role-based question selection (General or Company-specific)</li>
                <li>• Project deep-dive with intelligent follow-ups</li>
                <li>• Code review with line-by-line explanations</li>
                <li>• Dynamic questions based on your answers</li>
                <li>• No repeated questions across sessions</li>
              </ul>
            </motion.div>
          </div>

          {isAuthenticated && user && (
            <p className="text-center text-sm text-slate-400 mt-4">
              Logged in as <strong className="text-slate-200">{user.name}</strong>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );

  return (
    <>
      {currentStage === 'welcome' && renderWelcomeScreen()}

      {currentStage === 'setup' && (
        <InterviewSetupWizard
          onConfigComplete={handleConfigComplete}
          onBack={() => setCurrentStage('welcome')}
        />
      )}

      {currentStage === 'interview' && interviewConfig && selectedResume && user && (
        <MockInterviewRoom
          config={interviewConfig}
          userId={user.id}
          userName={user.name}
          resume={selectedResume}
          onInterviewComplete={handleInterviewComplete}
          onBack={handleBackToSetup}
        />
      )}

      {currentStage === 'summary' && completedSessionId && (
        <InterviewSummaryReport
          sessionId={completedSessionId}
          onRetake={handleRetakeInterview}
          onBackHome={() => navigate('/')}
        />
      )}
    </>
  );
};
