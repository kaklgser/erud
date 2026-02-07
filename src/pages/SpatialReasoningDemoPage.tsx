import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Play, 
  Settings, 
  BarChart3, 
  Users, 
  Trophy,
  CheckCircle
} from 'lucide-react';
import { SpatialReasoningAssessment } from '../components/games/SpatialReasoningAssessment';
import { SpatialReasoningGame } from '../components/games/SpatialReasoningGame';
import { UserAssessment, Difficulty } from '../types/spatialReasoning';

type DemoMode = 'landing' | 'practice' | 'assessment' | 'results';

export const SpatialReasoningDemoPage: React.FC = () => {
  const [mode, setMode] = useState<DemoMode>('landing');
  const [practiceSettings, setPracticeSettings] = useState({
    difficulty: 'medium' as Difficulty,
    questionNumber: 1
  });
  const [assessmentResults, setAssessmentResults] = useState<UserAssessment | null>(null);

  const handlePracticeComplete = (score: number, efficiency: number, timeSpent: number) => {
    console.log('Practice completed:', { score, efficiency, timeSpent });
    setTimeout(() => {
      setMode('landing');
    }, 3000);
  };

  const handleAssessmentComplete = (assessment: UserAssessment) => {
    setAssessmentResults(assessment);
    setMode('results');
  };

  const handleBackToLanding = () => {
    setMode('landing');
    setAssessmentResults(null);
  };

  if (mode === 'practice') {
    return (
      <SpatialReasoningGame
        difficulty={practiceSettings.difficulty}
        questionNumber={practiceSettings.questionNumber}
        userId="demo-user"
        onGameComplete={handlePracticeComplete}
        onGameExit={handleBackToLanding}
      />
    );
  }

  if (mode === 'assessment') {
    return (
      <SpatialReasoningAssessment
        userId="demo-user"
        onAssessmentComplete={handleAssessmentComplete}
        onExit={handleBackToLanding}
      />
    );
  }

  if (mode === 'results' && assessmentResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl"
          >
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Demo Assessment Complete!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                This is a demonstration of the spatial reasoning assessment results
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
                <Trophy className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {assessmentResults.overallScore}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Overall Score</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
                <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {assessmentResults.spatialReasoningScore}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Spatial Reasoning</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 text-center">
                <Users className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {assessmentResults.completionRate}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleBackToLanding}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Back to Demo
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Brain className="w-20 h-20 text-blue-600 mx-auto mb-8" />
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Spatial Reasoning
                <span className="block text-blue-600">Assessment Game</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto">
                Test your visual-spatial intelligence with our innovative pathfinding puzzle game. 
                Measure cognitive abilities through engaging tile-rotation challenges.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => setMode('assessment')}
                className="flex items-center justify-center space-x-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors"
              >
                <Play className="w-6 h-6" />
                <span>Start Assessment</span>
              </button>
              <button
                onClick={() => setMode('practice')}
                className="flex items-center justify-center space-x-2 px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-lg transition-colors"
              >
                <Settings className="w-6 h-6" />
                <span>Practice Mode</span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Game Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Advanced assessment capabilities built for modern recruitment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center p-8 bg-gray-50 dark:bg-gray-700 rounded-xl"
            >
              <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Spatial Intelligence
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Measures visual-spatial reasoning, mental rotation abilities, and logical sequencing skills
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center p-8 bg-gray-50 dark:bg-gray-700 rounded-xl"
            >
              <BarChart3 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Detailed Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive scoring based on efficiency, time management, and problem-solving approach
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center p-8 bg-gray-50 dark:bg-gray-700 rounded-xl"
            >
              <Trophy className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Adaptive Difficulty
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Progressive challenge levels from easy 4×4 grids to complex 6×6 puzzles with dead ends
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Simple gameplay mechanics with sophisticated assessment algorithms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: 'Select Tile',
                description: 'Click on any tile to select it for modification',
                icon: '🎯'
              },
              {
                step: 2,
                title: 'Rotate or Toggle',
                description: 'Use rotate button to turn tiles or toggle to flip arrows',
                icon: '🔄'
              },
              {
                step: 3,
                title: 'Create Path',
                description: 'Build a continuous path from spaceship to planet',
                icon: '🛤️'
              },
              {
                step: 4,
                title: 'Submit Solution',
                description: 'Validate your path and receive efficiency scoring',
                icon: '✅'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Practice Settings Modal */}
      {mode === 'landing' && (
        <div className="fixed bottom-8 right-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Practice Settings
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Difficulty
                </label>
                <select
                  value={practiceSettings.difficulty}
                  onChange={(e) => setPracticeSettings(prev => ({
                    ...prev,
                    difficulty: e.target.value as Difficulty
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="easy">Easy (4×4)</option>
                  <option value="medium">Medium (5×5)</option>
                  <option value="hard">Hard (6×6)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Question
                </label>
                <select
                  value={practiceSettings.questionNumber}
                  onChange={(e) => setPracticeSettings(prev => ({
                    ...prev,
                    questionNumber: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value={1}>Question 1</option>
                  <option value={2}>Question 2</option>
                  <option value={3}>Question 3</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};