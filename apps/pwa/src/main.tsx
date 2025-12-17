import { useInitializationStore, loadInitializationLog } from "@/shared/stores/initialization-store.tsx";
import { PwaRegister } from "@/app/providers/pwa-register";
import { AuthProvider } from "@/app/providers/auth-provider";
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
 * Bootstrap the application
 *
 * Key design: We render App ONCE and let it handle initialization internally.
 * The actual initialization (PGlite, services, stores) is triggered by App component
 * after React has mounted and stabilized. This ensures:
 * 1. React is fully mounted before DB operations
 * 2. iOS Safari has time to stabilize storage context after redirects
 * 3. Initialization runs within React lifecycle, not in module scope
 */
function bootstrap() {
  logger.debug("🚀 Bootstrapping application...");

  // Initialize steps in the store BEFORE rendering
  const { initializeSteps, setShowProgressScreen } = useInitializationStore.getState();

  // Check previous initialization log
  const previousLog = loadInitializationLog();
  const isFirstInstall = !previousLog;

  // First install: show detailed progress screen immediately
  if (isFirstInstall) {
    setShowProgressScreen(true);
  }

  // Define all initialization steps (these will be run by App component)
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
    { id: "session-cleanup", label: "Cleanup stale sessions" },
    { id: "api-connections", label: "Load API connections" },
    { id: "free-provider", label: "Setup free AI provider (if needed)" },
    { id: "default-models", label: "Configure default models" },
    { id: "check-sessions", label: "Check existing sessions" },
    { id: "migrate-play-sessions", label: "Migrate play sessions" },
    { id: "default-sessions", label: "Import default sessions (new users)" },
    { id: "extensions", label: "Initialize extensions" },
  ]);

  // Create root and render App
  const root = createRoot(document.getElementById("root")!);

  // Render app - App component handles showing InitializationScreen vs actual app
  // and triggers initialization after React has mounted
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

  logger.debug("✅ Bootstrap complete, App component will handle initialization");
}

bootstrap();
