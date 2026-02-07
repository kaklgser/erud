import { PuzzleConfig, PuzzleResult, UserAssessment, Difficulty } from '../types/spatialReasoning';
import { spatialReasoningService } from './spatialReasoningService';

/**
 * Mock API service for testing the spatial reasoning game without a backend
 */
class SpatialReasoningMockApiService {
  private results: PuzzleResult[] = [];
  private assessments: UserAssessment[] = [];

  /**
   * Start a new puzzle session (generates puzzle locally)
   */
  async startPuzzle(difficulty: Difficulty, questionNumber: number): Promise<PuzzleConfig> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate puzzle using the local service
    const puzzle = spatialReasoningService.generatePuzzle(difficulty, questionNumber);
    
    return puzzle;
  }

  /**
   * Submit puzzle result (stores locally)
   */
  async submitResult(result: Omit<PuzzleResult, 'resultId' | 'timestamp'>): Promise<{
    success: boolean;
    efficiencyScore: number;
    feedback: string;
    nextPuzzle?: { difficulty: Difficulty; questionNumber: number } | null;
  }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const resultWithId: PuzzleResult = {
      ...result,
      resultId: `result_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    // Store result locally
    this.results.push(resultWithId);

    // Calculate efficiency score
    const efficiencyScore = spatialReasoningService.calculateScore(
      result.moveCount,
      result.optimalMoves,
      result.timeSpent,
      300, // 5 minutes
      result.attempts
    ).finalScore;

    // Generate feedback
    let feedback = 'Good job!';
    if (efficiencyScore >= 90) {
      feedback = 'Excellent! Outstanding spatial reasoning skills!';
    } else if (efficiencyScore >= 75) {
      feedback = 'Great work! You solved it efficiently.';
    } else if (efficiencyScore >= 60) {
      feedback = 'Good job! Room for improvement in efficiency.';
    } else {
      feedback = 'Keep practicing to improve your spatial reasoning skills.';
    }

    // Determine next puzzle
    let nextPuzzle: { difficulty: Difficulty; questionNumber: number } | null = null;
    if (result.questionNumber < 3) {
      nextPuzzle = {
        difficulty: result.difficulty,
        questionNumber: result.questionNumber + 1
      };
    }

    return {
      success: true,
      efficiencyScore,
      feedback,
      nextPuzzle
    };
  }

  /**
   * Get user assessment results
   */
  async getUserResults(userId: string): Promise<UserAssessment> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const userResults = this.results.filter(r => r.userId === userId);
    
    if (userResults.length === 0) {
      throw new Error('No results found for user');
    }

    const completedResults = userResults.filter(r => r.completed);
    const completionRate = (completedResults.length / Math.max(userResults.length, 3)) * 100;
    
    const averageScore = completedResults.length > 0 
      ? completedResults.reduce((sum, r) => sum + r.efficiencyScore, 0) / completedResults.length
      : 0;

    const overallScore = Math.round((completionRate * 0.4) + (averageScore * 0.6));

    const assessment: UserAssessment = {
      assessmentId: `assess_${userId}_${Date.now()}`,
      userId,
      startedAt: userResults[0]?.timestamp || new Date().toISOString(),
      completedAt: userResults.length >= 3 ? new Date().toISOString() : null,
      overallScore,
      spatialReasoningScore: Math.round(averageScore),
      completionRate,
      results: userResults
    };

    return assessment;
  }

  /**
   * Save puzzle progress (mock - just returns success)
   */
  async savePuzzleProgress(
    userId: string,
    puzzleId: string,
    gameState: any
  ): Promise<{ success: boolean }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In a real implementation, this would save to a database
    console.log('Mock: Saving puzzle progress for user:', userId, 'puzzle:', puzzleId);
    
    return { success: true };
  }

  /**
   * Load saved puzzle progress (mock - returns null)
   */
  async loadPuzzleProgress(
    userId: string,
    puzzleId: string
  ): Promise<{ gameState: any } | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In a real implementation, this would load from a database
    console.log('Mock: Loading puzzle progress for user:', userId, 'puzzle:', puzzleId);
    
    return null; // No saved progress in mock
  }

  /**
   * Validate puzzle solution server-side (uses local validation)
   */
  async validateSolution(
    puzzleId: string,
    grid: any[][]
  ): Promise<{ isValid: boolean; pathTiles: any[]; message: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Use local validation
    const result = spatialReasoningService.validatePath(grid);
    
    return {
      isValid: result.isValid,
      pathTiles: result.pathTiles,
      message: result.message || 'Validation complete'
    };
  }

  /**
   * Get leaderboard data (mock data)
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
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock leaderboard data
    const mockEntries = [
      {
        userId: 'user1',
        userName: 'Alex Chen',
        averageScore: 92,
        completionRate: 100,
        totalPuzzles: 15,
        rank: 1
      },
      {
        userId: 'user2',
        userName: 'Sarah Johnson',
        averageScore: 88,
        completionRate: 95,
        totalPuzzles: 12,
        rank: 2
      },
      {
        userId: 'user3',
        userName: 'Mike Rodriguez',
        averageScore: 85,
        completionRate: 90,
        totalPuzzles: 18,
        rank: 3
      },
      {
        userId: 'demo-user',
        userName: 'Demo User',
        averageScore: 75,
        completionRate: 80,
        totalPuzzles: 6,
        rank: 4
      }
    ];

    return { entries: mockEntries };
  }

  /**
   * Clear all stored data (for testing)
   */
  clearData(): void {
    this.results = [];
    this.assessments = [];
  }
}

export const spatialReasoningMockApiService = new SpatialReasoningMockApiService();