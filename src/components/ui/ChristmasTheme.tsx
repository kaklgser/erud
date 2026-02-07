// src/components/ui/ChristmasTheme.tsx
// Global Christmas theme components for the entire project
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Snowflake component - Improved with softer, more realistic animation
export const Snowflake: React.FC<{ delay: number; duration: number; size?: number }> = ({ 
  delay, 
  duration, 
  size = 1 
}) => {
  const startX = Math.random() * 100;
  const drift = (Math.random() - 0.5) * 30; // Reduced drift for more natural movement
  const rotateDirection = Math.random() > 0.5 ? 180 : -180;
  
  return (
    <motion.div
      className="fixed pointer-events-none z-40"
      style={{
        left: `${startX}%`,
        top: -20,
        width: size * 10,
        height: size * 10,
      } as React.CSSProperties}
      initial={{ y: -20, x: 0, opacity: 0, rotate: 0 }}
      animate={{
        y: ['0vh', '105vh'],
        x: [0, drift * 0.3, drift * 0.7, drift, drift * 0.8],
        opacity: [0, 0.7, 0.7, 0.5, 0],
        rotate: [0, rotateDirection],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: 'linear',
      }}
    >
      {/* Simple circle snowflake for cleaner look */}
      <div 
        className="w-full h-full rounded-full bg-white/60 blur-[0.5px]"
        style={{
          boxShadow: '0 0 4px rgba(255,255,255,0.3)'
        }}
      />
    </motion.div>
  );
};

// Snow effect wrapper - Optimized for mobile performance
export const SnowEffect: React.FC<{ intensity?: 'light' | 'medium' | 'heavy' }> = ({ 
  intensity = 'medium' 
}) => {
  // Reduce snowflake count on mobile for better performance
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const counts = { 
    light: isMobile ? 8 : 15, 
    medium: isMobile ? 12 : 30, 
    heavy: isMobile ? 20 : 50 
  };
  const count = counts[intensity];

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {[...Array(count)].map((_, i) => (
        <Snowflake
          key={i}
          delay={Math.random() * 10}
          duration={10 + Math.random() * 10} // Slower animation for better performance
          size={0.5 + Math.random() * 0.8}
        />
      ))}
    </div>
  );
};

