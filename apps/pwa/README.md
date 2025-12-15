# Astrsk PWA

Main Progressive Web Application for Astrsk - an AI roleplay platform.

## Architecture

This project follows [Feature-Sliced Design (FSD)](https://feature-sliced.design/):

```
src/
├── app/           # App initialization, providers, services
├── pages/         # Route pages (1 route = 1 page)
│   ├── assets/    # Character, Scenario, Workflow pages
│   ├── home/      # Home page
│   ├── sessions/  # Session list & chat pages
│   └── settings/  # Settings pages
├── widgets/       # Reusable UI blocks across pages
├── features/      # User interactions & business logic
│   ├── character/
│   ├── flow/
│   ├── scenario/
│   ├── session/
│   └── vibe/
├── entities/      # Business domain models
│   ├── agent/
│   ├── card/
│   ├── flow/
│   ├── session/
│   └── ...
├── shared/        # Foundation (UI kit, hooks, utilities)
│   ├── ui/        # UI components (shadcn/ui)
│   ├── hooks/     # Custom hooks
│   ├── stores/    # Zustand stores
│   └── lib/       # Utilities
├── db/            # Database schemas and migrations (Drizzle)
└── routes/        # TanStack Router route definitions
```

## Development

```bash
# From monorepo root
pnpm dev:pwa

# Or from this directory
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (port 5173) |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run tests with Vitest |
| `pnpm lint` | Run ESLint |
| `pnpm db:export` | Export database to JSON |

## Key Technologies

- **React 18** + **TypeScript 5**
- **Vite 6** with PWA plugin
- **TanStack Router** for file-based routing
- **TanStack Query v5** for server state
- **Zustand** for client state
- **Drizzle ORM** + **PGlite** for local database
- **Tailwind CSS v4** for styling
- **@astrsk/design-system** for shared components

## Database

Local-first architecture using PGlite (PostgreSQL compiled to WASM):

- Data stored in browser's OPFS (Origin Private File System)
- Full SQL support with Drizzle ORM
- Automatic migrations on app startup

## Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run entity-specific tests
pnpm test:entities
```

## Related Documentation

- [FSD Guide](../../FSD_GUIDE.md) - Architecture guidelines
- [TanStack Query Guide](../../TANSTACK_QUERY.md) - Query patterns
- [Initialization System](./INITIALIZATION_SYSTEM.md) - App startup flow
