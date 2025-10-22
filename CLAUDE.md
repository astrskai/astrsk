# astrsk Development Guidelines

Maintained development guidelines. Last updated: 2025-10-21

## Active Feature: PWA Codebase Cleanup & Quality Improvement

**Branch**: 003-pwa-codebase-cleanup
**Timeline**: 8-10 weeks (4 phases)

### Objective

Restructure PWA codebase to eliminate 40-50% code duplication, organize 36+ loose components into domain folders, decompose oversized components (max 2,979 lines → 500 line limit), remove 20+ duplicate mobile files using Tailwind responsive design, and establish automated quality gates. Enable 50% faster feature development and A/B testing cycles.

**Current Progress**:

- ✅ Removed `useResponsiveLayout` hook (dead code, already using Tailwind)
- ⏳ Analyzing 36 loose files in components-v2/ root for domain classification

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

## Project Structure

```
apps/pwa/src/
├── components-v2/           # UI layer (CLEANUP TARGET)
│   ├── session/            # NEW: Session domain (organized)
│   ├── flow/               # NEW: Flow domain
│   ├── settings/           # NEW: Settings domain
│   └── shared/             # NEW: Shared components
├── hooks/                   # NEW: Centralized hooks
│   └── ui/
│       └── useBreakpoint.ts  # NEW: Breakpoint hook
├── utils/
│   └── breakpoints.ts      # NEW: Single source of truth
├── app/
│   ├── queries/            # Query factories and mutations
│   ├── services/           # Business logic services
│   ├── stores/             # State management
│   └── feature-flags/      # NEW: Phase rollback system
└── flow-multi/             # Flow editor components
```

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
pnpm test --coverage   # Coverage report (must be e80%)

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
