import {
  Tile,
  TileShape,
  TileRotation,
  TileConnections,
  Position,
  PuzzleConfig,
  Difficulty,
  PathValidationResult,
  ScoreCalculation,
  DIFFICULTY_CONFIGS,
  TILE_SHAPES,
} from '../types/spatialReasoning';

class SpatialReasoningService {
  generatePuzzle(difficulty: Difficulty, questionNumber: number): PuzzleConfig {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const puzzleId = `puzzle_${difficulty}_q${questionNumber}_${Date.now()}`;
    const gridSize = config.gridSize;

    // Random start/end positions
    const startRow = Math.floor(Math.random() * gridSize);
    const endRow = Math.floor(Math.random() * gridSize);
    const startPosition: Position = { row: startRow, col: 0 };
    const endPosition: Position = { row: endRow, col: gridSize - 1 };

    // Generate path
    const pathPositions = this.generatePathPositions(startPosition, endPosition, gridSize);

    // Create grid
    const tiles: Tile[][] = [];
    for (let row = 0; row < gridSize; row++) {
      tiles[row] = [];
      for (let col = 0; col < gridSize; col++) {
        const isStart = row === startPosition.row && col === startPosition.col;
        const isEnd = row === endPosition.row && col === endPosition.col;
        const pathIndex = pathPositions.findIndex((p) => p.row === row && p.col === col);
        const isOnPath = pathIndex !== -1;

        if (isOnPath) {
          const prev = pathIndex > 0 ? pathPositions[pathIndex - 1] : null;
          const next = pathIndex < pathPositions.length - 1 ? pathPositions[pathIndex + 1] : null;
          tiles[row][col] = this.createPathTile(`${row}-${col}`, { row, col }, prev, next, isStart, isEnd);
        } else {
          // 60% chance of having a tile, 40% empty
          const hasTile = Math.random() < 0.6;
          if (hasTile) {
            tiles[row][col] = this.createRandomTile(`${row}-${col}`, { row, col }, config.tileTypes);
          } else {
            tiles[row][col] = this.createEmptyTile(`${row}-${col}`, { row, col });
          }
        }
      }
    }

    this.scramblePuzzle(tiles);

    return {
      puzzleId,
      difficulty,
      gridSize,
      tiles,
      startPosition,
      endPosition,
      optimalMoves: this.calculateOptimalMoves(config),
      timeLimit: config.timeLimit,
      questionNumber,
    };
  }

  private generatePathPositions(start: Position, end: Position, gridSize: number): Position[] {
    const path: Position[] = [{ ...start }];
    let current = { ...start };

    while (current.col < end.col || current.row !== end.row) {
      const canGoRight = current.col < end.col;
      const needsVertical = current.row !== end.row;
      const distanceToEnd = end.col - current.col;

      if (needsVertical && (Math.random() < 0.35 || distanceToEnd <= 1)) {
        current.row += current.row < end.row ? 1 : -1;
      } else if (canGoRight) {
        current.col++;
      } else if (needsVertical) {
        current.row += current.row < end.row ? 1 : -1;
      }

      current.row = Math.max(0, Math.min(gridSize - 1, current.row));
      current.col = Math.max(0, Math.min(gridSize - 1, current.col));
      path.push({ ...current });

      if (path.length > gridSize * gridSize) break;
    }

    return path;
  }

