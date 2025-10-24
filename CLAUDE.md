# astrsk Development Guidelines

Maintained development guidelines. Last updated: 2025-10-24

## Active Feature: PWA Codebase Cleanup & Quality Improvement

**Branch**: 003-pwa-codebase-cleanup
**Timeline**: 8-10 weeks (4 phases)

### Current Progress

> 📜 **Full Migration History**: For complete Phase-by-Phase details, see [PWA_FSD_MIGRATION_HISTORY.md](./PWA_FSD_MIGRATION_HISTORY.md)

| Phase | Status | Key Achievements |
|-------|--------|------------------|
| Phase 1 | ✅ COMPLETE | Dead code removal, 36 files classified |
| Phase 2 | ✅ COMPLETE | FSD architecture, 180+ files migrated |
| Phase 2.5 | ✅ COMPLETE | FSD compliance, modules → entities |
| Phase 2.6 | ✅ COMPLETE | Routes/Pages separation, 4 pages created |
| Phase 2.7 | ✅ COMPLETE | Stores migration, app/stores → shared/stores |
| Phase 3 | 🔜 PENDING | Mobile duplication elimination |
| Phase 4 | 🔜 PENDING | Quality gates & polish |

**Overall Progress**: 70% | **Build Success Rate**: 100%

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

