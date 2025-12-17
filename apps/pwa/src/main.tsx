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

// Mobile console debugging (eruda) - only in non-production
if (import.meta.env.DEV || window.location.hostname.includes("dev.")) {
  import("eruda").then((eruda) => eruda.default.init());
}

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

  // Check if this is the first install (no previous initialization log)
  const isFirstInstall = !loadInitializationLog();

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

    // Step 3: Init services (ALWAYS run - in-memory initialization)
    logger.debug("🔧 Initializing services...");
    await initServices(onProgress);

    // Step 4: Init stores (ALWAYS run - loads data into memory)
    logger.debug("📦 Initializing stores...");
    await initStores(onProgress);

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