  private createPathTile(
    id: string,
    position: Position,
    prev: Position | null,
    next: Position | null,
    isStart: boolean,
    isEnd: boolean
  ): Tile {
    const connections: TileConnections = { UP: false, DOWN: false, LEFT: false, RIGHT: false };

    if (prev) {
      if (prev.row < position.row) connections.UP = true;
      if (prev.row > position.row) connections.DOWN = true;
      if (prev.col < position.col) connections.LEFT = true;
      if (prev.col > position.col) connections.RIGHT = true;
    }

    if (next) {
      if (next.row < position.row) connections.UP = true;
      if (next.row > position.row) connections.DOWN = true;
      if (next.col < position.col) connections.LEFT = true;
      if (next.col > position.col) connections.RIGHT = true;
    }

    if (isStart && !connections.RIGHT) connections.RIGHT = true;
    if (isEnd && !connections.LEFT) connections.LEFT = true;

    const { shape, rotation } = this.findShapeForConnections(connections);

    return {
      id,
      position,
      shape,
      rotation,
      connections,
      arrows: { ...connections },
      isStart,
      isEnd,
      isLocked: false,
      isSelected: false,
      isInPath: false,
    };
  }

  private createRandomTile(id: string, position: Position, allowedTypes: TileShape[]): Tile {
    const shape = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
    const rotation = ([0, 90, 180, 270] as TileRotation[])[Math.floor(Math.random() * 4)];
    const connections = this.rotateConnections(TILE_SHAPES[shape], rotation);

    return {
      id,
      position,
      shape,
      rotation,
      connections,
      arrows: { UP: connections.UP, DOWN: connections.DOWN, LEFT: connections.LEFT, RIGHT: connections.RIGHT },
      isStart: false,
      isEnd: false,
      isLocked: false,
      isSelected: false,
      isInPath: false,
    };
  }

  private createEmptyTile(id: string, position: Position): Tile {
    return {
      id,
      position,
      shape: 'straight',
      rotation: 0,
      connections: { UP: false, DOWN: false, LEFT: false, RIGHT: false },
      arrows: { UP: false, DOWN: false, LEFT: false, RIGHT: false },
      isStart: false,
      isEnd: false,
      isLocked: false,
      isSelected: false,
      isInPath: false,
    };
  }

  private scramblePuzzle(tiles: Tile[][]): void {
    for (const row of tiles) {
      for (let i = 0; i < row.length; i++) {
        const tile = row[i];
        const hasConn = tile.connections.UP || tile.connections.DOWN || tile.connections.LEFT || tile.connections.RIGHT;
        if (!hasConn) continue;

        const rotations = Math.floor(Math.random() * 4);
        for (let r = 0; r < rotations; r++) {
          row[i] = this.rotateTile(row[i]);
        }

        if (Math.random() < 0.15) {
          row[i] = this.toggleArrows(row[i]);
        }
      }
    }
  }

  rotateTile(tile: Tile): Tile {
    const newRotation = ((tile.rotation + 90) % 360) as TileRotation;
    const newConnections = this.rotateConnections(TILE_SHAPES[tile.shape], newRotation);

    return {
      ...tile,
      rotation: newRotation,
      connections: newConnections,
      arrows: {
        UP: tile.arrows.LEFT,
        RIGHT: tile.arrows.UP,
        DOWN: tile.arrows.RIGHT,
        LEFT: tile.arrows.DOWN,
      },
    };
  }

  toggleArrows(tile: Tile): Tile {
    return {
      ...tile,
      arrows: {
        UP: tile.connections.UP ? !tile.arrows.UP : false,
        DOWN: tile.connections.DOWN ? !tile.arrows.DOWN : false,
        LEFT: tile.connections.LEFT ? !tile.arrows.LEFT : false,
        RIGHT: tile.connections.RIGHT ? !tile.arrows.RIGHT : false,
      },
    };
  }

  private rotateConnections(connections: TileConnections, rotation: TileRotation): TileConnections {
    let result = { ...connections };
    const steps = rotation / 90;

    for (let i = 0; i < steps; i++) {
      const temp = result.UP;
      result.UP = result.LEFT;
      result.LEFT = result.DOWN;
      result.DOWN = result.RIGHT;
      result.RIGHT = temp;
    }

    return result;
  }