- ✅ **app/** - App layer with providers/ segment (7 initialization files) - **stores/ moved to shared/, hooks/ moved to shared/ (FSD compliance)**
- ✅ **pages/** - Pages layer (4 page components + not-found.tsx)
- ✅ **widgets/** - Widgets layer (8 layout files + left-navigation/)
- ✅ **features/** - Business features (session/, card/, flow/, settings/, vibe/)
- ✅ **entities/** - Domain entities (14 domains with model/, domain/, repos/) - **Renamed from modules/**
- ✅ **shared/** - Reusable code (ui/, lib/, **hooks/** ✅ 26 files, **stores/** ✅ 12 files, assets/) - **app/stores/ & app/hooks/ moved (FSD compliance)**
- ✅ **components/** - **DELETED** - All files reclassified to FSD layers

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
│   ├── stores/                   # ✅ NEW: Global state stores (12 files)
│   │   ├── agent-store.tsx      # Flow panel UI state
│   │   ├── app-store.tsx        # App-wide UI state (menu, page, selectedCardId)
│   │   ├── background-store.tsx # Background assets cache
│   │   ├── card-ui-store.tsx    # Card panel visibility
│   │   ├── cards-store.tsx      # Card list/editor UI state
│   │   ├── edit-session-dialog-store.tsx  # Dialog state
│   │   ├── model-store.tsx      # Model polling state
│   │   ├── session-store.tsx    # Session UI state (selectedSessionId)
│   │   ├── validation-store.tsx # Validation results cache
│   │   ├── wllama-store.tsx     # Local LLM state
│   │   ├── init-stores.ts, local-persist-storage.ts
│   │   └── index.ts             # Barrel export
│   │
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
│   ├── hooks/                    # ✅ Global React hooks (26 files) - **app/hooks/ moved (FSD compliance)**
│   │   ├── Query Hooks (11 files): use-asset, use-assets-shared, use-card, use-cards
│   │   │   use-session, use-sessions-v2, use-flow, use-flows, use-turn
│   │   │   use-api-connections, use-api-connections-with-models
│   │   ├── Validation Hooks (2 files): use-session-validation, use-flow-validation
│   │   ├── Generator Hooks (4 files): use-nano-banana-generator, use-seedream-generator
│   │   │   use-seedance-generator, use-fallback-generator
│   │   ├── Vibe Hooks (1 file): use-vibe-coding-convex
│   │   ├── Utility Hooks (3 files): use-default-initialized, use-auto-save-session
│   │   │   use-global-error-handler
│   │   └── Device Hooks (6 files): use-mobile, use-pwa, use-back-gesture
│   │       use-device-type, use-forwarded-ref, use-mobile-override
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
│   └── services/                 # Business logic services
│   ├── stores/                   # ✅ MOVED to shared/stores/ (FSD compliance)
│   └── hooks/                    # ✅ MOVED to shared/hooks/ (FSD compliance)
│
├── pages/                        # ✅ FSD Pages Layer
│   └── not-found.tsx
│
├── entities/                     # ✅ FSD Entities Layer: Domain entities (DDD-style)
│   ├── card/                    # Card domain entity
│   │   ├── domain/              # Domain models (CharacterCard, PlotCard)
│   │   ├── repos/               # Repository interfaces + implementations
│   │   ├── mappers/             # DB ↔ Domain mappers
│   │   └── usecases/            # Use cases (business logic)
│   ├── flow/                    # Flow domain entity
│   │   ├── model/               # ✅ FSD model segment (NodeType, ValidationIssue)
│   │   ├── domain/              # Domain models (Flow)
│   │   ├── repos/               # Repository interfaces
│   │   ├── mappers/             # DB ↔ Domain mappers
│   │   ├── usecases/            # Use cases
│   │   └── utils/               # Entity utilities
│   ├── session/                 # Session domain entity
│   ├── agent/                   # Agent domain entity
│   └── ... (14 total entities)
│
├── routes/                       # TanStack Router file-based routing
└── db/                           # Database schemas
```

---

## 🚀 FSD Quick Start Guide for Developers

### **Where to Put New Code? (Decision Tree)**

Follow this decision tree when creating new files:

```
┌─ New file to create?
│
├─ Is it a React component?
│  ├─ YES → Is it reusable across 3+ features?
│  │  ├─ YES → Is it a large UI block (Header, Sidebar)?
│  │  │  ├─ YES → widgets/
│  │  │  └─ NO → shared/ui/
│  │  └─ NO → Does it handle user interaction/workflow?
│  │     ├─ YES → features/{domain}/components/
│  │     └─ NO → entities/{domain}/ui/ (rare)
│  │
│  └─ NO → Is it a type/interface/enum?
│     ├─ Domain model (Card, Flow, Session) → entities/{domain}/model/
│     ├─ API request/response → entities/{domain}/api/ or features/{domain}/api/
│     └─ General utility → shared/lib/
```

### **Real-World Examples**

#### ✅ **Example 1: Adding a new Card feature**

**Task**: Add "Card Export to PDF" feature

**Step 1**: Identify the layer
- User interaction? ✅ YES → `features/card/`
- Uses existing Card entity? ✅ YES → Import from `entities/card/`

**Step 2**: Create files
```typescript
// features/card/components/card-export-dialog.tsx
import { Card } from "@/entities/card/domain";  // ✅ GOOD: feature → entity

export const CardExportDialog = ({ card }: { card: Card }) => {
  // UI logic here
};
```

**Step 3**: Update barrel export
```typescript
// features/card/components/index.ts
export * from "./card-export-dialog";
```

#### ✅ **Example 2: Adding a new domain type**

**Task**: Add `EdgeType` enum for Flow

**Step 1**: Determine location
- Is it a domain model? ✅ YES → `entities/flow/model/`
- Will features use it? ✅ YES → Must be in entity layer

**Step 2**: Create file
```typescript
// entities/flow/model/edge-types.ts
export enum EdgeType {
  STANDARD = "standard",
  CONDITIONAL = "conditional"
}
```

**Step 3**: Use in features
```typescript
// features/flow/flow-multi/components/edge-component.tsx
import { EdgeType } from "@/entities/flow/model/edge-types";  // ✅ GOOD
```

#### ❌ **Example 3: Common Mistakes**

**Mistake 1: Entity importing from Feature**
```typescript
// ❌ BAD: Entity layer importing from Feature layer
// entities/flow/domain/flow.ts
import { FlowPanel } from "@/features/flow/flow-multi/panels/flow-panel";  // ❌ WRONG!

// ✅ GOOD: Move shared type to entity layer
// entities/flow/model/flow-types.ts
export interface FlowPanelData { ... }

// features/flow/flow-multi/panels/flow-panel.tsx
import { FlowPanelData } from "@/entities/flow/model/flow-types";  // ✅ GOOD
```

**Mistake 2: Shared UI importing from Feature**
```typescript
// ❌ BAD: Shared layer importing from Feature layer
// shared/ui/card-preview.tsx
import { useCardEditor } from "@/features/card/hooks";  // ❌ WRONG!

// ✅ GOOD: Pass data via props
// shared/ui/card-preview.tsx
export const CardPreview = ({ onEdit }: { onEdit: () => void }) => {
  // No feature imports
};
```

### **PR Checklist for FSD Compliance**

Before submitting a PR, verify:

- [ ] **Layer dependency check**: No upward imports
  ```bash
  # Check for violations (should return 0)
  grep -r "from [\"']@/features" apps/pwa/src/entities/
  grep -r "from [\"']@/features" apps/pwa/src/shared/
  ```

- [ ] **File location check**:
  - [ ] Domain types in `entities/{domain}/model/`
  - [ ] UI components in `features/{domain}/components/` or `shared/ui/`
  - [ ] Business logic in `features/{domain}/` or `entities/{domain}/usecases/`

- [ ] **Import path consistency**:
  - [ ] Using absolute paths (`@/entities/...` not `../../../`)
  - [ ] Importing from barrel exports when available

- [ ] **No circular dependencies**:
  ```bash
  # Run build to check
  pnpm build:pwa
  ```

### **FSD Layer Rules (Enforcement)**

| Layer | Can Import From | CANNOT Import From | Example |
|-------|----------------|-------------------|---------|
| `app/` | pages, widgets, features, entities, shared | - | App providers can use anything |
| `pages/` | widgets, features, entities, shared | app | Pages compose features |
| `widgets/` | features, entities, shared | app, pages | Sidebar uses features |
| `features/` | entities, shared | app, pages, widgets | Card feature uses Card entity |
| `entities/` | shared | **ALL others** | Card entity is independent |
| `shared/` | - | **ALL others** | UI library has no dependencies |

**Violation Example**:
```typescript
// ❌ CRITICAL ERROR: Entity importing from Feature
// entities/flow/domain/flow.ts
import { ValidationPanel } from "@/features/flow/flow-multi/panels/validation/validation-panel";

// This breaks FSD! Move shared types to entities/flow/model/
```

### **Quick Reference: routes/ vs pages/**

We use **TanStack Router** (file-based routing). Follow this pattern to separate routing logic from page components:

| Folder | Responsibility | Contains | Example |
|--------|---------------|----------|---------|
| `routes/` | Routing definitions | Route config, guards, params validation | `beforeLoad`, `redirect`, route params |
| `pages/` | Page components | UI composition, state management | Combining features + widgets |

**Pattern**:
```typescript
// ✅ GOOD: routes/_layout/cards/$cardId.tsx (14 lines)
import { createFileRoute, redirect } from "@tanstack/react-router";
import { CardDetailPage } from "@/pages/card-detail-page";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

export const Route = createFileRoute("/_layout/cards/$cardId")({
  component: CardDetailPage,
  beforeLoad: async ({ params }) => {
    // Route guard logic only
    if (!UniqueEntityID.isValidUUID(params.cardId)) {
      throw redirect({ to: "/", replace: true });
    }
  },
});
```

```typescript
// ✅ GOOD: pages/card-detail-page.tsx (11 lines, FSD compliant)
import { Route } from "@/routes/_layout/cards/$cardId";
import { CardPanelMain } from "@/features/card/panels/card-panel-main";
import CardPanelMainMobile from "@/features/card/mobile/card-page-mobile";
import { useIsMobile } from "@/shared/hooks/use-mobile";

export function CardDetailPage() {
  const { cardId } = Route.useParams();
  const isMobile = useIsMobile();

  return isMobile ? <CardPanelMainMobile /> : <CardPanelMain cardId={cardId} />;
}
```

**FSD Layer Compliance**:
```typescript
// ❌ BAD: Pages importing from app layer (upward dependency)
pages/session-detail-page.tsx → app/stores/session-store.tsx

// ✅ GOOD: Move store logic to features layer
pages/session-detail-page.tsx → features/session/session-page.tsx → app/stores/session-store.tsx
```

**Benefits**:
- ✅ Clear separation of concerns (routing vs UI)
- ✅ Testable page components (no routing dependency)
- ✅ FSD Pages layer properly utilized
- ✅ Smaller route files (~50% reduction)
- ✅ **100% FSD compliance** (no upward dependencies)

---

### **Quick Reference: entities/ vs features/**

| Question | entities/ | features/ |
|----------|-----------|-----------|
| Contains React components? | Rare (only `ui/` segment) | ✅ YES (main purpose) |
| Contains business logic? | ✅ YES (domain rules) | ✅ YES (user workflows) |
| Contains types/interfaces? | ✅ YES (domain models) | Sometimes (UI-specific) |
| Can import from features/? | ❌ NEVER | ✅ NO (only from entities) |
| Example | `Card` class, `NodeType` enum | `CardEditor` component |

### **When to Create New Entity**

Create a new entity slice when:
1. ✅ It's a core business concept (User, Product, Order)
2. ✅ Multiple features will use it
3. ✅ It has database representation
4. ✅ It has business rules/validation

**Example**: Should `Notification` be an entity?
- Used by multiple features? ✅ YES
- Has database table? ✅ YES
- Has business rules? ✅ YES (read/unread status, expiration)
- **Decision**: Create `entities/notification/`

### **Migration Checklist (Moving Existing Code)**

When refactoring existing code to FSD:

**Step 1: Identify current violations**
```bash
# Find entities importing from features (should return 0, currently 1 known violation)
grep -r "from [\"']@/features" apps/pwa/src/entities/ --include="*.ts" --include="*.tsx"

# Find shared importing from features (should return 0)
grep -r "from [\"']@/features" apps/pwa/src/shared/ --include="*.ts" --include="*.tsx"
```

**Known Violations (To Fix)**:
- ⚠️ `entities/if-node/usecases/update-if-node-conditions.ts` imports `IfCondition` from `features/flow/flow-multi/nodes/if-node`
  - **Fix**: Move `IfCondition` type to `entities/if-node/model/if-condition.ts`

**Step 2: Extract domain types**
- Look for types/enums used by both features and entities
- Move to `entities/{domain}/model/`
- Update all imports

**Step 3: Verify build**
```bash
pnpm build:pwa
```

**Step 4: Update documentation**
- Update CLAUDE.md if new entity created
- Document in PR description

**Common Refactoring Patterns**:

| Before (Violation) | After (FSD Compliant) |
|-------------------|----------------------|
| `features/flow/types/node-types.ts` | `entities/flow/model/node-types.ts` |
| `features/card/utils/card-validator.ts` | `entities/card/domain/card-validator.ts` |
| `shared/hooks/useCardEditor.ts` | `features/card/hooks/useCardEditor.ts` |

---

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

For detailed migration history including all steps and Phase-by-Phase documentation, see [PWA_FSD_MIGRATION_HISTORY.md](./PWA_FSD_MIGRATION_HISTORY.md).

**Approach**: Incremental migration with build verification after every step.

- ✅ **Phase 1**: Foundation (Dead code removal, component classification)
- ✅ **Phase 2**: FSD Architecture Migration (7 folders deleted, 180+ files migrated)
- ✅ **Phase 2.5**: FSD Compliance (Fixed violations, renamed modules → entities)
- ✅ **Phase 2.6**: Routes & Pages Separation (4 page components created)
- 🔜 **Phase 3**: Mobile Duplication Elimination
- 🔜 **Phase 4**: Quality Gates & Polish

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

> 📜 **Full Migration History**: See [PWA_FSD_MIGRATION_HISTORY.md](./PWA_FSD_MIGRATION_HISTORY.md) for complete Phase-by-Phase details

- **2025-10-24**: ✅ Phase 2.8 COMPLETE - Hooks Migration (app/hooks → shared/hooks)
  - 20 hook files migrated (query, validation, generator, vibe, utility hooks)
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
**Overall Progress**: 75% (Phase 1 ✅, Phase 2 ✅, Phase 2.5 ✅, Phase 2.6 ✅, Phase 2.7 ✅, Phase 2.8 ✅)

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
