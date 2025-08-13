# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

astrsk is a Progressive Web Application (PWA) that manages AI conversations, cards, flows, and sessions with support for multiple AI providers. It uses Vite, React, TypeScript, and implements Domain-Driven Design with Clean Architecture patterns.

## Common Development Commands

```bash
# Development mode with hot reload
npm run dev

# Production build  
npm run build

# Lint the codebase
npm run lint

# Preview production build
npm run preview

# Run specific test files with Vitest
npx vitest path/to/test.spec.ts
```

## Architecture Overview

### Application Structure
- **Entry Point** (`/src/main.tsx`): React app initialization with Buffer polyfill
- **App Root** (`/src/App.tsx`): Main application component
- **Shared Code** (`/src/shared/`): Common utilities, types, and domain logic
- **PWA Configuration**: Vite PWA plugin with service worker support

### Domain-Driven Design Structure
Each module in `/src/modules/` follows this pattern:
```
module/
├── domain/        # Domain entities and value objects
├── mappers/       # Data transformation between layers
├── repos/         # Repository interfaces and implementations
└── usecases/      # Business logic and use cases
```

Key modules: `agent`, `api`, `asset`, `background`, `card`, `config`, `flow`, `prompt`, `session`, `turn`

### Database Architecture
- **Database**: PGlite (PostgreSQL in WebAssembly) with IndexedDB persistence
- **ORM**: Drizzle ORM
- **Migrations**: SQL files in `/src/db/migrations/`
- **Schema**: TypeScript definitions in `/src/db/schema/`
- **Transaction Support**: Custom transaction wrapper for atomic operations

### State Management
- **Zustand Stores** (`/src/app/stores/`): Global application state
- **React Query**: Server state and caching for API calls
- **Custom Hooks** (`/src/app/hooks/`): Business logic hooks

### UI Components
- **Components V2** (`/src/components-v2/`): Modern component library using Radix UI primitives
- **Legacy Components** (`/src/components/`): Older components being phased out
- **Styling**: Tailwind CSS v4 with Vite integration
- **UI Library**: Custom components built on Radix UI with consistent styling
- **Font Styling Rule**: Inter is the default font family. Do NOT use `font-['Inter']` in Tailwind classes as it's redundant. Simply use font-weight and other font utilities without explicit font-family declarations.
- **Absolute Positioning Rule**: When using absolute positioning (`absolute` class), avoid `self-stretch` as it doesn't work properly. Use explicit width/height classes like `w-28 h-16` instead. `self-stretch` works perfectly for flex layouts.
- **Icon Sizing Rule**: For Lucide icons, use `min-w-4 min-h-4` instead of `w-4 h-4`. The regular width/height classes don't properly set the icon size, while min-width/min-height classes ensure the icon displays at its correct dimensions.

### Special Features
1. **WASM Support**: MiniJinja templating and PGlite database via WebAssembly
2. **AI Provider Integration**: Multiple SDK integrations (OpenAI, Anthropic, Google, Deepseek, Mistral, xAI, etc.)
3. **Flow Editor**: Visual flow editing with React Flow (@xyflow/react)
4. **Monaco Editor**: Code editing capabilities
5. **PWA Features**: Offline support, installability, service worker caching

## Key Technical Considerations

### WebAssembly (WASM)
- Vite configuration excludes WASM modules from optimization (`@electric-sql/pglite`, `minijinja-js`)
- Buffer polyfill in main.tsx for browser compatibility
- Used for MiniJinja template rendering and PGlite database

### PWA Configuration
- Service worker with 20MB file size limit
- Caches JS, CSS, HTML, SVG, PNG, ICO files
- Prompt-based registration type
- Automatic cleanup of outdated caches

### Performance Optimizations
- React Query for efficient data fetching and caching
- Lazy loading potential for heavy components
- IndexedDB for local data persistence
- Service worker caching for offline support

### Build Configuration
- TypeScript with strict mode and path aliases
- Vite with React plugin and PWA support
- Tailwind CSS v4 integration via @tailwindcss/vite
- TSConfig paths for clean imports

## Testing Approach

- **Test Framework**: Vitest
- **Test Files**: `*.spec.ts` throughout the codebase
- **Unit Tests**: Domain logic and use cases
- **Coverage**: Available via @vitest/coverage-v8
- Run specific tests: `npx vitest path/to/test.spec.ts`

## Code Quality Tools

- **TypeScript**: Strict mode with path aliases
- **ESLint**: Configured for TypeScript and React
- **Prettier**: Code formatting (dependencies present)
- **Husky + Lint-staged**: Dependencies installed but configuration needed

## Important Files and Patterns

### Configuration Files
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: TypeScript configuration
- `tailwind.config.js`: Tailwind CSS configuration
- `vite.config.ts`: Vite and PWA configuration
- `pwa-assets.config.ts`: PWA assets generation config

### Domain Patterns
- All domain entities extend `Entity` or `AggregateRoot`
- Use `Result<T, E>` for error handling
- Value objects for type safety
- Repository pattern for data access
- Use case pattern for business logic

### State Management Patterns
- Zustand stores use `create()` with TypeScript interfaces
- Persist middleware for local storage
- Immer for immutable updates
- Separate stores by domain concern

### AI Integration
- Multiple AI provider SDKs integrated
- Provider strategies for different AI services
- Unified interface through domain models

### Data Invalidation Patterns

#### Flow Query Invalidation
When updating flows (e.g., panel layout changes, agent modifications), use the dedicated invalidation utilities:

This ensures:
- Specific flow detail queries are refreshed
- All flow list queries are invalidated
- UI components displaying flow data are updated

**Important**: Always use `invalidateSingleFlowQueries` after:
- Panel creation/removal in flow editor
- Layout changes (panel repositioning)
- Agent updates within a flow
- Any flow property modifications
