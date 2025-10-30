# astrsk Development Guidelines

Maintained development guidelines. Last updated: 2025-10-24

**Latest Updates (2025-10-24)**:

- ✅ Phase 2.11: App providers cleanup - FSD layer compliance achieved
  - app/contexts/ → shared/stores/ (mobile-navigation-context)
  - app/providers/ → pages/ (init-page, install-pwa)
  - app/providers/ → shared/ui/ (convex-ready)
  - app/providers/ → widgets/ (updater-new, mobile-updater)
  - **100% app layer purity**: Only 2 providers remain (theme, pwa-register)
- ✅ Phase 2.10: Card UI state to entities layer (card-ui-store → entities/card/stores/)
- ✅ Phase 2.9: App layer cleanup - app/v2/ folder eliminated (FSD app layer purification)
- ✅ Phase 2.8: Hooks migration to shared layer (app/hooks → shared/hooks, 26 files)

## Active Feature: PWA Codebase Cleanup & Quality Improvement

**Branch**: 003-pwa-codebase-cleanup
**Timeline**: 8-10 weeks (4 phases)

### Current Progress

> 📜 **Full Migration History**: For complete Phase-by-Phase details, see [PWA_FSD_MIGRATION_HISTORY.md](./PWA_FSD_MIGRATION_HISTORY.md)

| Phase      | Status      | Key Achievements                                  |
| ---------- | ----------- | ------------------------------------------------- |
| Phase 1    | ✅ COMPLETE | Dead code removal, 36 files classified            |
| Phase 2    | ✅ COMPLETE | FSD architecture, 180+ files migrated             |
| Phase 2.5  | ✅ COMPLETE | FSD compliance, modules → entities                |
| Phase 2.6  | ✅ COMPLETE | Routes/Pages separation, 4 pages created          |
| Phase 2.7  | ✅ COMPLETE | Stores migration, app/stores → shared/stores      |
| Phase 2.8  | ✅ COMPLETE | Hooks migration, app/hooks → shared/hooks         |
| Phase 2.9  | ✅ COMPLETE | App layer cleanup, app/v2/ folder eliminated      |
| Phase 2.10 | ✅ COMPLETE | Card UI store to entities (domain-specific state) |
| Phase 2.11 | ✅ COMPLETE | App providers cleanup (FSD compliance achieved)   |
| Phase 3    | 🔜 PENDING  | Mobile duplication elimination                    |
| Phase 4    | 🔜 PENDING  | Quality gates & polish                            |

**Overall Progress**: 90% | **Build Success Rate**: 100%

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

### TanStack Query Patterns

> 📚 **Complete Guide**: See [TANSTACK_QUERY.md](./TANSTACK_QUERY.md) for comprehensive documentation on:
>
> - Query Factory Pattern (hierarchical keys)
> - Mutation Hooks (optimistic updates + rollback)
> - Cache Invalidation Strategies
> - Race Condition Handling (edit mode)
> - Performance Optimizations
> - Testing Guidelines

**Quick Reference**:

- **Query Factory**: Centralized, type-safe query key management
- **Mutations**: Optimistic updates with automatic rollback on error
- **Reference**: `apps/pwa/src/app/queries/card/` (complete implementation)

---

## Architecture: Feature-Sliced Design (FSD)

