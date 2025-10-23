# astrsk Development Guidelines

Maintained development guidelines. Last updated: 2025-10-22

## Active Feature: PWA Codebase Cleanup & Quality Improvement

**Branch**: 003-pwa-codebase-cleanup
**Timeline**: 8-10 weeks (4 phases)

### Objective

Restructure PWA codebase to eliminate 40-50% code duplication, organize 36+ loose components into domain folders, decompose oversized components (max 2,979 lines → 500 line limit), remove 20+ duplicate mobile files using Tailwind responsive design, and establish automated quality gates. Enable 50% faster feature development and A/B testing cycles.

**Current Progress** (Phase 2):

- ✅ **Phase 1 Complete** - Removed `useResponsiveLayout` hook (dead code, already using Tailwind)
- ✅ **Component Reclassification Complete** - 36 loose files reorganized into domain-based structure
  - `components/ui/` - 15 files (shadcn/ui + basic UI components)
  - `components/layout/` - 7 files (navigation, top-bar, sidebar components)
  - `components/dialogs/` - 4 files (shared confirm, import dialogs)
  - `components/system/` - 7 files (PWA, theme, updater infrastructure)
  - `features/session/components/` - 1 file (custom-sheet)
  - `features/card/mobile/` - 1 file (sort-dialog-mobile)
- ✅ **Phase 2 In Progress** - Domain folder migrations:
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
  - ⏳ **components-v2/ cleanup** - 43 files remaining (37 migrated)
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
    - ✅ `ui/` - 38 files remaining (shadcn/ui - keep as-is, production use)
    - ⏳ `editor/` - 2 files → analyze usage
    - ⏳ `scenario/` - 2 files → analyze usage
    - ⏳ `title/` - 1 file → has TODO comment (deprecated)
- ✅ **Quality Findings**:
  - 3 UNUSED components identified (code-editor, json-viewer, tooltip-wrapper)
  - 5 Mobile duplication targets identified for Phase 3
  - 1 Legacy file removed (edit-card-dialog.tsx)
  - All barrel exports created (index.ts)

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

### **Architecture: Feature-Sliced Design (FSD)**

