import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ChristmasSnowProps {
  count?: number;
}

// Generate snowflake properties once to avoid re-renders
const generateSnowflakes = (count: number) => {
  return [...Array(count)].map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 2 + Math.random() * 4, // Varied sizes 2-6px
    duration: 12 + Math.random() * 8, // Slower, more gentle fall
    delay: Math.random() * 10,
    drift: (Math.random() - 0.5) * 60, // Gentle horizontal drift
    opacity: 0.3 + Math.random() * 0.4, // Varied opacity 0.3-0.7
  }));
};

export const ChristmasSnow: React.FC<ChristmasSnowProps> = ({ count = 30 }) => {
  // Memoize snowflakes to prevent regeneration on re-renders
  const snowflakes = useMemo(() => generateSnowflakes(count), [count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {snowflakes.map((flake) => (
        <motion.div
          key={flake.id}
          className="absolute rounded-full"
          style={{
            left: `${flake.left}%`,
            top: -20,
            width: flake.size,
            height: flake.size,
            background: `radial-gradient(circle, rgba(255,255,255,${flake.opacity}) 0%, rgba(255,255,255,${flake.opacity * 0.3}) 100%)`,
            boxShadow: `0 0 ${flake.size}px rgba(255,255,255,${flake.opacity * 0.5})`,
          }}
          animate={{
            y: ['0vh', '105vh'],
            x: [0, flake.drift * 0.3, flake.drift * 0.7, flake.drift],
            opacity: [0, flake.opacity, flake.opacity, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: flake.duration,
            repeat: Infinity,
            delay: flake.delay,
            ease: 'linear',
            rotate: {
              duration: flake.duration * 2,
              ease: 'linear',
            }
          }}
        />
      ))}
    </div>
  );
};
