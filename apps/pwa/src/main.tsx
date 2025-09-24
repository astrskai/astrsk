import { initServices } from "@/app/services/init-services.ts";
import { initStores } from "@/app/stores/init-stores.ts";
import { JwtUpdater } from "@/components-v2/convex/jwt-updater.tsx";
import { Loading } from "@/components-v2/loading.tsx";
import { migrate } from "@/db/migrate.ts";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { Buffer } from "buffer";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { enableMapSet } from "immer";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Load Supermemory test functions in development
if (import.meta.env.DEV) {
  import("@/modules/supermemory/expose-test");
}

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

// Init app
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
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <App />
            <JwtUpdater />
          </ConvexProviderWithClerk>
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
