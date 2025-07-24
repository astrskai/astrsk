# Storybook Development Plan

## Overview
This document outlines the plan to create comprehensive Storybook stories for all components in the `src/components-v2` directory. The stories will be organized in a separate `src/stories` directory structure for better maintainability.

## Current Status
- ✅ Storybook installed and configured
- ✅ Stories directory structure created (`/src/stories`)
- ✅ Stories separated from component files
- ✅ Completed components:
  - button (with all variants)
  - button-pill
  - dialog
  - confirm (DeleteConfirm, UnsavedChangesConfirm)

## Component Inventory

### ✅ Completed Components (components-v2/ui/*)
1. **button** - Button component with variants
2. **button-pill** - Pill-shaped button for panels
3. **dialog** - Modal dialog component
4. **checkbox** - Checkbox component (used in dialogs)

### ✅ Completed Components (components-v2/*)
1. **confirm** - Confirmation dialogs (DeleteConfirm, UnsavedChangesConfirm)

### 📝 UI Components to Document (components-v2/ui/*)

#### Form Components
1. **input** - Basic input field
2. **textarea** - Multi-line text input
3. **select** - Dropdown select
4. **checkbox** - Checkbox input
5. **radio-group** - Radio button group
6. **switch** - Toggle switch
7. **label** - Form label
8. **floating-label-input** - Input with floating label
9. **floating-label-inputs** - Multiple floating inputs
10. **floating-label-textarea** - Textarea with floating label
11. **floating-label-select** - Select with floating label

#### Layout Components
12. **card** - Card container (different from root card.tsx)
13. **accordion** - Collapsible content panels
14. **tabs** - Tab navigation
15. **separator** - Visual divider
16. **sheet** - Slide-out panel
17. **sidebar** - Side navigation component
18. **scroll-area** - Scrollable container
19. **aspect-ratio** - Maintain aspect ratio container

#### Display Components
20. **badge** - Status/label badges
21. **tooltip** - Hover tooltips (different from root tooltip.tsx)
22. **popover** - Popup content
23. **dropdown-menu** - Dropdown menu
24. **command** - Command palette/search
25. **table** - Data table
26. **progress** - Progress bar
27. **skeleton** - Loading placeholder
28. **carousel** - Image/content carousel

#### Utility Components
29. **sonner** - Toast notifications
30. **floating-action-button** - FAB component

### 📝 Root Components to Document (components-v2/*)

#### Core UI Components
1. **avatar** - User/character avatar display
   - [ ] Default avatar
   - [ ] With image
   - [ ] Different sizes
   - [ ] Loading states

2. **banner** - Notification/alert banners
   - [ ] Info, warning, error, success variants
   - [ ] With/without close button
   - [ ] With actions

3. **card** - Container component
   - [ ] Basic card
   - [ ] With header/footer
   - [ ] Different padding options
   - [ ] Clickable variants

4. **tooltip** - Hover tooltips
   - [ ] Different positions
   - [ ] With different triggers
   - [ ] Custom content

#### Form Components
5. **search-input** - Search input field
   - [ ] Default state
   - [ ] With placeholder
   - [ ] Loading state
   - [ ] With results

6. **color-picker** - Color selection component
   - [ ] Default picker
   - [ ] With presets
   - [ ] Custom colors

7. **combobox** - Searchable dropdown
   - [ ] Single select
   - [ ] Multi-select
   - [ ] With search
   - [ ] Loading states

#### Layout Components
8. **top-bar** - Application top bar
   - [ ] Default layout
   - [ ] With navigation
   - [ ] Mobile responsive

9. **left-navigation** - Side navigation panel
   - [ ] Expanded/collapsed states
   - [ ] With sections
   - [ ] Active states

10. **both-sidebar** - Dual sidebar layout
    - [ ] Different configurations
    - [ ] Responsive behavior

11. **top-navigation** - Top navigation tabs
    - [ ] Tab variations
    - [ ] Active states
    - [ ] With icons

#### Specialized Components
12. **svg-icon** - Icon component wrapper
    - [ ] All available icons
    - [ ] Different sizes
    - [ ] Different colors

13. **loading** - Loading indicators
    - [ ] Spinner variations
    - [ ] Different sizes
    - [ ] With text

14. **loading-overlay** - Full-screen loading
    - [ ] Default overlay
    - [ ] With custom message
    - [ ] Different opacity

15. **typo** - Typography components
    - [ ] All text variants (TypoBase, TypoTiny, TypoSmall, etc.)
    - [ ] Different weights
    - [ ] Different colors

16. **stepper** - Step indicator
    - [ ] Horizontal layout
    - [ ] Vertical layout
    - [ ] Active/completed states

17. **stepper-mobile** - Mobile step indicator
    - [ ] Compact view
    - [ ] With navigation

18. **code-editor** - Monaco editor wrapper
    - [ ] Different languages
    - [ ] Read-only mode
    - [ ] With themes

19. **json-viewer** - JSON display component
    - [ ] Collapsed/expanded
    - [ ] With syntax highlighting
    - [ ] Copy functionality

