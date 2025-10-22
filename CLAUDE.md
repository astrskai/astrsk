# astrsk Development Guidelines

Maintained development guidelines. Last updated: 2025-10-22

## Active Feature: PWA Codebase Cleanup & Quality Improvement

**Branch**: 003-pwa-codebase-cleanup
**Timeline**: 8-10 weeks (4 phases)

### Objective

Restructure PWA codebase to eliminate 40-50% code duplication, organize 36+ loose components into domain folders, decompose oversized components (max 2,979 lines → 500 line limit), remove 20+ duplicate mobile files using Tailwind responsive design, and establish automated quality gates. Enable 50% faster feature development and A/B testing cycles.

**Current Progress** (Phase 1):

- ✅ Removed `useResponsiveLayout` hook (dead code, already using Tailwind)
- ✅ **Component Reclassification Complete** - 36 loose files reorganized into domain-based structure
  - `components/ui/` - 15 files (shadcn/ui + basic UI components)
  - `components/layout/` - 7 files (navigation, top-bar, sidebar components)
  - `components/dialogs/` - 4 files (shared confirm, import dialogs)
  - `components/system/` - 7 files (PWA, theme, updater infrastructure)
  - `features/session/components/` - 1 file (custom-sheet)
  - `features/card/mobile/` - 1 file (sort-dialog-mobile)
- ✅ **Quality Findings**:
  - 3 UNUSED components identified (code-editor, json-viewer, tooltip-wrapper)
  - 5 Mobile duplication targets identified for Phase 3
  - All barrel exports created (index.ts)
- ⏳ Next: Migrate components-v2 domain folders → features/

### Migration Phases

- **Phase 1 (Weeks 1-2)**: Foundation - domain structure organization, quality gates setup
- **Phase 2 (Weeks 3-5)**: Component Decomposition - break large files into focused components (<500 lines enforced)
- **Phase 3 (Weeks 6-8)**: Mobile Duplication - eliminate `-mobile.tsx` files, use Tailwind responsive classes
- **Phase 4 (Weeks 9-10)**: Polish - move remaining loose components, create barrel exports, final cleanup

### Quality Gates (CI/CD Enforced)

- Component size: **≤300 lines (recommended), ≤500 lines (enforced)**
- Code duplication: **<5%**
- Test coverage: **≥80%**
- Lighthouse Mobile: **≥90 points**
- Bundle size increase: **<5% per PR**
- No `-mobile.tsx` files allowed

### Key Infrastructure

- **Tailwind CSS v4**: Responsive design with built-in breakpoints (sm, md, lg, xl, 2xl)
- **Domain Folders**: session/, flow/, card/, setting/, shared/ with barrel exports
- **Quality Gates**: CI/CD automation for size, duplication, coverage checks
- **Incremental Approach**: Small, safe changes with frequent testing

---

## Active Technologies

- TypeScript 5.x / React 18.x (PWA)
- TanStack Query v5 (Query/Mutation management)
- React Flow (Flow editor)
- Drizzle ORM (Database)
- Vite (Build tool)
- Vitest (Testing)

## Project Structure & Organization Principles

### **Approach: Feature-based + Colocation**
> "Keep files as close as possible to where they are used" - Kent C. Dodds

### **Current Structure** (Phase 1 Progress)

