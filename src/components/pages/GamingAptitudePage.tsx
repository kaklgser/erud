import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Star,
  TrendingUp,
  CheckCircle,
  Gamepad2,
  Zap,
  Target,
  Award,
  Brain,
  Key
} from 'lucide-react';
import { gamingService } from '../../services/gamingService';
import { CompanyWithProgress } from '../../types/gaming';
import { useAuth } from '../../contexts/AuthContext';
import { DarkPageWrapper } from '../ui';
import { PageSidebar } from '../navigation/PageSidebar';

interface GamingAptitudePageProps {
  isAuthenticated: boolean;
  onShowAuth: () => void;
}

export const GamingAptitudePage: React.FC<GamingAptitudePageProps> = ({
  isAuthenticated,
  onShowAuth
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isChristmas = new Date().getMonth() === 11 || new Date().getMonth() === 0;

  const [, setCompanies] = useState<CompanyWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    totalScore: 0,
    completedLevels: 0,
    totalLevels: 0,
    rank: null as number | null
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      loadCompanies();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadCompanies = async () => {
    if (!user) return;
    try {
      const companiesData = await gamingService.getAllCompaniesWithProgress(user.id);
      setCompanies(companiesData);

      const totalScore = companiesData.reduce((sum: number, c: CompanyWithProgress) => sum + c.totalScore, 0);
      const completedLevels = companiesData.reduce((sum: number, c: CompanyWithProgress) => sum + c.completedLevels, 0);
      const totalLevels = companiesData.reduce((sum: number, c: CompanyWithProgress) => sum + c.totalLevels, 0);
      
      // Rank calculation simplified - just use total score position
      const rank: number | null = totalScore > 0 ? 1 : null;

      setGlobalStats({ totalScore, completedLevels, totalLevels, rank });
    } catch (err) {
      console.error('Error loading companies with progress:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DarkPageWrapper showSnow={isChristmas} showSanta={isChristmas}>
        <PageSidebar />
        <div className="md:ml-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Gamepad2 className="w-12 h-12 text-emerald-400 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-400">Loading gaming section...</p>
          </div>
        </div>
      </DarkPageWrapper>
    );
  }

  return (
    <DarkPageWrapper showSnow={isChristmas} showSanta={isChristmas}>
      <PageSidebar />
      <div className="md:ml-16 container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ${
              isChristmas
                ? 'bg-gradient-to-br from-red-500/20 to-green-500/20 border border-red-400/30'
                : 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30'
            }`}>
              <Gamepad2 className={`w-10 h-10 ${isChristmas ? 'text-red-400' : 'text-emerald-400'}`} />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Gaming Aptitude Center
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Test your cognitive abilities with assessment games designed for top consulting firms.
            Complete challenges, earn scores, and climb the leaderboards!
          </p>
        </motion.div>

        {/* Global Stats */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          >
            <div className="bg-slate-900/70 border border-slate-800/70 backdrop-blur-xl rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className={`w-5 h-5 ${isChristmas ? 'text-yellow-400' : 'text-amber-400'}`} />
                <h3 className="text-xs font-medium text-slate-400">Total Score</h3>
              </div>
              <p className="text-2xl font-bold text-white">{globalStats.totalScore.toLocaleString()}</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/70 backdrop-blur-xl rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className={`w-5 h-5 ${isChristmas ? 'text-green-400' : 'text-emerald-400'}`} />
                <h3 className="text-xs font-medium text-slate-400">Completed</h3>
              </div>
              <p className="text-2xl font-bold text-white">{globalStats.completedLevels}/{globalStats.totalLevels}</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/70 backdrop-blur-xl rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xs font-medium text-slate-400">Global Rank</h3>
              </div>
              <p className="text-2xl font-bold text-white">{globalStats.rank ? `#${globalStats.rank}` : '-'}</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/70 backdrop-blur-xl rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-purple-400" />
                <h3 className="text-xs font-medium text-slate-400">Avg Score</h3>
              </div>
              <p className="text-2xl font-bold text-white">
                {globalStats.completedLevels > 0 ? Math.round(globalStats.totalScore / globalStats.completedLevels) : 0}
              </p>
            </div>
          </motion.div>
        )}

        {/* Game Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl p-6 h-full">
              <div className="flex flex-col h-full">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-10 h-10 text-white" />
                    <Zap className="w-8 h-8 text-yellow-300" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Bubble Selection</h2>
                  <p className="text-orange-100 mb-4 text-sm">
                    Test your mental math speed and accuracy. Calculate expressions quickly and select bubbles in ascending order. 24 questions with adaptive difficulty across 14 sections!
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-white text-xs">
                      <Zap className="w-3 h-3" /> Mental Math Speed
                    </span>
                    <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-white text-xs">
                      <Target className="w-3 h-3" /> 24 Questions
                    </span>
                    <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-white text-xs">
                      <Trophy className="w-3 h-3" /> Adaptive Difficulty
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => isAuthenticated ? navigate('/bubble-selection') : onShowAuth()}
                  className="mt-auto w-full px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors shadow-lg"
                >
                  {isAuthenticated ? 'Play Bubble Selection' : 'Login to Play'}
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 h-full">
              <div className="flex flex-col h-full">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="w-10 h-10 text-white" />
                    <Key className="w-8 h-8 text-yellow-300" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Key Finder</h2>
                  <p className="text-blue-100 mb-4 text-sm">
                    Test your spatial memory and navigation skills in this cognitive assessment game. Navigate through an invisible maze to find the key and reach the exit using only your memory.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-white text-xs">
                      <Brain className="w-3 h-3" /> Memory Challenge
                    </span>
                    <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-white text-xs">
                      <Target className="w-3 h-3" /> 3 Difficulty Levels
                    </span>
                    <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-white text-xs">
                      <Trophy className="w-3 h-3" /> Leaderboards
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/key-finder')}
                  className="mt-auto w-full px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-lg"
                >
                  Play Key Finder
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-2xl p-6 h-full">
              <div className="flex flex-col h-full">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="w-10 h-10 text-white" />
                    <Target className="w-8 h-8 text-yellow-300" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Spatial Reasoning</h2>
                  <p className="text-indigo-100 mb-4 text-sm">
                    Test your visual-spatial intelligence with pathfinding puzzles. Rotate tiles and toggle arrows to create a path from spaceship to planet. 3 questions with progressive difficulty!
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-white text-xs">
                      <Brain className="w-3 h-3" /> Spatial Intelligence
                    </span>
                    <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-white text-xs">
                      <Target className="w-3 h-3" /> 3 Questions
                    </span>
                    <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-white text-xs">
                      <Trophy className="w-3 h-3" /> Efficiency Scoring
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/spatial-reasoning')}
                  className="mt-auto w-full px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors shadow-lg"
                >
                  Play Spatial Reasoning
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-slate-900/70 border border-slate-800/70 backdrop-blur-xl rounded-2xl p-8"
        >
          <h2 className="text-xl font-bold text-white mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                isChristmas
                  ? 'bg-red-500/10 border border-red-500/30'
                  : 'bg-emerald-500/10 border border-emerald-500/30'
              }`}>
                <Target className={`w-7 h-7 ${isChristmas ? 'text-red-400' : 'text-emerald-400'}`} />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Choose a Challenge</h3>
              <p className="text-slate-400 text-sm">
                Select from our collection of cognitive games designed for consulting assessments.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Solve the Puzzle</h3>
              <p className="text-slate-400 text-sm">
                Complete various challenges: math calculations, spatial puzzles, memory tasks, and pathfinding within time limits.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-center">
                <Award className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Earn Points & Rank</h3>
              <p className="text-slate-400 text-sm">
                Complete challenges to earn points and climb the global leaderboard.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Auth CTA */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 text-center"
          >
            <button
              onClick={onShowAuth}
              className={`px-8 py-4 font-semibold rounded-xl shadow-lg transition-all ${
                isChristmas
                  ? 'bg-gradient-to-r from-red-500 to-green-600 text-white hover:shadow-red-500/30'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-emerald-500/30'
              }`}
            >
              Sign In to Start Gaming
            </button>
          </motion.div>
        )}
      </div>
    </DarkPageWrapper>
  );
};
