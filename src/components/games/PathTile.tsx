import React from 'react';
import { motion } from 'framer-motion';
import { Tile } from '../../types/spatialReasoning';

interface PathTileProps {
  tile: Tile;
  onSelect: () => void;
  disabled?: boolean;
  gridSize: number;
}

export const PathTile: React.FC<PathTileProps> = ({
  tile,
  onSelect,
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled && !tile.isLocked) {
      onSelect();
    }
  };

  const isSelected = tile.isSelected;
  const isPath = tile.isInPath;

  const tileSize = 56; // Keep it fixed to match grid styling
  const { connections, arrows: arrowState } = tile;

  // Check if tile has connections
  const hasConnections =
    connections.UP || connections.DOWN || connections.LEFT || connections.RIGHT;

  // Background color for empty tiles
  if (!hasConnections) {
    return (
      <div
        className="bg-white"
        style={{ width: `${tileSize}px`, height: `${tileSize}px` }}
      />
    );
  }

  const pathColor = isPath ? '#22c55e' : '#64748b'; // Path color (slate gray in the reference)
  const pathWidth = 20;
  const center = tileSize / 2;
  const arrowColor = '#94a3b8'; // Light gray for arrows

  // Render path segments
  const renderPaths = () => {
    const paths: JSX.Element[] = [];
    if (connections.UP) {
      paths.push(
        <rect
          key="up"
          x={center - pathWidth / 2}
          y={0}
          width={pathWidth}
          height={center + pathWidth / 2}
          fill={pathColor}
        />
      );
    }
    if (connections.DOWN) {
      paths.push(
        <rect
          key="down"
          x={center - pathWidth / 2}
          y={center - pathWidth / 2}
          width={pathWidth}
          height={center + pathWidth / 2}
          fill={pathColor}
        />
      );
    }
    if (connections.LEFT) {
      paths.push(
        <rect
          key="left"
          x={0}
          y={center - pathWidth / 2}
          width={center + pathWidth / 2}
          height={pathWidth}
          fill={pathColor}
        />
      );
    }
    if (connections.RIGHT) {
      paths.push(
        <rect
          key="right"
          x={center - pathWidth / 2}
          y={center - pathWidth / 2}
          width={center + pathWidth / 2}
          height={pathWidth}
          fill={pathColor}
        />
      );
    }
    return paths;
  };

  // Render small triangular arrows
  const renderArrows = () => {
    const arrows: JSX.Element[] = [];
    const size = 3;

    const arrow = (x: number, y: number, dir: string) => {
      let pts = '';
      if (dir === 'UP') pts = `${x},${y - size} ${x + size},${y + size} ${x - size},${y + size}`;
      if (dir === 'DOWN') pts = `${x},${y + size} ${x + size},${y - size} ${x - size},${y - size}`;
      if (dir === 'LEFT') pts = `${x - size},${y} ${x + size},${y - size} ${x + size},${y + size}`;
      if (dir === 'RIGHT') pts = `${x + size},${y} ${x - size},${y - size} ${x - size},${y + size}`;
      return <polygon key={`${dir}-${x}-${y}`} points={pts} fill={arrowColor} />;
    };

    if ((connections.LEFT || connections.RIGHT) && !(connections.UP && connections.DOWN && !connections.LEFT && !connections.RIGHT)) {
      const y = center;
      if (arrowState.RIGHT && connections.RIGHT) {
        arrows.push(arrow(center - 8, y, 'RIGHT'));
        arrows.push(arrow(center, y, 'RIGHT'));
        arrows.push(arrow(center + 8, y, 'RIGHT'));
      }
      if (arrowState.LEFT && connections.LEFT && !arrowState.RIGHT) {
        arrows.push(arrow(center - 8, y, 'LEFT'));
        arrows.push(arrow(center, y, 'LEFT'));
        arrows.push(arrow(center + 8, y, 'LEFT'));
      }
    }

    if ((connections.UP || connections.DOWN) && !(connections.LEFT && connections.RIGHT && !connections.UP && !connections.DOWN)) {
      const x = center;
      if (arrowState.UP && connections.UP) {
        arrows.push(arrow(x, center - 8, 'UP'));
        arrows.push(arrow(x, center, 'UP'));
        arrows.push(arrow(x, center + 8, 'UP'));
      }
      if (arrowState.DOWN && connections.DOWN && !arrowState.UP) {
        arrows.push(arrow(x, center - 8, 'DOWN'));
        arrows.push(arrow(x, center, 'DOWN'));
        arrows.push(arrow(x, center + 8, 'DOWN'));
      }
    }

    return arrows;
  };

  return (
    <motion.div
      className={`relative cursor-pointer ${disabled ? 'cursor-default' : ''}`}
      onClick={handleClick}
      whileTap={!disabled && !tile.isLocked ? { scale: 0.97 } : {}}
      style={{
        width: `${tileSize}px`,
        height: `${tileSize}px`,
      }}
    >
      <svg width={tileSize} height={tileSize} viewBox={`0 0 ${tileSize} ${tileSize}`}>
        {/* Background */}
        <rect x="0" y="0" width={tileSize} height={tileSize} fill="white" />

        {/* Paths */}
        {renderPaths()}

        {/* Arrows */}
        {renderArrows()}

        {/* Selection border - cyan like reference */}
        {isSelected && (
          <rect
            x="2"
            y="2"
            width={tileSize - 4}
            height={tileSize - 4}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="3"
          />
        )}

        {/* Valid path glow */}
        {isPath && !isSelected && (
          <rect
            x="2"
            y="2"
            width={tileSize - 4}
            height={tileSize - 4}
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
          />
        )}
      </svg>
    </motion.div>
  );
};
