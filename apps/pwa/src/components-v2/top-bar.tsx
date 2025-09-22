import { useDefaultInitialized } from "@/app/hooks/use-default-initialized";
import { useAgentStore } from "@/app/stores/agent-store";
import { Page, useAppStore } from "@/app/stores/app-store";
import { useCardsStore } from "@/app/stores/cards-store";
import { useSessionStore } from "@/app/stores/session-store";
import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components-v2/svg-icon";
import { ButtonPill } from "@/components-v2/ui/button-pill";
import { Code, SquareArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { isElectronEnvironment } from "@/utils/environment";

const NewWindowButton = () => {
  const handleNewWindow = useCallback(() => {
    window.api?.topBar?.newWindow?.();
  }, []);

  return (
    <button
      tabIndex={-1}
      type="button"
      className="electron-no-drag min-h-[26px] flex flex-row gap-[8px] items-center text-text-subtle hover:text-text-primary transition-colors group"
      onClick={handleNewWindow}
    >
      <div className="w-5 h-5 relative overflow-hidden">
        <SquareArrowUpRight size={20} />
      </div>
      <span className="font-[600] text-[16px] leading-[25.6px]">
        New window
      </span>
    </button>
  );
};

export function TopBar() {
  // Check if we're in Electron environment - hide topbar in web browsers
  if (!isElectronEnvironment()) {
    return null;
  }

  // Detect Windows platform
  const isWindows = window.electron?.process?.platform === "win32";

  // Check loading
  const isLoadingScreen = useAppStore.use.isLoading();
  const defaultInitialized = useDefaultInitialized();
  const isLoading = isLoadingScreen || !defaultInitialized;

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

  // Window title
  const { activeMenu, activePage } = useAppStore();

  return (
    <div
      className={cn(
        "electron-drag-region",
        "z-30 min-h-[38px] bg-background-surface-2",
        "flex flex-row items-center justify-center gap-2 relative",
      )}
    >
      {isLoading ? (
        <>
          {/* Window title */}
          <div className="absolute inset-x-[160px] inset-y-[6px] flex flex-row justify-center items-center gap-[8px] font-[500] text-[16px] leading-[20px]">
            <span className="text-text-primary truncate">astrsk.ai</span>
          </div>

          {/* Windows: Window controls */}
          {isWindows && (
            <div
              className={cn(
                "electron-no-drag absolute right-[10px] inset-y-[7px]",
                "flex flex-row gap-[30px] items-center text-text-body",
              )}
            >
              <button tabIndex={-1} onClick={handleMinimize}>
                <SvgIcon name="window_minimize" size={24} />
              </button>
              <button tabIndex={-1} onClick={handleMaximizeRestore}>
                <SvgIcon name="window_maximize" size={24} />
              </button>
              <button tabIndex={-1} onClick={handleClose}>
                <SvgIcon name="window_close" size={24} />
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Windows: New window */}
          {isWindows && (
            <div className="absolute left-[16px] inset-y-[6px]">
              <NewWindowButton />
            </div>
          )}

          {/* Window title */}
          <div className="absolute inset-x-[160px] inset-y-[6px] flex flex-row justify-center items-center gap-[8px] font-[500] text-[16px] leading-[20px]">
            <span className="text-text-body">{activeMenu}</span>
          </div>

          {/* Windows: Window controls */}
          {isWindows && (
            <div
              className={cn(
                "electron-no-drag absolute right-[10px] inset-y-[7px]",
                "flex flex-row gap-[30px] items-center text-text-body",
              )}
            >
              <button tabIndex={-1} onClick={handleMinimize}>
                <SvgIcon name="window_minimize" size={24} />
              </button>
              <button tabIndex={-1} onClick={handleMaximizeRestore}>
                <SvgIcon name="window_maximize" size={24} />
              </button>
              <button tabIndex={-1} onClick={handleClose}>
                <SvgIcon name="window_close" size={24} />
              </button>
            </div>
          )}
          {/* macOS: New window */}
          {!isWindows && (
            <div className="absolute right-[16px] inset-y-[6px]">
              <NewWindowButton />
            </div>
          )}
        </>
      )}
    </div>
  );
}
