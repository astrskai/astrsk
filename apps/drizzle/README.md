# @astrsk/drizzle

Drizzle ORM schema and types for the astrsk project.

## Installation

```bash
pnpm add @astrsk/drizzle
# or
npm install @astrsk/drizzle
# or
yarn add @astrsk/drizzle
```

## Usage

```typescript
import { Schema } from '@astrsk/drizzle';

// Access database schemas
const { flows, agents, cards } = Schema;
```

## Publishing (Maintainers Only)

### Prerequisites

1. Create an npm account at https://www.npmjs.com/signup
2. Get invited to the `astrsk` organization on npm
3. Log in to your npm account:
```bash
pnpm login
```

### Publish

```bash
cd apps/drizzle

# 1. Update version
pnpm version patch  # or minor, or major

# 2. Publish to npm
pnpm publish
```

The package will automatically build before publishing (via `prepublishOnly` hook).
