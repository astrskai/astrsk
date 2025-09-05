import { initServices } from "@/app/services/init-services.ts";
import { initStores } from "@/app/stores/init-stores.ts";
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

// Convex
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Enable Map/Set support in Immer before anything else
enableMapSet();

// Buffer polyfill
if (!window.Buffer) {
  window.Buffer = Buffer;
}

async function initializeApp() {
  // Create root
  const root = createRoot(document.getElementById("root")!);

  // Render loading
  root.render(
    <StrictMode>
      <div className="flex items-center justify-center h-dvh bg-background-screen">
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
  root.render(
    <StrictMode>
      <ClerkProvider
        publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      >
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <App />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </StrictMode>,
  );
}
initializeApp();
