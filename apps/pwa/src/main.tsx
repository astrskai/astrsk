import { initServices } from "@/app/services/init-services.ts";
import { useAppStore } from "@/shared/stores/app-store.tsx";
import { initStores } from "@/shared/stores/init-stores.ts";
import { InitialLoading } from "@/shared/ui/initial-loading";
import { PwaRegister } from "@/app/providers/pwa-register";
import { migrate } from "@/db/migrate.ts";
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

  // Helper function to update progress
  const updateProgress = (progress: number) => {
    root.render(
      <StrictMode>
        <div className="bg-background-screen flex h-dvh items-center justify-center">
          <InitialLoading progress={progress} />
        </div>
      </StrictMode>,
    );
  };

  // Helper function to show error
  const showError = (errorMessage: string) => {
    root.render(
      <StrictMode>
        <div className="bg-background-screen flex h-dvh items-center justify-center">
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="text-red-500 text-xl font-semibold">
              Initialization Failed
            </div>
            <div className="text-gray-400 text-sm max-w-md text-center">
              {errorMessage}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </StrictMode>,
    );
  };

  try {
    // Start: 0%
    updateProgress(0);

    // Step 1: Migrate database (0% → 33%)
    await migrate();
    updateProgress(33);

    // Step 2: Init services (33% → 66%)
    await initServices();
    updateProgress(66);

    // Step 3: Init stores (66% → 100%)
    await initStores();
    updateProgress(100);

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
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred during initialization";
    showError(errorMessage);
  }
}
initializeApp();
