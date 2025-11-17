import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { queryClient } from "@/shared/api/query-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { initializeEnvironment } from "@/shared/lib/environment";
import { runMigrations } from "@/db/migrations";

import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Initialize environment detection once at app startup
initializeEnvironment();

// Run data migrations (idempotent - safe to run on every startup)
runMigrations();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