```
apps/pwa/src/
├── features/                      # Business domains (Feature-based) [NEW]
│   ├── session/
│   │   └── components/
│   │       └── custom-sheet.tsx  # Session edit dialogs
│   └── card/
│       └── mobile/
│           └── sort-dialog-mobile.tsx
│
├── components/                    # Shared components (domain-independent) [REORGANIZED]
│   ├── ui/                       # shadcn/ui + basic UI (15 files)
│   │   ├── avatar.tsx
│   │   ├── banner.tsx
│   │   ├── code-editor.tsx       # [UNUSED]
│   │   ├── color-picker.tsx
│   │   ├── combobox.tsx
│   │   ├── json-viewer.tsx       # [UNUSED]
│   │   ├── loading.tsx
│   │   ├── loading-overlay.tsx
│   │   ├── search-input.tsx
│   │   ├── stepper.tsx
│   │   ├── stepper-mobile.tsx    # [Phase 3: Mobile removal target]
│   │   ├── subscribe-badge.tsx
│   │   ├── svg-icon.tsx
│   │   ├── tooltip.tsx           # [UNUSED - tooltip-wrapper]
│   │   ├── typo.tsx
│   │   └── index.ts              # Barrel export
│   │
│   ├── layout/                   # Layout/navigation (7 files)
│   │   ├── both-sidebar.tsx      # SidebarLeft, SidebarRight system
│   │   ├── dockview-default-tab.tsx
│   │   ├── dockview-hidden-tab.tsx  # [UNUSED]
│   │   ├── dockview-panel-focus-animation.tsx
│   │   ├── left-navigation-mobile.tsx  # [Phase 3: Mobile removal target]
│   │   ├── top-bar.tsx
│   │   ├── top-navigation.tsx
│   │   └── index.ts              # Barrel export
│   │
│   ├── dialogs/                  # Shared dialogs (4 files)
│   │   ├── confirm.tsx           # Used in 5 domains
│   │   ├── help-video-dialog.tsx # left-navigation only
│   │   ├── import-dialog.tsx     # Used in 3 domains
│   │   ├── list-edit-dialog-mobile.tsx  # [Mobile only]
│   │   └── index.ts              # Barrel export
│   │
│   └── system/                   # System/infrastructure (7 files, no index.ts)
│       ├── convex-ready.tsx
│       ├── init-page.tsx         # App initialization screen
│       ├── install-pwa.tsx
│       ├── mobile-updater.tsx    # [Mobile only]
│       ├── pwa-register.tsx
│       ├── theme-provider.tsx
│       └── updater-new.tsx
│
├── components-v2/                 # Legacy structure (being migrated)
│   ├── card/                     # [TODO: → features/card/]
│   ├── flow/                     # [TODO: → features/flow/]
│   ├── session/                  # [TODO: → features/session/]
│   ├── model/                    # [TODO: → features/model/]
│   ├── setting/                  # [TODO: → features/settings/]
│   ├── left-navigation/          # [TODO: → components/layout/]
│   ├── right-navigation/         # [TODO: → components/layout/]
│   ├── layout/                   # [TODO: → components/layout/]
│   └── editor/                   # [TODO: → features/editor/]
│
├── app/                          # Global app configuration
│   ├── queries/                  # TanStack Query factories
│   ├── services/                 # Business logic services
│   └── stores/                   # Global state management
│
├── lib/                          # Utilities
│   ├── utils/
│   └── hooks/                    # Shared hooks (domain-independent)
│
└── flow-multi/                   # Legacy flow editor (incremental migration)
```

### **Organization Principles**

#### **1. Feature-based Structure (Domain-based)**
Group business logic by domain
```typescript
// ✅ GOOD: Related code together
features/session/
├── components/SessionPanel.tsx
├── hooks/useSession.ts          // Used only by SessionPanel
└── stores/sessionStore.ts       // Session domain only

// ❌ BAD: Scattered across folders
components/SessionPanel.tsx
hooks/useSession.ts              // Far away
stores/sessionStore.ts           // Even farther
```

#### **2. Colocation Principle**
Place files close to where they are used
```typescript
// ✅ GOOD: Inside the feature
features/session/hooks/useSessionMessages.ts

// ❌ BAD: Global hooks folder (if not used in multiple places)
lib/hooks/useSessionMessages.ts
```

#### **3. Progressive Disclosure**
Create structure as needed
```
# Step 1: Start small
session/
└── SessionPanel.tsx

# Step 2: Separate when it grows
session/
├── components/
│   └── SessionPanel.tsx
└── hooks/
    └── useSession.ts

# Step 3: Subdivide when it grows more
session/
├── components/
│   ├── panel/
│   │   ├── SessionPanel.tsx
│   │   └── SessionHeader.tsx
│   └── list/
├── hooks/
└── stores/
```

#### **4. Shared Components Criteria**
Criteria for moving to `components/`:
- ✅ Used in **3+ domains**
- ✅ **Domain-independent** (no business logic)
- ✅ Acts like a **UI library** (Button, Dialog, Loading, etc.)

