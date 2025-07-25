import { invalidateByLiveQuery } from "@/app/queries/query-client.ts";
import { initServices } from "@/app/services/init-services.ts";
import { initStores } from "@/app/stores/init-stores.ts";
import { Loading } from "@/components-v2/loading.tsx";
import { migrate } from "@/db/migrate.ts";
import { Pglite } from "@/db/pglite.ts";
import { PGliteProvider } from "@electric-sql/pglite-react";
import { PGliteWithLive } from "@electric-sql/pglite/live";
import { Buffer } from "buffer";
import { enableMapSet } from "immer";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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

  // Invalidate by live query
  await invalidateByLiveQuery();

  // Init services
  await initServices();

  // Init stores
  await initStores();

  // Render app
  const db = (await Pglite.getInstance()) as PGliteWithLive;
  root.render(
    <StrictMode>
      <PGliteProvider db={db}>
        <App />
      </PGliteProvider>
    </StrictMode>,
  );
}
initializeApp();
