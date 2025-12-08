/**
 * CapWheel Logo Component
 * 
 * Animated SVG "CW" monogram with wheel motif
 * Premium gold gradient with subtle animation
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
  const gradientId = useId();
  const glowId = useId();
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial={animate ? { opacity: 0, rotate: -10 } : undefined}
      animate={animate ? { opacity: 1, rotate: 0 } : undefined}
      transition={{ 
        duration: 0.5, 
        ease: [0.2, 0, 0.1, 1] // Jet-glide easing
      }}
    >
      {/* Outer wheel ring */}
      <motion.circle
        cx="50"
        cy="50"
        r="45"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        fill="none"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ 
          duration: 1, 
          ease: [0.2, 0, 0.1, 1],
          delay: 0.2 
        }}
      />
      
      {/* Inner decorative spokes */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <motion.line
          key={angle}
          x1="50"
          y1="50"
          x2={50 + Math.cos((angle * Math.PI) / 180) * 35}
          y2={50 + Math.sin((angle * Math.PI) / 180) * 35}
          stroke={`url(#${gradientId})`}
          strokeWidth="1"
          opacity="0.3"
          initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
          animate={animate ? { pathLength: 1, opacity: 0.3 } : undefined}
          transition={{ 
            duration: 0.4,
            delay: 0.3 + i * 0.05,
            ease: [0.2, 0, 0.1, 1]
          }}
        />
      ))}

      {/* "C" letterform */}
      <motion.path
        d="M 35 25 Q 25 25, 25 35 L 25 65 Q 25 75, 35 75"
        stroke={`url(#${gradientId})`}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ 
          duration: 0.6,
          delay: 0.5,
          ease: [0.2, 0, 0.1, 1]
        }}
      />

      {/* "W" letterform */}
      <motion.path
        d="M 52 30 L 57 70 L 62 50 L 67 70 L 72 30"
        stroke={`url(#${gradientId})`}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ 
          duration: 0.6,
          delay: 0.7,
          ease: [0.2, 0, 0.1, 1]
        }}
      />

      {/* Premium gold gradient definition */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="50%" stopColor="#E5C158" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
        
        {/* Glow filter for premium effect */}
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
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
  const gradientId = useId();
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        fill="none"
      />
      
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1="50"
          y1="50"
          x2={50 + Math.cos((angle * Math.PI) / 180) * 35}
          y2={50 + Math.sin((angle * Math.PI) / 180) * 35}
          stroke={`url(#${gradientId})`}
          strokeWidth="1"
          opacity="0.3"
        />
      ))}

      <path
        d="M 35 25 Q 25 25, 25 35 L 25 65 Q 25 75, 35 75"
        stroke={`url(#${gradientId})`}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      <path
        d="M 52 30 L 57 70 L 62 50 L 67 70 L 72 30"
        stroke={`url(#${gradientId})`}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="50%" stopColor="#E5C158" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
    </svg>
  );
};