// Christmas lights component
export const ChristmasLights: React.FC<{ position?: 'top' | 'bottom' }> = ({ position = 'top' }) => {
  const colors = ['#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#00ffff', '#ff6600'];
  const lightCount = 20;

  return (
    <div className={`fixed left-0 right-0 z-40 flex justify-around px-4 ${
      position === 'top' ? 'top-16' : 'bottom-0'
    }`}>
      {[...Array(lightCount)].map((_, i) => (
        <motion.div
          key={i}
          className="relative"
          style={{ marginTop: Math.sin(i * 0.5) * 10 } as React.CSSProperties}
        >
          {/* Wire */}
          <div className="absolute -top-2 left-1/2 w-px h-3 bg-green-800" />
          {/* Bulb */}
          <motion.div
            className="w-3 h-4 rounded-full"
            style={{
              backgroundColor: colors[i % colors.length],
              boxShadow: `0 0 10px ${colors[i % colors.length]}, 0 0 20px ${colors[i % colors.length]}`,
            } as React.CSSProperties}
            animate={{
              opacity: [0.6, 1, 0.6],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 1 + Math.random(),
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

// Santa sleigh animation - Enhanced magical flying effect
export const SantaSleigh: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show Santa every 45 seconds
    const interval = setInterval(() => {
      setShow(true);
      setTimeout(() => setShow(false), 12000);
    }, 45000);

    // Show once on mount after 5 seconds
    const timeout = setTimeout(() => {
      setShow(true);
      setTimeout(() => setShow(false), 12000);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed z-50 pointer-events-none"
          style={{ top: '6%' }}
          initial={{ x: '-350px', opacity: 0 }}
          animate={{ 
            x: ['calc(-350px)', 'calc(100vw + 350px)'],
            y: [0, -20, 10, -15, 5, -10, 0, -8, 5, -5, 0],
            opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 0.8, 0]
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 12, 
            ease: 'linear',
            y: { duration: 12, ease: 'easeInOut' }
          }}
        >
          {/* Magical glow behind the sleigh */}
          <motion.div
            className="absolute inset-0 -z-10"
            style={{
              background: 'radial-gradient(ellipse 200px 80px at center, rgba(255,215,0,0.3) 0%, rgba(255,100,100,0.15) 40%, transparent 70%)',
              filter: 'blur(8px)',
            }}
            animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <div className="relative flex items-center">
            {/* Lead reindeer (Rudolph with glowing nose) */}
            <motion.div
              className="relative text-3xl sm:text-4xl"
              animate={{ y: [0, -4, 0], rotate: [-2, 2, -2] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              🦌
              {/* Rudolph's glowing red nose */}
              <motion.div
                className="absolute top-[45%] left-[35%] w-2 h-2 rounded-full bg-red-500"
                style={{ boxShadow: '0 0 8px 4px rgba(255,0,0,0.8), 0 0 15px 8px rgba(255,0,0,0.4)' }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            </motion.div>

            {/* Second row of reindeer */}
            <motion.span 
              className="text-2xl sm:text-3xl -ml-2"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 0.55, repeat: Infinity, delay: 0.1 }}
            >
              🦌
            </motion.span>
            <motion.span 
              className="text-2xl sm:text-3xl -ml-2"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 0.55, repeat: Infinity, delay: 0.15 }}
            >
              🦌
            </motion.span>

            {/* Golden reins with sparkle */}
            <div className="relative w-6 sm:w-8 -ml-1">
              <div className="h-0.5 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600" 
                   style={{ boxShadow: '0 0 4px rgba(255,215,0,0.6)' }} />
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs"
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                transition={{ duration: 0.4, repeat: Infinity }}
              >
                ✨
              </motion.div>
            </div>

            {/* Sleigh with gifts */}
            <motion.div 
              className="relative -ml-1"
              animate={{ rotate: [-1, 1, -1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="text-3xl sm:text-4xl">🛷</span>
              {/* Gifts on sleigh */}
              <motion.span 
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                🎁
              </motion.span>
            </motion.div>

            {/* Santa waving */}
            <motion.div 
              className="relative text-3xl sm:text-4xl -ml-4"
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              🎅
              {/* Santa's waving hand effect */}
              <motion.span
                className="absolute -top-1 -right-1 text-sm"
                animate={{ rotate: [0, 20, 0, -10, 0], y: [0, -2, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                👋
              </motion.span>
            </motion.div>

            {/* Magical sparkle trail */}
            <div className="absolute -right-16 top-1/2 -translate-y-1/2 flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  className="text-sm sm:text-base"
                  style={{ color: i % 2 === 0 ? '#FFD700' : '#FF6B6B' }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0.3, 1, 0.3],
                    y: [0, (i % 2 === 0 ? -5 : 5), 0]
                  }}
                  transition={{ 
                    duration: 0.6, 
                    repeat: Infinity, 
                    delay: i * 0.12 
                  }}
                >
                  {i % 3 === 0 ? '✨' : i % 3 === 1 ? '⭐' : '❄️'}
                </motion.span>
              ))}
            </div>

            {/* Stardust trail below */}
            <motion.div
              className="absolute -bottom-4 left-0 right-0 h-1"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.4), rgba(255,100,100,0.3), transparent)',
                filter: 'blur(2px)',
              }}
              animate={{ opacity: [0.3, 0.7, 0.3], scaleX: [0.8, 1, 0.8] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>

          {/* "Ho Ho Ho!" text bubble */}
          <motion.div
            className="absolute -top-8 right-8 bg-white/90 text-red-600 px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 1, 0],
              scale: [0.5, 1, 1, 1, 0.5],
              y: [0, -5, 0, -3, 0]
            }}
            transition={{ duration: 3, delay: 2 }}
          >
            Ho Ho Ho! 🎄
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Christmas tree decoration
export const ChristmasTree: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizes = { sm: 'text-3xl', md: 'text-5xl', lg: 'text-7xl' };
  
  return (
    <motion.div
      className={`${sizes[size]} select-none`}
      animate={{ 
        scale: [1, 1.05, 1],
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      🎄
    </motion.div>
  );
};

// Festive gradient orb (red/green themed)
export const FestiveOrb: React.FC<{ className?: string; color?: 'red' | 'green' | 'gold' }> = ({ 
  className, 
  color = 'red' 
}) => {
  const colors = {
    red: 'bg-red-500/20',
    green: 'bg-green-500/20',
    gold: 'bg-yellow-500/20',
  };

  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${colors[color]} ${className}`}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.2, 0.4, 0.2],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

// Gift box animation
export const GiftBox: React.FC<{ className?: string }> = ({ className }) => (
  <motion.div
    className={`text-3xl select-none ${className}`}
    animate={{
      y: [0, -5, 0],
      rotate: [-5, 5, -5],
    }}
    transition={{ duration: 2, repeat: Infinity }}
  >
    🎁
  </motion.div>
);

// Candy cane decoration
export const CandyCane: React.FC<{ className?: string; rotate?: number }> = ({ 
  className, 
  rotate = 0 
}) => (
  <motion.div
    className={`text-2xl select-none ${className}`}
    style={{ transform: `rotate(${rotate}deg)` } as React.CSSProperties}
    animate={{ scale: [1, 1.1, 1] }}
    transition={{ duration: 3, repeat: Infinity }}
  >
    🍬
  </motion.div>
);

// Holly decoration
export const Holly: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`text-xl select-none ${className}`}>🎄</div>
);

// Christmas background wrapper
export const ChristmasBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative min-h-screen bg-gradient-to-b from-[#1a0a0f] via-[#0f1a0f] to-[#070b14] text-slate-100">
    {/* Festive gradient overlays */}
    <div className="fixed inset-0 pointer-events-none">
      <FestiveOrb className="w-[500px] h-[500px] -top-40 -left-40" color="red" />
      <FestiveOrb className="w-[400px] h-[400px] top-1/3 -right-40" color="green" />
      <FestiveOrb className="w-[300px] h-[300px] bottom-20 left-1/4" color="gold" />
    </div>
    
    {/* Subtle pattern overlay */}
    <div 
      className="fixed inset-0 pointer-events-none opacity-[0.02]"
      style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,0,0,0.1) 0%, transparent 50%),
                         radial-gradient(circle at 75% 75%, rgba(0,255,0,0.1) 0%, transparent 50%)`,
      }}
    />
    
    {children}
  </div>
);

// Dark theme page wrapper (matches HomePage style)
export const DarkPageWrapper: React.FC<{ 
  children: React.ReactNode;
  showSnow?: boolean;
  showSanta?: boolean;
  className?: string;
}> = ({ children, showSnow = true, showSanta = true, className = '' }) => {
  const [isChristmas] = useState(() => {
    const month = new Date().getMonth();
    return month === 11 || month === 0; // December or January
  });

  return (
    <div className={`relative min-h-screen text-slate-100 overflow-x-hidden ${
      isChristmas
        ? 'bg-gradient-to-b from-[#1a0a0f] via-[#0f1a0f] to-[#070b14]'
        : 'bg-gradient-to-b from-[#0a1e1e] via-[#0d1a1a] to-[#070b14]'
    } ${className}`}>
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {isChristmas ? (
          <>
            <FestiveOrb className="w-[600px] h-[600px] -top-40 -left-40" color="red" />
            <FestiveOrb className="w-[500px] h-[500px] top-1/3 -right-40" color="green" />
            <FestiveOrb className="w-[400px] h-[400px] bottom-20 left-1/4" color="gold" />
          </>
        ) : (
          <>
            <motion.div
              className="absolute w-[600px] h-[600px] -top-40 -left-40 bg-emerald-500/20 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute w-[500px] h-[500px] top-1/3 -right-40 bg-cyan-500/15 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, delay: 2 }}
            />
          </>
        )}
      </div>

      {/* Grid pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Christmas effects */}
      {isChristmas && showSnow && <SnowEffect intensity="light" />}
      {isChristmas && showSanta && <SantaSleigh />}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default DarkPageWrapper;
