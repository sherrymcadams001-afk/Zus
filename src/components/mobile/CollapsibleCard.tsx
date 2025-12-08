/**
 * Collapsible Card Component
 * 
 * Accordion-style card for mobile viewports with smooth animations
 * Progressive disclosure for complex information
 */

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ORION_MOTION } from '../../theme/orion-design-system';

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  badge?: string;
  badgeColor?: 'green' | 'cyan' | 'gold' | 'red';
  alwaysShowPreview?: boolean;
  preview?: ReactNode;
}

const badgeColors = {
  green: 'bg-[#00FF9D]/20 text-[#00FF9D]',
  cyan: 'bg-[#00B8D4]/20 text-[#00B8D4]',
  gold: 'bg-[#D4AF37]/20 text-[#D4AF37]',
  red: 'bg-red-500/20 text-red-400',
};

export const CollapsibleCard = ({
  title,
  subtitle,
  icon,
  children,
  defaultExpanded = false,
  className = '',
  headerClassName = '',
  contentClassName = '',
  badge,
  badgeColor = 'green',
  alwaysShowPreview = false,
  preview,
}: CollapsibleCardProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const contentVariants = {
    collapsed: { 
      height: 0, 
      opacity: 0,
      transition: {
        height: { duration: ORION_MOTION.duration.normal / 1000, ease: ORION_MOTION.easing.default },
        opacity: { duration: ORION_MOTION.duration.fast / 1000 },
      }
    },
    expanded: { 
      height: 'auto', 
      opacity: 1,
      transition: {
        height: { duration: ORION_MOTION.duration.normal / 1000, ease: ORION_MOTION.easing.default },
        opacity: { duration: ORION_MOTION.duration.normal / 1000, delay: 0.05 },
      }
    },
  };

  return (
    <div className={`bg-[#0F1419] border border-white/5 rounded-xl overflow-hidden transition-all duration-200 hover:border-[#00FF9D]/10 ${className}`}>
      {/* Header - Always visible, touch-optimized */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full flex items-center gap-3 p-4 text-left touch-manipulation
          min-h-[56px] transition-colors duration-200
          ${isExpanded ? 'bg-white/[0.02]' : 'hover:bg-white/[0.02]'}
          ${headerClassName}
        `}
        aria-expanded={isExpanded}
        aria-controls={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        {/* Icon */}
        {icon && (
          <span className="p-2 rounded-lg bg-[#00FF9D]/10 text-[#00FF9D] flex-shrink-0">
            {icon}
          </span>
        )}

        {/* Title & Subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">{title}</span>
            {badge && (
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${badgeColors[badgeColor]}`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        {/* Preview (shown when collapsed) */}
        {alwaysShowPreview && preview && !isExpanded && (
          <div className="flex-shrink-0 text-right">
            {preview}
          </div>
        )}

        {/* Chevron */}
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: ORION_MOTION.duration.fast / 1000, ease: ORION_MOTION.easing.smooth }}
          className="flex-shrink-0 p-1 rounded-lg text-slate-500"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      {/* Content - Expandable */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <div className={`px-4 pb-4 ${icon ? 'pl-[60px]' : ''} ${contentClassName}`}>
              <div className="pt-2 border-t border-white/5">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Collapsible Metric Card - Specialized for metrics display
 */
interface CollapsibleMetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export const CollapsibleMetricCard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  children,
  className = '',
}: CollapsibleMetricCardProps) => {
  const changeColors = {
    positive: 'text-[#00FF9D]',
    negative: 'text-red-400',
    neutral: 'text-slate-400',
  };

  const preview = (
    <div className="text-right">
      <p className="text-sm font-bold text-white">{value}</p>
      {change && (
        <p className={`text-[10px] font-medium ${changeColors[changeType]}`}>{change}</p>
      )}
    </div>
  );

  return (
    <CollapsibleCard
      title={title}
      icon={icon}
      className={className}
      alwaysShowPreview={true}
      preview={preview}
    >
      {children || (
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Current Value</span>
            <span className="text-sm font-medium text-white">{value}</span>
          </div>
          {change && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Change</span>
              <span className={`text-sm font-medium ${changeColors[changeType]}`}>{change}</span>
            </div>
          )}
        </div>
      )}
    </CollapsibleCard>
  );
};

export default CollapsibleCard;
