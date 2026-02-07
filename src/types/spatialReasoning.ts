// Spatial Reasoning Puzzle Game Types
export type TileShape = 'straight' | 'L' | 'T' | 'cross';
export type TileRotation = 0 | 90 | 180 | 270;
export type ArrowDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameStatus = 'idle' | 'ready' | 'playing' | 'paused' | 'completed' | 'failed';

export interface Position {
  row: number;
  col: number;
}

export interface ArrowState {
  UP: boolean;
  DOWN: boolean;
  LEFT: boolean;
  RIGHT: boolean;
}

export interface TileConnections {
  UP: boolean;
  DOWN: boolean;
  LEFT: boolean;
  RIGHT: boolean;
}

export interface Tile {
  id: string;
  position: Position;
  shape: TileShape;
  rotation: TileRotation;
  connections: TileConnections;
  arrows: ArrowState;
  isStart: boolean;
  isEnd: boolean;
  isLocked: boolean;
  isSelected: boolean;
  isInPath: boolean;
}

export interface PuzzleConfig {
  puzzleId: string;
  difficulty: Difficulty;
  gridSize: number;
  tiles: Tile[][];
  startPosition: Position;
  endPosition: Position;
  optimalMoves: number;
  timeLimit: number;
  questionNumber: number;
}

export interface GameState {
  puzzleId: string;
  userId: string;
  grid: Tile[][];
  selectedTileId: string | null;
  moveCount: number;
  rotationCount: number;
  toggleCount: number;
  startTime: number;
  timeLimit: number;
  timeRemaining: number;
  isComplete: boolean;
  isPaused: boolean;
  difficulty: Difficulty;
  questionNumber: number;
  status: GameStatus;
  attempts: number;
}

export interface PuzzleResult {
  resultId: string;
  userId: string;
  puzzleId: string;
  difficulty: Difficulty;
  questionNumber: number;
  completed: boolean;
  moveCount: number;
  rotationCount: number;
  toggleCount: number;
  timeSpent: number;
  optimalMoves: number;
  efficiencyScore: number;
  timestamp: string;
  attempts: number;
}

export interface UserAssessment {
  assessmentId: string;
  userId: string;
  startedAt: string;
  completedAt: string | null;
  overallScore: number;
  spatialReasoningScore: number;
  completionRate: number;
  results: PuzzleResult[];
}

export interface PathValidationResult {
  isValid: boolean;
  pathTiles: Position[];
  message?: string;
}

export interface ScoreCalculation {
  baseScore: number;
  timeBonus: number;
  efficiencyBonus: number;
  attemptPenalty: number;
  finalScore: number;
  efficiency: number;
}

// Difficulty Configuration
export interface DifficultyConfig {
  gridSize: number;
  tileTypes: TileShape[];
  deadEndProbability: number;
  optimalMovesRange: [number, number];
  timeLimit: number;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    gridSize: 4,
    tileTypes: ['straight', 'L'],
    deadEndProbability: 0.1,
    optimalMovesRange: [8, 12],
    timeLimit: 300 // 5 minutes
  },
  medium: {
    gridSize: 5,
    tileTypes: ['straight', 'L', 'T'],
    deadEndProbability: 0.3,
    optimalMovesRange: [15, 20],
    timeLimit: 300
  },
  hard: {
    gridSize: 6,
    tileTypes: ['straight', 'L', 'T', 'cross'],
    deadEndProbability: 0.5,
    optimalMovesRange: [25, 35],
    timeLimit: 300
  }
};

// Tile Shape Definitions
export const TILE_SHAPES: Record<TileShape, TileConnections> = {
  straight: { UP: true, DOWN: true, LEFT: false, RIGHT: false },
  L: { UP: true, DOWN: false, LEFT: false, RIGHT: true },
  T: { UP: true, DOWN: true, LEFT: true, RIGHT: false },
  cross: { UP: true, DOWN: true, LEFT: true, RIGHT: true }
};