import { useAppStore } from "@/shared/stores/app-store";
import {
  TypoTiny,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui";
import { cn } from "@/shared/lib";
import { logger } from "@/shared/lib/logger";
import { Import } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface UpdaterNewProps {
  variant?: "default" | "indicator";
}

const UpdaterNew = ({ variant = "default" }: UpdaterNewProps) => {
  // Electron updater
  const [isUpdateReadyElectron, setIsUpdateReadyElectron] = useState(false);
  const isDownloading = useRef<boolean>(false);
  const [downloadProgressPercent, setDownloadProgressPercent] =
    useState<number>(0);
  useEffect(() => {
    // Check updater is available
    if (!window.api || !window.api.updater) {
      return;
    }

    // Handle updater events
    window.api.updater.onError((error, message) => {
      logger.error("Updater error:", error, message);
    });
    window.api.updater.onUpdateAvailable(() => {
      logger.info("New update available");
      if (!isDownloading.current) {
        logger.info("Starting automatic download of update");
        window.api?.updater?.downloadUpdate();
      }
    });
    window.api.updater.onDownloadProgress((info) => {
      logger.info(`Download progress: ${info.percent}%`);
      setDownloadProgressPercent(Math.round(info.percent));
      isDownloading.current = true;
    });
    window.api.updater.onUpdateDownloaded(() => {
      logger.info("Update downloaded");
      setIsUpdateReadyElectron(true);
    });

    // Clean up listeners on component unmount
    return () => {
      // No need for cleanup as the listeners are automatically removed when the component unmounts
      // The electron IPC API doesn't provide a way to remove listeners directly
    };
  }, []);

  // Restart and apply update
  const updateServiceWorker = useAppStore.use.updateServiceWorker();
  const restartApp = useCallback(async () => {
    // Clear session initialization flag to force full re-initialization after update
    // This ensures new migrations run after app updates
    sessionStorage.removeItem("astrsk-session-initialized");
    await updateServiceWorker?.();
    await window.api?.updater?.quitAndInstall();
  }, [updateServiceWorker]);

  // Get update readiness
  const isUpdateReadyPWA = useAppStore.use.isUpdateReadyPWA;
  const isUpdateReady = isUpdateReadyElectron && isUpdateReadyPWA;

  const hasUpdate = isDownloading.current || isUpdateReady;

  if (!hasUpdate) return null;

  // Indicator variant: small pulsing dot for collapsed sidebar
  if (variant === "indicator") {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                if (isUpdateReady) {
                  restartApp();
                }
              }}
              className="relative flex items-center justify-center"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            variant="button"
            sideOffset={8}
            className="z-[100]"
          >
            <TypoTiny className="p-0 leading-tight">
              {isUpdateReady
                ? "Restart to update!"
                : `Downloading... ${downloadProgressPercent}%`}
            </TypoTiny>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default variant: icon with animation
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => {
              if (isUpdateReady) {
                restartApp();
              }
            }}
            className="relative flex items-center justify-center text-zinc-400 transition-colors hover:text-white"
          >
            <Import
              size={20}
              className={cn(
                isUpdateReady && "animate-bounce text-blue-400",
                !isUpdateReady && "animate-pulse",
              )}
            />
            {isUpdateReady && (
              <span className="absolute -top-0.5 -right-0.5 flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          variant="button"
          sideOffset={14}
          className="z-[100]"
        >
          <div className="flex flex-col px-2 py-2">
            {isUpdateReady ? (
              <TypoTiny className="p-0 leading-tight">
                Restart to update!
              </TypoTiny>
            ) : (
              <TypoTiny className="p-0 leading-tight">
                Downloading update... {downloadProgressPercent}%
              </TypoTiny>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export { UpdaterNew };
