/**
 * CapWheel Logo Component
 * 
 * ORION-Styled SVG "CW" monogram with wheel motif
 * Neon green glow with teal accent on dark base
 * 
 * Palette:
 * - Primary Glow (Neon Green): #00FF9D
 * - Secondary Accent (Teal/Cyan): #00B8D4
 * - Base Dark (Dashboard Bg): #0B1015
 */

import { motion } from 'framer-motion';
import { useId } from 'react';

interface CapWheelLogoProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const CapWheelLogo = ({ 
  size = 48, 
  className = '',
  animate = true 
}: CapWheelLogoProps) => {
  const primaryGradientId = useId();
  const secondaryGradientId = useId();
  const glowFilterId = useId();
  const pulseGlowId = useId();
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial={animate ? { opacity: 0, scale: 0.9 } : undefined}
      animate={animate ? { opacity: 1, scale: 1 } : undefined}
      transition={{ 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1] // Smooth expo-out
      }}
    >
      <defs>
        {/* Primary Neon Green Gradient */}
        <linearGradient id={primaryGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FF9D" />
          <stop offset="50%" stopColor="#00E88A" />
          <stop offset="100%" stopColor="#00B8D4" />
        </linearGradient>
        
        {/* Secondary Teal Gradient */}
        <linearGradient id={secondaryGradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00B8D4" />
          <stop offset="100%" stopColor="#00FF9D" />
        </linearGradient>
        
        {/* Neon Glow Filter */}
        <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Animated Pulse Glow */}
        <filter id={pulseGlowId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0
                    0 1 0 0 0.6
                    0 0 0 0 0.4
                    0 0 0 1 0"
          />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Radial glow for center */}
        <radialGradient id={`${primaryGradientId}-radial`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00FF9D" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#00FF9D" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#00FF9D" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background glow circle */}
      <motion.circle
        cx="50"
        cy="50"
        r="46"
        fill={`url(#${primaryGradientId}-radial)`}
        initial={animate ? { opacity: 0 } : undefined}
        animate={animate ? { opacity: [0.5, 0.8, 0.5] } : undefined}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Outer ring - main */}
      <motion.circle
        cx="50"
        cy="50"
        r="44"
        stroke={`url(#${primaryGradientId})`}
        strokeWidth="2"
        fill="none"
        filter={`url(#${glowFilterId})`}
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ 
          duration: 1.2, 
          ease: [0.16, 1, 0.3, 1],
          delay: 0.1 
        }}
      />
      
      {/* Outer ring - accent (offset) */}
      <motion.circle
        cx="50"
        cy="50"
        r="40"
        stroke={`url(#${secondaryGradientId})`}
        strokeWidth="0.5"
        fill="none"
        opacity="0.4"
        strokeDasharray="8 4"
        initial={animate ? { opacity: 0, rotate: 0 } : undefined}
        animate={animate ? { opacity: 0.4, rotate: 360 } : undefined}
        style={{ transformOrigin: 'center' }}
        transition={{ 
          opacity: { duration: 0.5, delay: 0.3 },
          rotate: { duration: 60, repeat: Infinity, ease: "linear" }
        }}
      />

      {/* Tech spokes - 8 directions */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const outerRadius = 38;
        const innerRadius = 18;
        const x1 = 50 + Math.cos((angle * Math.PI) / 180) * innerRadius;
        const y1 = 50 + Math.sin((angle * Math.PI) / 180) * innerRadius;
        const x2 = 50 + Math.cos((angle * Math.PI) / 180) * outerRadius;
        const y2 = 50 + Math.sin((angle * Math.PI) / 180) * outerRadius;
        
        return (
          <motion.line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={i % 2 === 0 ? '#00FF9D' : '#00B8D4'}
            strokeWidth="1"
            opacity="0.25"
            initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
            animate={animate ? { pathLength: 1, opacity: 0.25 } : undefined}
            transition={{ 
              duration: 0.4,
              delay: 0.4 + i * 0.04,
              ease: [0.16, 1, 0.3, 1]
            }}
          />
        );
      })}

      {/* Inner tech circle */}
      <motion.circle
        cx="50"
        cy="50"
        r="16"
        stroke="#00FF9D"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
        initial={animate ? { scale: 0, opacity: 0 } : undefined}
        animate={animate ? { scale: 1, opacity: 0.3 } : undefined}
        transition={{ 
          duration: 0.5,
          delay: 0.6,
          ease: [0.16, 1, 0.3, 1]
        }}
      />

      {/* "C" letterform - Bold, glowing */}
      <motion.path
        d="M 38 28 Q 24 28, 24 42 L 24 58 Q 24 72, 38 72"
        stroke={`url(#${primaryGradientId})`}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        filter={`url(#${glowFilterId})`}
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ 
          duration: 0.7,
          delay: 0.7,
          ease: [0.16, 1, 0.3, 1]
        }}
      />

      {/* "W" letterform - Bold, glowing */}
      <motion.path
        d="M 50 32 L 56 68 L 63 48 L 70 68 L 76 32"
        stroke={`url(#${secondaryGradientId})`}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={`url(#${glowFilterId})`}
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ 
          duration: 0.7,
          delay: 0.9,
          ease: [0.16, 1, 0.3, 1]
        }}
      />

      {/* Center dot - pulsing */}
      <motion.circle
        cx="50"
        cy="50"
        r="3"
        fill="#00FF9D"
        filter={`url(#${pulseGlowId})`}
        initial={animate ? { scale: 0 } : undefined}
        animate={animate ? { scale: [1, 1.2, 1] } : undefined}
        transition={{
          scale: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      />

      {/* Corner accent marks */}
      {[
        { x1: 8, y1: 15, x2: 8, y2: 8, x3: 15, y3: 8 },
        { x1: 92, y1: 15, x2: 92, y2: 8, x3: 85, y3: 8 },
        { x1: 8, y1: 85, x2: 8, y2: 92, x3: 15, y3: 92 },
        { x1: 92, y1: 85, x2: 92, y2: 92, x3: 85, y3: 92 },
      ].map((corner, i) => (
        <motion.path
          key={i}
          d={`M ${corner.x1} ${corner.y1} L ${corner.x2} ${corner.y2} L ${corner.x3} ${corner.y3}`}
          stroke="#00B8D4"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.6"
          initial={animate ? { opacity: 0, pathLength: 0 } : undefined}
          animate={animate ? { opacity: 0.6, pathLength: 1 } : undefined}
          transition={{
            duration: 0.3,
            delay: 1.1 + i * 0.05,
            ease: [0.16, 1, 0.3, 1]
          }}
        />
      ))}
    </motion.svg>
  );
};

