# Dashboard Standardization - Visual Consistency Checklist

## Color Palette (ORION Design System)

### Primary Colors
- ✓ Neon Green `#00FF9D` - Primary actions, success states, profits
- ✓ Neon Cyan `#00B8D4` - Secondary actions, info states
- ✓ Bright Cyan `#00D4FF` - Highlights, accents

### Background Colors
- ✓ Base: `#0B1015` - Page level background
- ✓ Panel: `#0F1419` - Card/panel background (all components use this)
- ✓ Elevated: `#141A20` - Modal/dropdown backgrounds
- ✓ Overlay: `#0B1015` - Modal backdrop

### Text Colors
- ✓ Primary: `#FFFFFF` - Headings, important text
- ✓ Secondary: `#CBD5E1` (slate-300) - Body text
- ✓ Tertiary: `#94A3B8` (slate-400) - Supporting text
- ✓ Muted: `#64748B` (slate-500) - Labels, hints
- ✓ Disabled: `#475569` (slate-600) - Disabled states

### Border Colors
- ✓ Subtle: `rgba(255, 255, 255, 0.05)` - Default card borders
- ✓ Medium: `rgba(255, 255, 255, 0.10)` - Dividers
- ✓ Accent: `rgba(0, 255, 157, 0.30)` - Active/hover states

## Component Standardization Status

### Metrics & Cards
- [x] OrionMetricsGrid - Uses design system colors
- [x] OrionWealthProjection - Updated with enhanced toggle
- [x] OrionTierDisplay - New component, uses design system
- [x] OrionStrategyPerformance - Uses consistent colors
- [x] OrionTransactionLedger - Uses consistent colors

### Charts & Visualizations
- [x] OrionWealthChart - Uses primary green (#00FF9D)
- [ ] Need to verify chart tooltip colors match design system

### Interactive Components
- [x] BoostCapital - Modal and button use design system
- [x] Auto-Compound Toggle - Enhanced with Lock icons
- [ ] Need to ensure all buttons use consistent hover states (active:scale-[0.98])

### Layout Components
- [x] CapWheelDashboard - Updated layout with tier display
- [x] OrionSidebar - Updated to show dynamic tier
- [x] DashboardHeader - Added Boost Capital button

## Typography Consistency

### Font Families
- ✓ Base: `Inter, system-ui, sans-serif` for all UI text
- ✓ Mono: Monospace for numbers, IDs, data values

### Font Sizes (Tailwind classes)
- ✓ `text-[9px]` - Micro text (labels, tags)
- ✓ `text-[10px]` - Small text (captions, meta)
- ✓ `text-xs` (12px) - Default small
- ✓ `text-sm` (14px) - Body text
- ✓ `text-base` (16px) - Emphasized text
- ✓ `text-lg` (18px) - Headings
- ✓ `text-xl` (20px) - Large numbers/values
- ✓ `text-2xl` (24px) - Major headings

### Font Weights
- ✓ `font-normal` (400) - Body text
- ✓ `font-medium` (500) - Emphasis
- ✓ `font-semibold` (600) - Sub-headings
- ✓ `font-bold` (700) - Headings, important values

## Motion & Animation

### Transition Durations
- ✓ 100ms - Instant (micro-interactions)
- ✓ 150ms - Fast (button states, toggles)
- ✓ 200ms - Normal (default, sub-200ms cap)
- ✓ 300ms - Slow (panel slides)

### Easing Functions
- ✓ `ease: [0.2, 0, 0.1, 1]` - Default jet-glide (fast start, slow landing)
- ✓ All animations use ease-out curves

### Interactive States
- ✓ All buttons: `active:scale-[0.98]` for tactile feedback
- ✓ Hover states: opacity change or background lighten
- ✓ No bounce or spring animations (military-grade precision)

## Spacing & Layout

### Border Radius
- ✓ `rounded-lg` (0.5rem/8px) - Default for cards, buttons
- ✓ `rounded-xl` (0.75rem/12px) - Large containers, modals
- ✓ `rounded-full` - Badges, pills

### Shadows
- ✓ Cards: No heavy shadows, only `border-white/5`
- ✓ Glow effects: `shadow-[0_0_20px_rgba(0,255,157,0.15)]` for primary actions
- ✓ Modals: `shadow-2xl` for elevation

### Padding
- ✓ Cards: `p-3` or `p-4` consistently
- ✓ Sections: `px-4 py-3` for headers
- ✓ Tight spacing: `gap-2` or `gap-3` in grids

## Feature Implementation Status

### Auto-Compound Toggle
- [x] Visual design (Lock/LockOpen icons)
- [x] Default state ON
- [x] Descriptive text
- [x] Green glow when enabled
- [x] Sub-200ms animations
- [ ] Backend integration for user preference storage
- [ ] Withdrawal logic enforcement

### Boost Capital
- [x] Modal interface with form
- [x] Quick amount selection buttons
- [x] "Boost Capital" terminology (no "Deposit")
- [x] Button in dashboard header
- [x] Success/error states
- [ ] Backend API integration testing
- [ ] Real wallet balance updates

### Tier Display
- [x] Shows all 4 tiers
- [x] Current tier highlighted
- [x] Color-coded indicators
- [x] Upgrade messaging
- [x] Integrated in dashboard
- [x] Dynamic tier calculation based on AUM
- [ ] Verify tier parameter enforcement

## Visual Consistency Verification

### Checklist
- [x] All cards use `bg-[#0F1419]` background
- [x] All borders use `border-white/5`
- [x] Primary color `#00FF9D` used consistently
- [x] Secondary color `#00B8D4` for info states
- [x] Monospace fonts for all numeric data
- [x] Consistent padding/spacing
- [ ] Take before/after screenshots
- [ ] Test on different screen sizes
- [ ] Verify color contrast for accessibility

## Next Steps

1. [ ] Apply design system to remaining components
2. [ ] Test all interactive elements for sub-200ms feedback
3. [ ] Add backend integration for Auto-Compound preference
4. [ ] Implement withdrawal logic that respects Auto-Compound state
5. [ ] Add tier enforcement in backend API
6. [ ] Create comprehensive screenshot documentation
7. [ ] Test on multiple browsers
8. [ ] Verify accessibility (color contrast, keyboard navigation)
