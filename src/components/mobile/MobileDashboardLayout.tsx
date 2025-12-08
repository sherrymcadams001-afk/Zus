/**
 * Mobile Dashboard Layout Component
 * 
 * Responsive grid layout for CapWheel dashboard
 * Optimized for mobile, tablet, and desktop viewports
 */

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileNavDrawer } from './MobileNavDrawer';
import { MobileBottomNav } from './MobileBottomNav';
import { useViewportHeight } from '../../hooks/useViewportHeight';
import { useResponsive } from '../../hooks/useMediaQuery';
import { ORION_MOTION } from '../../theme/orion-design-system';

interface MobileDashboardLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
  className?: string;
}

export const MobileDashboardLayout = ({
  children,
  header,
  sidebar,
  className = '',
}: MobileDashboardLayoutProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { isKeyboardOpen } = useViewportHeight();

  const handleMenuClick = () => {
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Animation variants for page content
  const contentVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: ORION_MOTION.duration.normal / 1000,
        ease: ORION_MOTION.easing.default,
      }
    },
  };

  return (
    <div 
      className={`h-screen w-screen flex bg-[#0B1015] overflow-hidden ${className}`}
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
    >
      {/* Desktop Sidebar */}
      {isDesktop && sidebar && (
        <div className="hidden lg:block flex-shrink-0">
          {sidebar}
        </div>
      )}

      {/* Mobile Nav Drawer */}
      <MobileNavDrawer isOpen={isDrawerOpen} onClose={handleCloseDrawer} />

      {/* Main Content Area */}
      <motion.div
        variants={contentVariants}
        initial="initial"
        animate="animate"
        className="flex-1 flex flex-col min-w-0 h-full overflow-hidden"
      >
        {/* Header */}
        {header}

        {/* Main Content */}
        <main className={`
          flex-1 overflow-auto
          ${isMobile ? 'p-3 pb-20' : isTablet ? 'p-4 pb-20' : 'p-4'}
        `}>
          <AnimatePresence mode="wait">
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>

      {/* Mobile Bottom Navigation */}
      <AnimatePresence>
        {!isDesktop && !isKeyboardOpen && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <MobileBottomNav onMenuClick={handleMenuClick} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Responsive Grid for metrics/cards
 */
interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

export const ResponsiveGrid = ({
  children,
  className = '',
  cols = { mobile: 1, tablet: 2, desktop: 4 },
  gap = 'md',
}: ResponsiveGridProps) => {
  const { mobile = 1, tablet = 2, desktop = 4 } = cols;
  
  // Generate responsive grid classes
  const gridCols = `
    grid-cols-${mobile} 
    md:grid-cols-${tablet} 
    lg:grid-cols-${desktop}
  `;

  return (
    <div className={`grid ${gridCols} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Responsive Two Column Layout
 */
interface TwoColumnLayoutProps {
  left: ReactNode;
  right: ReactNode;
  className?: string;
  leftWidth?: 'narrow' | 'equal' | 'wide';
}

export const TwoColumnLayout = ({
  left,
  right,
  className = '',
  leftWidth = 'equal',
}: TwoColumnLayoutProps) => {
  const { isMobile } = useResponsive();

  const widthClasses = {
    narrow: 'lg:grid-cols-[1fr_2fr]',
    equal: 'lg:grid-cols-2',
    wide: 'lg:grid-cols-[2fr_1fr]',
  };

  if (isMobile) {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        {left}
        {right}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 ${widthClasses[leftWidth]} gap-3 ${className}`}>
      {left}
      {right}
    </div>
  );
};

/**
 * Stack layout for mobile - converts grid to vertical stack
 */
interface MobileStackProps {
  children: ReactNode;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}

export const MobileStack = ({
  children,
  className = '',
  gap = 'md',
}: MobileStackProps) => {
  return (
    <div className={`flex flex-col ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

export default MobileDashboardLayout;
