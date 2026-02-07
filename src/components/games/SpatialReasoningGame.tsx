import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { useSpatialReasoningStore } from '../../stores/spatialReasoningStore';
import { spatialReasoningService } from '../../services/spatialReasoningService';
import { spatialReasoningMockApiService } from '../../services/spatialReasoningMockApiService';
import { Difficulty } from '../../types/spatialReasoning';
import { PathTile } from './PathTile';

interface SpatialReasoningGameProps {
  difficulty: Difficulty;
  questionNumber: number;
  userId: string;
  onGameComplete: (score: number, efficiency: number, timeSpent: number) => void;
  onGameExit: () => void;
}

export const SpatialReasoningGame: React.FC<SpatialReasoningGameProps> = ({
  difficulty,
  questionNumber,
  userId,
  onGameComplete,
  onGameExit,
}) => {
  const store = useSpatialReasoningStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gameStartedRef = useRef(false);
  const [showInvalidPath, setShowInvalidPath] = useState(false);

  useEffect(() => {
    const initializeGame = async () => {
      try {
        const puzzle = await spatialReasoningMockApiService.startPuzzle(difficulty, questionNumber);
        store.loadPuzzle(puzzle, userId);
      } catch (error) {
        console.error('Failed to initialize game:', error);
        const puzzle = spatialReasoningService.generatePuzzle(difficulty, questionNumber);
        store.loadPuzzle(puzzle, userId);
      }
    };
    initializeGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty, questionNumber, userId]);

  useEffect(() => {
    if (store.status === 'playing' && !gameStartedRef.current) {
      gameStartedRef.current = true;
      timerRef.current = setInterval(() => store.updateTimer(), 1000);
    }
    if (store.status === 'paused' && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (store.status === 'playing' && store.isPaused && !timerRef.current) {
      timerRef.current = setInterval(() => store.updateTimer(), 1000);
    }
    if ((store.status === 'completed' || store.status === 'failed') && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [store.status, store.isPaused]);

  useEffect(() => {
    if (store.status === 'completed') {
      const timeSpent = store.timeLimit - store.timeRemaining;
      const scoreCalc = spatialReasoningService.calculateScore(store.moveCount, 10, timeSpent, store.timeLimit, store.attempts);
      setTimeout(() => onGameComplete(scoreCalc.finalScore, scoreCalc.efficiency, timeSpent), 2000);
    }
  }, [store.status, store.moveCount, store.timeLimit, store.timeRemaining, store.attempts, onGameComplete]);

  const startGame = () => store.setStatus('playing');

  const handleRotate = () => {
    if (store.selectedTileId) store.rotateTile();
  };

  const handleToggle = () => {
    if (store.selectedTileId) store.toggleArrows();
  };

  const handleSubmit = async () => {
    const isValid = await store.submitSolution();
    if (!isValid) {
      setShowInvalidPath(true);
      setTimeout(() => setShowInvalidPath(false), 2000);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (store.status === 'idle') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-500 mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Loading puzzle...</p>
        </div>
      </div>
    );
  }

  const gridSize = store.grid.length;
  const tileSize = 56;

  const startTile = store.grid.flat().find((t) => t.isStart);
  const endTile = store.grid.flat().find((t) => t.isEnd);
  const startRow = startTile?.position.row ?? Math.floor(gridSize / 2);
  const endRow = endTile?.position.row ?? Math.floor(gridSize / 2);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      {/* Invalid path toast */}
      <AnimatePresence>
        {showInvalidPath && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-5 py-2 rounded-lg shadow-lg z-50 text-sm"
          >
            Invalid path! Try again.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start overlay */}
      {store.status === 'ready' && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-40">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 text-center shadow-xl max-w-sm"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-3">Question {questionNumber}</h2>
            <p className="text-slate-600 mb-5 text-sm">
              Create a path from 🚀 to 🌍 by rotating tiles and toggling arrows
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              Start
            </button>
          </motion.div>
        </div>
      )}

      {/* Game area */}
      <div className="flex flex-col items-center">
        {/* Grid with icons */}
        <div className="relative mb-6">
          {/* Spaceship - left */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '-45px',
              top: `${startRow * tileSize + tileSize / 2 - 16}px`,
            }}
          >
            <svg viewBox="0 0 32 32" width="32" height="32">
              <polygon points="28,16 6,6 10,16 6,26" fill="#334155" />
            </svg>
          </div>

          {/* Grid container */}
          <div
            className="bg-white rounded-lg shadow-sm"
            style={{
              padding: '2px',
              display: 'grid',
              gridTemplateColumns: `repeat(${gridSize}, ${tileSize}px)`,
              gap: '1px',
              backgroundColor: '#e2e8f0',
            }}
          >
            {store.grid.map((row) =>
              row.map((tile) => (
                <PathTile
                  key={tile.id}
                  tile={tile}
                  onSelect={() => store.selectTile(tile.id)}
                  disabled={store.status !== 'playing'}
                  gridSize={gridSize}
                />
              ))
            )}
          </div>

          {/* Planet - right */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              right: '-45px',
              top: `${endRow * tileSize + tileSize / 2 - 16}px`,
            }}
          >
            <svg viewBox="0 0 32 32" width="32" height="32">
              <circle cx="16" cy="16" r="12" fill="none" stroke="#334155" strokeWidth="2" />
              <ellipse cx="16" cy="16" rx="18" ry="6" fill="none" stroke="#334155" strokeWidth="1.5" transform="rotate(-20 16 16)" />
            </svg>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="relative w-14 h-14">
            <svg className="w-full h-full" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="white" stroke="#e2e8f0" strokeWidth="2" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-slate-700">{formatTime(store.timeRemaining)}</span>
            </div>
          </div>

          {/* Rotate button */}
          <button
            onClick={handleRotate}
            disabled={!store.selectedTileId || store.status !== 'playing'}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
              store.selectedTileId
                ? 'bg-slate-400 hover:bg-slate-500 ring-2 ring-cyan-400'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
            title="Rotate"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          {/* Toggle button */}
          <button
            onClick={handleToggle}
            disabled={!store.selectedTileId || store.status !== 'playing'}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
              store.selectedTileId
                ? 'bg-slate-500 hover:bg-slate-600'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
            title="Toggle arrows"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 16l-4-4 4-4" />
              <path d="M17 8l4 4-4 4" />
              <path d="M3 12h18" />
            </svg>
          </button>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={store.status !== 'playing'}
            className="w-12 h-12 bg-slate-500 hover:bg-slate-600 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
            title="Submit"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>

        {/* Move counter */}
        <div className="mt-3 text-slate-400 text-sm">Moves: {store.moveCount}</div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {store.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center shadow-xl">
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Puzzle Complete!</h2>
              <p className="text-slate-600 mb-4 text-sm">Great job! You created a valid path.</p>
              <div className="space-y-1 mb-4 text-sm">
                <p><span className="text-slate-500">Time:</span> <span className="font-semibold">{formatTime(store.timeLimit - store.timeRemaining)}</span></p>
                <p><span className="text-slate-500">Moves:</span> <span className="font-semibold">{store.moveCount}</span></p>
              </div>
            </div>
          </motion.div>
        )}

        {store.status === 'failed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center shadow-xl">
              <XCircle className="w-14 h-14 text-red-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Time's Up!</h2>
              <p className="text-slate-600 mb-4 text-sm">You ran out of time.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const puzzle = spatialReasoningService.generatePuzzle(difficulty, questionNumber);
                    store.loadPuzzle(puzzle, userId);
                    gameStartedRef.current = false;
                  }}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={onGameExit}
                  className="flex-1 px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-sm font-medium"
                >
                  Exit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
