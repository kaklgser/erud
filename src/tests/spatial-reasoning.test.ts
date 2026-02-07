import { describe, it, expect } from 'vitest';
import { spatialReasoningService } from '../services/spatialReasoningService';
import { Tile, TileRotation, TILE_SHAPES } from '../types/spatialReasoning';

describe('Spatial Reasoning Service', () => {
  describe('Tile Rotation', () => {
    it('should rotate tile 90 degrees clockwise', () => {
      const tile: Tile = {
        id: '0-0',
        position: { row: 0, col: 0 },
        shape: 'L',
        rotation: 0,
        connections: { UP: true, DOWN: false, LEFT: false, RIGHT: true },
        arrows: { UP: true, DOWN: false, LEFT: false, RIGHT: true },
        isStart: false,
        isEnd: false,
        isLocked: false,
        isSelected: false,
        isInPath: false
      };

      const rotated = spatialReasoningService.rotateTile(tile);
      
      expect(rotated.rotation).toBe(90);
      expect(rotated.connections.UP).toBe(false);
      expect(rotated.connections.RIGHT).toBe(true);
      expect(rotated.connections.DOWN).toBe(true);
      expect(rotated.connections.LEFT).toBe(false);
    });

    it('should wrap rotation from 270 to 0', () => {
      const tile: Tile = {
        id: '0-0',
        position: { row: 0, col: 0 },
        shape: 'straight',
        rotation: 270,
        connections: { UP: false, DOWN: false, LEFT: true, RIGHT: true },
        arrows: { UP: true, DOWN: true, LEFT: true, RIGHT: true },
        isStart: false,
        isEnd: false,
        isLocked: false,
        isSelected: false,
        isInPath: false
      };

      const rotated = spatialReasoningService.rotateTile(tile);
      expect(rotated.rotation).toBe(0);
    });

    it('should preserve arrow states during rotation', () => {
      const tile: Tile = {
        id: '0-0',
        position: { row: 0, col: 0 },
        shape: 'T',
        rotation: 0,
        connections: { UP: true, DOWN: true, LEFT: true, RIGHT: false },
        arrows: { UP: true, DOWN: false, LEFT: true, RIGHT: false },
        isStart: false,
        isEnd: false,
        isLocked: false,
        isSelected: false,
        isInPath: false
      };

      const rotated = spatialReasoningService.rotateTile(tile);
      
      // Arrows should remain the same
      expect(rotated.arrows.UP).toBe(true);
      expect(rotated.arrows.DOWN).toBe(false);
      expect(rotated.arrows.LEFT).toBe(true);
      expect(rotated.arrows.RIGHT).toBe(false);
    });
  });

  describe('Arrow Toggle', () => {
    it('should flip all arrow directions', () => {
      const tile: Tile = {
        id: '0-0',
        position: { row: 0, col: 0 },
        shape: 'cross',
        rotation: 0,
        connections: { UP: true, DOWN: true, LEFT: true, RIGHT: true },
        arrows: { UP: true, DOWN: false, LEFT: true, RIGHT: false },
        isStart: false,
        isEnd: false,
        isLocked: false,
        isSelected: false,
        isInPath: false
      };

      const toggled = spatialReasoningService.toggleArrows(tile);
      
      expect(toggled.arrows.UP).toBe(false);
      expect(toggled.arrows.DOWN).toBe(true);
      expect(toggled.arrows.LEFT).toBe(false);
      expect(toggled.arrows.RIGHT).toBe(true);
    });

    it('should not change tile rotation or shape', () => {
      const tile: Tile = {
        id: '0-0',
        position: { row: 0, col: 0 },
        shape: 'L',
        rotation: 90,
        connections: { UP: false, DOWN: true, LEFT: false, RIGHT: true },
        arrows: { UP: true, DOWN: true, LEFT: false, RIGHT: true },
        isStart: false,
        isEnd: false,
        isLocked: false,
        isSelected: false,
        isInPath: false
      };

      const toggled = spatialReasoningService.toggleArrows(tile);
      
      expect(toggled.shape).toBe('L');
      expect(toggled.rotation).toBe(90);
      expect(toggled.connections).toEqual(tile.connections);
    });
  });

  describe('Path Validation', () => {
    it('should validate a simple straight path', () => {
      // Create a simple 1x2 grid with start and end tiles
      const startTile: Tile = {
        id: '0-0',
        position: { row: 0, col: 0 },
        shape: 'straight',
        rotation: 90,
        connections: { UP: false, DOWN: false, LEFT: false, RIGHT: true },
        arrows: { UP: false, DOWN: false, LEFT: false, RIGHT: true },
        isStart: true,
        isEnd: false,
        isLocked: true,
        isSelected: false,
        isInPath: false
      };

      const endTile: Tile = {
        id: '0-1',
        position: { row: 0, col: 1 },
        shape: 'straight',
        rotation: 90,
        connections: { UP: false, DOWN: false, LEFT: true, RIGHT: false },
        arrows: { UP: false, DOWN: false, LEFT: true, RIGHT: false },
        isStart: false,
        isEnd: true,
        isLocked: true,
        isSelected: false,
        isInPath: false
      };

      const grid: Tile[][] = [[startTile, endTile]];

      const result = spatialReasoningService.validatePath(grid);
      
      expect(result.isValid).toBe(true);
      expect(result.pathTiles.length).toBe(2);
      expect(result.pathTiles[0]).toEqual({ row: 0, col: 0 });
      expect(result.pathTiles[1]).toEqual({ row: 0, col: 1 });
    });

    it('should reject path with disabled arrows', () => {
      const grid: Tile[][] = [
        [
          {
            id: '0-0',
            position: { row: 0, col: 0 },
            shape: 'straight',
            rotation: 90,
            connections: { UP: false, DOWN: false, LEFT: false, RIGHT: true },
            arrows: { UP: false, DOWN: false, LEFT: false, RIGHT: false }, // Arrow disabled
            isStart: true,
            isEnd: false,
            isLocked: true,
            isSelected: false,
            isInPath: false
          },
          {
            id: '0-1',
            position: { row: 0, col: 1 },
            shape: 'straight',
            rotation: 90,
            connections: { UP: false, DOWN: false, LEFT: true, RIGHT: false },
            arrows: { UP: false, DOWN: false, LEFT: true, RIGHT: false },
            isStart: false,
            isEnd: true,
            isLocked: true,
            isSelected: false,
            isInPath: false
          }
        ]
      ];

      const result = spatialReasoningService.validatePath(grid);
      
      expect(result.isValid).toBe(false);
    });

    it('should validate L-shaped path', () => {
      const grid: Tile[][] = [
        [
          {
            id: '0-0',
            position: { row: 0, col: 0 },
            shape: 'L',
            rotation: 90,
            connections: { UP: false, DOWN: true, LEFT: false, RIGHT: true },
            arrows: { UP: false, DOWN: true, LEFT: false, RIGHT: true },
            isStart: true,
            isEnd: false,
            isLocked: true,
            isSelected: false,
            isInPath: false
          },
          {
            id: '0-1',
            position: { row: 0, col: 1 },
            shape: 'straight',
            rotation: 90,
            connections: { UP: false, DOWN: false, LEFT: true, RIGHT: false },
            arrows: { UP: false, DOWN: false, LEFT: true, RIGHT: false },
            isStart: false,
            isEnd: true,
            isLocked: true,
            isSelected: false,
            isInPath: false
          }
        ],
        [
          {
            id: '1-0',
            position: { row: 1, col: 0 },
            shape: 'straight',
            rotation: 0,
            connections: { UP: true, DOWN: false, LEFT: false, RIGHT: false },
            arrows: { UP: true, DOWN: false, LEFT: false, RIGHT: false },
            isStart: false,
            isEnd: false,
            isLocked: false,
            isSelected: false,
            isInPath: false
          },
          {
            id: '1-1',
            position: { row: 1, col: 1 },
            shape: 'straight',
            rotation: 0,
            connections: { UP: false, DOWN: false, LEFT: false, RIGHT: false },
            arrows: { UP: false, DOWN: false, LEFT: false, RIGHT: false },
            isStart: false,
            isEnd: false,
            isLocked: false,
            isSelected: false,
            isInPath: false
          }
        ]
      ];

      const result = spatialReasoningService.validatePath(grid);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('Score Calculation', () => {
    it('should calculate perfect score for optimal moves', () => {
      const score = spatialReasoningService.calculateScore(10, 10, 120, 300, 1);
      
      expect(score.finalScore).toBe(100);
      expect(score.efficiency).toBe(100);
    });

    it('should apply time bonus for fast completion', () => {
      const score = spatialReasoningService.calculateScore(10, 10, 150, 300, 1);
      
      expect(score.timeBonus).toBe(10);
      expect(score.finalScore).toBeGreaterThanOrEqual(100);
    });

    it('should penalize for extra moves', () => {
      const score = spatialReasoningService.calculateScore(20, 10, 200, 300, 1);
      
      expect(score.efficiency).toBe(50);
      expect(score.finalScore).toBeLessThan(100);
    });

    it('should penalize for failed attempts', () => {
      const scoreNoAttempts = spatialReasoningService.calculateScore(10, 10, 200, 300, 1);
      const scoreWithAttempts = spatialReasoningService.calculateScore(10, 10, 200, 300, 3);
      
      expect(scoreWithAttempts.attemptPenalty).toBe(10); // 2 extra attempts * 5
      expect(scoreWithAttempts.finalScore).toBeLessThan(scoreNoAttempts.finalScore);
    });

    it('should clamp score between 0 and 100', () => {
      const score = spatialReasoningService.calculateScore(100, 10, 300, 300, 10);
      
      expect(score.finalScore).toBeGreaterThanOrEqual(0);
      expect(score.finalScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Puzzle Generation', () => {
    it('should generate easy puzzle with correct grid size', () => {
      const puzzle = spatialReasoningService.generatePuzzle('easy', 1);
      
      expect(puzzle.gridSize).toBe(4);
      expect(puzzle.tiles.length).toBe(4);
      expect(puzzle.tiles[0].length).toBe(4);
      expect(puzzle.difficulty).toBe('easy');
    });

    it('should generate medium puzzle with correct grid size', () => {
      const puzzle = spatialReasoningService.generatePuzzle('medium', 2);
      
      expect(puzzle.gridSize).toBe(5);
      expect(puzzle.tiles.length).toBe(5);
      expect(puzzle.tiles[0].length).toBe(5);
      expect(puzzle.difficulty).toBe('medium');
    });

    it('should generate hard puzzle with correct grid size', () => {
      const puzzle = spatialReasoningService.generatePuzzle('hard', 3);
      
      expect(puzzle.gridSize).toBe(6);
      expect(puzzle.tiles.length).toBe(6);
      expect(puzzle.tiles[0].length).toBe(6);
      expect(puzzle.difficulty).toBe('hard');
    });

    it('should have start and end tiles', () => {
      const puzzle = spatialReasoningService.generatePuzzle('medium', 1);
      
      const allTiles = puzzle.tiles.flat();
      const startTiles = allTiles.filter(t => t.isStart);
      const endTiles = allTiles.filter(t => t.isEnd);
      
      expect(startTiles.length).toBe(1);
      expect(endTiles.length).toBe(1);
      expect(startTiles[0].isLocked).toBe(true);
      expect(endTiles[0].isLocked).toBe(true);
    });

    it('should have optimal moves within range', () => {
      const puzzle = spatialReasoningService.generatePuzzle('easy', 1);
      
      expect(puzzle.optimalMoves).toBeGreaterThanOrEqual(8);
      expect(puzzle.optimalMoves).toBeLessThanOrEqual(12);
    });

    it('should set correct time limit', () => {
      const puzzle = spatialReasoningService.generatePuzzle('medium', 1);
      
      expect(puzzle.timeLimit).toBe(300); // 5 minutes
    });
  });
});