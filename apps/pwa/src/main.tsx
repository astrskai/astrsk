import { initServices } from "@/app/services/init-services.ts";
import { useAppStore } from "@/shared/stores/app-store.tsx";
import { initStores } from "@/shared/stores/init-stores.ts";
import { useInitializationStore, loadInitializationLog } from "@/shared/stores/initialization-store.tsx";
import { PwaRegister } from "@/app/providers/pwa-register";
import { AuthProvider } from "@/app/providers/auth-provider";
import { runUnifiedMigrations, hasPendingMigrations } from "@/db/migrations";
import { logger } from "@/shared/lib/logger.ts";
import { Buffer } from "buffer";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { enableMapSet } from "immer";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@astrsk/design-system/styles";
import "@/app/styles/global.css";
import "@/app/styles/theme.css";

// Convex client setup
const isConvexReady =
  import.meta.env.VITE_CONVEX_URL &&
  import.meta.env.VITE_CONVEX_SITE_URL;
const convex = isConvexReady
  ? new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)
  : null;

// Enable Map/Set support in Immer before anything else
enableMapSet();

// Buffer polyfill
if (!window.Buffer) {
  window.Buffer = Buffer;
}

/**
 * Wrapper component that provides Convex client (without auth)
 * Convex is used for subscriptions/payments features, not for auth
 * Auth is handled separately by Supabase via AuthProvider
 */
function ConvexWrapper({ children }: { children: React.ReactNode }) {
  if (!convex) {
    return <>{children}</>;
  }

  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
}

/**
 * Initialize the application
 *
 * Key design: We render App ONCE and let it handle initialization UI internally.
 * This prevents HMR conflicts that occur when root.render() is called multiple times
 * with different component trees.
 */
