import { create } from 'zustand';
import { 
  GameState, 
  Tile, 
  PuzzleConfig, 
  GameStatus, 
  Difficulty,
  Position,
  TileRotation,
  ArrowState
} from '../types/spatialReasoning';
import { spatialReasoningService } from '../services/spatialReasoningService';
import { spatialReasoningMockApiService } from '../services/spatialReasoningMockApiService';

interface SpatialReasoningStore extends GameState {
  // Actions
  loadPuzzle: (config: PuzzleConfig, userId: string) => void;
  selectTile: (tileId: string) => void;
  rotateTile: () => void;
  toggleArrows: () => void;
  submitSolution: () => Promise<boolean>;
  updateTimer: () => void;
  resetGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setStatus: (status: GameStatus) => void;
}

const initialState: GameState = {
  puzzleId: '',
  userId: '',
  grid: [],
  selectedTileId: null,
  moveCount: 0,
  rotationCount: 0,
  toggleCount: 0,
  startTime: 0,
  timeLimit: 300,
  timeRemaining: 300,
  isComplete: false,
  isPaused: false,
  difficulty: 'easy',
  questionNumber: 1,
  status: 'idle',
  attempts: 0
};

export const useSpatialReasoningStore = create<SpatialReasoningStore>((set, get) => ({
  ...initialState,

  loadPuzzle: (config: PuzzleConfig, userId: string) => {
    const now = Date.now();
    set({
      puzzleId: config.puzzleId,
      userId,
      grid: config.tiles,
      selectedTileId: null,
      moveCount: 0,
      rotationCount: 0,
      toggleCount: 0,
      startTime: now,
      timeLimit: config.timeLimit,
      timeRemaining: config.timeLimit,
      isComplete: false,
      isPaused: false,
      difficulty: config.difficulty,
      questionNumber: config.questionNumber,
      status: 'ready',
      attempts: 0
    });
  },

  selectTile: (tileId: string) => {
    const state = get();
    if (state.status !== 'playing') return;

    const tile = state.grid.flat().find(t => t.id === tileId);
    if (!tile || tile.isLocked) return;

    set(state => ({
      ...state,
      selectedTileId: tileId,
      grid: state.grid.map(row => 
        row.map(t => ({
          ...t,
          isSelected: t.id === tileId
        }))
      )
    }));
  },

  rotateTile: () => {
    const state = get();
    if (state.status !== 'playing' || !state.selectedTileId) return;

    const selectedTile = state.grid.flat().find(t => t.id === state.selectedTileId);
    if (!selectedTile || selectedTile.isLocked) return;

    const rotatedTile = spatialReasoningService.rotateTile(selectedTile);

    set(state => ({
      ...state,
      moveCount: state.moveCount + 1,
      rotationCount: state.rotationCount + 1,
      grid: state.grid.map(row =>
        row.map(tile =>
          tile.id === state.selectedTileId ? rotatedTile : tile
        )
      )
    }));
  },

  toggleArrows: () => {
    const state = get();
    if (state.status !== 'playing' || !state.selectedTileId) return;

    const selectedTile = state.grid.flat().find(t => t.id === state.selectedTileId);
    if (!selectedTile || selectedTile.isLocked) return;

    const toggledTile = spatialReasoningService.toggleArrows(selectedTile);

    set(state => ({
      ...state,
      moveCount: state.moveCount + 1,
      toggleCount: state.toggleCount + 1,
      grid: state.grid.map(row =>
        row.map(tile =>
          tile.id === state.selectedTileId ? toggledTile : tile
        )
      )
    }));
  },

  submitSolution: async () => {
    const state = get();
    if (state.status !== 'playing') return false;

    const validationResult = spatialReasoningService.validatePath(state.grid);
    
    if (validationResult.isValid) {
      set(state => ({
        ...state,
        isComplete: true,
        status: 'completed',
        grid: state.grid.map(row =>
          row.map(tile => ({
            ...tile,
            isInPath: validationResult.pathTiles.some(pos => 
              pos.row === tile.position.row && pos.col === tile.position.col
            )
          }))
        )
      }));
      return true;
    } else {
      set(state => ({
        ...state,
        attempts: state.attempts + 1
      }));
      return false;
    }
  },

  updateTimer: () => {
    const state = get();
    if (state.status !== 'playing' || state.isPaused) return;

    const newTimeRemaining = Math.max(0, state.timeRemaining - 1);
    
    if (newTimeRemaining === 0) {
      set(state => ({
        ...state,
        timeRemaining: 0,
        status: 'failed'
      }));
    } else {
      set(state => ({
        ...state,
        timeRemaining: newTimeRemaining
      }));
    }
  },

  resetGame: () => {
    set(initialState);
  },

  pauseGame: () => {
    set(state => ({
      ...state,
      isPaused: true,
      status: 'paused'
    }));
  },

  resumeGame: () => {
    set(state => ({
      ...state,
      isPaused: false,
      status: 'playing'
    }));
  },

  setStatus: (status: GameStatus) => {
    set(state => ({
      ...state,
      status
    }));
  }
}));