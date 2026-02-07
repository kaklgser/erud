import React from 'react';
import { motion } from 'framer-motion';
import { Tile, TileShape } from '../../types/spatialReasoning';

interface TileComponentProps {
  tile: Tile;
  onSelect: () => void;
  disabled?: boolean;
}

export const TileComponent: React.FC<TileComponentProps> = ({
  tile,
  onSelect,
  disabled = false
}) => {
  const getTilePathData = (shape: TileShape): string => {
    switch (shape) {
      case 'straight':
        return 'M 15 30 L 45 30'; // Horizontal line
      case 'L':
        return 'M 30 15 L 30 30 L 45 30'; // L-shape
      case 'T':
        return 'M 15 30 L 45 30 M 30 15 L 30 30'; // T-shape
      case 'cross':
        return 'M 15 30 L 45 30 M 30 15 L 30 45'; // Cross
      default:
        return 'M 15 30 L 45 30';
    }
  };

  const getArrowPath = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): string => {
    switch (direction) {
      case 'UP':
        return 'M 30 10 L 25 20 L 35 20 Z';
      case 'DOWN':
        return 'M 30 50 L 25 40 L 35 40 Z';
      case 'LEFT':
        return 'M 10 30 L 20 25 L 20 35 Z';
      case 'RIGHT':
        return 'M 50 30 L 40 25 L 40 35 Z';
      default:
        return '';
    }
  };

  const getArrowColor = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): string => {
    return tile.arrows[direction] ? '#10b981' : '#6b7280'; // Green if enabled, gray if disabled
  };

  const getTileClasses = (): string => {
    let classes = 'aspect-square border-2 rounded-lg cursor-pointer transition-all duration-200 ';
    
    if (tile.isStart || tile.isEnd) {
      classes += 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ';
    } else if (tile.isSelected) {
      classes += 'border-blue-500 bg-blue-100 dark:bg-blue-800/30 ring-2 ring-blue-300 ';
    } else if (tile.isInPath) {
      classes += 'border-green-500 bg-green-50 dark:bg-green-900/20 ';
    } else {
      classes += 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 ';
    }
    
    if (tile.isLocked || disabled) {
      classes += 'cursor-not-allowed opacity-75 ';
    }
    
    return classes;
  };

  const handleClick = () => {
    if (!disabled && !tile.isLocked) {
      onSelect();
    }
  };

  return (
    <motion.div
      className={getTileClasses()}
      onClick={handleClick}
      whileHover={!disabled && !tile.isLocked ? { scale: 1.05 } : {}}
      whileTap={!disabled && !tile.isLocked ? { scale: 0.95 } : {}}
      style={{ minWidth: '60px', minHeight: '60px' }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 60 60"
        className="overflow-visible"
      >
        {/* Tile Path */}
        <g transform={`rotate(${tile.rotation} 30 30)`}>
          <path
            d={getTilePathData(tile.shape)}
            stroke="#374151"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        
        {/* Arrows */}
        {(['UP', 'DOWN', 'LEFT', 'RIGHT'] as const).map(direction => (
          <path
            key={direction}
            d={getArrowPath(direction)}
            fill={getArrowColor(direction)}
            stroke={getArrowColor(direction)}
            strokeWidth="1"
          />
        ))}
        
        {/* Start/End Icons */}
        {tile.isStart && (
          <text
            x="30"
            y="35"
            textAnchor="middle"
            fontSize="20"
            className="pointer-events-none"
          >
            🚀
          </text>
        )}
        
        {tile.isEnd && (
          <text
            x="30"
            y="35"
            textAnchor="middle"
            fontSize="20"
            className="pointer-events-none"
          >
            🪐
          </text>
        )}
        
        {/* Selection Ring */}
        {tile.isSelected && (
          <circle
            cx="30"
            cy="30"
            r="28"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="animate-pulse"
          />
        )}
      </svg>
      
      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 left-0 text-xs text-gray-500 bg-white/80 px-1 rounded">
          {tile.rotation}°
        </div>
      )}
    </motion.div>
  );
};