  validatePath(grid: Tile[][]): PathValidationResult {
    const startTile = grid.flat().find((t) => t.isStart);
    const endTile = grid.flat().find((t) => t.isEnd);

    if (!startTile || !endTile) {
      return { isValid: false, pathTiles: [], message: 'Start or end not found' };
    }

    const visited = new Set<string>();
    const queue: { tile: Tile; path: Position[] }[] = [{ tile: startTile, path: [startTile.position] }];

    while (queue.length > 0) {
      const { tile, path } = queue.shift()!;
      const key = `${tile.position.row}-${tile.position.col}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (tile.isEnd) {
        return { isValid: true, pathTiles: path, message: 'Valid path found' };
      }

      const dirs = [
        { dir: 'UP' as const, dr: -1, dc: 0, opp: 'DOWN' as const },
        { dir: 'DOWN' as const, dr: 1, dc: 0, opp: 'UP' as const },
        { dir: 'LEFT' as const, dr: 0, dc: -1, opp: 'RIGHT' as const },
        { dir: 'RIGHT' as const, dr: 0, dc: 1, opp: 'LEFT' as const },
      ];

      for (const { dir, dr, dc, opp } of dirs) {
        if (!tile.connections[dir] || !tile.arrows[dir]) continue;

        const nr = tile.position.row + dr;
        const nc = tile.position.col + dc;

        if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) continue;

        const neighbor = grid[nr][nc];
        if (visited.has(`${nr}-${nc}`)) continue;
        if (!neighbor.connections[opp] || !neighbor.arrows[opp]) continue;

        queue.push({ tile: neighbor, path: [...path, neighbor.position] });
      }
    }

    return { isValid: false, pathTiles: [], message: 'No valid path' };
  }

  calculateScore(
    actualMoves: number,
    optimalMoves: number,
    timeSpent: number,
    _timeLimit: number,
    attempts: number
  ): ScoreCalculation {
    const baseScore = Math.round((optimalMoves / Math.max(actualMoves, 1)) * 100);
    const timeBonus = timeSpent < 180 ? 10 : 0;
    const attemptPenalty = Math.max(0, (attempts - 1) * 5);
    const finalScore = Math.max(0, Math.min(100, baseScore + timeBonus - attemptPenalty));

    return {
      baseScore,
      timeBonus,
      efficiencyBonus: 0,
      attemptPenalty,
      finalScore,
      efficiency: Math.round((optimalMoves / Math.max(actualMoves, 1)) * 100),
    };
  }

  private findShapeForConnections(req: TileConnections): { shape: TileShape; rotation: TileRotation } {
    const count = [req.UP, req.DOWN, req.LEFT, req.RIGHT].filter(Boolean).length;

    if (count === 1) {
      if (req.UP) return { shape: 'straight', rotation: 0 };
      if (req.DOWN) return { shape: 'straight', rotation: 180 };
      if (req.LEFT) return { shape: 'straight', rotation: 270 };
      return { shape: 'straight', rotation: 90 };
    }

    if (count === 2) {
      if (req.UP && req.DOWN) return { shape: 'straight', rotation: 0 };
      if (req.LEFT && req.RIGHT) return { shape: 'straight', rotation: 90 };
      if (req.UP && req.RIGHT) return { shape: 'L', rotation: 0 };
      if (req.DOWN && req.RIGHT) return { shape: 'L', rotation: 90 };
      if (req.DOWN && req.LEFT) return { shape: 'L', rotation: 180 };
      return { shape: 'L', rotation: 270 };
    }

    if (count === 3) {
      if (!req.UP) return { shape: 'T', rotation: 180 };
      if (!req.DOWN) return { shape: 'T', rotation: 0 };
      if (!req.LEFT) return { shape: 'T', rotation: 90 };
      return { shape: 'T', rotation: 270 };
    }

    if (count === 4) return { shape: 'cross', rotation: 0 };

    return { shape: 'straight', rotation: 90 };
  }

  private calculateOptimalMoves(config: { optimalMovesRange: [number, number] }): number {
    const [min, max] = config.optimalMovesRange;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export const spatialReasoningService = new SpatialReasoningService();
