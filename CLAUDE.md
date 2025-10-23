# astrsk Development Guidelines

Maintained development guidelines. Last updated: 2025-10-23

## Active Feature: PWA Codebase Cleanup & Quality Improvement

**Branch**: 003-pwa-codebase-cleanup
**Timeline**: 8-10 weeks (4 phases)

### Objective

Restructure PWA codebase to eliminate 40-50% code duplication, organize 36+ loose components into domain folders, decompose oversized components (max 2,979 lines → 500 line limit), remove 20+ duplicate mobile files using Tailwind responsive design, and establish automated quality gates. Enable 50% faster feature development and A/B testing cycles.

**Current Progress**:

- ✅ **Phase 1 Complete** (2025-10-22)
  - Removed `useResponsiveLayout` hook (dead code, already using Tailwind)
  - Component reclassification complete (36 loose files reorganized)

- ✅ **Phase 2 COMPLETE** (2025-10-23) - **FSD Architecture Migration** 🎉

  **Summary**: Migrated entire PWA codebase to Feature-Sliced Design (FSD) architecture, eliminating 7 legacy folders and establishing clear layer separation.

  **Achievements**:
  - ✅ **7 Legacy Folders Deleted** → FSD layers
  - ✅ **180+ Files Migrated** to proper FSD structure
  - ✅ **~1,300 Import Paths Updated** for consistency
  - ✅ **20+ Barrel Exports Created** (index.ts pattern)
  - ✅ **5 FSD Layers Established** (app, pages, widgets, features, shared)
  - ✅ **100% Build Success** across all migration steps

  **Detailed Progress**:
  - ✅ `features/settings/providers/` - 3 files (model-page, model-page-mobile, provider-list-item)
  - ✅ `components/layout/left-navigation/` - 7 files (index, mobile, card-list, flow-list, session-list, shared, hooks)
  - ✅ `features/flow/` - 5 files (dialog, page-mobile, components: agent-model-card, export-dialog, import-dialog)
  - ✅ `features/card/` - 47 files complete! (components, hooks, mobile, panels, utils + types)
    - Barrel exports maintained (components/index.ts, hooks/index.ts)
    - Legacy cleanup: Removed components-v1/card/(edit-card)/edit-card-dialog.tsx
    - Created features/card/types/card-form.ts for shared types
    - Fixed CardFormValues type duplication (4 files updated)
  - ✅ `features/session/` - 47 files complete! (components, create-session, edit-session, hooks, mobile)
    - Full domain structure with complete session workflow
    - Merged Phase 1 custom-sheet.tsx into components/
    - Updated 85+ import statements across codebase
    - Build verified successful (26.0s)
  - ✅ `features/settings/` - 24 files complete! (account, subscription, onboarding, legal, providers)
    - Organized into 5 subdomain folders with clear separation
    - Created 4 barrel exports (account/, subscription/, onboarding/, legal/)
    - Cleaned up all import paths to use domain-based imports
    - Empty components-v2/setting/ folder removed
    - Build verified successful (26.9s)
  - ✅ **components-v2/ MIGRATION COMPLETE & DELETED** - All 43 files migrated to FSD structure
    - ✅ `layout/` - 2 files migrated → `components/layout/`
      - modal-pages.tsx, v2-layout.tsx
      - Updated 1 import in routes/_layout.tsx
    - ✅ `lib/` - 1 file migrated → `shared/lib/cn.ts` (FSD Layer)
      - Tailwind cn() utility function
      - Updated 102 imports across codebase
    - ✅ `hooks/` - 6 files migrated → `shared/hooks/` (FSD Layer)
      - use-mobile.tsx (24 usages), use-device-type.tsx (internal)
      - use-pwa.tsx (2 usages), use-back-gesture.tsx (3 usages)
      - use-forwarded-ref.tsx (1 usage), use-mobile-override.tsx (2 usages)
      - All hooks actively used, zero dead code
    - ✅ `right-navigation/` - 26 files migrated → `features/vibe/` (FSD Layer)
      - Identified as independent AI assistant feature (not just navigation)
      - Components: 9 files, Hooks: 7 files (with barrel export)
      - Utils: 8 files, Types: 1 file
      - Updated 3 imports (flow-multi, features/card)
      - Build successful (11.32s)
    - ✅ `shared/` - 1 file migrated → `shared/ui/media-display.tsx` (FSD Layer)
      - Image/video display component (5 usages)
      - Updated all imports across codebase
    - ✅ `ui/play-button.tsx` - 1 file migrated → `shared/ui/play-button.tsx` (FSD Layer)
      - Video play button component (3 usages)
      - Updated all imports, removed empty shared/ folder
      - Build successful (10.04s)
    - ✅ **FSD Layer Consolidation** - `shared/utils/` → `shared/lib/` (FSD compliance)
      - Merged 12 utility files + 2 directories (test/, tokenizer/)
      - Updated 177 import paths: `@/shared/utils` → `@/shared/lib`
      - Barrel export updated in shared/lib/index.ts
      - Eliminated lib/utils confusion (FSD recommends single `lib` segment)
      - Build successful (10.55s)
    - ✅ **Import Path Optimization** - cn utility barrel export
      - Shortened 146 imports: `@/shared/lib/cn` → `@/shared/lib`
      - Leverages barrel export pattern for cleaner imports
    - ✅ `editor/` - 2 files migrated → `shared/ui/editor/` (FSD Layer)
      - Monaco Editor wrapper component (10 usages across flow-multi, card, vibe)
      - Domain-independent UI component
      - Updated all imports across codebase
    - ✅ `scenario/` - 2 files migrated → `features/session/components/scenario/`
      - ScenarioItem, ScenarioSelectionDialog (4 usages in session + stories)
      - Session domain-specific components
      - Updated all imports
    - ✅ **ui/ COMPLETE MIGRATION** - All 38 shadcn/ui components → `shared/ui/` (FSD Layer)
      - **High Usage** (20+ usages): button (113), scroll-area (44), dialog (34), tooltip (28), input (27)
      - **Medium Usage** (10-19 usages): label (18), tabs (15), select (13), card (12), checkbox (11)
      - **Low Usage** (1-9 usages): 23 components (accordion, badge, switch, sheet, separator, etc.)
      - Updated ~400+ import paths: `@/components-v2/ui/*` → `@/shared/ui/*`
      - **Zero unused components** - All 38 files actively used in production
      - Build successful (9.56s)
    - ✅ **components-v2/ FOLDER DELETED** - Complete FSD migration achieved
      - All 43 files successfully migrated to FSD structure
      - Legacy folder completely removed from codebase
  - ✅ **components/ FOLDER COMPLETE FSD RECLASSIFICATION & DELETED**
    - ✅ **components/ui/ → shared/ui/** (12 files)
      - Deleted 3 unused: code-editor, json-viewer, tooltip
      - Migrated: avatar, banner, color-picker, combobox, loading-overlay, loading, search-input, stepper-mobile, stepper, subscribe-badge, svg-icon, typo
      - All domain-independent UI components
    - ✅ **components/dialogs/ → shared/ui/** (4 files)
      - confirm (8 usages), help-video-dialog (1), import-dialog (3), list-edit-dialog-mobile (3)
      - Reusable dialog components
    - ✅ **components/layout/ → widgets/** (8 files + 1 directory) - **FSD Widgets Layer**
      - Deleted 1 unused: dockview-hidden-tab
      - Migrated: both-sidebar, dockview-default-tab, dockview-panel-focus-animation, modal-pages, top-bar, top-navigation, v2-layout, left-navigation/
      - Large UI blocks composing multiple features
    - ✅ **components/system/ → app/providers/** (7 files) - **FSD App Layer**
      - convex-ready, init-page, install-pwa, mobile-updater, pwa-register, theme-provider, updater-new
      - App initialization and global providers
    - ✅ **components/ FOLDER DELETED** - Complete FSD reorganization
      - All files reclassified according to FSD principles
      - Build successful (9.67s)
  - ✅ **FSD Layer Refinement** - Additional folder migrations (2025-10-23)
    - ✅ **contexts/ → app/contexts/** (1 file)
      - mobile-navigation-context.tsx (6 imports)
      - App-wide context provider
    - ✅ **assets/ → shared/assets/** (FSD compliance)
      - icons/ (logo.svg with barrel export)
      - Follows FSD shared layer guidelines
    - ✅ **public/placeholders/ → shared/assets/placeholders/**
      - character-card-placeholder.ts, plot-card-placeholder.ts
      - Centralized static assets management
      - Build successful (25.27s)
  - ✅ **shared/ui/ BARREL EXPORT** - Consolidated 57 UI components
    - Single import point: `@/shared/ui`
    - Consolidated 581 import statements across 211 files
    - Examples: Button, Dialog, Input, Select, Tooltip (shadcn/ui + custom)
    - Build successful (11.29s)
  - ✅ **utils/ FOLDER COMPLETE MIGRATION & DELETED** - 7 files + operation-processors/
    - ✅ **Global utilities → shared/lib/** (4 files)
      - url-utils.ts (4 imports) - URL/path parsing
      - environment.ts (2 imports) - Electron vs Web detection
      - flow-local-state-sync.ts (4 imports) - Flow sync utility
      - uuid-generator.ts - UUID generation (currently unused)
    - ✅ **Vibe AI utilities → features/vibe/lib/** (3 files + processors/)
      - snapshot-utils.ts (1 import) - Vibe session snapshots
      - data-store-field-pipeline.ts (1 import) - Data store operations
      - operation-processor.ts (8 imports) - Operation-based editing
      - operation-processors/ (entire directory) - Processing infrastructure
    - ✅ **Import path updates**: 20+ files updated
    - ✅ **Build successful**: 28.0s
    - ✅ **utils/ folder completely removed**
  - ✅ **flow-multi/ FOLDER MIGRATION** - React Flow visual editor (2025-10-23)
    - ✅ **flow-multi/ → features/flow/flow-multi/** (100 files)
      - Complete visual flow editor moved to Flow domain
      - Components: nodes (6), panels (17+ subdirs), components (9), utils (12), validation (4 subdirs)
      - Import path updates: 189 imports (`@/flow-multi` → `@/features/flow/flow-multi`)
      - Fixed CSS import path (relative → absolute)
      - Build successful (27.0s)
    - ✅ **FSD Domain Consolidation**: All Flow-related code now in features/flow/
      - flow-dialog.tsx, flow-page-mobile.tsx, components/ (3 files)
      - flow-multi/ (100 files - React Flow editor)
      - Total: 105 files in unified Flow domain
- ✅ **Phase 2 Final Statistics & Outcomes**:

  **Migration Summary**:
  - **7 Legacy Folders Deleted**: components-v2/, components/, contexts/, assets/, public/placeholders/, utils/, flow-multi/
  - **180+ Files Migrated**: Complete FSD restructuring
  - **~1,300 Import Paths Updated**: Consistent naming conventions
  - **20+ Barrel Exports**: Public API pattern (index.ts)
  - **7 Unused Files Deleted**: Dead code elimination
  - **100% Build Success**: All migrations verified

  **FSD Layer Structure**:
  ```
  ✅ app/          App initialization (providers, contexts, queries, services, stores)
  ✅ pages/        Page components (not-found.tsx)
  ✅ widgets/      Large UI blocks (9 files: sidebar, top-bar, layout, navigation)
  ✅ features/     Business domains (5 domains, 254 files)
    ├── card/      (47 files) Card management
    ├── flow/      (105 files) Flow editor + React Flow visual editor
    ├── session/   (49 files) Session management
    ├── settings/  (24 files) Settings & account
    └── vibe/      (29 files) AI assistant
  ✅ shared/       Reusable code (ui, lib, hooks, assets, domain, core, infra)
  ```

  **Key Improvements**:
  - ✅ **Domain Consolidation**: Flow domain unified (flow/ + flow-multi/ → 105 files)
  - ✅ **Clear Naming**: `right-navigation/` → `vibe/` (AI assistant)
  - ✅ **UI Centralization**: 3 UI folders → 1 `shared/ui/` (57 files)
  - ✅ **Utility Consolidation**: `utils/` + `shared/utils/` → `shared/lib/`
  - ✅ **Barrel Exports**: Single import points (`@/shared/ui`, `@/shared/lib`)

  **Code Quality Metrics**:
  - ✅ Folder depth reduced: 4-5 levels → 2-3 levels
  - ✅ Import consistency: 100% FSD-compliant paths
  - ✅ Domain cohesion: High (feature-based grouping)
  - ✅ Dependency direction: Single-directional (FSD layers)
  - ✅ New feature placement: Clear guidelines established

  **Documentation**:
  - ✅ FSD_MIGRATION.md created (comprehensive migration guide)
  - ✅ CLAUDE.md updated (current structure documented)
  - ✅ types/ folder analyzed (kept as TypeScript ambient declarations)

  **Next Steps (Phase 3)**:
  - 🔜 Mobile duplication elimination (5 `-mobile.tsx` targets identified)
  - 🔜 Component decomposition (enforce 500-line limit)
  - 🔜 Tailwind responsive design migration

### Migration Phases

- ✅ **Phase 1 (Week 1)**: Foundation - COMPLETE
  - Dead code removal (`useResponsiveLayout` hook)
  - Component reclassification (36 files analyzed)
  - Domain structure planning

- ✅ **Phase 2 (Weeks 2-3)**: FSD Architecture Migration - COMPLETE
  - **Scope**: Complete FSD layer restructuring
  - **Delivered**:
    - 7 legacy folders deleted → FSD layers
    - 180+ files migrated with 100% build success
    - ~1,300 import paths updated
    - 20+ barrel exports created
    - Domain consolidation (Flow, Vibe, Session, Card, Settings)
  - **Duration**: 2 days (2025-10-22 ~ 2025-10-23)
  - **Status**: ✅ 100% Complete

- 🔜 **Phase 3 (Weeks 4-6)**: Mobile Duplication Elimination
  - Remove `-mobile.tsx` files (5 targets identified)
  - Implement Tailwind responsive design patterns
  - Break large components into smaller pieces (<500 lines)
  - Component decomposition for oversized files

- 🔜 **Phase 4 (Weeks 7-8)**: Quality Gates & Polish
  - Setup CI/CD quality gates (size, duplication, coverage)
  - Final code review and optimization
  - Performance testing (Lighthouse >90)
  - Documentation finalization

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

### **Architecture: Feature-Sliced Design (FSD)**

We are adopting [Feature-Sliced Design (FSD)](https://feature-sliced.design/) as our long-term architectural standard. This is a gradual migration, with new code following FSD principles.

> "Feature-Sliced Design is an architectural methodology for frontend projects. It aims to divide an application according to business logic and scopes of responsibility."

#### **FSD Core Principles**

1. **Explicit layer separation** - Clear boundaries between app, pages, widgets, features, entities, shared
2. **Isolation** - Layers can only import from layers below (shared ← entities ← features ← widgets ← pages ← app)
3. **Public API** - Each module exposes a single entry point (index.ts)
4. **Business-oriented** - Structure reflects business domains, not technical details

#### **FSD 3-Level Hierarchy**

FSD organizes code through three levels: **Layers → Slices → Segments**

**1. Layers** (Vertical Separation by Responsibility)
- **Purpose**: Separate code by responsibility scope and dependency range
- **Rule**: Upper layers can only import from lower layers
- **7 Standard Layers**: app, ~~processes~~(deprecated), pages, widgets, features, entities, shared

**2. Slices** (Horizontal Separation by Business Domain)
- **Purpose**: Group code by business meaning and product domain
- **Naming**: Freely chosen based on business (e.g., `session`, `card`, `flow`)
- **Rule**: Slices on the same layer cannot import each other (ensures high cohesion, low coupling)
- **Applied to**: features, entities, widgets, pages layers only (app/shared go directly to segments)

**3. Segments** (Technical Purpose Separation)
- **Purpose**: Group code by technical nature within a slice
- **Standard Segments**:
  - `ui/` - Everything related to UI display
  - `model/` - State management and business logic
  - `api/` - API calls and backend integration
  - `lib/` - Library code needed by this slice
  - `config/` - Configuration files
- **Public API**: Each slice exports only through `index.ts`

**Example Structure:**
```
features/           # Layer
  ├── session/      # Slice (business domain)
  │   ├── ui/       # Segment (UI components)
  │   ├── model/    # Segment (state management)
  │   ├── api/      # Segment (API calls)
  │   └── index.ts  # Public API
  └── card/         # Slice (different business domain)
      ├── ui/
      ├── model/
      └── index.ts
```

#### **FSD Layers** (Bottom-up dependency)

```
┌─────────────────────────────────────┐
│  app/          (Initialization)     │  ← App-wide configs, providers, routes
├─────────────────────────────────────┤
│  pages/        (Pages)              │  ← Compose widgets + features
├─────────────────────────────────────┤
│  widgets/      (Large UI blocks)    │  ← Header, Sidebar, complex components
├─────────────────────────────────────┤
│  features/     (User interactions)  │  ← Business features (session, card, flow)
├─────────────────────────────────────┤
│  entities/     (Business entities)  │  ← Domain models (Card, Session, User)
├─────────────────────────────────────┤
│  shared/       (Reusable code)      │  ← ui/, lib/, hooks/, api/
└─────────────────────────────────────┘
```

#### **Current Migration Status**

- ✅ **app/** - App layer with providers/ segment (7 initialization files)
- ✅ **widgets/** - Widgets layer created (8 layout files + left-navigation/)
- ✅ **features/** - Business features (session/, card/, flow/, settings/, vibe/)
- ✅ **shared/** - Following FSD structure (ui/, lib/, hooks/) - **utils/ removed (FSD compliance)**
- ✅ **components/** - **DELETED** - All files reclassified to FSD layers
- ⏳ **routes/** → **pages/** (planned migration)
- ⏳ **modules/** → **entities/** (planned migration)

#### **Colocation + FSD**

We combine FSD layers with colocation principles:

> "Keep files as close as possible to where they are used" - Kent C. Dodds

### **Current Structure** (Phase 2 Progress)

```
apps/pwa/src/
├── features/                      # ✅ FSD Features Layer: Business domains
│   ├── card/                     # Card management (47 files)
│   │   ├── components/, hooks/, mobile/, panels/, types/, utils/
│   │   └── card-list.tsx, card-page.tsx
│   │
│   ├── flow/                     # ✅ Flow domain (105 files)
│   │   ├── flow-dialog.tsx
│   │   ├── flow-page-mobile.tsx
│   │   ├── components/          # Flow UI components (3 files)
│   │   │   ├── agent-model-card.tsx
│   │   │   ├── flow-export-dialog.tsx
│   │   │   └── flow-import-dialog.tsx
│   │   └── flow-multi/          # ✅ NEW: React Flow visual editor (100 files)
│   │       ├── components/      # Flow editor components (9 files)
│   │       ├── nodes/           # Node types: agent, if, data-store, start, end (6 files)
│   │       ├── panels/          # Node panels: prompt, output, parameter, preview, etc. (17+ files)
│   │       ├── utils/           # Flow helpers, validation, traversal (12 files)
│   │       ├── validation/      # Flow validation system (4 subdirs)
│   │       ├── edges/, hooks/, types/, pages/
│   │       └── debug-mutations.ts
│   │
│   ├── session/                  # Session management (49 files)
│   │   ├── components/, create-session/, edit-session/, hooks/, mobile/
│   │   └── session-*.tsx (6 page files)
│   │
│   ├── settings/                 # Settings & account (24 files)
│   │   ├── account/, subscription/, onboarding/, legal/, providers/
│   │   └── setting-page.tsx, setting-page-mobile.tsx
│   │
│   └── vibe/                     # AI assistant (29 files)
│       ├── components/, hooks/, lib/, utils/, types/
│       └── index.tsx (VibeCodingPanel)
│
├── widgets/                       # ✅ FSD Widgets Layer: Large UI blocks
│   ├── left-navigation/          # Sidebar navigation (7 files)
│   └── both-sidebar.tsx, top-bar.tsx, v2-layout.tsx, etc.
│
├── shared/                        # ✅ FSD Shared Layer: Reusable code
│   ├── ui/                       # Global UI components (57 files)
│   │   ├── editor/              # Monaco Editor wrapper
│   │   ├── shadcn/ui components (38 files: button, dialog, input, etc.)
│   │   ├── Custom UI (12 files: avatar, banner, color-picker, etc.)
│   │   ├── Dialogs (4 files: confirm, help-video, import, etc.)
│   │   └── index.ts             # Barrel export
│   │
│   ├── lib/                      # Utilities & libraries
│   │   ├── cn.ts, crypto-utils.ts, datetime.ts, file-utils.ts
│   │   ├── environment.ts, flow-local-state-sync.ts, url-utils.ts
│   │   ├── logger.ts, template-renderer.ts, zustand-utils.ts
│   │   ├── test/, tokenizer/
│   │   └── index.ts             # Barrel export
│   │
│   ├── assets/                   # Static assets
│   │   ├── icons/, placeholders/
│   │   └── index.ts             # Barrel exports
│   │
│   ├── hooks/                    # Global React hooks (6 files)
│   │   ├── use-mobile.tsx, use-pwa.tsx, use-back-gesture.tsx
│   │   └── use-device-type.tsx, use-forwarded-ref.tsx, use-mobile-override.tsx
│   │
│   ├── domain/                   # DDD base classes
│   ├── core/                     # Core business logic
│   ├── infra/                    # Infrastructure
│   ├── endpoints/                # API endpoints
│   ├── prompt/                   # Prompt templates
│   └── task/                     # Background tasks
│
├── app/                          # ✅ FSD App Layer: Application initialization
│   ├── providers/                # App providers (7 files)
│   ├── contexts/                 # App-wide contexts (1 file)
│   ├── queries/                  # TanStack Query factories
│   ├── services/                 # Business logic services
│   └── stores/                   # Global state management
│
├── pages/                        # ✅ FSD Pages Layer
│   └── not-found.tsx
│
├── routes/                       # TanStack Router file-based routing
├── modules/                      # Domain modules (DDD)
└── db/                           # Database schemas
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
features / session / hooks / useSessionMessages.ts;

// ❌ BAD: Global hooks folder (if not used in multiple places)
lib / hooks / useSessionMessages.ts;
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

**Phase 2 (COMPLETED - 2025-10-23)**: Migrate components-v2 domain folders → features/

- ✅ `features/settings/providers/` - 3 files migrated
  - model-page.tsx, model-page-mobile.tsx, provider-list-item.tsx
- ✅ `components/layout/left-navigation/` - 7 files consolidated with barrel export
  - index.tsx (renamed from left-navigation.tsx), left-navigation-mobile.tsx
  - card-list.tsx, flow-list.tsx, session-list.tsx, shared-list-components.tsx
  - hooks/use-left-navigation-width.ts
- ✅ `features/flow/` - 5 files migrated
  - flow-dialog.tsx, flow-page-mobile.tsx
  - components/: agent-model-card.tsx, flow-export-dialog.tsx, flow-import-dialog.tsx
- ✅ `features/card/` - 47 files migrated (COMPLETE!)
  - Full domain structure: components/, hooks/, mobile/, panels/, types/, utils/
  - Maintained barrel exports (components/index.ts, hooks/index.ts)
  - Legacy cleanup: Removed components-v1/card/(edit-card)/edit-card-dialog.tsx
  - Created types/card-form.ts for shared CardFormValues type
  - Updated 2 store files to use new type location
  - Fixed CardFormValues type duplication (4 files updated)
- ✅ `features/session/` - 47 files migrated (COMPLETE!)
  - Full domain structure: components/, create-session/, edit-session/, hooks/, mobile/
  - Merged Phase 1 custom-sheet.tsx into components/
  - Updated 85+ import statements across codebase
  - Fixed relative import in v2-layout.tsx
  - Build verified successful (26.0s)
- ✅ `features/settings/` - 24 files migrated (COMPLETE!)
  - Organized into 5 subdomain folders: account/, subscription/, onboarding/, legal/, providers/
  - Created 4 barrel exports for cleaner imports (account, subscription, onboarding, legal)
  - Cleaned up all import paths to use domain-based imports
  - Removed empty components-v2/setting/ folder
  - Build verified successful (26.9s)
- ⏳ **Final cleanup: components-v2/ → complete migration** (80 files remaining)
  - Phase 2a: Move layout files (2) → `components/layout/`
  - Phase 2b: Move hooks (6) → `lib/hooks/`
  - Phase 2c: Move right-navigation (26) → `components/layout/right-navigation/`
  - Phase 2d: Analyze and migrate remaining small folders (7 files total)
  - Phase 2e: Keep ui/ (39 files) as-is - already in use
  - Goal: Complete removal of components-v2/ folder

**Phase 3**: Mobile Duplication Elimination

- Remove `-mobile.tsx` files using Tailwind responsive design

**Phase 4**: Feature modularization

- Convert each feature into independent modules as needed (monorepo preparation)

### **References**

**Feature-Sliced Design (FSD):**
- [Feature-Sliced Design](https://feature-sliced.design/) - **Primary architectural reference**
- [FSD Get Started](https://feature-sliced.design/docs/get-started/overview) - Core concepts and layers
- [FSD Layers](https://feature-sliced.design/docs/reference/layers) - **Layer hierarchy and dependency rules**
- [FSD Slices & Segments](https://feature-sliced.design/docs/reference/slices-segments) - **Business domain and technical organization**
- [FSD Migration from Custom](https://feature-sliced.design/docs/guides/migration/from-custom) - Migration guide (lib vs utils)

**Other References:**
- [Kent C. Dodds - Colocation](https://kentcdodds.com/blog/colocation) - File organization principles
- [Bulletproof React](https://github.com/alan2207/bulletproof-react) - React project structure patterns
- [Next.js Project Structure](https://nextjs.org/docs/getting-started/project-structure) - Modern folder conventions

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

- **2025-10-23**: ✅ **Phase 2 COMPLETE** - FSD Architecture Migration
  - Migrated 180+ files to Feature-Sliced Design structure
  - Deleted 7 legacy folders (components, components-v2, contexts, assets, utils, flow-multi)
  - Updated ~1,300 import paths for consistency
  - Created 20+ barrel exports (index.ts pattern)
  - Established 5 FSD layers (app, pages, widgets, features, shared)
  - 100% build success across all migration steps
  - Created comprehensive FSD_MIGRATION.md documentation

- **2025-10-22**: ✅ **Phase 1 COMPLETE** - Foundation
  - Removed `useResponsiveLayout` hook (dead code)
  - Component reclassification complete (36 files analyzed)
  - Domain structure planning finalized

- **2025-10-20**: Project Initialization
  - Established constitutional principles v2.0.0 (11 core principles)
  - Component size policy defined (300 recommended, 500 enforced)
  - Defined 4-phase migration approach (8-10 weeks)

## Current Status

**Active Phase**: Phase 3 Preparation
**Overall Progress**: 50% (Phase 1 ✅, Phase 2 ✅, Phase 3 🔜, Phase 4 🔜)

### Completed

- ✅ **Phase 1**: Foundation (Dead code removal, component classification)
- ✅ **Phase 2**: FSD Architecture Migration (7 folders → FSD layers)
  - All legacy folders deleted and restructured
  - Complete FSD layer establishment
  - Domain consolidation (Flow, Vibe, Session, Card, Settings)
  - Barrel exports and import path optimization
  - Comprehensive documentation (FSD_MIGRATION.md)

### Next Steps

- 🔜 **Phase 3**: Mobile Duplication Elimination (Weeks 4-6)
  - Remove 5 `-mobile.tsx` files identified
  - Implement Tailwind responsive design patterns
  - Component decomposition (enforce 500-line limit)

- 🔜 **Phase 4**: Quality Gates & Polish (Weeks 7-8)
  - Setup CI/CD automation
  - Performance optimization (Lighthouse >90)
  - Final documentation

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
