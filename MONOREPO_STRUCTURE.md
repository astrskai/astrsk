# Monorepo Structure & Dependency Management

## 🏗️ Architecture Overview

```
astrsk/
├── packages/
│   └── shared/              # Shared utilities & types
│       ├── package.json     # Dependencies: tslog, zustand
│       └── src/
│           ├── logger.ts    # Logging utility
│           ├── storage.ts   # LocalStorage wrapper
│           └── zustand-utils.ts  # Zustand helpers
│
├── apps/
│   ├── pwa/                 # Main application
│   │   ├── package.json     # Depends on: @astrsk/shared
│   │   └── src/
│   │       └── modules/extensions/
│   │           ├── core/    # Extension system API
│   │           │   ├── types.ts              # IExtensionClient
│   │           │   ├── extension-client.ts   # Secure API impl
│   │           │   └── extension-registry.ts
│   │           └── bootstrap.ts  # Loads plugins from apps/extensions
│   │
│   └── extensions/          # Plugins (PHYSICALLY SEPARATED)
│       ├── package.json     # Dependencies: zod, zustand, @astrsk/shared
│       ├── README.md        # Security docs
│       └── npc/             # NPC plugin
│           ├── npc-plugin.ts
│           ├── npc-extraction-agent.ts
│           ├── npc-card-creation.ts
│           └── npc-store.tsx
```

## 📦 Dependency Rules

### External NPM Packages

Each package has its own `package.json`:

**packages/shared/package.json**
```json
{
  "dependencies": {
    "tslog": "^4.9.2",     // Logger library
    "zustand": "^4.4.7"    // State management
  }
}
```

**apps/pwa/package.json**
```json
{
  "dependencies": {
    "@astrsk/shared": "workspace:*",  // Import shared utilities
    "react": "^18.0.0",
    "zod": "^3.22.4",
    // ... other pwa dependencies
  }
}
```

**apps/extensions/package.json**
```json
{
  "dependencies": {
    "@astrsk/shared": "workspace:*",  // Import shared utilities
    "zod": "^3.22.4",     // Schema validation
    "zustand": "^4.4.7"   // State management
  }
}
```

### Import Rules by Package

#### ✅ apps/extensions (plugins)

**ALLOWED:**
```typescript
// Shared utilities (both packages use same version)
import { logger } from "@astrsk/shared/logger";
import { LocalPersistStorage } from "@astrsk/shared/storage";

// External packages (in extensions/package.json)
import { z } from "zod";
import { create } from "zustand";

// Extension API types only (interface contract)
import { IExtensionClient } from "../pwa/src/modules/extensions/core/types";
```

**FORBIDDEN:**
```typescript
// ❌ Cannot import pwa services (physical separation!)
import { CardService } from "@/app/services/card-service";  // Path doesn't exist

// ❌ Cannot import pwa stores (physical separation!)
import { useAppStore } from "@/app/stores/app-store";  // Path doesn't exist

// ❌ Cannot access credentials
const jwt = client.api.getJwt();  // API doesn't exist
```

#### ✅ apps/pwa

**ALLOWED:**
```typescript
// Shared utilities
import { logger } from "@astrsk/shared/logger";

// All pwa internal imports
import { CardService } from "@/app/services/card-service";
import { useAppStore } from "@/app/stores/app-store";

// Extension core (pwa owns the extension system)
import { extensionRegistry } from "@/modules/extensions/core/extension-registry";

// Load plugins from extensions folder
import { NpcPlugin } from "../../../../../extensions/npc/npc-plugin";
```

#### ✅ packages/shared

**ALLOWED:**
```typescript
// External packages only (no internal dependencies)
import { Logger } from "tslog";
import { create } from "zustand";
```

**FORBIDDEN:**
```typescript
// ❌ Cannot import from pwa or extensions
// Shared is the foundation - no dependencies on other packages
```

## 🔒 Security Benefits

### Physical Separation

**Before** (plugins inside pwa):
```typescript
// apps/pwa/src/modules/extensions/plugins/npc/
import { CardService } from "../../../app/services/card-service";  // ✅ Works!
// Nothing prevents malicious imports
```

**After** (plugins physically separate):
```typescript
// apps/extensions/npc/
import { CardService } from "@/app/services/card-service";  // ❌ Path doesn't exist!
// Filesystem enforces security boundary
```

### Capability-Based Security

Plugins get **capabilities**, not **credentials**:

```typescript
// ❌ FORBIDDEN - Exposing credentials
export interface IExtensionClient {
  api: {
    getJwt(): string;  // Security vulnerability!
  }
}

// ✅ CORRECT - Providing capabilities
export interface IExtensionClient {
  api: {
    callAI(prompt, options): Promise<Result>;  // JWT handled internally
    getCard(id): Promise<Result>;              // Authenticated internally
    saveCard(card): Promise<Result>;           // Authenticated internally
  }
}
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
# Root
npm install

# Or per package
cd packages/shared && npm install
cd apps/pwa && npm install
cd apps/extensions && npm install
```

### 2. TypeScript Configuration

Update `tsconfig.json` paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@astrsk/shared/*": ["../packages/shared/src/*"]
    }
  }
}
```

### 3. Build Order

```bash
# 1. Build shared (no dependencies)
cd packages/shared && npm run build

# 2. Build pwa (depends on shared)
cd apps/pwa && npm run build

# 3. Extensions don't need build (loaded at runtime)
```

## 📝 Adding New Plugins

1. **Create plugin folder:**
```bash
mkdir apps/extensions/my-plugin
```

2. **Implement IExtension:**
```typescript
// apps/extensions/my-plugin/index.ts
import { IExtension, IExtensionClient } from "../../pwa/src/modules/extensions/core/types";
import { logger } from "@astrsk/shared/logger";

export class MyPlugin implements IExtension {
  metadata = {
    id: "my-plugin",
    name: "My Plugin",
    version: "1.0.0",
  };

  async onLoad(client: IExtensionClient) {
    logger.info("[My Plugin] Loading");

    // Use client.api for all functionality
    client.on("message:afterGenerate", async (context) => {
      const result = await client.api.callAI("Process message", {
        schema: mySchema,
      });
    });
  }
}
```

3. **Register in bootstrap:**
```typescript
// apps/pwa/src/modules/extensions/bootstrap.ts
import { MyPlugin } from "../../../../../extensions/my-plugin";

export async function initializeExtensions() {
  await extensionRegistry.register(new MyPlugin());
}
```

## 🎯 Key Principles

1. **Shared Code in packages/shared** - Utilities used by multiple packages
2. **Physical Separation** - Plugins cannot import from pwa (filesystem enforces)
3. **Capability-Based Security** - Plugins get APIs, never credentials
4. **Clear Boundaries** - Each package has explicit dependencies
5. **Monorepo Benefits** - Shared code, but isolated packages

## 📊 Dependency Graph

```
┌─────────────────┐
│ packages/shared │  (Foundation - no deps)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐  ┌──▼──────────┐
│  pwa  │  │ extensions  │
└───┬───┘  └──────┬──────┘
    │             │
    └─────┬───────┘
          │
    (Runtime only)
```

- **Build time**: pwa and extensions both depend on shared
- **Runtime**: pwa loads extensions dynamically, passes IExtensionClient
- **Security**: extensions cannot import pwa (physical separation)