```typescript
// ✅ components/ui/avatar.tsx
// Reason: Used in session, flow, and card

// ❌ features/session/components/SessionAvatar.tsx
// Reason: Contains session-specific logic
```

#### **5. Naming Convention**
- **Folder names**: kebab-case (`session-panel/`)
- **File names**: kebab-case (`session-panel.tsx`)
- **Component names**: PascalCase (`SessionPanel`)
- **Functions/Variables**: camelCase (`useSession`, `sessionStore`)

### **Migration Strategy**

**Phase 1 (COMPLETED - 2025-10-22)**: Clean up root files ✅
- ✅ Classified 36 loose files from `components-v2/` root
  - 15 files → `components/ui/` (shadcn/ui + basic UI)
  - 7 files → `components/layout/` (navigation, top-bar, sidebar)
  - 4 files → `components/dialogs/` (shared confirm, import)
  - 7 files → `components/system/` (PWA, theme, updater)
  - 2 files → `features/` (session custom-sheet, card sort-dialog)
- ✅ Created barrel exports (index.ts) for organized folders
- ✅ Identified cleanup targets:
  - 3 UNUSED components (code-editor, json-viewer, tooltip-wrapper)
  - 5 Mobile duplication targets for Phase 3
- ✅ Build verified successful after all migrations

**Phase 2 (NEXT)**: Migrate components-v2 domain folders → features/
- Move `components-v2/session/` → `features/session/`
- Move `components-v2/flow/` → `features/flow/`
- Move `components-v2/card/` → `features/card/`
- Move `components-v2/model/` → `features/model/`
- Move `components-v2/setting/` → `features/settings/`
- Merge navigation folders → `components/layout/`

**Phase 3**: Mobile Duplication Elimination
- Remove `-mobile.tsx` files using Tailwind responsive design

**Phase 4**: Feature modularization
- Convert each feature into independent modules as needed (monorepo preparation)

