# Initialization System Documentation

## Overview

The astrsk PWA performs sequential initialization on app startup: database migration, services initialization, and stores initialization. This document explains the initialization system architecture and how to add new initialization steps.

## Architecture

### Three-Tier Initialization System

The initialization system is divided into three distinct tiers with different execution patterns:

```
main.tsx (Orchestration)
  ├── 1. Database Migration (ONE-TIME)
  │   └── migrate() - Runs only on first initialization or when DB is missing
  │
  ├── 2. Services Initialization (EVERY TIME)
  │   └── initServices() - Runs on every app startup (in-memory dependency injection)
  │
  └── 3. Stores Initialization (EVERY TIME)
      └── initStores() - Runs on every app startup (loads data from DB into memory)
```

### Why This Architecture?

#### Tier 1: Database Migration (One-Time)

- **Purpose**: Create table structures in PGlite database
- **Storage**: Persisted in IndexedDB
- **When it runs**: Only when `isDatabaseInitialized()` returns `false`
- **Check logic**:
  1. Migration table exists (`drizzle.__drizzle_migrations`)
  2. Migration records exist (count > 0)
  3. Essential application tables exist (sessions, flows, cards, turns, api_connections)
- **Skip behavior**: If all checks pass, migration steps are marked as instant success

#### Tier 2: Services Initialization (Every Time)

- **Purpose**: Dependency injection and repository linking
- **Storage**: In-memory only (not persisted)
- **When it runs**: Every app startup
- **Why always run**:
  - Services need runtime linking of repositories and functions
  - Example: `FlowService.init(AgentService.agentRepo, ...)`
  - These references are in-memory and don't persist across page reloads

#### Tier 3: Stores Initialization (Every Time)

- **Purpose**: Load data from database into memory caches
- **Storage**: In-memory only (not persisted)
- **When it runs**: Every app startup
- **Why always run**:
  - Memory caches need to be repopulated from database
  - Example: Load API connections, backgrounds, sessions into app state

### Initialization Flow

```typescript
// main.tsx
async function initializeApp() {
  // Check if database is already migrated
  const dbInitialized = await isDatabaseInitialized();

  if (!dbInitialized) {
    // First-time initialization: Run full migration
    await migrate(onProgress);
  } else {
    // Subsequent loads: Skip migration, mark as instant success
    markMigrationStepsAsSuccess();
  }

  // ALWAYS run services (dependency injection)
  await initServices(onProgress);

  // ALWAYS run stores (data loading)
  await initStores(onProgress);

  // Save log only on first initialization
  if (!dbInitialized) {
    saveLog(initTime);
  }
}
```

### Core Components

1. **InitializationStore** (`@/shared/stores/initialization-store.tsx`)
   - Initialization step state management (Zustand)
   - localStorage-based log saving/loading

2. **InitializationScreen** (`@/shared/ui/initialization-screen.tsx`)
   - UI displayed to users during initialization
   - Only shown when initialization takes >1 second

3. **Initialization Logs Page** (`@/pages/settings/initialization-logs.tsx`)
   - Accessible via Settings > Advanced Preferences
   - View and manage last initialization log

## Initialization Steps (18 Total)

### 1. Database Migration (migrate.ts)

| Step ID            | Label                    | Description                     | Execution Pattern               |
| ------------------ | ------------------------ | ------------------------------- | ------------------------------- |
| `database-init`    | Initialize database      | Create PGlite database instance | One-time (skipped if DB exists) |
| `migration-schema` | Setup migration schema   | Create migration schema/table   | One-time (skipped if DB exists) |
| `check-migrations` | Check pending migrations | Check for migrations to run     | One-time (skipped if DB exists) |
| `run-migrations`   | Run database migrations  | Execute migration SQL           | One-time (skipped if DB exists) |

### 2. Service Initialization (init-services.ts)

| Step ID           | Label                      | Description                               | Execution Pattern             |
| ----------------- | -------------------------- | ----------------------------------------- | ----------------------------- |
| `asset-service`   | Initialize asset service   | Initialize AssetService                   | **Every time** (in-memory DI) |
| `api-service`     | Initialize API service     | Initialize ApiService                     | **Every time** (in-memory DI) |
| `agent-service`   | Initialize agent service   | Initialize AgentService                   | **Every time** (in-memory DI) |
| `node-services`   | Initialize node services   | Initialize DataStoreNode, IfNode services | **Every time** (in-memory DI) |
| `vibe-service`    | Initialize vibe service    | Initialize VibeSessionService             | **Every time** (in-memory DI) |
| `flow-service`    | Initialize flow service    | Initialize FlowService (Agent dependency) | **Every time** (in-memory DI) |
| `image-service`   | Initialize image service   | Initialize GeneratedImageService          | **Every time** (in-memory DI) |
| `card-service`    | Initialize card service    | Initialize CardService (Image dependency) | **Every time** (in-memory DI) |
| `session-service` | Initialize session service | Initialize SessionService (multiple deps) | **Every time** (in-memory DI) |

