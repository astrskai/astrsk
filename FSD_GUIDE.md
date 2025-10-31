# Feature-Sliced Design (FSD) Architecture Guide

## Overview

Feature-Sliced Design is a hierarchical architecture pattern that organizes code by responsibility level and dependency direction. This guide provides practical decision-making guidance for the astrsk project.

---

## Layer Hierarchy (Top to Bottom)

```
📁 src/
  📁 app/          ← Highest responsibility (app-wide concerns)
  📁 pages/        ← Router pages/screens
  📁 widgets/      ← Large reusable UI blocks
  📁 features/     ← User interactions & business logic
  📁 entities/     ← Business domain concepts
  📁 shared/       ← Foundation (external APIs, UI kit, utilities)
```

**Key Principle**: Upper layers can only import from lower layers (one-way dependency flow).

---

## Layer Definitions & When to Use

### 📁 app/ (Application Layer)

**Purpose**: App-wide initialization, configuration, and global concerns

**Contains**: Segments only (no slices, no business domains)

**Common Segments**:
- `routes/` - Router configuration
- `store/` - Global store setup
- `styles/` - Global styles and library overrides (e.g., dockview, third-party CSS)
- `entrypoint/` - Application entry point

**When to Use**:
- ✅ Router setup (route definitions, providers)
- ✅ Global context providers (theme, auth)
- ✅ App-wide analytics setup
- ✅ Global CSS overrides for third-party libraries
- ❌ Business logic (use features/ or entities/)
- ❌ Reusable components (use widgets/ or shared/ui/)

**Example**:
```typescript
// ✅ GOOD: app/styles/dockview-detail.css
// Global styles for Dockview library used across character, plot, flow pages

// ✅ GOOD: app/routes/router.tsx
// Router configuration

// ❌ BAD: app/components/card-list.tsx
// Should be: widgets/card-list/ or features/card/ui/card-list.tsx
```

---

### 📁 pages/ (Pages Layer)

**Purpose**: Full page components corresponding to routes (screens/activities)

**Contains**: Slices (one slice per page or group of similar pages)

**Common Segments in Slice**:
- `ui/` - Page UI, loading states, error boundaries
- `api/` - Data fetching and mutations for the page

**When to Use**:
- ✅ One page = one route
- ✅ Group similar pages (e.g., login + registration)
- ✅ Non-reused page-specific UI blocks
- ❌ Reusable components across pages (use widgets/ or features/)
- ❌ Business logic without UI (use features/ or entities/)

**Example**:
```typescript
// ✅ GOOD: pages/assets/character-plot-detail-page.tsx
// Full page component for character/plot detail view

// ✅ GOOD: pages/auth/login-page.tsx + pages/auth/register-page.tsx
// Grouped similar pages in one slice

// ❌ BAD: pages/assets/components/card-header.tsx
// Reusable component → should be widgets/card-header/ or features/card/ui/
```

---

### 📁 widgets/ (Widgets Layer)

**Purpose**: Large, self-sufficient, reusable UI blocks

**Contains**: Slices (one widget per slice)

**Common Segments in Slice**:
- `ui/` - Widget UI components
- `model/` - Widget-specific state (if needed)

**When to Use**:
- ✅ Reused across multiple pages
- ✅ Large independent blocks on a page (e.g., sidebar, header, footer)
- ✅ Page layouts (if using nested routing)
- ❌ Single-use blocks (keep in pages/)
- ❌ Small components (use shared/ui/)

**Example**:
```typescript
// ✅ GOOD: widgets/create-page-header/ui/create-page-header.tsx
// Reused across character, plot, session creation pages

// ✅ GOOD: widgets/sidebar-left/ui/sidebar-left.tsx
// Reused layout component

// ❌ BAD: widgets/button/ui/button.tsx
// Too small → should be shared/ui/button.tsx
```

---

### 📁 features/ (Features Layer)

**Purpose**: User interactions and business logic (what users care to do)

**Contains**: Slices (one feature per slice)

**Common Segments in Slice**:
- `ui/` - Feature UI (forms, interactions)
- `api/` - API calls for the feature
- `model/` - Feature state, validation
- `config/` - Feature flags

**When to Use**:
- ✅ Reused interactions across multiple pages
- ✅ Complex user actions (e.g., commenting, authentication, cart)
- ✅ Business logic involving entities
- ❌ Everything that involves entities (not everything needs to be a feature)
- ❌ Single-use interactions (keep in pages/)

**Important**: Optimize for newcomer experience. Too many features = hard to navigate.