### **References**
- [Kent C. Dodds - Colocation](https://kentcdodds.com/blog/colocation)
- [Bulletproof React](https://github.com/alan2207/bulletproof-react)
- [Next.js Project Structure](https://nextjs.org/docs/getting-started/project-structure)

## Component Patterns (Cleanup Project)

### Compound Component Pattern

For complex UI requiring flexibility:

```typescript
export const SessionPanel = ({ children }) => {
  return <div>{children}</div>;
};

SessionPanel.Header = ({ children }) => <header>{children}</header>;
SessionPanel.Messages = ({ children }) => <main>{children}</main>;
SessionPanel.Input = ({ children }) => <footer>{children}</footer>;
```

### Adaptive Component Pattern (No Mobile Files)

```typescript
// GOOD: Single component with responsive behavior
export const SessionPanel = () => {
  const { isMobile } = useBreakpoint();
  return isMobile ? <MobileLayout /> : <DesktopLayout />;
};

// BAD: Separate mobile file (FORBIDDEN)
// session-panel-mobile.tsx
```

### Container/Presenter Pattern

Separate data logic from UI:

```typescript
// Container (data logic)
export const SessionPanelContainer = () => {
  const { data } = useSessionQuery(sessionId);
  return <SessionPanel session={data} />;
};

// Presenter (UI only)
export const SessionPanel = ({ session }) => {
  return <div>{session.title}</div>;
};
```

## Commands

```bash
# Development
pnpm dev:pwa           # Start PWA dev server

# Testing
pnpm test              # Run all tests
pnpm test --coverage   # Coverage report (must be ≥80%)

# Code Quality
pnpm exec jscpd apps/pwa/src --threshold 5  # Duplication check (<5%)
find apps/pwa/src/components-v2 -name "*.tsx" -exec wc -l {} + | awk '$1 > 500'  # Size check (enforced: 500 lines)
find apps/pwa/src/components-v2 -name "*.tsx" -exec wc -l {} + | awk '$1 > 300'  # Size check (recommended: 300 lines)

# Build
pnpm build:pwa         # Build PWA (with feature flags)
```

## Code Style

- TypeScript strict mode required
- No `any` types without justification
- Component size: **≤300 lines (recommended)**, ≤500 lines (enforced), ≤8 props, ≤10 hooks
- Domain organization: session/, flow/, settings/, shared/
- Barrel exports required (index.ts in every domain folder)
- No `-mobile.tsx` files (use adaptive components)
- No hardcoded breakpoints (use `useBreakpoint()`)

## Testing Requirements

- Characterization tests before refactoring (capture current behavior)
- Component tests for mobile AND desktop rendering
- Test coverage ≥80% (enforced by CI/CD)
- Tests must pass before and after migration

## Constitutional Principles (v2.0.0)

This cleanup project ENFORCES all 11 principles:

1. **Code Reusability First**: Reduce duplication from 40-50% to <5%
2. **Component-Based Architecture**: Recommend 300-line max, enforce 500-line max, 8 props max, 10 hooks max
3. **Single Source of Truth**: Centralized breakpoints (utils/breakpoints.ts)
4. **Clean Code Standards**: PascalCase components, camelCase hooks/utils
5. **Test-Driven Development**: 80%+ coverage with characterization tests
6. **Performance by Design**: Lighthouse >90, bundle size monitoring
7. **Type Safety Everywhere**: TypeScript strict mode (already enforced)
8. **Single Responsibility**: Decompose components exceeding complexity limits
9. **Mobile-First Responsive Design**: Eliminate `-mobile` files, adaptive components only
10. **Component Organization**: Domain folders + barrel exports
11. **Incremental Migration**: 4-phase approach, no Big Bang refactoring

## Recent Changes

- 003-pwa-codebase-cleanup: PWA cleanup project - Phase 1 (Foundation) starting
- Established constitutional principles v2.0.0 with 11 core principles
- Created cleanup infrastructure: feature flags, progress dashboard, quality gates
- Defined 4-phase migration approach (8-10 weeks)

## Migration Workflow (Current Phase)

**Phase 1 Deliverables** (Weeks 1-2):

- [x] Remove dead code (useResponsiveLayout hook - 100 lines saved)
- [ ] Analyze and classify 36 loose components by domain
- [ ] Move components to domain folders (session/, flow/, card/, setting/, shared/)
- [ ] Create barrel exports (index.ts) for clean imports
- [ ] Setup CI/CD quality gates (.github/workflows/quality-gates.yml)
- [ ] Document component patterns (Tailwind-first responsive design)

**Next Phase** (Weeks 3-5):

- Phase 2: Component Decomposition (break 2,979-line session-messages file into smaller components)

---

<!-- MANUAL ADDITIONS START -->

## Cleanup Project Status

### Completed

- [x] Specification and clarification (spec.md, plan.md, tasks.md)
- [x] Constitutional principles v2.0.0 ratified (11 principles)
- [x] Component size policy updated (300 recommended, 500 enforced)
- [x] Dead code removal: useResponsiveLayout hook (~100 lines)

### In Progress

- [x] Phase 1: Foundation - Domain structure organization
  - ✅ Analyzed existing folder structure (session/, flow/, card/, setting/, shared/ exist)
  - ⏳ Classifying 36 loose components by domain
  - ⏳ Creating barrel exports (index.ts)

### Todo

- [ ] Complete Phase 1: Move all loose components to domain folders
- [ ] Phase 2: Component decomposition (2,979-line file → smaller components)
- [ ] Phase 3: Mobile duplication elimination (20+ \*-mobile.tsx files)
- [ ] Phase 4: Final polish and validation
- [ ] Setup CI/CD quality gates

---

## Future Enhancements (Post-Cleanup)

### Feature Flags System (Optional)

**Use Case**: When experimental features need gradual rollout or instant rollback capability

**Implementation**: Custom React Context with environment variables

```typescript
// apps/pwa/src/app/feature-flags/FeatureFlagContext.tsx
export const FEATURE_FLAGS = {
  EXPERIMENTAL_FEATURE_X: 'feature.experimental.x',
} as const;

// Usage
const isEnabled = useFeatureFlag(FEATURE_FLAGS.EXPERIMENTAL_FEATURE_X);
```

**Rollback**:

```bash
VITE_FEATURE_X=false pnpm build:pwa && pnpm deploy
```

**When to implement**:

- After cleanup project completes
- When introducing high-risk experimental features
- When A/B testing is needed

<!-- MANUAL ADDITIONS END -->
