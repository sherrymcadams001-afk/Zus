/**
 * Shared Navigation Configuration
 * 
 * Single source of truth for all navigation menus (desktop sidebar + mobile drawer).
 * Update this file to change navigation - both views will sync automatically.
 */

export interface NavItemConfig {
  to: string;
  label: string;
  iconName: 'LayoutDashboard' | 'User' | 'FileCode' | 'Zap' | 'Wallet' | 'Users' | 'Shield';
  badge?: string;
  adminOnly?: boolean;
}

export interface NavGroupConfig {
  title: string;
  defaultOpen?: boolean;
  items: NavItemConfig[];
}

/**
 * Main navigation configuration
 * Used by OrionSidebar (desktop) and MobileNavDrawer (mobile)
 */
export const NAVIGATION_CONFIG: NavGroupConfig[] = [
  {
    title: 'Overview',
    defaultOpen: true,
    items: [
      { to: '/capwheel/dashboard', iconName: 'LayoutDashboard', label: 'Dashboard' },
      { to: '/capwheel/profile', iconName: 'User', label: 'Profile' },
      { to: '/capwheel/protocol', iconName: 'FileCode', label: 'Asset Protocol' },
      { to: '/capwheel/trading', iconName: 'Zap', label: 'Trading Agent', badge: 'LIVE' },
      { to: '/capwheel/strategy-pools', iconName: 'Wallet', label: 'Strategy Pools' },
      { to: '/capwheel/partners', iconName: 'Users', label: 'Partner Network' },
      { to: '/capwheel/admin', iconName: 'Shield', label: 'Admin Panel', badge: 'ADMIN', adminOnly: true },
    ]
  }
];

/**
 * Filter navigation items based on user role
 */
export function getFilteredNavigation(userRole?: string): NavGroupConfig[] {
  return NAVIGATION_CONFIG.map(group => ({
    ...group,
    items: group.items.filter(item => !item.adminOnly || userRole === 'admin')
  }));
}
