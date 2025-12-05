/**
 * App Layout Component
 * 
 * Main application shell with animated page transitions
 * Part of the Orion Design System - "Institutional Cybernetics"
 */

import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { Header } from './Header';
import { Sidebar, type NavItem } from './Sidebar';
import { MobileNav, type MobileNavItem } from './MobileNav';
import type { StatusType } from '../ui/StatusIndicator';

export interface AppLayoutProps {
  children: ReactNode;
  activeNav?: string;
  onNavChange?: (item: NavItem | MobileNavItem) => void;
  showSidebar?: boolean;
  showMobileNav?: boolean;
  status?: StatusType;
  userName?: string;
  className?: string;
}

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    }
  },
};

export function AppLayout({
  children,
  activeNav = 'dashboard',
  onNavChange,
  showSidebar = true,
  showMobileNav = true,
  status = 'connected',
  userName = 'User',
  className,
}: AppLayoutProps) {
  return (
    <div className={twMerge('min-h-screen bg-orion-bg flex flex-col', className)}>
      {/* Header */}
      <Header
        status={status}
        userName={userName}
        variant="compact"
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        {showSidebar && (
          <div className="hidden md:block">
            <Sidebar
              activeItem={activeNav}
              onItemClick={onNavChange}
              className="h-full"
            />
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNav}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Navigation */}
      {showMobileNav && (
        <MobileNav
          activeItem={activeNav}
          onItemClick={onNavChange}
        />
      )}
    </div>
  );
}

/**
 * Page Wrapper with animations
 */
export interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={twMerge('p-4 md:p-6', className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger container for animating children
 */
export interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ 
  children, 
  className,
  staggerDelay = 0.1,
}: StaggerContainerProps) {
  return (
    <motion.div
      variants={{
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}