/**
 * Static version (no animation) for performance-critical contexts
 */
export const CapWheelLogoStatic = ({ 
  size = 48, 
  className = '' 
}: Omit<CapWheelLogoProps, 'animate'>) => {
  const primaryGradientId = useId();
  const secondaryGradientId = useId();
  const glowFilterId = useId();
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={primaryGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FF9D" />
          <stop offset="50%" stopColor="#00E88A" />
          <stop offset="100%" stopColor="#00B8D4" />
        </linearGradient>
        
        <linearGradient id={secondaryGradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00B8D4" />
          <stop offset="100%" stopColor="#00FF9D" />
        </linearGradient>
        
        <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <radialGradient id={`${primaryGradientId}-radial`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00FF9D" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#00FF9D" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#00FF9D" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="50" cy="50" r="46" fill={`url(#${primaryGradientId}-radial)`} opacity="0.6" />

      {/* Outer ring */}
      <circle
        cx="50"
        cy="50"
        r="44"
        stroke={`url(#${primaryGradientId})`}
        strokeWidth="2"
        fill="none"
        filter={`url(#${glowFilterId})`}
      />
      
      {/* Dashed accent ring */}
      <circle
        cx="50"
        cy="50"
        r="40"
        stroke={`url(#${secondaryGradientId})`}
        strokeWidth="0.5"
        fill="none"
        opacity="0.4"
        strokeDasharray="8 4"
      />

      {/* Tech spokes */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const outerRadius = 38;
        const innerRadius = 18;
        return (
          <line
            key={angle}
            x1={50 + Math.cos((angle * Math.PI) / 180) * innerRadius}
            y1={50 + Math.sin((angle * Math.PI) / 180) * innerRadius}
            x2={50 + Math.cos((angle * Math.PI) / 180) * outerRadius}
            y2={50 + Math.sin((angle * Math.PI) / 180) * outerRadius}
            stroke={i % 2 === 0 ? '#00FF9D' : '#00B8D4'}
            strokeWidth="1"
            opacity="0.25"
          />
        );
      })}

      {/* Inner tech circle */}
      <circle cx="50" cy="50" r="16" stroke="#00FF9D" strokeWidth="1" fill="none" opacity="0.3" />

      {/* "C" letterform */}
      <path
        d="M 38 28 Q 24 28, 24 42 L 24 58 Q 24 72, 38 72"
        stroke={`url(#${primaryGradientId})`}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        filter={`url(#${glowFilterId})`}
      />

      {/* "W" letterform */}
      <path
        d="M 50 32 L 56 68 L 63 48 L 70 68 L 76 32"
        stroke={`url(#${secondaryGradientId})`}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={`url(#${glowFilterId})`}
      />

      {/* Center dot */}
      <circle cx="50" cy="50" r="3" fill="#00FF9D" />

      {/* Corner accent marks */}
      {[
        { x1: 8, y1: 15, x2: 8, y2: 8, x3: 15, y3: 8 },
        { x1: 92, y1: 15, x2: 92, y2: 8, x3: 85, y3: 8 },
        { x1: 8, y1: 85, x2: 8, y2: 92, x3: 15, y3: 92 },
        { x1: 92, y1: 85, x2: 92, y2: 92, x3: 85, y3: 92 },
      ].map((corner, i) => (
        <path
          key={i}
          d={`M ${corner.x1} ${corner.y1} L ${corner.x2} ${corner.y2} L ${corner.x3} ${corner.y3}`}
          stroke="#00B8D4"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.6"
        />
      ))}
    </svg>
  );
};
