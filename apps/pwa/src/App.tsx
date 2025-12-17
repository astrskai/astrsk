import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { queryClient } from "@/shared/api/query-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { initializeEnvironment } from "@/shared/lib/environment";
import { useAppStore } from "@/shared/stores/app-store";
import { useInitializationStore } from "@/shared/stores/initialization-store";
import { InitializationScreen } from "@/shared/ui/initialization-screen";

import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree, basepath: "/" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Initialize environment detection once at app startup
initializeEnvironment();

/**
 * Simple loading spinner shown during initialization
 * when progress screen is not needed (subsequent loads without migrations)
 */
function InitSpinner({ isOfflineReady, isAuthCallback }: { isOfflineReady: boolean; isAuthCallback: boolean }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-black/50">
      <div className="bg-canvas flex items-center gap-3 rounded-full px-5 py-3 shadow-lg">
        <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
        <span className="text-text-secondary text-sm">Initializing...</span>
      </div>
      {/* Debug info */}
      <div className="bg-canvas rounded-lg px-4 py-2 text-xs font-mono opacity-70">
        <div>isOfflineReady: {String(isOfflineReady)}</div>
        <div>isAuthCallback: {String(isAuthCallback)}</div>
        <div>pathname: {window.location.pathname}</div>
      </div>
    </div>
  );
}

function App() {
  const isOfflineReady = useAppStore.use.isOfflineReady();
  const showProgressScreen = useInitializationStore.use.showProgressScreen();
  // Efficient selector: only re-renders when hasError boolean changes, not on every step update
  const hasError = useInitializationStore(
    (state) => state.steps.some((step) => step.status === "error"),
  );

  // Skip initialization UI for OAuth callback - it handles its own loading state
  const isAuthCallback = window.location.pathname === "/auth/callback";

  // Show initialization UI while app is not ready
  if (!isOfflineReady && !isAuthCallback) {
    // Show detailed progress screen for first install, migrations, or errors
    if (showProgressScreen || hasError) {
      return <InitializationScreen />;
    }
    // Show simple spinner for normal loads
    return <InitSpinner isOfflineReady={isOfflineReady} isAuthCallback={isAuthCallback} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
