import { PuzzleConfig, PuzzleResult, UserAssessment, Difficulty } from '../types/spatialReasoning';

class SpatialReasoningApiService {
  private baseUrl = '/api/spatial-reasoning';

  /**
   * Start a new puzzle session
   */
  async startPuzzle(difficulty: Difficulty, questionNumber: number): Promise<PuzzleConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/start?difficulty=${difficulty}&question=${questionNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to start puzzle: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting puzzle:', error);
      throw error;
    }
  }

  /**
   * Submit puzzle result
   */
  async submitResult(result: Omit<PuzzleResult, 'resultId' | 'timestamp'>): Promise<{
    success: boolean;
    efficiencyScore: number;
    feedback: string;
    nextPuzzle?: { difficulty: Difficulty; questionNumber: number } | null;
  }> {
    try {
      const resultWithId: PuzzleResult = {
        ...result,
        resultId: `result_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(`${this.baseUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultWithId),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit result: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting result:', error);
      throw error;
    }
  }

  /**
   * Get user assessment results
   */
  async getUserResults(userId: string): Promise<UserAssessment> {
    try {
      const response = await fetch(`${this.baseUrl}/results/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get results: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting results:', error);
      throw error;
    }
  }

  /**
   * Save puzzle progress (for pause/resume functionality)
   */
  async savePuzzleProgress(
    userId: string,
    puzzleId: string,
    gameState: any
  ): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/save-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          puzzleId,
          gameState,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save progress: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving progress:', error);
      throw error;
    }
  }

  /**
   * Load saved puzzle progress
   */
  async loadPuzzleProgress(
    userId: string,
    puzzleId: string
  ): Promise<{ gameState: any } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/load-progress/${userId}/${puzzleId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        return null; // No saved progress
      }

      if (!response.ok) {
        throw new Error(`Failed to load progress: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading progress:', error);
      return null;
    }
  }

  /**
   * Validate puzzle solution server-side
   */
  async validateSolution(
    puzzleId: string,
    grid: any[][]
  ): Promise<{ isValid: boolean; pathTiles: any[]; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puzzleId,
          grid,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to validate solution: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating solution:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboard(
    difficulty?: Difficulty,
    timeframe: 'daily' | 'weekly' | 'monthly' | 'all' = 'all'
  ): Promise<{
    entries: Array<{
      userId: string;
      userName: string;
      averageScore: number;
      completionRate: number;
      totalPuzzles: number;
      rank: number;
    }>;
  }> {
    try {
      const params = new URLSearchParams();
      if (difficulty) params.append('difficulty', difficulty);
      params.append('timeframe', timeframe);

      const response = await fetch(`${this.baseUrl}/leaderboard?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get leaderboard: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }
}

export const spatialReasoningApiService = new SpatialReasoningApiService();