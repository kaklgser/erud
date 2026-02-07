import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Clock, 
  Target, 
  Trophy, 
  CheckCircle, 
  ArrowRight,
  BarChart3,
  Download
} from 'lucide-react';
import { SpatialReasoningGame } from './SpatialReasoningGame';
import { spatialReasoningApiService } from '../../services/spatialReasoningApiService';
import { Difficulty, PuzzleResult, UserAssessment } from '../../types/spatialReasoning';

interface SpatialReasoningAssessmentProps {
  userId: string;
  onAssessmentComplete: (assessment: UserAssessment) => void;
  onExit: () => void;
}

interface QuestionResult {
  questionNumber: number;
  difficulty: Difficulty;
  score: number;
  efficiency: number;
  timeSpent: number;
  completed: boolean;
}

export const SpatialReasoningAssessment: React.FC<SpatialReasoningAssessmentProps> = ({
  userId,
  onAssessmentComplete,
  onExit
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [finalAssessment, setFinalAssessment] = useState<UserAssessment | null>(null);
  const [startTime] = useState(Date.now());

  // Progressive difficulty or consistent difficulty
  const getDifficulty = (questionNumber: number): Difficulty => {
    // You can modify this to have progressive difficulty
    // For now, using medium for all questions
    return 'medium';
  };

  const startAssessment = () => {
    setAssessmentStarted(true);
  };

  const handleGameComplete = async (score: number, efficiency: number, timeSpent: number) => {
    const questionResult: QuestionResult = {
      questionNumber: currentQuestion,
      difficulty: getDifficulty(currentQuestion),
      score,
      efficiency,
      timeSpent,
      completed: true
    };

    const newResults = [...results, questionResult];
    setResults(newResults);

    // Submit result to backend
    try {
      const puzzleResult: Omit<PuzzleResult, 'resultId' | 'timestamp'> = {
        userId,
        puzzleId: `puzzle_${getDifficulty(currentQuestion)}_q${currentQuestion}_${Date.now()}`,
        difficulty: getDifficulty(currentQuestion),
        questionNumber: currentQuestion,
        completed: true,
        moveCount: 0, // This should come from the game state
        rotationCount: 0,
        toggleCount: 0,
        timeSpent,
        optimalMoves: 15, // This should come from the puzzle config
        efficiencyScore: efficiency,
        attempts: 1
      };

      await spatialReasoningApiService.submitResult(puzzleResult);
    } catch (error) {
      console.error('Failed to submit result:', error);
    }

    // Check if assessment is complete
    if (currentQuestion >= 3) {
      completeAssessment(newResults);
    } else {
      // Move to next question after a delay
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
      }, 3000);
    }
  };

  const completeAssessment = async (allResults: QuestionResult[]) => {
    const completedResults = allResults.filter(r => r.completed);
    const completionRate = (completedResults.length / 3) * 100;
    const averageScore = completedResults.reduce((sum, r) => sum + r.score, 0) / Math.max(completedResults.length, 1);
    const averageEfficiency = completedResults.reduce((sum, r) => sum + r.efficiency, 0) / Math.max(completedResults.length, 1);
    
    // Calculate overall score (weighted average)
    const overallScore = Math.round((completionRate * 0.4) + (averageScore * 0.6));
    
    const assessment: UserAssessment = {
      assessmentId: `assess_${userId}_${Date.now()}`,
      userId,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      overallScore,
      spatialReasoningScore: Math.round(averageEfficiency),
      completionRate,
      results: [] // This would be populated from the backend
    };

    setFinalAssessment(assessment);
    setIsComplete(true);

    // Submit final assessment
    setTimeout(() => {
      onAssessmentComplete(assessment);
    }, 5000);
  };

  const handleGameExit = () => {
    if (currentQuestion > 1 || results.length > 0) {
      // Save partial progress
      completeAssessment(results);
    } else {
      onExit();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exportResults = () => {
    // This would integrate with your existing PDF export functionality
    console.log('Exporting results...', finalAssessment);
  };

  if (!assessmentStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl text-center"
        >
          <Brain className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Spatial Reasoning Assessment
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            Test your visual-spatial intelligence with our pathfinding puzzle game. 
            You'll complete 3 questions, each with a 5-minute time limit.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">3 Questions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Progressive difficulty</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">5 Min Each</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Time limit per question</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Efficiency Score</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Based on moves & time</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Instructions:</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>• Click tiles to select them</li>
              <li>• Use Rotate to turn tiles 90° clockwise</li>
              <li>• Use Toggle to flip arrow directions</li>
              <li>• Create a path from 🚀 to 🪐</li>
              <li>• Submit when you have a valid path</li>
            </ul>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={onExit}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={startAssessment}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Start Assessment
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isComplete && finalAssessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl w-full bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl"
        >
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Assessment Complete!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here are your spatial reasoning assessment results
            </p>
          </div>

          {/* Overall Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
              <Trophy className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {finalAssessment.overallScore}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Overall Score</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
              <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {finalAssessment.spatialReasoningScore}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Spatial Reasoning</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 text-center">
              <Target className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {finalAssessment.completionRate}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
            </div>
          </div>

          {/* Question Breakdown */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Question Breakdown
            </h3>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                      {result.questionNumber}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        Question {result.questionNumber}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {result.difficulty.charAt(0).toUpperCase() + result.difficulty.slice(1)} • {formatTime(result.timeSpent)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-gray-100">
                      {result.score}/100
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {result.efficiency}% efficiency
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={exportResults}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Export Results</span>
            </button>
            <button
              onClick={() => onAssessmentComplete(finalAssessment)}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress Indicator */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-full px-6 py-2 shadow-lg border">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Question {currentQuestion} of 3
            </span>
            <div className="flex space-x-1">
              {[1, 2, 3].map((q) => (
                <div
                  key={q}
                  className={`w-2 h-2 rounded-full ${
                    q < currentQuestion
                      ? 'bg-green-500'
                      : q === currentQuestion
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <SpatialReasoningGame
        difficulty={getDifficulty(currentQuestion)}
        questionNumber={currentQuestion}
        userId={userId}
        onGameComplete={handleGameComplete}
        onGameExit={handleGameExit}
      />
    </div>
  );
};