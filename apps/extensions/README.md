# Extensions

**Extensions are physically separated from the main PWA application for true isolation.**

## 🔒 Security Architecture

###Physical Separation Benefits:

1. **Cannot import from pwa** - Extensions are in a separate folder, imports like `@/app/services/*` won't work
2. **Must use client API** - Only way to access pwa functionality is through `client.api.*`
3. **True isolation** - Even malicious code cannot bypass the security boundary

## Structure

```
apps/
  pwa/                           # Main application
    src/modules/extensions/
      core/                      # Extension system (part of pwa)
        types.ts                 # IExtensionClient interface
        extension-client.ts      # Secure API implementation
        extension-registry.ts    # Extension registry
      bootstrap.ts               # Loads extensions from ../../../extensions/

  extensions/                    # Extensions (PHYSICALLY SEPARATE)
    npc/                         # NPC detection extension
      npc-extension.ts           # Main extension class
      npc-extraction-agent.ts    # AI extraction logic
      npc-card-creation.ts       # Card creation logic
      npc-store.tsx              # Extension state
```

## Security Rules

### ✅ ALLOWED:

```typescript
// Import extension interface types
import { IExtensionClient } from "../../pwa/src/modules/extensions/core/types";

// Use secure client API
export class MyExtension implements IExtension {
  async onLoad(client: IExtensionClient) {
    // Access through client.api - JWT handled internally
    const result = await client.api.callAI(prompt, options);
    const card = await client.api.getCard(id);
  }
}
```

### ❌ FORBIDDEN:

```typescript
// CANNOT import from pwa (path doesn't work, physical separation!)
import { CardService } from "@/app/services/card-service";  // ❌ Won't work!
import { useAppStore } from "@/app/stores/app-store";       // ❌ Won't work!

// CANNOT access credentials
const jwt = client.api.getJwt();  // ❌ This API doesn't exist!
```

## Current Issue: Shared Dependencies

The extensions currently still have some pwa imports that need to be resolved:

```typescript
// These won't work from extensions folder:
import { logger } from "@/shared/utils/logger";                    // ❌
import { CharacterCard } from "@/modules/card/domain/character-card";  // ❌
import { LocalPersistStorage } from "@/app/stores/local-persist-storage"; // ❌
```

### Solutions:

**Option 1: Duplicate utilities in extension folder**
- Copy logger, storage utils to extensions/npc/
- Simple but creates duplication

**Option 2: Expose through client.api**
```typescript
client.api.log(level, message);  // Logger through API
client.api.storage;              // Storage through API
```

**Option 3: Create shared package**
```
apps/
  shared/           # Shared utilities & types
    logger/
    storage/
    domain/
  pwa/              # Uses shared
  extensions/       # Uses shared
```

## Why Physical Separation Matters

**Before** (extensions in pwa folder):
```
apps/pwa/src/modules/extensions/plugins/npc/
  npc-extension.ts can do:
    import { CardService } from "../../../app/services/card-service";  // ✅ Works!

  Even with "rules", nothing stops malicious code from importing anything!
```

**After** (extensions in extensions folder):
```
apps/extensions/npc/
  npc-extension.ts tries to do:
    import { CardService } from "@/app/services/card-service";  // ❌ Path doesn't exist!

  Physical filesystem separation = real security boundary!
```

## Adding New Extensions

1. Create folder: `apps/extensions/my-extension/`
2. Implement `IExtension` interface
3. Only import from: `../../pwa/src/modules/extensions/core/types`
4. Register in `apps/pwa/src/modules/extensions/bootstrap.ts`

Example:
```typescript
// apps/extensions/my-extension/index.ts
import { IExtension, IExtensionClient } from "../../pwa/src/modules/extensions/core/types";

export class MyExtension implements IExtension {
  metadata = {
    id: "my-extension",
    name: "My Extension",
    version: "1.0.0",
  };

  async onLoad(client: IExtensionClient) {
    // Use client.api.* for all functionality
    client.on("message:afterGenerate", async (context) => {
      const result = await client.api.callAI("...");
    });
  }
}
```

## Security Principle

**Capability-Based Security** 🔒
- Extensions get capabilities (client.api.callAI)
- Extensions NEVER get credentials (JWT, API keys)
- Physical separation enforces this at filesystem level