**Example**:
```typescript
// ✅ GOOD: features/character/ui/create-character/
// Character creation wizard (multi-step form)

// ✅ GOOD: features/session/api/use-create-session.ts
// Session creation mutation

// ❌ BAD: features/card/panels/card-panel-main.tsx
// Full page component → should be pages/assets/character-plot-detail-page.tsx
```

---

### 📁 entities/ (Entities Layer)

**Purpose**: Business domain concepts (real-world terms the business uses)

**Contains**: Slices (one entity per slice)

**Common Segments in Slice**:
- `model/` - Data models, validation schemas
- `api/` - Entity-specific API requests
- `ui/` - Visual representation of entity (reusable across pages)

**When to Use**:
- ✅ Core business concepts (User, Post, Card, Session, Flow)
- ✅ Data models and types
- ✅ Entity-specific API requests
- ✅ Reusable entity UI (avatar, card display)
- ❌ Business logic of entity interactions (use features/ or pages/)

**Entity Relationships**:
Entities cannot import each other by default. Use `@x` notation for explicit cross-references:

```typescript
// entities/artist/model/artist.ts
import type { Song } from "entities/song/@x/artist";

export interface Artist {
  name: string;
  songs: Array<Song>;
}

// entities/song/@x/artist.ts
export type { Song } from "../model/song.ts";
```

**Example**:
```typescript
// ✅ GOOD: entities/card/domain/character-card.ts
// Core domain model

// ✅ GOOD: entities/card/ui/card-display.tsx
// Reusable card UI component

// ❌ BAD: entities/card/stores/card-ui-store.ts
// Domain-specific UI state → consider if it should be in shared/stores/
// (But card-ui-store is acceptable because it's card selection/editing state)
```

---

### 📁 shared/ (Shared Layer)

**Purpose**: Foundation layer (external connections, highly contained libraries)

**Contains**: Segments only (no slices, no business domains)

**Common Segments**:
- `api/` - API client, request functions to backend
- `ui/` - UI kit (buttons, inputs, dialogs)
- `lib/` - Internal focused libraries (dates, colors, text)
- `config/` - Environment variables, feature flags
- `routes/` - Route constants or patterns
- `i18n/` - Translation setup
- `hooks/` - Reusable hooks (not feature-specific)
- `stores/` - App-wide state management

**When to Use**:
- ✅ UI components without business logic
- ✅ Reusable utilities and hooks
- ✅ Third-party library wrappers
- ✅ API client setup
- ❌ Business-specific logic (use features/ or entities/)
- ❌ Page-specific code (use pages/)

**Important**: Avoid "helpers" or "utils" dumps. Each library should have one area of focus with documentation.

**Example**:
```typescript
// ✅ GOOD: shared/ui/button.tsx
// Generic button component

// ✅ GOOD: shared/hooks/use-breakpoint.ts
// Reusable responsive hook

// ✅ GOOD: shared/stores/mobile-navigation-store.ts
// App-wide navigation state

// ❌ BAD: shared/hooks/use-session-query.ts
// Session-specific → should be features/session/api/
```

---

## Import Rules

### Core Rule
**A module in a slice can only import from:**
1. Layers strictly below it
2. Sibling modules in the same slice

### Examples

```typescript
// ✅ GOOD: features/character/api/use-create-character.ts
import { CardService } from "entities/card/api"; // ✅ Lower layer
import { Button } from "shared/ui/button"; // ✅ Lower layer
import { validateCharacter } from "../model/validator"; // ✅ Same slice

// ❌ BAD: features/character/ui/form.tsx
import { SessionPanel } from "features/session/ui"; // ❌ Same layer, different slice
import { CreatePageHeader } from "pages/assets/header"; // ❌ Upper layer
```

### Exceptions

