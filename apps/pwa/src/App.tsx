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
function InitSpinner() {
  const isAppInitialized = useAppStore.use.isAppInitialized();
  const isOfflineReady = useAppStore.use.isOfflineReady();
  const steps = useInitializationStore((state) => state.steps);
  const currentStep = steps.find((s) => s.status === "running");
  const completedCount = steps.filter((s) => s.status === "success").length;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-black/50">
      <div className="bg-canvas flex items-center gap-3 rounded-full px-5 py-3 shadow-lg">
        <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
        <span className="text-text-secondary text-sm">Initializing...</span>
      </div>
      {/* Debug info - shows current initialization step and state */}
      <div className="bg-canvas rounded-lg px-4 py-2 text-xs font-mono opacity-70 text-center space-y-1">
        <div>isAppInitialized: {String(isAppInitialized)}</div>
        <div>isOfflineReady: {String(isOfflineReady)}</div>
        <div>Step: {currentStep?.label || "Starting..."}</div>
        <div>Progress: {completedCount}/{steps.length}</div>
        <div>Path: {window.location.pathname}</div>
      </div>
    </div>
  );
}

function App() {
  const isAppInitialized = useAppStore.use.isAppInitialized();
  const showProgressScreen = useInitializationStore.use.showProgressScreen();
  // Efficient selector: only re-renders when hasError boolean changes, not on every step update
  const hasError = useInitializationStore(
    (state) => state.steps.some((step) => step.status === "error"),
  );

  // Skip initialization UI for OAuth callback - it handles its own loading state
  const isAuthCallback = window.location.pathname === "/auth/callback";

  // Show initialization UI while app is not ready
  // Note: isAppInitialized is separate from isOfflineReady (PWA service worker state)
  if (!isAppInitialized && !isAuthCallback) {
    // Show detailed progress screen for first install, migrations, or errors
    if (showProgressScreen || hasError) {
      return <InitializationScreen />;
    }
    // Show simple spinner for normal loads
    return <InitSpinner />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
