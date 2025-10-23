import { initServices } from "@/app/services/init-services.ts";
import { useAppStore } from "@/app/stores/app-store.tsx";
import { initStores } from "@/app/stores/init-stores.ts";
import { Loading } from "@/components/ui/loading.tsx";
import { PwaRegister } from "@/components/system/pwa-register.tsx";
import { migrate } from "@/db/migrate.ts";
import { logger } from "@/shared/lib/logger.ts";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { Buffer } from "buffer";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { enableMapSet } from "immer";
import { StrictMode, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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

  // Render loading
  root.render(
    <StrictMode>
      <div className="bg-background-screen flex h-dvh items-center justify-center">
        <Loading />
      </div>
    </StrictMode>,
  );

  // Migrate database
  await migrate();

  // Init services
  await initServices();

  // Init stores
  await initStores();

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
}
initializeApp();