**app/** and **shared/** layers:
- No slices (only segments)
- Segments can import each other freely

```typescript
// ✅ GOOD: shared/ui/dialog.tsx
import { cn } from "shared/lib/utils"; // ✅ Segment to segment OK

// ✅ GOOD: app/routes/router.tsx
import { theme } from "app/store/theme"; // ✅ Segment to segment OK
```

---

## Decision Trees

### Where to put new code?

#### 1. Is it app-wide initialization or global configuration?
→ **Yes**: `app/` (routes, store, styles, entrypoint)

#### 2. Is it a full page component (1:1 with route)?
→ **Yes**: `pages/` (one slice per page or group of similar pages)

#### 3. Is it a large UI block reused across multiple pages?
→ **Yes**: `widgets/` (one widget per slice)

#### 4. Is it a user interaction reused on multiple pages?
→ **Yes**: `features/` (one feature per slice)

#### 5. Is it a core business domain concept?
→ **Yes**: `entities/` (one entity per slice)

#### 6. Is it a foundation utility, UI component, or external API?
→ **Yes**: `shared/` (segments: ui, lib, api, hooks, stores, config)

---

### Where to put CSS files?

#### Global styles or library overrides (Dockview, third-party)?
→ `app/styles/`

**Example**: `app/styles/dockview-detail.css`

#### Component-specific styles?
→ Co-locate with component (same folder)

**Example**: `features/character/ui/form.module.css`

---

### Where to put stores/state management?

#### App-wide state (navigation, theme, auth)?
→ `shared/stores/`

**Example**: `shared/stores/mobile-navigation-store.ts`

#### Domain-specific state (card selection, editing)?
→ `entities/{domain}/stores/`

**Example**: `entities/card/stores/card-ui-store.ts`

#### Feature-specific state (form state, wizard step)?
→ `features/{feature}/model/`

**Example**: `features/character/model/create-character-store.ts`

#### Page-specific state (local UI state)?
→ Keep in component (useState, useReducer)

---

### Where to put hooks?

#### Reusable utility hooks (breakpoint, debounce, copy)?
→ `shared/hooks/`

**Example**: `shared/hooks/use-breakpoint.ts`

#### Domain-specific hooks (entity queries)?
→ `entities/{domain}/api/`

**Example**: `entities/card/api/use-card-query.ts`

#### Feature-specific hooks (feature mutations)?
→ `features/{feature}/api/`

**Example**: `features/session/api/use-create-session.ts`

---

## Real-World Examples from astrsk

### ✅ Good Structure

```
📁 src/
  📁 app/
    📁 routes/ - router.tsx
    📁 store/ - theme.ts
    📁 styles/ - dockview-detail.css (global library override)

  📁 pages/
    📁 assets/
      character-plot-detail-page.tsx (full page component)
      📁 characters/
        new-character.tsx
      📁 plots/
        new-plot.tsx

  📁 widgets/
    📁 create-page-header/ - ui/create-page-header.tsx (reused across pages)
    📁 sidebar-left/ - ui/sidebar-left.tsx

  📁 features/
    📁 character/
      📁 ui/ - create-character/ (character creation wizard)
      📁 api/ - use-create-character.ts
    📁 session/
      📁 ui/ - session-panel/
      📁 api/ - use-create-session.ts

  📁 entities/
    📁 card/
      📁 domain/ - character-card.ts, plot-card.ts
      📁 ui/ - card-display.tsx
      📁 stores/ - card-ui-store.ts (domain-specific UI state)
    📁 session/
      📁 domain/ - session.ts

  📁 shared/
    📁 ui/ - button.tsx, dialog.tsx, avatar.tsx
    📁 hooks/ - use-breakpoint.ts, use-debounce.ts
    📁 stores/ - mobile-navigation-store.ts (app-wide state)
    📁 lib/ - utils.ts, cn.ts
```

### ❌ Anti-Patterns (Fixed in Migration)

```
// ❌ BAD: features/card/panels/card-panel-main.tsx
// Full page component in features layer
// ✅ FIXED: pages/assets/character-plot-detail-page.tsx

// ❌ BAD: pages/assets/character-plot-detail-dockview.css
// Global library override in pages layer
// ✅ FIXED: app/styles/dockview-detail.css

// ❌ BAD: app/hooks/use-breakpoint.ts
// Reusable utility in app layer
// ✅ FIXED: shared/hooks/use-breakpoint.ts

// ❌ BAD: app/stores/card-ui-store.ts
// Domain-specific state in app layer
// ✅ FIXED: entities/card/stores/card-ui-store.ts

// ❌ BAD: features/session/ui/session-panel-mobile.tsx
// Separate mobile file (forbidden in astrsk)
// ✅ FIXED: Single component with useBreakpoint() hook
```

---

## Migration Checklist

When refactoring code to FSD:

- [ ] Identify the layer (app, pages, widgets, features, entities, shared)
- [ ] Verify no upward dependencies (only import from lower layers)
- [ ] Check if slice or segment (app/shared = segments only)
- [ ] Update all import paths
- [ ] Run tests before and after migration
- [ ] Verify build succeeds
- [ ] Update documentation if needed

---

## Key Takeaways

1. **Not every layer is required** - Use only what brings value
2. **app/** and **shared/** are special - Segments only, no slices
3. **Import rule** - Only import from lower layers or same slice
4. **Entities cannot import entities** - Use `@x` notation for relationships
5. **Not everything needs to be a feature** - Optimize for navigation
6. **Global CSS goes in app/styles/** - Not in pages/ or features/
7. **Domain state in entities/**, **app-wide state in shared/** - Clear separation

---

---

## Slices and Segments

### Slices (Second Level Organization)

**Purpose**: Group code by its meaning for the product, business, or application

**Key Characteristics**:
- Names are **not standardized** - determined by your business domain
- Each slice represents a business concept or feature area
- Slices should be **independent** (zero coupling) and **highly cohesive**

**Examples by Domain**:
- Photo gallery app: `photo`, `effects`, `gallery-page`
- Social network: `post`, `comments`, `news-feed`
- astrsk project: `character`, `session`, `flow`, `card`, `plot`

**Exceptions**:
- **app/** layer: No slices (only segments) - concerns entire application
- **shared/** layer: No slices (only segments) - no business logic

#### Zero Coupling and High Cohesion

An ideal slice should:
- ✅ **Zero coupling**: Independent from other slices on its layer
- ✅ **High cohesion**: Contains most code related to its primary goal

**Enforced by Import Rule**:
> A module in a slice can only import other slices when they are located on layers strictly below.

#### Public API Rule on Slices

> Every slice (and segment on layers without slices) must contain a **public API definition**.

**Key Points**:
- Inside a slice: organize code however you want
- Outside the slice: only reference the public API, not internal structure
- Makes refactoring safer - internal changes don't break consumers

**Example**:
```typescript
// features/character/index.ts (Public API)
export { CharacterImageStep, CharacterInfoStep } from "./ui/create-character";
export { useCreateCharacter } from "./api/use-create-character";
export type { Character } from "./model/types";

// ✅ GOOD: External import via public API
import { CharacterImageStep } from "features/character";

// ❌ BAD: Direct import bypassing public API
import { CharacterImageStep } from "features/character/ui/create-character/image-step";
```

#### Slice Groups

**Purpose**: Group closely related slices structurally

**Rules**:
- ✅ Group in a folder for organization
- ❌ No code sharing in that folder (still maintain slice isolation)

**Example**:
```
📁 features/
  📁 post/                        ← Slice group folder
    📁 compose/                   ← Slice 1
      index.ts (public API)
      📁 ui/
      📁 model/
    📁 like/                      ← Slice 2
      index.ts (public API)
      📁 ui/
      📁 api/
    📁 delete/                    ← Slice 3
      index.ts (public API)
      📁 api/
    ❌ shared-code.ts             ← NOT ALLOWED (breaks isolation)
```

---

### Segments (Third Level Organization)

**Purpose**: Group code by its **technical nature** (not business meaning)

**Standardized Segments**:

| Segment | Purpose | Examples |
|---------|---------|----------|
| `ui/` | UI display | Components, formatters, styles |
| `api/` | Backend interactions | Request functions, data types, mappers |
| `model/` | Data model | Schemas, interfaces, stores, business logic |
| `lib/` | Library code | Utilities needed by this slice |
| `config/` | Configuration | Feature flags, constants |

**Segment Usage by Layer**:

#### app/ Layer Segments
- `routes/` - Router configuration
- `store/` - Global store setup
- `styles/` - Global styles, library overrides
- `entrypoint/` - Application entry point

#### shared/ Layer Segments
- `ui/` - UI kit (buttons, inputs, dialogs)
- `api/` - API client, request functions
- `lib/` - Focused internal libraries (dates, colors, text)
- `config/` - Environment variables, feature flags
- `routes/` - Route constants or patterns
- `i18n/` - Translation setup
- `hooks/` - Reusable utility hooks
- `stores/` - App-wide state management

#### Custom Segments

You can create custom segments, especially in **app/** and **shared/** layers.

**Naming Rule**:
- ✅ Describe the **purpose** (what it does)
- ❌ Describe the **essence** (what it is)

**Examples**:
```
✅ GOOD segment names:
- shared/auth/         - Authentication utilities
- shared/date/         - Date manipulation
- app/analytics/       - Analytics tracking

❌ BAD segment names:
- shared/components/   - Too generic (use ui/)
- shared/hooks/        - OK if truly reusable, but avoid dumping ground
- shared/types/        - Too generic (co-locate types with usage)
- shared/utils/        - Too generic (split by purpose: date/, text/, etc.)
```

---

## Slices vs Segments: Quick Reference

| Aspect | Slices | Segments |
|--------|--------|----------|
| **Level** | 2nd (middle) | 3rd (lowest) |
| **Purpose** | Business meaning | Technical nature |
| **Naming** | Not standardized (business domain) | Standardized (ui, api, model, lib, config) |
| **Location** | pages/, widgets/, features/, entities/ | All layers (including app/, shared/) |
| **Isolation** | Must be independent from each other | Can reference each other within slice |
| **Public API** | Required (index.ts) | Not required (internal to slice) |

---

## Real-World Structure Example

```
📁 src/
  📁 app/                        ← Layer (segments only)
    📁 routes/                   ← Segment
    📁 styles/                   ← Segment

  📁 features/                   ← Layer
    📁 character/                ← Slice (business: character)
      index.ts                   ← Public API
      📁 ui/                     ← Segment (technical: UI)
        📁 create-character/
          image-step.tsx
          info-step.tsx
      📁 api/                    ← Segment (technical: backend)
        use-create-character.ts
      📁 model/                  ← Segment (technical: data)
        types.ts
        validator.ts

  📁 shared/                     ← Layer (segments only)
    📁 ui/                       ← Segment
      button.tsx
    📁 hooks/                    ← Segment
      use-breakpoint.ts
```

---

## Public API Best Practices

### 1. Create index.ts for Each Slice

```typescript
// features/character/index.ts
export { CharacterImageStep, CharacterInfoStep } from "./ui/create-character";
export { useCreateCharacter } from "./api/use-create-character";
export type { Character } from "./model/types";
```

### 2. Export Only What's Needed

```typescript
// ✅ GOOD: Export only public interface
export { useCreateCharacter } from "./api/use-create-character";

// ❌ BAD: Export internal utilities
export { validateCharacterName } from "./model/validator"; // Keep internal
```

### 3. Re-export from Segments

```typescript
// features/character/index.ts

// Re-export UI components
export type {
  CharacterImageStepProps,
  CharacterInfoStepProps,
} from "./ui/create-character";

export {
  CharacterImageStep,
  CharacterInfoStep,
  CharacterLorebookStep,
} from "./ui/create-character";

// Re-export API hooks
export { useCreateCharacter } from "./api/use-create-character";

// Re-export types (but not internal models)
export type { Character } from "./model/types";
```

### 4. Benefits of Public API

1. **Refactoring Safety**: Change internal structure without breaking consumers
2. **Clear Contracts**: Explicit about what's public vs private
3. **Better IDE Support**: Autocomplete only shows public exports
4. **Easier Code Review**: Reviewers see intended public surface

---

## Common Mistakes to Avoid

### 1. Creating "Utils" or "Helpers" Dumps

```typescript
// ❌ BAD: Generic dumping ground
📁 shared/
  📁 utils/
    string-helpers.ts       // Too generic
    date-helpers.ts
    array-helpers.ts
    misc.ts                 // Worst offender

// ✅ GOOD: Focused libraries with purpose
📁 shared/
  📁 date/                  // Clear focus: date manipulation
    README.md               // Documents purpose
    format.ts
    parse.ts
  📁 text/                  // Clear focus: text operations
    README.md
    truncate.ts
    slugify.ts
```

### 2. Bypassing Public API

```typescript
// ❌ BAD: Direct import of internal structure
import { validateForm } from "features/character/ui/create-character/form-validator";

// ✅ GOOD: Use public API
import { useCreateCharacter } from "features/character";
// Validation handled internally by the hook
```

### 3. Sharing Code Between Slices in Same Layer

```typescript
// ❌ BAD: features/character/ importing from features/session/
import { SessionPanel } from "features/session/ui";

// ✅ GOOD: Extract shared logic to lower layer
import { Panel } from "shared/ui/panel";
// Both character and session can use shared Panel
```

### 4. Using Technical Names for Slices

```typescript
// ❌ BAD: Technical/essence-based naming
📁 features/
  📁 forms/            // Too technical
  📁 modals/           // Too technical
  📁 tables/           // Too technical

// ✅ GOOD: Business/purpose-based naming
📁 features/
  📁 character/        // Business domain
  📁 session/          // Business domain
  📁 authentication/   // Business purpose
```

---

## References

- [Feature-Sliced Design Official Docs](https://feature-sliced.design/)
- [astrsk FSD Migration History](./PWA_FSD_MIGRATION_HISTORY.md)
- [astrsk CLAUDE.md](./CLAUDE.md) - Development guidelines