We are adopting [Feature-Sliced Design (FSD)](https://feature-sliced.design/) as our long-term architectural standard. This is a gradual migration, with new code following FSD principles.

> "Feature-Sliced Design is an architectural methodology for frontend projects. It aims to divide an application according to business logic and scopes of responsibility."

#### **FSD Core Principles**

1. **Explicit layer separation** - Clear boundaries between app, pages, widgets, features, entities, shared
2. **Isolation** - Layers can only import from layers below (shared ← entities ← features ← widgets ← pages ← app)
3. **Public API** - Each module exposes a single entry point (index.ts)
4. **Business-oriented** - Structure reflects business domains, not technical details

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
│  shared/       (Reusable code)      │  ← ui/, lib/, hooks/, utils/, api/
└─────────────────────────────────────┘
```

#### **Current Migration Status**

- ✅ **shared/** - Following FSD structure (ui/, lib/, hooks/, utils/)
- ✅ **features/** - Business features (session/, card/, flow/, settings/, vibe/)
- ⏳ **components/** → **widgets/** (planned migration)
- ⏳ **routes/** → **pages/** (planned migration)
- ⏳ **modules/** → **entities/** (planned migration)

#### **Colocation + FSD**

We combine FSD layers with colocation principles:

> "Keep files as close as possible to where they are used" - Kent C. Dodds

### **Current Structure** (Phase 2 Progress)

```
apps/pwa/src/
├── features/                      # Business domains (Feature-based) [ACTIVE MIGRATION]
│   ├── card/                     # ✅ Card domain COMPLETE (47 files)
│   │   ├── card-list.tsx
│   │   ├── card-page.tsx
│   │   ├── components/          # UI components
│   │   │   ├── edit-sheet/      # Card editing components
│   │   │   ├── card-grid.tsx
│   │   │   ├── card-import-dialog.tsx
│   │   │   ├── header-bar.tsx
│   │   │   ├── sorting-bar.tsx
│   │   │   ├── trading-card.tsx
│   │   │   ├── trading-card-display.tsx
│   │   │   └── index.ts         # Barrel export
│   │   ├── hooks/               # Custom hooks
│   │   │   ├── useCardEditor.ts
│   │   │   ├── useCardImport.ts
│   │   │   ├── useCardManagement.ts
│   │   │   ├── useEntryList.ts
│   │   │   └── index.ts         # Barrel export
│   │   ├── mobile/              # [Phase 3: Mobile removal target]
│   │   │   ├── card-page-mobile.tsx
│   │   │   ├── sort-dialog-mobile.tsx
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── panels/              # Panel components
│   │   │   ├── card-panel/
│   │   │   │   └── components/
│   │   │   │       └── image-generator/  # Complex feature
│   │   │   ├── card-panel-main.tsx
│   │   │   ├── card-panel-provider.tsx
│   │   │   ├── card-panel-dockview.css
│   │   │   └── hooks/
│   │   ├── types/               # Type definitions
│   │   │   └── card-form.ts     # CardFormValues type
│   │   └── utils/               # Utilities
│   │       ├── invalidate-card-queries.ts
│   │       └── panel-id-utils.ts
│   │
│   ├── flow/                     # ✅ Flow domain (5 files)
│   │   ├── flow-dialog.tsx
│   │   ├── flow-page-mobile.tsx  # [Phase 3: Mobile removal target]
│   │   └── components/
│   │       ├── agent-model-card.tsx  # Shared with session import/export
│   │       ├── flow-export-dialog.tsx
│   │       └── flow-import-dialog.tsx
│   │
│   ├── settings/                 # ✅ Settings domain COMPLETE (24 files)
│   │   ├── setting-page.tsx
│   │   ├── setting-page-mobile.tsx  # [Phase 3: Mobile removal target]
│   │   ├── account/              # Account & auth (4 files)
│   │   │   ├── account-page.tsx
│   │   │   ├── signup-page.tsx   # 786 lines
│   │   │   ├── credit-usage-page.tsx
│   │   │   └── index.ts          # Barrel export
│   │   ├── subscription/         # Subscription & payment (5 files)
│   │   │   ├── subscribe-page.tsx  # 487 lines
│   │   │   ├── subscribe-nudge-dialog.tsx
│   │   │   ├── subscribe-checker.tsx
│   │   │   ├── payment-page.tsx
│   │   │   └── index.ts          # Barrel export
│   │   ├── onboarding/           # Onboarding flow (4 files)
│   │   │   ├── onboarding-step-one-page.tsx
│   │   │   ├── onboarding-step-two-page.tsx
│   │   │   ├── onboarding-genre-dialog.tsx
│   │   │   └── index.ts          # Barrel export
│   │   ├── legal/                # Legal documents (6 files)
│   │   │   ├── privacy-policy.tsx
│   │   │   ├── terms-of-service.tsx
│   │   │   ├── content-policy.tsx
│   │   │   ├── refund-policy.tsx
│   │   │   ├── oss-notice.tsx
│   │   │   └── index.ts          # Barrel export
│   │   └── providers/            # Provider settings (3 files)
│   │       ├── model-page.tsx
│   │       ├── model-page-mobile.tsx  # [Phase 3: Mobile removal target]
│   │       └── provider-list-item.tsx
│   │
│   ├── session/                  # ✅ Session domain COMPLETE (47 files)
│   │   ├── create-session-page.tsx
│   │   ├── session-list.tsx
│   │   ├── session-main.tsx
│   │   ├── session-messages-and-user-inputs.tsx
│   │   ├── session-page.tsx
│   │   ├── session-settings.tsx
│   │   ├── inline-chat-styles.tsx
│   │   ├── media-placeholder-message.tsx
│   │   ├── components/
│   │   │   ├── custom-sheet.tsx
│   │   │   ├── session-export-dialog.tsx
│   │   │   └── session-import-dialog.tsx
│   │   ├── create-session/      # Create session workflow (10 step files)
│   │   ├── edit-session/        # Edit session workflow (5 edit files)
│   │   ├── hooks/               # Custom hooks (2 files)
│   │   └── mobile/              # [Phase 3: Mobile removal target] (19 files)
│   │
│   └── vibe/                     # ✅ Vibe AI assistant domain COMPLETE (26 files)
│       ├── index.tsx            # Main VibeCodingPanel component
│       ├── components/          # UI components (9 files)
│       │   ├── ai-outputs-display.tsx
│       │   ├── analysis-ready-message.tsx
│       │   ├── chat-input.tsx
│       │   ├── chat-message.tsx
│       │   ├── chat-suggestions.tsx
│       │   ├── edit-approval-message.tsx
│       │   ├── message-list.tsx
│       │   ├── review-dialog.tsx
│       │   └── vibe-panel-header.tsx
│       ├── hooks/               # Custom hooks (7 files with barrel export)
│       │   ├── index.ts         # Barrel export
│       │   ├── use-vibe-session.tsx
│       │   ├── use-message-history.tsx
│       │   ├── use-resource-data.tsx
│       │   ├── use-flow-data.tsx
│       │   ├── use-apply-card-changes.tsx
│       │   └── use-apply-flow-changes.tsx
│       ├── utils/               # Utilities (8 files)
│       │   ├── card-operations.ts
│       │   ├── flow-operations.ts
│       │   ├── agent-operations.ts
│       │   ├── if-node-operations.ts
│       │   ├── data-store-node-operations.ts
│       │   ├── edit-mappers.ts
│       │   ├── message-formatter.ts
│       │   ├── resource-helpers.ts
│       │   └── filter-editable-fields.ts
│       └── types/               # Type definitions (1 file)
│           └── index.ts
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
│   ├── layout/                   # Layout/navigation [UPDATED]
│   │   ├── both-sidebar.tsx
│   │   ├── dockview-default-tab.tsx
│   │   ├── dockview-hidden-tab.tsx  # [UNUSED]
│   │   ├── dockview-panel-focus-animation.tsx
│   │   ├── top-bar.tsx
│   │   ├── top-navigation.tsx
│   │   ├── left-navigation/      # ✅ Consolidated (7 files)
│   │   │   ├── index.tsx         # Desktop main (barrel export)
│   │   │   ├── left-navigation-mobile.tsx  # [Phase 3: Mobile removal target]
│   │   │   ├── card-list.tsx
│   │   │   ├── flow-list.tsx
│   │   │   ├── session-list.tsx
│   │   │   ├── shared-list-components.tsx
│   │   │   └── hooks/
│   │   │       └── use-left-navigation-width.ts
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
├── shared/                        # ✅ FSD Layer: Reusable code
│   ├── ui/                       # ✅ NEW (FSD): Global UI components
│   │   ├── media-display.tsx    # Image/video display (5 usages)
│   │   └── play-button.tsx      # Video play button (3 usages)
│   ├── lib/                      # ✅ FSD: UI utilities
│   │   └── cn.ts                # Tailwind cn() utility (102 usages)
│   ├── hooks/                    # ✅ FSD: Global React hooks (32+ usages)
│   │   ├── use-mobile.tsx       # Mobile detection (24 usages)
│   │   ├── use-device-type.tsx  # Device type detection (internal)
│   │   ├── use-pwa.tsx          # PWA state (2 usages)
│   │   ├── use-back-gesture.tsx # Mobile back gesture (3 usages)
│   │   ├── use-forwarded-ref.tsx # Ref forwarding (1 usage)
│   │   └── use-mobile-override.tsx # Mobile override (2 usages)
│   ├── utils/                    # Business logic utilities
│   ├── domain/                   # DDD base classes (Entity, ValueObject, etc.)
│   ├── core/                     # Core business logic
│   ├── infra/                    # Infrastructure layer
│   ├── endpoints/                # API endpoints
│   ├── prompt/                   # Prompt templates
│   └── task/                     # Background tasks
│
├── components-v2/                 # Legacy structure (43 files remaining, 37 migrated)
│   ├── ui/                       # 38 files - shadcn/ui (KEEP AS-IS, production use)
│   ├── editor/                   # 2 files [TODO: analyze usage]
│   ├── scenario/                 # 2 files [TODO: analyze usage]
│   └── title/                    # 1 file (has TODO comment, deprecated)
│
├── app/                          # Global app configuration
│   ├── queries/                  # TanStack Query factories
│   ├── services/                 # Business logic services
│   └── stores/                   # Global state management
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

**Phase 2 (IN PROGRESS - 2025-10-22)**: Migrate components-v2 domain folders → features/

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

- [Feature-Sliced Design](https://feature-sliced.design/) - **Primary architectural reference**
- [FSD Get Started](https://feature-sliced.design/docs/get-started/overview) - Core concepts and layers
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
