import { motion } from 'framer-motion';

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
  return (
    <motion.div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      initial={animate ? { opacity: 0, scale: 0.9, filter: 'brightness(0.8)' } : undefined}
      animate={animate ? { 
        opacity: 1, 
        scale: 1, 
        filter: 'brightness(1)' 
      } : undefined}
      whileHover={{ 
        scale: 1.05,
        filter: 'brightness(1.2) drop-shadow(0 0 8px rgba(0, 255, 157, 0.5))'
      }}
      transition={{ 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1] 
      }}
    >
      {/* Ambient Glow Background */}
      <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full -z-10 animate-pulse" />
      
      <img 
        src="/icon.svg" 
        alt="CapWheel Logo" 
        className="w-full h-full object-contain drop-shadow-[0_0_2px_rgba(0,255,157,0.3)]"
      />
    </motion.div>
  );
};

export const CapWheelLogoStatic = ({ 
  size = 48, 
  className = '' 
}: Omit<CapWheelLogoProps, 'animate'>) => {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img 
        src="/icon.svg" 
        alt="CapWheel Logo" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};