#### Dialog Components
20. **custom-sheet** - Slide-out panel
    - [ ] From different sides
    - [ ] Different sizes
    - [ ] With/without overlay

21. **list-edit-dialog** - List editing modal
    - [ ] Add/remove items
    - [ ] Reorder functionality
    - [ ] Validation states

22. **sort-dialog** - Sorting options dialog
    - [ ] Different sort options
    - [ ] Multi-column sort

#### System Components
23. **theme-provider** - Theme context provider
    - [ ] Light/dark theme switching
    - [ ] Custom theme colors

24. **updater-new** - App update notifications
    - [ ] Update available
    - [ ] Download progress
    - [ ] Install prompts

25. **mobile-updater** - Mobile update UI
    - [ ] Compact view
    - [ ] Update flow

26. **install-pwa** - PWA installation prompt
    - [ ] Install button states
    - [ ] Platform detection

27. **init-page** - Initial loading page
    - [ ] Loading states
    - [ ] Error states
    - [ ] Success transition

## Story Structure Template

Each component story should include:

```typescript
// Location: /src/stories/[category]/component-name.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ComponentName } from "@/components-v2/component-name";

const meta = {
  title: 'Category/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered', // or 'fullscreen', 'padded'
  },
  tags: ['autodocs'],
  argTypes: {
    // Define controls for props
  },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

// Stories should cover:
export const Default: Story = {
  args: {
    // Basic usage
  },
};

export const Variants: Story = {
  // All visual variations
};

export const States: Story = {
  // Interactive states (hover, active, disabled, loading)
};

export const Sizes: Story = {
  // If applicable
};

export const Playground: Story = {
  // Fully configurable with controls
};

export const EdgeCases: Story = {
  // Empty states, long content, errors
};
```

## Development Approach

### Phase 1: Basic Form Components (Priority: High)
Week 1:
- [ ] input
- [ ] textarea
- [ ] select
- [ ] label
- [ ] switch
- [ ] radio-group

### Phase 2: Floating Label Variants (Priority: High)
Week 1-2:
- [ ] floating-label-input
- [ ] floating-label-inputs
- [ ] floating-label-textarea
- [ ] floating-label-select

### Phase 3: Layout Components (Priority: High)
Week 2:
- [ ] card (ui version)
- [ ] accordion
- [ ] tabs
- [ ] separator
- [ ] sheet
- [ ] scroll-area

### Phase 4: Display Components (Priority: Medium)
Week 3:
- [ ] badge
- [ ] tooltip (ui version)
- [ ] popover
- [ ] dropdown-menu
- [ ] progress
- [ ] skeleton

### Phase 5: Complex Components (Priority: Medium)
Week 3-4:
- [ ] command
- [ ] table
- [ ] carousel
- [ ] sidebar
- [ ] aspect-ratio

### Phase 6: Root Core Components (Priority: High)
Week 4:
- [ ] avatar
- [ ] banner
- [ ] card (root version)
- [ ] tooltip (root version)
- [ ] svg-icon
- [ ] typo

### Phase 7: Root Form Components (Priority: Medium)
Week 5:
- [ ] search-input
- [ ] color-picker
- [ ] combobox

### Phase 8: Root Layout Components (Priority: Medium)
Week 5:
- [ ] top-bar
- [ ] left-navigation
- [ ] both-sidebar
- [ ] top-navigation

### Phase 9: Root Specialized Components (Priority: Low)
Week 6:
- [ ] loading
- [ ] loading-overlay
- [ ] stepper
- [ ] stepper-mobile
- [ ] code-editor
- [ ] json-viewer
- [ ] custom-sheet
- [ ] list-edit-dialog
- [ ] sort-dialog

### Phase 10: System Components (Priority: Low)
Week 6:
- [ ] theme-provider
- [ ] updater-new
- [ ] mobile-updater
- [ ] install-pwa
- [ ] init-page
- [ ] sonner
- [ ] floating-action-button

## Guidelines

1. **File Organization**:
   - Stories in `/src/stories/[category]/`
   - Categories: `ui`, `form`, `layout`, `dialog`, `system`

2. **Import Paths**: 
   - Always use absolute imports: `@/components-v2/...`

3. **Mock Data**: 
   - Create realistic mock data
   - Store complex mocks in story file

4. **Accessibility**: 
   - Include keyboard navigation examples
   - Show ARIA labels in stories

5. **Documentation**: 
   - Add JSDoc comments for complex props
   - Include usage examples in story descriptions

6. **Visual Testing**: 
   - Ensure all states are visually distinct
   - Test with different viewport sizes

## Next Steps

1. Clear cache as mentioned
2. Start with Phase 1 (avatar component)
3. Create one component story at a time
4. Test thoroughly in Storybook
5. Update this plan with any discoveries

## Summary

**Total Components to Document: 57**
- UI subdirectory components: 30 (4 completed, 26 remaining)
- Root directory components: 27 (1 completed, 26 remaining)

## Notes
- Components are from both `components-v2/*` and `components-v2/ui/*`
- Some components have similar names but different implementations (e.g., card, tooltip)
- Each story should be self-contained and not depend on external state
- Priority given to commonly used UI components first