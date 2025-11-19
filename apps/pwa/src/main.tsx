import { initServices } from "@/app/services/init-services.ts";
import { useAppStore } from "@/shared/stores/app-store.tsx";
import { initStores } from "@/shared/stores/init-stores.ts";
import { useInitializationStore } from "@/shared/stores/initialization-store.tsx";
import { InitializationScreen } from "@/shared/ui/initialization-screen";
import { PwaRegister } from "@/app/providers/pwa-register";
import { migrate, isDatabaseInitialized } from "@/db/migrate.ts";
import { logger } from "@/shared/lib/logger.ts";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { Buffer } from "buffer";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { enableMapSet } from "immer";
import { StrictMode, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@/app/styles/global.css";

// Convex
const isConvexReady =
  import.meta.env.VITE_CONVEX_URL &&
  import.meta.env.VITE_CONVEX_SITE_URL &&
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const convex = isConvexReady
  ? new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)
  : null;

// Enable Map/Set support in Immer before anything else
enableMapSet();

// Buffer polyfill
if (!window.Buffer) {
  window.Buffer = Buffer;
}

function useConvexAuthWithClerk() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const setJwt = useAppStore.use.setJwt();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        const jwt = await getToken({
          template: "convex",
          skipCache: forceRefreshToken,
        });
        setJwt(jwt);
        return jwt;
      } catch (error) {
        logger.error("Failed to fetch access token", error);
        setJwt(null);
        return null;
      }
    },
    [getToken, setJwt],
  );

  return useMemo(
    () => ({
      isLoading: !isLoaded,
      isAuthenticated: !!isSignedIn,
      fetchAccessToken,
    }),
    [isLoaded, isSignedIn, fetchAccessToken],
  );
}

async function initializeApp() {
  // Create root
  const root = createRoot(document.getElementById("root")!);

  // Verify database migration status
  const dbInitialized = await isDatabaseInitialized();

  // Services and stores must ALWAYS be initialized (they're in-memory)
  // Only database migration can be skipped if already completed

  logger.debug(`🔍 Database initialized: ${dbInitialized}`);

  // Track initialization time
  const startTime = performance.now();
  let shouldShowInitScreen = false;
  let initScreenTimeout: number | null = null;

  // Initialize steps in the store
  const { initializeSteps, startStep, completeStep, failStep, saveLog } =
    useInitializationStore.getState();

  // Define all initialization steps
  initializeSteps([
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
    { id: "check-sessions", label: "Check existing sessions" },
    { id: "default-sessions", label: "Import default sessions (new users)" },
    { id: "backgrounds", label: "Load background assets" },
  ]);

  // Helper function to render initialization screen
  const renderInitScreen = () => {
    if (!shouldShowInitScreen) return;
    root.render(
      <StrictMode>
        <InitializationScreen />
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
      failStep(stepId, error || "Unknown warning");
    } else if (status === "error") {
      failStep(stepId, error || "Unknown error");
    }
    renderInitScreen();
  };

  try {
    // Show initialization screen after 1 second if still initializing
    initScreenTimeout = window.setTimeout(() => {
      shouldShowInitScreen = true;
      renderInitScreen();
    }, 1000);

    // Step 1: Migrate database (only if not already done)
    if (!dbInitialized) {
      logger.debug("🔨 Running database migrations...");
      await migrate(onProgress);
    } else {
      logger.debug("⏭️ Database already migrated, skipping migration steps");
      // Mark migration steps as success immediately
      onProgress?.("database-init", "start");
      onProgress?.("database-init", "success");
      onProgress?.("migration-schema", "start");
      onProgress?.("migration-schema", "success");
      onProgress?.("check-migrations", "start");
      onProgress?.("check-migrations", "success");
      onProgress?.("run-migrations", "start");
      onProgress?.("run-migrations", "success");
    }

    // Step 2: Init services (ALWAYS run - in-memory initialization)
    logger.debug("🔧 Initializing services...");
    await initServices(onProgress);

    // Step 3: Init stores (ALWAYS run - loads data into memory)
    logger.debug("📦 Initializing stores...");
    await initStores(onProgress);

    // Calculate initialization time
    const initTime = performance.now() - startTime;
    logger.debug(`✅ Initialization completed in ${Math.round(initTime)}ms`);

    // Save initialization log only on first run
    if (!dbInitialized) {
      saveLog(Math.round(initTime));
    }

    // Clear timeout if initialization finished quickly
    if (initScreenTimeout) {
      clearTimeout(initScreenTimeout);
    }

    // If we showed the init screen, wait a bit to show completion
    if (shouldShowInitScreen) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Render app
    if (isConvexReady && convex) {
      // Convex ready
      root.render(
        <StrictMode>
          <ClerkProvider
            publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
          >
            <ConvexProviderWithAuth
              client={convex}
              useAuth={useConvexAuthWithClerk}
            >
              <PwaRegister />
              <App />
            </ConvexProviderWithAuth>
          </ClerkProvider>
        </StrictMode>,
      );
    } else {
      // Self-hosted
      root.render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
    }
  } catch (error) {
    logger.error("Failed to initialize app:", error);
    // Error screen is already rendered by InitializationScreen
    renderInitScreen();
  }
}
initializeApp();
