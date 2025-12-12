import { initServices } from "@/app/services/init-services.ts";
import { useAppStore } from "@/shared/stores/app-store.tsx";
import { initStores } from "@/shared/stores/init-stores.ts";
import { useInitializationStore, loadInitializationLog } from "@/shared/stores/initialization-store.tsx";
import { InitializationScreen } from "@/shared/ui/initialization-screen";
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

async function initializeApp() {
  // Create root
  const root = createRoot(document.getElementById("root")!);

  // Track initialization time
  const startTime = performance.now();

  // Initialize steps in the store
  const { initializeSteps, startStep, completeStep, warnStep, failStep, saveLog } =
    useInitializationStore.getState();

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
    { id: "default-sessions", label: "Import default sessions (new users)" },
    { id: "backgrounds", label: "Load background assets" },
  ]);

  // Initialization overlay component (blocks interaction during init)
  const InitOverlay = ({ showProgressScreen }: { showProgressScreen: boolean }) => {
    if (showProgressScreen) {
      return <InitializationScreen />;
    }

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <div className="flex items-center gap-3 rounded-full bg-canvas px-5 py-3 shadow-lg">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-text-secondary text-sm">Initializing...</span>
        </div>
      </div>
    );
  };

  // Check if this is the first install (no previous initialization log)
  const isFirstInstall = !loadInitializationLog();

  // Track whether to show detailed progress screen or simple spinner
  // First install: show progress screen immediately
  // Subsequent loads: show simple spinner, upgrade to progress screen if needed
  let showProgressScreen = isFirstInstall;

  // Helper function to render initialization overlay (without App)
  const renderInitOverlay = () => {
    root.render(
      <StrictMode>
        <InitOverlay showProgressScreen={showProgressScreen} />
      </StrictMode>,
    );
  };

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
    // No need to re-render: InitializationScreen subscribes to store changes via Zustand
  };

  // Variable to track if migrations were needed (for logging)
  let needsMigration = false;

  try {
    // Step 1: Initialize database engine (PGlite)
    // This can take ~2 seconds on first load (PGlite initialization polling)
    onProgress("database-engine", "start");

    // Show loading overlay before DB check
    // - First install: full progress screen
    // - Normal loads: simple spinner during DB initialization
    renderInitOverlay();

    const dbCheckStart = performance.now();
    needsMigration = await hasPendingMigrations();
    const dbCheckDuration = performance.now() - dbCheckStart;

    logger.debug(`⏱️ DB initialization took ${Math.round(dbCheckDuration)}ms`);
    onProgress("database-engine", "success");

    if (needsMigration && !showProgressScreen) {
      // App update with new migrations: upgrade to progress screen
      showProgressScreen = true;
      renderInitOverlay();
    }
    // Otherwise: keep current overlay (progress screen or simple spinner)

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

    // Save initialization log only when migrations were executed (first run or app update)
    if (needsMigration) {
      saveLog(Math.round(initTime));
    }

    // Mark app as ready
    useAppStore.getState().setIsOfflineReady(true);

    // Navigate to home on first install (before router initializes)
    // This ensures users start from "/" after initial setup, regardless of URL
    if (isFirstInstall && window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }

    // Render final app with providers
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
  } catch (error) {
    logger.error("Failed to initialize app:", error);

    // On failure, persist the current step states as a log (when migrations were attempted)
    if (needsMigration) {
      const initTime = performance.now() - startTime;
      saveLog(Math.round(initTime));
    }

    // Show progress screen with error state
    showProgressScreen = true;
    renderInitOverlay();
  }
}
initializeApp();