### 3. Store Initialization (init-stores.ts)

| Step ID            | Label                               | Description                                | Execution Pattern                 |
| ------------------ | ----------------------------------- | ------------------------------------------ | --------------------------------- |
| `api-connections`  | Load API connections                | Query API connection list                  | **Every time** (load into memory) |
| `free-provider`    | Setup free AI provider (if needed)  | Create astrsk.ai free provider (new users) | Conditional (every time check)    |
| `check-sessions`   | Check existing sessions             | Check if sessions exist                    | **Every time** (load into memory) |
| `default-sessions` | Import default sessions (new users) | Import default sessions (new users only)   | Conditional (every time check)    |
| `backgrounds`      | Load background assets              | Load background image assets               | **Every time** (load into memory) |

## Adding New Initialization Steps

### Step 1: Add Step to Initialization Function

#### 1-1. Adding Database Migration Step

**File**: `apps/pwa/src/db/migrate.ts`

```typescript
export async function migrate(
  onProgress?: (
    step: string,
    status: "start" | "success" | "error",
    error?: string,
  ) => void,
) {
  try {
    // ... existing code ...

    // Add new step
    onProgress?.("new-migration-step", "start");
    await performNewMigration();
    onProgress?.("new-migration-step", "success");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    onProgress?.("new-migration-step", "error", errorMessage);
    throw error;
  }
}
```

**Important**: Database migration steps will only execute on first initialization or when `isDatabaseInitialized()` returns `false`. On subsequent app loads, these steps are skipped and marked as instant success.

#### 1-2. Adding Service Initialization Step

**File**: `apps/pwa/src/app/services/init-services.ts`

```typescript
export async function initServices(
  onProgress?: (
    service: string,
    status: "start" | "success" | "error",
    error?: string,
  ) => void,
): Promise<void> {
  try {
    // ... existing services ...

    // Add new service initialization
    onProgress?.("new-service", "start");
    NewService.init();
    onProgress?.("new-service", "success");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    onProgress?.("new-service", "error", errorMessage);
    throw error;
  }
}
```

**Dependency Considerations**:

- Service initialization order matters
- Example: `CardService` must be initialized after `GeneratedImageService`
- Place dependent services in correct order

**Important**: Service initialization steps **always execute** on every app startup because they perform in-memory dependency injection that doesn't persist across page reloads.

#### 1-3. Adding Store Initialization Step

**File**: `apps/pwa/src/shared/stores/init-stores.ts`

```typescript
export async function initStores(
  onProgress?: (
    step: string,
    status: "start" | "success" | "error",
    error?: string,
  ) => void,
): Promise<void> {
  // ... existing code ...

  // Add new store initialization
  onProgress?.("new-store", "start");
  try {
    await initializeNewStore();
    onProgress?.("new-store", "success");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to initialize new store:", error);
    onProgress?.("new-store", "error", errorMessage);
    // Continue if non-critical
  }
}
```

**Error Handling Patterns**:

- **Critical**: Throw error on failure (stops app execution)
- **Non-critical**: Log error and continue (e.g., backgrounds load failure)

**Important**: Store initialization steps **always execute** on every app startup because they load data from the database into in-memory caches.

### Step 2: Add Step Definition to main.tsx

**File**: `apps/pwa/src/main.tsx`

Add new step to `initializeSteps()` array in the **correct order**:

```typescript
initializeSteps([
  // Database Migration (ONE-TIME execution)
  { id: "database-init", label: "Initialize database" },
  { id: "migration-schema", label: "Setup migration schema" },
  { id: "check-migrations", label: "Check pending migrations" },
  { id: "run-migrations", label: "Run database migrations" },
  { id: "new-migration-step", label: "New migration step" }, // ← New step (skipped after first run)

  // Services (ALWAYS execute - dependency injection)
  { id: "asset-service", label: "Initialize asset service" },
  { id: "new-service", label: "Initialize new service" }, // ← New step (runs every time)
  // ... remaining services ...

  // Stores (ALWAYS execute - data loading)
  { id: "api-connections", label: "Load API connections" },
  { id: "new-store", label: "Initialize new store" }, // ← New step (runs every time)
  // ... remaining stores ...
]);
```