We are adopting [Feature-Sliced Design (FSD)](https://feature-sliced.design/) as our long-term architectural standard.

> 📚 **Complete FSD Guide**: See [FSD.md](./FSD.md) for comprehensive architecture documentation including:
>
> - Decision trees (where to put new code)
> - Layer-by-layer guides (widgets/, pages/, features/, entities/)
> - Store placement strategies
> - Real-world examples and anti-patterns
> - PR checklist and migration patterns

**Quick Summary:**

- **7 Layers**: app (init) → pages (routes) → widgets (reusable UI) → features (user interactions) → entities (business concepts) → shared (utils)
- **Dependency Rule**: Upper layers can only import from lower layers
- **Current Status**: 90% complete (Phase 2.11 done, Phase 3 pending)

**Migration Status:**

- ✅ app/ - PURE initialization (only 2 providers: theme, pwa-register)
- ✅ pages/ - 7 page components (4 detail pages + 3 UI screens)
- ✅ widgets/ - 10 layout components (reused across pages, includes updaters)
- ✅ features/ - 5 feature domains (user interactions)
- ✅ entities/ - 14 domain entities (business concepts)
- ✅ shared/ - UI components, hooks, stores, contexts (fully populated)

---

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
- **Test-first development (TDD)**: Write tests before implementation
- **Follow existing patterns**: Reuse card/ implementation as reference for queries/mutations
- **Comprehensive error handling**: Always implement rollback on mutation errors

### React Hooks Declaration Order

Follow this order for consistent, readable components:

```typescript
export function Component({ prop }: Props) {
  // 1. State hooks (useState, useReducer)
  const [state, setState] = useState(initial);

  // 2. Store/Context hooks (global state)
  const value = useMyStore.use.selector();

  // 3. Ref hooks
  const ref = useRef(null);

  // 4. Custom hooks (data fetching, utilities)
  const { data } = useQuery(...);
  const navigate = useNavigate();

  // 5. Effects (in logical order, not alphabetical)
  useEffect(() => { /* initialization */ }, [deps]);
  useEffect(() => { /* side effects */ }, [deps]);

  // 6. Memoized callbacks (useCallback)
  const handler = useCallback(() => { ... }, [deps]);

  // 7. Memoized values (useMemo)
  const derived = useMemo(() => { ... }, [deps]);

  // 8. Regular functions (only if not passed as props)
  function helper() { ... }

  return <div>...</div>;
}
```

**useCallback Guidelines**:
- ✅ **Use when**: Function is passed as prop to child components, or used in dependency arrays
- ❌ **Don't use when**: Simple event handlers not passed as props (avoid premature optimization)
- **Rationale**: Prevents unnecessary child re-renders by maintaining referential equality

**useEffect Ordering**:
- Group by logical purpose, not alphabetically
- Order: initialization → validation → event listeners → data sync → cleanup

## Testing Requirements

- **Test coverage**: ≥80% (enforced by CI/CD)
- **Characterization tests** before refactoring (capture current behavior)
- **Component tests** for mobile AND desktop rendering
- Tests must pass before and after migration

### For TanStack Query Mutations

Each mutation must have comprehensive tests:

1. ✅ **Unit test** - Mutation logic correctness
2. ✅ **Optimistic update test** - Immediate UI feedback works
3. ✅ **Error rollback test** - Cache restored on failure
4. ✅ **Cache invalidation test** - Correct queries refetch
5. ✅ **Integration test** - Service layer interaction

**Example test structure**:

```typescript
describe('useUpdateFlowTitle', () => {
  it('should update title optimistically', () => {
    /* ... */
  });
  it('should rollback on error', () => {
    /* ... */
  });
  it('should invalidate detail query on success', () => {
    /* ... */
  });
  it('should handle network errors gracefully', () => {
    /* ... */
  });
});
```

> 📚 **See**: [TANSTACK_QUERY.md](./TANSTACK_QUERY.md#testing-guidelines) for complete testing examples

## Performance Guidelines

### TanStack Query Optimizations

> 📚 **See**: [TANSTACK_QUERY.md](./TANSTACK_QUERY.md#performance-optimizations) for detailed patterns

- ✅ **Optimistic updates** for all mutations (immediate UI feedback)
- ✅ **Granular cache invalidation** (only invalidate affected queries)
- ✅ **Use `select` for data transformation** (prevent unnecessary re-renders)
- ✅ **Batch updates** where possible (reduce API calls)
- ✅ **Set appropriate `staleTime`** (avoid redundant refetches)

**Example**:

```typescript
// Only re-render when name changes
const { data: flowName } = useQuery({
  ...flowQueries.detail(flowId),
  select: (flow) => flow.name,
  staleTime: 1000 * 60, // 1 minute
});
```

### Component Optimizations

- ✅ **Lighthouse Mobile**: ≥90 points
- ✅ **Bundle size increase**: <5% per PR
- ✅ **Component size**: ≤300 lines (recommended), ≤500 lines (enforced)
- ✅ **Code duplication**: <5%
- ✅ **Lazy loading** for heavy components
- ✅ **React.memo** for expensive renders (use sparingly)

### Build & Runtime Optimizations

- Vite with React plugin and PWA support
- Service worker caching (20MB file size limit)
- IndexedDB for local data persistence
- Tree-shaking for unused code elimination

---

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

> 📜 **Full Migration History**: See [PWA_FSD_MIGRATION_HISTORY.md](./PWA_FSD_MIGRATION_HISTORY.md) for complete Phase-by-Phase details

- **2025-10-24**: ✅ Phase 2.11 COMPLETE - App Providers Cleanup (FSD Layer Compliance)
  - **app/contexts/** deleted (1 file → shared/stores/):
    - mobile-navigation-context.tsx → shared/stores/ (6 imports)
  - **app/providers/** cleanup (7 → 2 files):
    - init-page.tsx → pages/initial-page.tsx (2 imports)
    - install-pwa.tsx → pages/install-pwa-page.tsx (1 import)
    - convex-ready.tsx → shared/ui/convex-ready.tsx (4 imports)
    - updater-new.tsx → widgets/updater-new.tsx (1 import)
    - mobile-updater.tsx → widgets/mobile-updater.tsx (1 import)
  - **100% app layer purity**: Only 2 true providers remain (theme-provider, pwa-register)
  - **100% FSD compliance**: No routes/pages importing from app layer
  - Total: 15 import paths updated, 6 files relocated
- **2025-10-24**: ✅ Phase 2.10 COMPLETE - Card UI Store to Entities Layer
  - card-ui-store.tsx moved from shared/stores/ to entities/card/stores/
  - **Rationale**: Domain-specific state (card selection, editing, panel visibility) belongs in entity layer
  - **FSD improvement**: Clearer separation between app-wide state (shared) vs domain state (entities)
  - 18 files updated with new import paths
- **2025-10-24**: ✅ Phase 2.9 COMPLETE - App Layer Cleanup (app/v2/ folder eliminated)
  - 2 files deleted (desktop-app.tsx, mobile-app.tsx)
  - Logic inlined to pages/app-layout.tsx
- **2025-10-24**: ✅ Phase 2.8 COMPLETE - Hooks Migration (app/hooks → shared/hooks)
  - 26 hook files migrated (query, validation, generator, vibe, utility, device hooks)
  - ~85+ import paths updated
  - app/hooks/ directory deleted
  - **100% FSD compliance**: All hooks now in shared layer (app = initialization only)
- **2025-10-24**: ✅ Phase 2.7 COMPLETE - Stores Migration (app/stores → shared/stores)
  - 12 store files migrated (10 stores + init + storage)
  - ~100+ import paths updated
  - app/stores/ directory deleted
  - **100% FSD compliance**: features can now import stores from shared layer
- **2025-10-24**: ✅ Phase 2.6 COMPLETE - Routes & Pages Separation + FSD Layer Violations Fixed
  - Part 1: 4 page components created (routes/pages separation)
  - Part 2: Fixed 2 FSD violations (session-detail-page, flow-detail-page)
  - 100% FSD compliance achieved (no upward dependencies)
- **2025-10-23**: ✅ Phase 2.5 COMPLETE - FSD Architecture Compliance (1,102 imports updated)
- **2025-10-23**: ✅ Phase 2 COMPLETE - FSD Architecture Migration (180+ files)
- **2025-10-22**: ✅ Phase 1 COMPLETE - Foundation
- **2025-10-20**: Project Initialization

## Current Status

**Active Phase**: Phase 3 Preparation
**Overall Progress**: 90% (Phase 1 ✅, Phase 2.x ✅ all 11 sub-phases complete)

### Next Steps

- 🔜 **Phase 3**: Mobile Duplication Elimination
- 🔜 **Phase 4**: Quality Gates & Polish

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
