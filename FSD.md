# Feature-Sliced Design (FSD) Architecture Guide

> **Official Documentation**: [feature-sliced.design](https://feature-sliced.design/)

Last updated: 2025-10-31

---

## Table of Contents

- [Overview](#overview)
- [FSD Core Principles](#fsd-core-principles)
- [FSD 3-Level Hierarchy](#fsd-3-level-hierarchy)
- [Current Project Structure](#current-project-structure)
- [Quick Start Guide](#quick-start-guide)
  - [Decision Tree](#decision-tree)
  - [Store Placement](#store-placement)
  - [Real-World Examples](#real-world-examples)
- [Layer-by-Layer Guide](#layer-by-layer-guide)
  - [widgets/ vs pages/](#widgets-vs-pages)
  - [entities/ vs features/](#entities-vs-features)
- [PR Checklist](#pr-checklist)
- [Migration Patterns](#migration-patterns)
- [References](#references)

---

## Overview

**Feature-Sliced Design (FSD)** is an architectural methodology for frontend projects. It aims to divide an application according to business logic and scopes of responsibility.

> "Feature-Sliced Design is an architectural methodology for frontend projects. It aims to divide an application according to business logic and scopes of responsibility."

**Why FSD?**
- ✅ **Scalable**: Supports projects from small to enterprise
- ✅ **Business-oriented**: Structure reflects business domains
- ✅ **Clear dependencies**: No circular imports, predictable flow
- ✅ **Easy onboarding**: Newcomers quickly discover functionality

---

## FSD Core Principles

1. **Explicit layer separation** - Clear boundaries between app, pages, widgets, features, entities, shared
2. **Isolation** - Layers can only import from layers below (shared ← entities ← features ← widgets ← pages ← app)
3. **Public API** - Each module exposes a single entry point (index.ts)
4. **Business-oriented** - Structure reflects business domains, not technical details

---

## FSD 3-Level Hierarchy

FSD organizes code through three levels: **Layers → Slices → Segments**

### **1. Layers** (Vertical Separation by Responsibility)
- **Purpose**: Separate code by responsibility scope and dependency range
- **Rule**: Upper layers can only import from lower layers
- **7 Standard Layers**: app, ~~processes~~(deprecated), pages, widgets, features, entities, shared

### **2. Slices** (Horizontal Separation by Business Domain)
- **Purpose**: Group code by business meaning and product domain
- **Naming**: Freely chosen based on business (e.g., `session`, `card`, `flow`)
- **Rule**: Slices on the same layer cannot import each other (ensures high cohesion, low coupling)
- **Applied to**: features, entities, widgets, pages layers only (app/shared go directly to segments)

### **3. Segments** (Technical Purpose Separation)
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

---

## FSD Layers (Bottom-up dependency)

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

### **FSD Layer Rules (Enforcement)**

| Layer | Can Import From | CANNOT Import From | Example | Notes |
|-------|----------------|-------------------|---------|-------|
| `app/` | pages, widgets, features, entities, shared | - | App providers can use anything | **Initialization ONLY** |
| `pages/` | widgets, features, entities, shared | app | Pages compose features + widgets | **1 page = 1 route** |
| `widgets/` | features, entities, shared | app, pages | Sidebar uses features | **Reused across 3+ pages** |
| `features/` | entities, shared | app, pages, widgets | Card feature uses Card entity | User workflows |
| `entities/` | shared | **ALL others** | Card entity is independent | Domain models |
| `shared/` | - | **ALL others** | UI library has no dependencies | Reusable code |

**📖 Layer Descriptions:**
- **pages/**: Full pages/screens, each maps to one route. Composes widgets + features. Keep page-specific UI here if not reused.
- **widgets/**: Large self-sufficient UI blocks reused across multiple pages (navigation, layouts). Can have data fetching & error boundaries.
- **features/**: User interaction workflows (card editing, session creation). Feature-specific, not reused across domains.

**⚠️ App Layer Purity Rule**:
- `app/` should ONLY contain initialization logic: providers, contexts, routes, services
- NO components, NO hooks (move to `shared/hooks/`), NO stores (move to `shared/stores/`)
- NO UI logic (move to `pages/` or `features/`)

**Violation Example**:
```typescript
// ❌ CRITICAL ERROR: Entity importing from Feature
// entities/flow/domain/flow.ts
import { ValidationPanel } from "@/features/flow/flow-multi/panels/validation/validation-panel";

// This breaks FSD! Move shared types to entities/flow/model/
```

---

## Current Project Structure

**Migration Status:**

- ✅ **app/** - App layer (PURE) - **Only initialization: providers/, contexts/, queries/, services/**
  - ✅ **app/stores/** → DELETED (moved to shared/stores/)
  - ✅ **app/hooks/** → DELETED (moved to shared/hooks/)
  - ✅ **app/v2/** → DELETED (inlined to pages/app-layout.tsx)
- ✅ **pages/** - Pages layer (5 page components: app-layout, card-detail, session-detail, flow-detail, not-found)
  - ✅ **pages/settings/providers/** - Page-specific components (provider-display.tsx)
- ✅ **widgets/** - Widgets layer (layouts + left-navigation/ + **dialog/** ✅ 3 global dialogs)
  - ✅ **widgets/dialog/** - Global dialogs (onboarding-dialog, subscribe-nudge-dialog, subscribe-checker)
- ✅ **features/** - Business features (session/, card/, flow/, vibe/)
  - ✅ **features/settings/** → DELETED (moved to widgets/dialog/ and pages/settings/)
- ✅ **entities/** - Domain entities (14 domains with model/, domain/, repos/) - **Renamed from modules/**
- ✅ **shared/** - Reusable code (ui/, lib/, **hooks/** ✅ 26 files, **stores/** ✅ 11 files, assets/)
  - ✅ **shared/stores/card-ui-store.tsx** → MOVED to **entities/card/stores/** (domain-specific state)
- ✅ **components/** - **DELETED** - All files reclassified to FSD layers

See [CLAUDE.md](./CLAUDE.md) for the full project structure tree.

---

## Quick Start Guide

### Decision Tree: Where to Put New Code?

```
┌─ New file to create?
│
├─ Is it initialization code (Provider, Context, Router setup)?
│  └─ YES → app/ (PURE initialization only)
│
├─ Is it a React hook?
│  ├─ Used across 3+ features? → shared/hooks/
│  └─ Feature-specific? → features/{domain}/hooks/
│
├─ Is it a Zustand store?
│  ├─ Domain-specific state (card selection, flow editing)? → entities/{domain}/stores/
│  ├─ App-wide UI state (menu, page, global modals)? → shared/stores/
│  └─ Feature workflow state? → features/{domain}/stores/
│
├─ Is it a React component?
│  ├─ YES → Is it a full page/screen that maps to a route?
│  │  ├─ YES → pages/ (one page per route, composes features + widgets)
│  │  └─ NO → Is it reusable across 3+ pages?
│  │     ├─ YES → Is it a large self-sufficient UI block (Sidebar, Layout)?
│  │     │  ├─ YES → widgets/ (navigation, layouts, complex reusable blocks)
│  │     │  └─ NO → shared/ui/ (buttons, inputs, simple components)
│  │     └─ NO (only 1-2 pages) → Does it contain business logic?
│  │        ├─ YES (API calls, complex state) → Keep in pages/{page}/ (page-specific component)
│  │        │  └─ Example: pages/settings/providers/provider-display.tsx
│  │        └─ NO → Is it a pure UI component with props only?
│  │           ├─ YES, used on 2 pages → Keep in pages/ (wait for 3rd usage - YAGNI)
│  │           └─ YES, entity appearance → entities/{domain}/ui/ (if truly reusable)
│  │
│  │  **⚠️ Common mistake: Creating features/ for single-page components**
│  │  - features/settings/providers/ ❌ (only used on 1 page)
│  │  - pages/settings/providers/ ✅ (page-specific)
│  │
│  └─ NO → Is it a type/interface/enum?
│     ├─ Real-world business concept? → entities/{domain}/model/ (Card, Session, User)
│     ├─ Interaction-specific type? → features/{domain}/types/ or model/
│     ├─ API request/response → entities/{domain}/api/ or features/{domain}/api/
│     └─ General utility → shared/lib/
```

### Store Placement Guide

**When deciding where to place Zustand stores:**

| Store Type | Location | Example | Rationale |
|------------|----------|---------|-----------|
| **Domain state** | `entities/{domain}/stores/` | card-ui-store (card selection, editing, panels) | Belongs to specific business entity |
| **App-wide UI** | `shared/stores/` | app-store (menu, page, modals) | Used across all features |
| **Feature workflow** | `features/{domain}/stores/` | (future) session-wizard-store | Feature-specific flow state |

**Real Examples:**
```typescript
// ✅ GOOD: Domain state in entities
// entities/card/stores/card-ui-store.tsx
export const useCardUIStore = create<CardUIState>((set) => ({
  selectedCardId: null,
  cardEditOpen: null,
  setSelectedCardId: (id) => set({ selectedCardId: id }),
  // Card-specific state
}));

// ✅ GOOD: App-wide state in shared
// shared/stores/app-store.tsx
export const useAppStore = create<AppState>((set) => ({
  currentMenu: Menu.Sessions,
  currentPage: Page.Sessions,
  setCurrentMenu: (menu) => set({ currentMenu: menu }),
  // App-wide UI state
}));

// ❌ BAD: Domain state in shared (violates FSD)
// shared/stores/card-ui-store.tsx - MOVED to entities/card/stores/
```

---

## Layer-by-Layer Guide

### widgets/ vs pages/

**FSD Official Guidelines:**

#### **widgets/ - Large Self-Sufficient UI Blocks**

> "Widgets are intended for large self-sufficient blocks of UI. Widgets are most useful when they are **reused across multiple pages**, or when the page has **multiple large independent blocks**."

**When to use widgets/:**
- ✅ **Reused across 3+ pages** (e.g., navigation sidebar, header, footer)
- ✅ **Large independent UI blocks** that are self-contained (e.g., complex dashboard panels)
- ✅ **Layout components** (e.g., page layouts, nested routing layouts)
- ✅ **Complete router blocks** with data fetching, loading states, error boundaries (for nested routing)

**When NOT to use widgets/:**
- ❌ UI block makes up **most of the page** and is **never reused** → Use `pages/` instead
- ❌ Feature-specific components → Use `features/{domain}/components/`
- ❌ Simple UI components → Use `shared/ui/`

#### **pages/ - Full Pages/Screens**

> "Pages are what makes up websites and applications. One page usually corresponds to one slice. If a UI block on a page is **not reused**, it's perfectly fine to keep it inside the page slice."

**When to use pages/:**
- ✅ **Full page/screen** that maps to a route (e.g., `/cards/:id` → `card-detail-page.tsx`)
- ✅ **Page-specific UI** that's never reused elsewhere
- ✅ **Data fetching & mutations** for the page (📁 `api/` segment, though we use TanStack Query)
- ✅ **Loading states & error boundaries** for the page (📁 `ui/` segment)

**Page structure (FSD segments):**
```
pages/
├── card-detail-page/
│   ├── ui/                   # Page UI components (if complex)
│   │   ├── card-header.tsx
│   │   └── card-sections.tsx
│   ├── api/                  # Page-specific data fetching (optional, we use shared hooks)
│   └── index.tsx             # Main page component
```

**Our simplified approach:**
```typescript
// pages/card-detail-page.tsx (simple page, all in one file)
export function CardDetailPage() {
  const { cardId } = Route.useParams();
  const isMobile = useIsMobile();

  // Page composes features + widgets
  return isMobile ? <CardPanelMainMobile /> : <CardPanelMain cardId={cardId} />;
}
```

**Real-World Examples from Our Project:**

**Current widgets/:**
| File | Why it's a Widget | Usage |
|------|-------------------|-------|
| `top-bar.tsx` | Reused on all pages, app-wide navigation | Global |
| `left-navigation/` | Sidebar used across desktop pages | Global |
| `main-layout.tsx` | Page layout wrapper with routing | Global |
| `both-sidebar.tsx` | Desktop dual-sidebar layout | Global |
| `modal-pages.tsx` | Modal routing system | Global |
| `dialog/onboarding-dialog.tsx` | App-level onboarding flow | Global (triggered once) |
| `dialog/subscribe-nudge-dialog.tsx` | Subscription upsell dialog | Global (triggered from 3+ pages) |
| `dialog/subscribe-checker.tsx` | Subscription state sync | Global initialization |

**Decision criteria:** All are **reused across multiple pages** or are **layout components** or **global dialogs**.

**Current pages/:**
| File | Why it's a Page | Route |
|------|-----------------|-------|
| `app-layout.tsx` | Main app layout routing (desktop/mobile) | `/` (root) |
| `card-detail-page.tsx` | Card detail screen | `/cards/:id` |
| `session-detail-page.tsx` | Session detail screen | `/sessions/:id` |
| `flow-detail-page.tsx` | Flow editor screen | `/flows/:id` |
| `not-found.tsx` | 404 error page | `*` (catch-all) |
| `settings/providers/provider-display.tsx` | Provider card component (only used on 1 page) | N/A (page-specific) |

**Decision criteria:** Each maps to **one route**, composes features + widgets. Page-specific components stay within pages/ subfolder.

**Common Mistakes to Avoid:**

**Mistake 1: Putting feature-specific components in widgets/**
```typescript
// ❌ BAD: widgets/card-editor-panel.tsx
// This is only used on the card detail page → Should be in features/card/

// ✅ GOOD: features/card/panels/card-panel-main.tsx
```

**Mistake 2: Creating page slices for similar pages**
```typescript
// ❌ BAD: Multiple page slices for similar screens
pages/
├── card-create-plot-page.tsx
├── card-create-character-page.tsx
└── card-create-user-page.tsx

// ✅ GOOD: Group similar pages in one slice or use features/
features/card/create-card/
├── plot-card-form.tsx
├── character-card-form.tsx
└── user-card-form.tsx
```

**Mistake 3: Over-nesting page components**
```typescript
// ❌ BAD: Unnecessary page slice structure (when page is simple)
pages/
└── card-detail-page/
    ├── ui/
    │   ├── card-header.tsx      // Only used here
    │   └── card-content.tsx     // Only used here
    ├── api/
    │   └── use-card-data.ts     // Already in shared/hooks/
    └── index.tsx

// ✅ GOOD: Simple page in one file (composes features)
pages/
└── card-detail-page.tsx         // Composes CardPanelMain from features/
```

---

### entities/ vs features/ vs pages/

**Quick Reference Table:**

| Question | entities/ | features/ | pages/ |
|----------|-----------|-----------|--------|
| **What** | Business concepts (nouns) | User interactions (verbs) | Full screens/routes |
| **Examples** | User, Post, Card, Session | CreatePost, EditCard, CommentOnPost | CardDetailPage, ProviderSettingsPage |
| Contains React components? | Rare (📁 `ui/` for reusable appearance) | ✅ YES (📁 `ui/` for complete interactions) | ✅ YES (page-specific UI) |
| Contains business logic? | ✅ YES (domain rules, validation) | ✅ YES (user workflows, orchestration) | ✅ YES (page-specific logic) |
| Contains types/interfaces? | ✅ YES (📁 `model/` domain models) | Sometimes (UI-specific state) | Sometimes (page-specific types) |
| Contains API calls? | ✅ YES (📁 `api/` entity CRUD) | ✅ YES (📁 `api/` interaction-specific) | ✅ YES (page-specific data) |
| Can import from features/? | ❌ NEVER | ✅ NO (only from entities) | ✅ YES (composes features) |
| Reusability | Reused across features | Reused across pages (3+) | **Never reused (1 route)** |
| **Key Rule** | Pure domain logic | **Must be reused on 3+ pages** | **Keep if used on 1 page only** |

---

### entities/ - Business Concepts (Real-World Terms)

**FSD Official Definition:**
> "Slices on this layer represent **concepts from the real world** that the project is working with. Commonly, they are the **terms that the business uses** to describe the product."

#### **What Entities Contain:**

| Segment | Purpose | Example |
|---------|---------|---------|
| 📁 `model/` | Data models, validation schemas | `Card` interface, `CardType` enum, Zod schemas |
| 📁 `api/` | Entity CRUD operations | `getCard()`, `updateCard()`, `deleteCard()` |
| 📁 `ui/` | Visual representation (reusable appearance) | `<CardPreview />` (same look, different behavior via props) |
| 📁 `domain/` | Domain logic (DDD) | `Card` class with business rules |
| 📁 `repos/` | Repository interfaces | `ICardRepository` |
| 📁 `stores/` | Domain-specific state | `card-ui-store` (card selection, editing) |

**Key Principle:**
- **ui/**: Provides **appearance**, not complete behavior
- Business logic for entity **interactions** lives in **features/** or **pages/**
- **Entities CANNOT contain**: Service calls, API mutations, complex workflows
- **Entities CAN contain**: Validation, domain rules, type definitions

**⚠️ When NOT to use entities/ui/:**
```typescript
// ❌ BAD: Entity UI with service calls
// entities/provider/ui/provider-card.tsx
const ProviderCard = ({ provider }) => {
  const [flows, setFlows] = useState([]);

  // ❌ Entity calling services - violates FSD!
  useEffect(() => {
    FlowService.listFlowByProvider(provider).then(setFlows);
  }, [provider]);

  return <Card>...</Card>;
};

// ✅ GOOD: Pure entity UI (appearance only)
// entities/provider/ui/provider-badge.tsx
const ProviderBadge = ({ provider, onClick }) => {
  // Only displays provider info, behavior via props
  return <Badge onClick={onClick}>{provider.name}</Badge>;
};

// ✅ GOOD: Business logic in pages/features
// pages/settings/providers/provider-display.tsx
const ProviderDisplay = ({ provider }) => {
  // Pages can have business logic
  const flows = useFlowsByProvider(provider);
  return <ProviderCard provider={provider} flows={flows} />;
};
```

#### **Entity Relationships (@x cross-imports)**

When entities reference each other, use `@x` notation for explicit cross-imports:

```typescript
// ✅ GOOD: Explicit entity relationship
// entities/artist/model/artist.ts
import type { Song } from "entities/song/@x/artist";

export interface Artist {
  name: string;
  songs: Array<Song>;  // Connected entities refactored together
}

// entities/song/@x/artist.ts
export type { Song } from "../model/song.ts";
```

**Why @x notation?**
- Makes entity dependencies **impossible to miss**
- Connected entities are **refactored together**
- Clearer than hidden dependencies

#### **When to Create New Entity**

Create a new entity slice when:
1. ✅ It's a **real-world business concept** (terms business uses: Card, Session, Flow, User)
2. ✅ **Multiple features** will use it (reused across user interactions)
3. ✅ It has **database representation** (persisted data)
4. ✅ It has **business rules/validation** (domain logic)

**Example**: Should `Notification` be an entity?
- Real-world concept? ✅ YES (business term)
- Used by multiple features? ✅ YES (notifications appear everywhere)
- Has database table? ✅ YES (persisted)
- Has business rules? ✅ YES (read/unread status, expiration)
- **Decision**: Create `entities/notification/`

**Example**: Should `CardExportDialog` be an entity?
- Real-world concept? ❌ NO (UI interaction, not business term)
- Used by multiple features? ❌ NO (only in card export feature)
- Has database table? ❌ NO
- Has business rules? ❌ NO (just UI)
- **Decision**: `features/card/components/card-export-dialog.tsx`

---

### features/ - User Interactions (What Users Do)

**FSD Official Definition:**
> "This layer is for the **main interactions in your app**, things that your **users care to do**. These interactions often involve business entities, because that's what the app is about."

#### **What Features Contain:**

| Segment | Purpose | Example |
|---------|---------|---------|
| 📁 `ui/` | Complete interaction UI (forms, workflows) | `<CardEditForm />`, `<CommentEditor />` |
| 📁 `api/` | Interaction-specific API calls | `exportCardToPDF()`, `submitComment()` |
| 📁 `model/` | Interaction state, validation | Form state, wizard steps |
| 📁 `config/` | Feature flags, constants | `ENABLE_CARD_EXPORT`, `MAX_COMMENTS` |

**Key Principle:**
> "**Not everything needs to be a feature.** A good indicator that something needs to be a feature is the fact that it is **reused on several pages**."

#### **When to Create New Feature**

**✅ Create a feature when:**
- Reused on **3+ pages** (e.g., comments on posts, sessions, flows)
- Important **user interaction** (optimize for newcomer discovery)
- Has dedicated **workflow/business logic** (multi-step forms, wizards)

**❌ Don't create a feature when:**
- Only used on **1-2 pages** → Keep in `pages/{page}/` (page-specific component)
- Too granular (feature bloat) → Drowns out important features
- Simple UI component → Use `shared/ui/`

**🎯 The "3+ Pages Rule":**
- **1 page**: Keep in `pages/{page}/component.tsx` (page-specific)
- **2 pages**: Still keep in `pages/` (wait for 3rd usage)
- **3+ pages**: Extract to `features/{domain}/` or `widgets/` (proven reusability)

**Examples:**

| Interaction | Feature or Not? | Rationale |
|-------------|----------------|-----------|
| Comments (on posts, sessions, flows) | ✅ `features/comments/` | Reused on 3+ pages, important interaction |
| Card Export to PDF | ✅ `features/card/card-export/` | Reused (card list, detail), complex workflow |
| Session creation wizard | ✅ `features/session/create-session/` | Multi-step, important interaction |
| Card detail page header | ❌ Keep in `pages/card-detail-page.tsx` | Only used on one page |
| Delete button | ❌ `shared/ui/button.tsx` | Simple UI, not a "feature" |

#### **Real-World Case Study: ProviderDisplay Component**

**Context**: A component that displays AI provider cards (OpenAI, Anthropic, etc.) with edit/delete actions and dependency checking logic.

**Initial mistake**: Placed in `features/settings/providers/provider-list-item.tsx`

**Analysis:**
- ❌ **Used on**: Only 1 page (`pages/settings/providers/model-page.tsx`)
- ❌ **"settings" is not a feature**: It's a page category, not a user interaction
- ✅ **Contains business logic**: FlowService, SessionService calls for dependency checking
- ✅ **Page-specific**: Never reused on other pages

**Correct solution**: `pages/settings/providers/provider-display.tsx`

**Rationale:**
1. ✅ **FSD principle**: "Not everything needs to be a feature"
2. ✅ **Single-page usage**: No evidence of reuse on 3+ pages
3. ✅ **Cohesion**: Keeps related code together (page + its components)
4. ✅ **YAGNI**: Don't abstract until proven need (wait for 3rd usage)

**Wrong alternatives considered:**
- `entities/api/ui/provider-card.tsx` - ❌ Entities cannot contain business logic (FlowService calls)
- `features/provider/disconnect-provider.tsx` - ❌ Over-engineered for single-page usage
- `widgets/provider-card.tsx` - ❌ Not reused across 3+ pages

#### **Real-World Examples from Our Project**

**Current entities/:**
- `card/` - Business concept (Character, Plot cards)
- `session/` - Business concept (AI chat sessions)
- `flow/` - Business concept (AI agent flows)
- `agent/` - Business concept (AI agents)

**Current features/:**
- `card/` - Card management (create, edit, export)
- `session/` - Session workflows (create wizard, edit, manage)
- `flow/` - Flow editor (visual node editor)
- `vibe/` - AI coding assistant (interactive panel)

**Decision rationale:**
```typescript
// entities/card/ui/card-preview.tsx
// ✅ Entity UI: Reusable appearance, behavior via props
export const CardPreview = ({ card, onClick, onEdit }) => {
  return (
    <div onClick={onClick}>
      <h3>{card.name}</h3>
      <p>{card.description}</p>
      <Button onClick={onEdit}>Edit</Button>  {/* Behavior via props */}
    </div>
  );
};

// features/card/components/card-editor.tsx
// ✅ Feature UI: Complete interaction with business logic
export const CardEditor = ({ cardId }) => {
  const { data: card } = useCard(cardId);
  const { mutate: updateCard } = useUpdateCard();

  const handleSubmit = (formData) => {
    // Feature orchestrates entity operations
    updateCard({ id: cardId, ...formData });
  };

  return <CardEditForm onSubmit={handleSubmit} initialData={card} />;
};
```

---

## Quick Reference Tables

### **All Layers Comparison**

| Layer | What | Examples (nouns/verbs) | Reusability | Can Import From |
|-------|------|------------------------|-------------|-----------------|
| **app/** | Initialization | Providers, Routes | App-wide | All layers |
| **pages/** | Full screens | CardDetailPage | 1 page = 1 route | widgets, features, entities, shared |
| **widgets/** | Large UI blocks | Sidebar, Layout | 3+ pages | features, entities, shared |
| **features/** | User interactions (verbs) | **Create**Card, **Edit**Session | Multiple pages | entities, shared |
| **entities/** | Business concepts (nouns) | Card, Session, User | Multiple features | shared only |
| **shared/** | Reusable code | UI lib, utils, hooks | Everything | - (no dependencies) |

**Key distinction: entities (nouns) vs features (verbs)**
- Entity: "What is it?" → Card, User, Post
- Feature: "What can users do with it?" → CreateCard, EditUser, LikePost

### **widgets/ vs pages/ vs features/**

| Question | widgets/ | pages/ | features/ |
|----------|----------|--------|-----------|
| **Purpose** | Reusable large UI blocks | Full screens/routes | User workflows |
| **Reusability** | Reused across 3+ pages | Never reused (1 route) | Reused across pages |
| **Example** | Sidebar, Layout, Header | CardDetailPage, SessionDetailPage | CardEditor, SessionWizard |
| **Can have data fetching?** | ✅ YES (for nested routing) | ✅ YES (page-specific) | ✅ YES (feature-specific) |
| **Typical size** | Large, self-sufficient | Composes widgets + features | Medium, focused |
| **When to use** | 3+ pages need it | Maps to a route | User interaction flow |

---

## PR Checklist for FSD Compliance

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

---

## Migration Patterns

### **Migration Checklist (Moving Existing Code)**

When refactoring existing code to FSD:

**Step 1: Identify current violations**
```bash
# Find entities importing from features (should return 0)
grep -r "from [\"']@/features" apps/pwa/src/entities/ --include="*.ts" --include="*.tsx"

# Find shared importing from features (should return 0)
grep -r "from [\"']@/features" apps/pwa/src/shared/ --include="*.ts" --include="*.tsx"
```

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

**Common Refactoring Patterns:**

| Before (Violation) | After (FSD Compliant) |
|-------------------|----------------------|
| `features/flow/types/node-types.ts` | `entities/flow/model/node-types.ts` |
| `features/card/utils/card-validator.ts` | `entities/card/domain/card-validator.ts` |
| `shared/hooks/useCardEditor.ts` | `features/card/hooks/useCardEditor.ts` |

---

## Organization Principles

### **1. Feature-based Structure (Domain-based)**

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

### **2. Colocation Principle**

Place files close to where they are used

```typescript
// ✅ GOOD: Inside the feature
features / session / hooks / useSessionMessages.ts;

// ❌ BAD: Global hooks folder (if not used in multiple places)
lib / hooks / useSessionMessages.ts;
```

### **3. Progressive Disclosure**

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

### **4. Shared Components Criteria**

Criteria for moving to `shared/ui/`:

- ✅ Used in **3+ domains**
- ✅ **Domain-independent** (no business logic)
- ✅ Acts like a **UI library** (Button, Dialog, Loading, etc.)

```typescript
// ✅ shared/ui/avatar.tsx
// Reason: Used in session, flow, and card

// ❌ features/session/components/SessionAvatar.tsx
// Reason: Contains session-specific logic
```

### **5. Naming Convention**

- **Folder names**: kebab-case (`session-panel/`)
- **File names**: kebab-case (`session-panel.tsx`)
- **Component names**: PascalCase (`SessionPanel`)
- **Functions/Variables**: camelCase (`useSession`, `sessionStore`)

---

## References

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

---

**Back to**: [CLAUDE.md](./CLAUDE.md) - Project progress and guidelines