async function initializeApp() {
  // Track initialization time
  const startTime = performance.now();

  // Initialize steps in the store BEFORE rendering
  const { initializeSteps, startStep, completeStep, warnStep, failStep, saveLog, setShowProgressScreen } =
    useInitializationStore.getState();

  // Check previous initialization log
  const previousLog = loadInitializationLog();
  const isFirstInstall = !previousLog;
  const previousInitSuccessful = previousLog && !previousLog.hasError;

  // First install: show detailed progress screen immediately
  if (isFirstInstall) {
    setShowProgressScreen(true);
  }

  // Define all initialization steps
  initializeSteps([
    { id: "database-engine", label: "Initialize database engine" },
    { id: "database-init", label: "Initialize database" },
    { id: "migration-schema", label: "Setup migration schema" },
    { id: "check-migrations", label: "Check pending migrations" },
    { id: "run-migrations", label: "Run database migrations" },
    { id: "asset-service", label: "Initialize asset service" },
    { id: "api-service", label: "Initialize API service" },
    { id: "agent-service", label: "Initialize agent service" },
    { id: "node-services", label: "Initialize node services" },
    { id: "vibe-service", label: "Initialize vibe service" },
    { id: "flow-service", label: "Initialize flow service" },
    { id: "image-service", label: "Initialize image service" },
    { id: "card-service", label: "Initialize card service" },
    { id: "session-service", label: "Initialize session service" },
    { id: "api-connections", label: "Load API connections" },
    { id: "free-provider", label: "Setup free AI provider (if needed)" },
    { id: "default-models", label: "Configure default models" },
    { id: "check-sessions", label: "Check existing sessions" },
    { id: "migrate-play-sessions", label: "Migrate play sessions" },
    { id: "default-sessions", label: "Import default sessions (new users)" },
  ]);

  // Create root and render App AFTER store is initialized
  const root = createRoot(document.getElementById("root")!);

  // Render app once - App component handles showing InitializationScreen vs actual app
  root.render(
    <StrictMode>
      <AuthProvider>
        <ConvexWrapper>
          <PwaRegister />
          <App />
        </ConvexWrapper>
      </AuthProvider>
    </StrictMode>,
  );

  // Fast path: Skip DB re-initialization if already initialized in this browser session.
  // This handles OAuth redirects on iOS Chrome where PGlite re-initialization can hang.
  // We use sessionStorage (cleared on tab close) to track initialization within a session.
  // On cold start (new tab), full initialization runs including migration checks.
  //
  // IMPORTANT: We still need to initialize services (SessionService, etc.) because
  // they are in-memory objects that don't persist across page refreshes.
  // Only the DB initialization (PGlite) can be skipped.
  const SESSION_INIT_KEY = "astrsk-session-initialized";
  const sessionInitialized = sessionStorage.getItem(SESSION_INIT_KEY) === "true";
  const skipDbInit = sessionInitialized && !!previousInitSuccessful;

  // Progress callback for all initialization functions
  const onProgress = (
    stepId: string,
    status: "start" | "success" | "warning" | "error",
    error?: string,
  ) => {
    if (status === "start") {
      startStep(stepId);
    } else if (status === "success") {
      completeStep(stepId);
    } else if (status === "warning") {
      warnStep(stepId, error || "Unknown warning");
    } else if (status === "error") {
      failStep(stepId, error || "Unknown error");
    }
    // App component subscribes to store changes via Zustand - no re-render needed
  };

  // Variable to track if migrations were needed (for logging)
  let needsMigration = false;

  try {
    // Fast path: Skip only DB initialization, but still init services
    if (skipDbInit) {
      logger.debug("⚡ Fast path: Skipping DB init, but initializing services...");

      // Mark DB steps as skipped
      onProgress("database-engine", "start");
      onProgress("database-engine", "success");
      onProgress("database-init", "start");
      onProgress("database-init", "success");
      onProgress("migration-schema", "start");
      onProgress("migration-schema", "success");
      onProgress("check-migrations", "start");
      onProgress("check-migrations", "success");
      onProgress("run-migrations", "start");
      onProgress("run-migrations", "success");
    } else {
      // Step 1: Initialize database engine (PGlite)
      // This can take ~2 seconds on first load (PGlite initialization polling)
      onProgress("database-engine", "start");

      const dbCheckStart = performance.now();
      needsMigration = await hasPendingMigrations();
      const dbCheckDuration = performance.now() - dbCheckStart;

      logger.debug(`⏱️ DB initialization took ${Math.round(dbCheckDuration)}ms`);
      onProgress("database-engine", "success");

      // App update with new migrations: upgrade to progress screen
      if (needsMigration && !isFirstInstall) {
        setShowProgressScreen(true);
      }

      logger.debug(`🔍 Pending migrations: ${needsMigration}`);

      // Step 2: Migrate database (only if there are pending migrations)
      if (needsMigration) {
        logger.debug("🔨 Running database migrations...");
        await runUnifiedMigrations(onProgress);
      } else {
        logger.debug("⏭️ No pending migrations, skipping migration steps");
        // Mark migration steps as success immediately
        onProgress("database-init", "start");
        onProgress("database-init", "success");
        onProgress("migration-schema", "start");
        onProgress("migration-schema", "success");
        onProgress("check-migrations", "start");
        onProgress("check-migrations", "success");
        onProgress("run-migrations", "start");
        onProgress("run-migrations", "success");
      }
    }

    // Step 3: Init services (ALWAYS run - in-memory initialization, doesn't persist across refresh)
    // In fast path, skip DB operations to avoid PGlite hang on iOS Chrome OAuth redirects
    logger.debug("🔧 Initializing services...");
    await initServices(onProgress, { skipDbOperations: skipDbInit });

    // Step 4: Init stores (skip in fast path - these require DB access)
    // In fast path, the stores will be initialized lazily when data is first accessed
    if (!skipDbInit) {
      logger.debug("📦 Initializing stores...");
      await initStores(onProgress);
    } else {
      logger.debug("⚡ Fast path: Skipping store initialization (will init lazily)");
      // Mark store-related steps as skipped
      onProgress("api-connections", "start");
      onProgress("api-connections", "success");
      onProgress("free-provider", "start");
      onProgress("free-provider", "success");
      onProgress("default-models", "start");
      onProgress("default-models", "success");
      onProgress("check-sessions", "start");
      onProgress("check-sessions", "success");
      onProgress("migrate-play-sessions", "start");
      onProgress("migrate-play-sessions", "success");
      onProgress("default-sessions", "start");
      onProgress("default-sessions", "success");
    }

    // Calculate initialization time
    const initTime = performance.now() - startTime;
    logger.debug(`✅ Initialization completed in ${Math.round(initTime)}ms`);

    // Save initialization log on first install or when migrations were executed
    if (isFirstInstall || needsMigration) {
      saveLog(Math.round(initTime));
    }

    // Navigate to home on first install (before router initializes)
    // This ensures users start from "/" after initial setup, regardless of URL
    if (isFirstInstall && window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }

    // Mark app as ready - App component will switch from InitializationScreen to actual app
    useAppStore.getState().setIsOfflineReady(true);

    // Mark session as initialized (for fast path on OAuth redirects)
    sessionStorage.setItem(SESSION_INIT_KEY, "true");
  } catch (error) {
    logger.error("Failed to initialize app:", error);

    // On failure, persist the current step states as a log
    if (isFirstInstall || needsMigration) {
      const initTime = performance.now() - startTime;
      saveLog(Math.round(initTime));
    }

    // Show progress screen with error state
    setShowProgressScreen(true);
  }
}
initializeApp();
