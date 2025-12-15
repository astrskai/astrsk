// import { useDefaultInitialized } from "@/shared/hooks/use-default-initialized";
import { useAppStore } from "@/shared/stores/app-store";
import { cn } from "@/shared/lib";
import { SvgIcon } from "@/shared/ui";
import { SquareArrowUpRight, X } from "lucide-react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { isElectronEnvironment } from "@/shared/lib/environment";
import { useLocation } from "@tanstack/react-router";

const NewWindowButton = () => {
  const handleNewWindow = useCallback(() => {
    window.api?.topBar?.newWindow?.();
  }, []);

  return (
    <button
      tabIndex={-1}
      type="button"
      className="electron-no-drag text-fg-subtle hover:text-text-primary group flex min-h-[26px] flex-row items-center gap-[8px] transition-colors"
      onClick={handleNewWindow}
    >
      <div className="relative h-5 w-5 overflow-hidden">
        <SquareArrowUpRight size={20} />
      </div>
      <span className="text-[16px] leading-[25.6px] font-[600]">
        New window
      </span>
    </button>
  );
};

export function TopBar() {
  // Detect Windows platform
  const isWindows = window.electron?.process?.platform === "win32";

  // Check loading
  const isLoadingScreen = useAppStore.use.isLoading();
  // defaultInitialized is now handled in main.tsx initStores()
  // const defaultInitialized = useDefaultInitialized();
  const isLoading = isLoadingScreen;

  // Electron window controls
  // Track maximized state for toggle icon
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check API availability
    if (!window.api?.topBar) {
      return;
    }

    // Handle top bar events
    window.api.topBar.onWindowMaximized(() => {
      setIsMaximized(true);
    });
    window.api.topBar.onWindowUnmaximized(() => {
      setIsMaximized(false);
    });

    // Cleanup event listeners on unmount
    return () => {
      // No need for cleanup as the listeners are automatically removed when the component unmounts
      // The electron IPC API doesn't provide a way to remove listeners directly
    };
  }, []);
  const handleMinimize = () => {
    window.api?.topBar?.windowMinimize();
  };
  const handleMaximizeRestore = async () => {
    if (isMaximized) {
      await window.api?.topBar?.windowUnmaximize();
      setIsMaximized(false);
    } else {
      await window.api?.topBar?.windowMaximize();
      setIsMaximized(true);
    }
  };
  const handleClose = () => {
    window.api?.topBar?.windowClose();
  };

  // Window title based on current route
  const location = useLocation();
  const pageTitle = useMemo(() => {
    const pathname = location.pathname;
    if (pathname.startsWith("/sessions")) return "Sessions";
    if (pathname.startsWith("/assets/characters")) return "Characters";
    if (pathname.startsWith("/assets/scenarios")) return "Scenarios";
    if (pathname.startsWith("/assets/workflows")) return "Workflows";
    if (pathname.startsWith("/settings")) return "Settings";
    if (pathname === "/") return "Home";
    return "astrsk";
  }, [location.pathname]);

  // Check if we're in Electron environment - hide topbar in web browsers
  if (!isElectronEnvironment()) {
    return null;
  }

  return (
    <div
      className={cn(
        "electron-drag-region",
        "bg-black-alternate z-30 min-h-[38px]",
        "relative flex flex-row items-center justify-center gap-2",
      )}
    >
      {isLoading ? (
        <>
          {/* Window title */}
          <div className="absolute inset-x-[160px] inset-y-[6px] flex flex-row items-center justify-center gap-[8px] text-[16px] leading-[20px] font-[500]">
            <span className="text-text-primary truncate">astrsk.ai</span>
          </div>

          {/* Windows: Window controls */}
          {isWindows && (
            <div
              className={cn(
                "electron-no-drag absolute inset-y-[7px] right-[10px]",
                "text-neutral-300 flex flex-row items-center gap-[30px]",
              )}
            >
              <button tabIndex={-1} onClick={handleMinimize}>
                <SvgIcon name="window_minimize" size={24} />
              </button>
              <button tabIndex={-1} onClick={handleMaximizeRestore}>
                <SvgIcon name="window_maximize" size={24} />
              </button>
              <button tabIndex={-1} onClick={handleClose}>
                <X size={24} />
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Windows: New window */}
          {isWindows && (
            <div className="absolute inset-y-[6px] left-[16px]">
              <NewWindowButton />
            </div>
          )}

          {/* Window title */}
          <div className="absolute inset-x-[160px] inset-y-[6px] flex flex-row items-center justify-center gap-[8px] text-[16px] leading-[20px] font-[500]">
            <span className="text-neutral-300">{pageTitle}</span>
          </div>

          {/* Windows: Window controls */}
          {isWindows && (
            <div
              className={cn(
                "electron-no-drag absolute inset-y-[7px] right-[10px]",
                "text-neutral-300 flex flex-row items-center gap-[30px]",
              )}
            >
              <button tabIndex={-1} onClick={handleMinimize}>
                <SvgIcon name="window_minimize" size={24} />
              </button>
              <button tabIndex={-1} onClick={handleMaximizeRestore}>
                <SvgIcon name="window_maximize" size={24} />
              </button>
              <button tabIndex={-1} onClick={handleClose}>
                <X size={24} />
              </button>
            </div>
          )}
          {/* macOS: New window */}
          {!isWindows && (
            <div className="absolute inset-y-[6px] right-[16px]">
              <NewWindowButton />
            </div>
          )}
        </>
      )}
    </div>
  );
}