**Considerations**:

- `id` must **exactly match** the value used in `onProgress?.("id", ...)` in Step 1
- `label` is user-facing text (shown in InitializationScreen and Logs page)
- Array order must match actual execution order
- **Execution pattern matters**: Migration steps are skipped after first run, but services/stores always run

### Step 3: Handle Skip Logic (for Migration Steps Only)

If adding a database migration step, you must also update the skip logic in `main.tsx`:

**File**: `apps/pwa/src/main.tsx`

```typescript
// When database is already initialized, mark migration steps as instant success
if (dbInitialized) {
  logger.debug("⏭️ Database already migrated, skipping migration steps");

  // Mark all migration steps as success
  onProgress?.("database-init", "start");
  onProgress?.("database-init", "success");
  onProgress?.("migration-schema", "start");
  onProgress?.("migration-schema", "success");
  onProgress?.("check-migrations", "start");
  onProgress?.("check-migrations", "success");
  onProgress?.("run-migrations", "start");
  onProgress?.("run-migrations", "success");
  onProgress?.("new-migration-step", "start"); // ← Add new migration step
  onProgress?.("new-migration-step", "success"); // ← Add new migration step
}
```

**Important**: This skip logic **only applies to database migration steps**. Services and stores initialization steps are never skipped because they must run on every app startup.

### Step 4: Validation

1. **TypeScript Compilation**:

   ```bash
   pnpm build:pwa
   ```

2. **Initialization Screen Check**:
   - Run app (takes >1 second → InitializationScreen displays)
   - Verify new step appears in correct order
   - Check grouped display (3 categories)

3. **Logs Check**:
   - Settings > Advanced Preferences > View initialization logs
   - Verify new step is recorded in logs
   - Verify success/failure status is accurate

4. **Execution Pattern Validation**:
   - **For migration steps**: Clear IndexedDB and reload → step should execute → reload again → step should be skipped
   - **For service/store steps**: Reload multiple times → step should execute every time

## File Structure

```
apps/pwa/src/
├── main.tsx                              # Initialization orchestration
├── db/
│   └── migrate.ts                        # DB migration (Steps 1-4) + isDatabaseInitialized()
├── app/services/
│   └── init-services.ts                  # Services initialization (Steps 5-13)
├── shared/
│   ├── stores/
│   │   ├── initialization-store.tsx      # Initialization state + localStorage
│   │   └── init-stores.ts                # Stores initialization (Steps 14-18)
│   └── ui/
│       └── initialization-screen.tsx     # Initialization UI (1sec+ display)
├── pages/settings/
│   ├── initialization-logs.tsx           # Logs viewer page
│   └── advanced.tsx                      # Logs page menu item
└── routes/_layout/settings/
    └── initialization-logs.tsx           # Route definition
```

## Initialization State Management

### InitializationStore (Zustand)

```typescript
interface InitializationState {
  steps: InitializationStep[]; // All step states
  currentStepIndex: number; // Current step index
  isInitialized: boolean; // Initialization complete

  // Actions
  initializeSteps: (steps) => void; // Initialize step list
  startStep: (stepId) => void; // Start step (status: "running")
  completeStep: (stepId) => void; // Complete step (status: "success")
  failStep: (stepId, error) => void; // Fail step (status: "error")
  saveLog: (totalTime) => void; // Save log to localStorage
  reset: () => void; // Reset state
}
```

### InitializationStep

```typescript
interface InitializationStep {
  id: string; // Step ID (unique)
  label: string; // User-facing text
  status: "pending" | "running" | "success" | "error" | "warning";
  error?: string; // Error message (on failure)
  startedAt?: Date; // Start time
  completedAt?: Date; // Completion time
}
```

### InitializationLog (localStorage)

```typescript
interface InitializationLog {
  timestamp: string; // ISO 8601 format
  totalTime: number; // Total initialization time (ms)
  hasError: boolean; // Has error
  steps: InitializationStep[]; // Full step snapshot
}
```

**Storage Key**: `"astrsk-initialization-log"`

**Note**: Logs are only saved on first initialization (when `dbInitialized=false`) to preserve original timing data.

## Database Initialization Check

### isDatabaseInitialized() Function

**File**: `apps/pwa/src/db/migrate.ts`

This function performs a three-tier validation to determine if the database has been properly initialized:

```typescript
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    const db = await Drizzle.getInstance();

    // Debug: List all tables in database
    await listAllTables();

    // Tier 1: Check if migration table exists
    const tableExistsResult = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'drizzle'
        AND table_name = '__drizzle_migrations'
      ) as table_exists
    `);

    if (!tableExistsResult.rows[0]?.table_exists) {
      return false;
    }

    // Tier 2: Check migration records exist
    const recordsResult = await db.execute(`
      SELECT COUNT(*) as count
      FROM "drizzle"."__drizzle_migrations"
    `);

    const recordCount = Number(recordsResult.rows[0]?.count || 0);
    if (recordCount === 0) {
      return false;
    }

    // Tier 3: Check essential application tables exist
    const essentialTables = [
      "sessions",
      "flows",
      "cards",
      "turns", // Message/turn history
      "api_connections",
    ];

    const tablesCheckResult = await db.execute(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (${essentialTables.map((t) => `'${t}'`).join(", ")})
    `);

    const foundTables = tablesCheckResult.rows.map((row) => row.table_name);
    const missingTables = essentialTables.filter(
      (t) => !foundTables.includes(t),
    );

    if (missingTables.length > 0) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}
```

**Validation Tiers**:

1. **Migration table exists**: `drizzle.__drizzle_migrations` table must exist
2. **Migration records exist**: At least 1 migration record must be present
3. **Essential tables exist**: Core app tables (sessions, flows, cards, turns, api_connections) must exist

**Return value**:

- `true`: Database is fully initialized, skip migration steps
- `false`: Database needs initialization, run full migration

## Initialization UI Behavior

### 1. InitializationScreen

**Display Condition**:

- Only shown when initialization takes >1 second
- If <1 second, app launches directly without screen

**UI Modes**:

#### Normal Progress (Simple Mode)

- **Logo animation** (rotating)
- **Progress bar** (X / 18 steps completed)
- **Grouped step display** (18 steps → 3 groups):
  ```
  ✅ Database Setup
  ✅ Services Initialization
  ⏳ Data Loading
  ```
- Group states:
  - `pending`: Gray (not started)
  - `running`: Blue Loader2 (rotating animation)
  - `success`: Green CheckCircle2 (completed)

#### Error Mode (Detailed Mode)

- **Logo animation stops**
- **Progress bar** maintained
- **Failed step details only**:
  - Step number (e.g., 04)
  - Step label
  - Error message (red box)
  - Duration
- **Action buttons**:
  - "Retry Initialization" (page refresh)
  - "Copy Error Details" (copy to clipboard)

### 2. Initialization Logs Page

**Access Path**:

```
Settings → Advanced Preferences → View initialization logs
```

**Features**:

- Display last initialization log (from localStorage)
- Summary Card:
  - Timestamp
  - Total initialization time
  - Success/Warning/Error counts
  - Status badge (Success/Partial Success/Failed)
- Step-by-step details:
  - Order number, label, status icon
  - Duration (ms)
  - Error message (on failure)
  - Click to see full error details
- Action buttons:
  - "Copy Logs" (copy error logs to clipboard)
  - "Clear Logs" (delete localStorage)

**Empty State**:

- No logs available: "No initialization logs available"
- Guide: "Logs will be saved automatically on the next app initialization"

## Debugging Tips

### 1. Initialization Failure

**Console Check**:

```typescript
// Check logger.debug messages
logger.debug("✅ Initialization completed in XXXms");
logger.error("Failed to initialize app:", error);
```

**Logs Page Check**:

- Settings > Advanced Preferences > View initialization logs
- Identify which step failed
- Copy error message for analysis

### 2. Database Initialization Check

**Debug Function**:

```typescript
// listAllTables() - shows all tables in database
logger.debug("📋 All tables in database:");
logger.debug(`  - drizzle.__drizzle_migrations`);
logger.debug(`  - public.sessions`);
logger.debug(`  - public.flows`);
// ... etc
```

**Manual Check**:

```typescript
// In browser console
const dbInitialized = await isDatabaseInitialized();
console.log("DB Initialized:", dbInitialized);
```

### 3. Skip Specific Step (Development Only)

```typescript
// init-stores.ts example
export async function initStores(onProgress) {
  // Temporarily skip step
  onProgress?.("check-sessions", "start");
  // await SessionService.listSession.execute({ limit: 1 }); // Commented out
  onProgress?.("check-sessions", "success");
}
```

### 4. Measure Initialization Time

```typescript
// Automatically measured in main.tsx
const startTime = performance.now();
// ... initialization ...
const initTime = performance.now() - startTime;
logger.debug(`✅ Initialization completed in ${Math.round(initTime)}ms`);
```

### 5. Test Execution Patterns

**Test Migration Skip**:

1. Clear IndexedDB (DevTools > Application > IndexedDB > Delete)
2. Reload page → migrations should execute
3. Check console: `🔨 Running database migrations...`
4. Reload page again → migrations should be skipped
5. Check console: `⏭️ Database already migrated, skipping migration steps`

**Test Services/Stores Always Run**:

1. Reload page multiple times
2. Check console logs:
   - `🔧 Initializing services...` (every time)
   - `📦 Initializing stores...` (every time)

## Best Practices

### 1. Step ID Naming Conventions

- **Database**: `database-*`, `migration-*`
- **Services**: `*-service`
- **Stores**: Descriptive names (e.g., `api-connections`, `backgrounds`)

### 2. Error Handling

```typescript
// ✅ GOOD: Detailed error message
try {
  await someOperation();
  onProgress?.("step-id", "success");
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("Context-specific error message:", error);
  onProgress?.("step-id", "error", errorMessage);
  throw error; // If critical
}

// ❌ BAD: No error message
try {
  await someOperation();
  onProgress?.("step-id", "success");
} catch (error) {
  onProgress?.("step-id", "error");
  throw error;
}
```

### 3. Dependency Order

Consider dependency graph when initializing services:

```typescript
// init-services.ts
AssetService.init(); // No dependencies
GeneratedImageService.init(
  // Depends on AssetService
  AssetService.saveFileToAsset,
  AssetService.deleteAsset,
);
CardService.init(
  // Depends on AssetService + GeneratedImageService
  AssetService.assetRepo,
  AssetService.saveFileToAsset,
  AssetService.cloneAsset,
  GeneratedImageService.generatedImageRepo, // ← Dependency
);
```

### 4. Async Handling

```typescript
// ✅ GOOD: Use await
onProgress?.("step-id", "start");
await asyncOperation();
onProgress?.("step-id", "success");

// ❌ BAD: Missing await
onProgress?.("step-id", "start");
asyncOperation(); // No await!
onProgress?.("step-id", "success"); // Completes too early
```

### 5. Execution Pattern Awareness

When adding a new step, ask:

**Is this a one-time setup?**

- Database table creation → Add to `migrate.ts`
- Must add skip logic in `main.tsx`

**Does this need to run every time?**

- In-memory dependency injection → Add to `init-services.ts`
- Data loading into memory → Add to `init-stores.ts`
- No skip logic needed

### 6. Warning Status for Partial Failures

Use `"warning"` status for non-critical partial failures:

```typescript
// Example: Some files imported successfully, some failed
const errorDetails: string[] = [];
for (const file of files) {
  try {
    await processFile(file);
  } catch (error) {
    errorDetails.push(`${file}: ${error.message}`);
  }
}

if (errorDetails.length === 0) {
  onProgress?.("step-id", "success");
} else if (errorDetails.length === files.length) {
  onProgress?.(
    "step-id",
    "error",
    `All files failed: ${errorDetails.join(", ")}`,
  );
} else {
  onProgress?.(
    "step-id",
    "warning",
    `Partial failure: ${errorDetails.join(", ")}`,
  );
}
```

## UI/UX Improvements (2025-11-19)

### InitializationScreen Simplification

**Background**: Showing all 18 technical steps to regular users is information overload

**Implemented Improvements**:

1. **Grouping (STEP_GROUPS)**:
   - 18 steps → 3 high-level groups
   - `Database Setup` (4 steps)
   - `Services Initialization` (9 steps)
   - `Data Loading` (5 steps)

2. **Conditional UI Modes**:
   - **Normal progress**: Show only 3 groups (clean)
   - **Error occurred**: Show failed step details (debugging)

3. **Role Separation with Settings Page**:
   - **InitializationScreen**: For regular users (simple progress)
   - **Initialization Logs Page**: For developers/debugging (all 18 steps + logs)

**Files Changed**:

- `initialization-store.tsx`: Added `STEP_GROUPS`
- `initialization-screen.tsx`: Conditional rendering (groups vs details)
- `initialization-logs.tsx`: No changes (always shows all steps)

## Future Improvements

- [ ] Retry logic (auto retry with exponential backoff)
- [ ] Per-step timeout settings
- [ ] Parallel execution optimization for independent steps
- [ ] Initialization log history (store recent N logs)
- [ ] Initialization performance monitoring dashboard
- [ ] Group expand/collapse feature (optional detail view during normal progress)

## Related Documentation

- [Feature-Sliced Design Guide](./FSD_GUIDE.md)
- [TanStack Query Patterns](./TANSTACK_QUERY.md)
- [Development Guidelines](./CLAUDE.md)

---

**Last Updated**: 2025-11-19
**Version**: 1.0.0
