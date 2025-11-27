import { CheckCircle2, Loader2, XCircle, AlertTriangle } from "lucide-react";
import {
  useInitializationStore,
  type InitializationStep,
  STEP_GROUPS,
} from "@/shared/stores/initialization-store";
import { SvgIcon } from "@/shared/ui";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useState, useEffect } from "react";

export const InitializationScreen = () => {
  const steps = useInitializationStore.use.steps();
  const isInitialized = useInitializationStore.use.isInitialized();
  const isMobile = useIsMobile();

  const hasError = steps.some((step: InitializationStep) => step.status === "error");
  const hasWarning = steps.some((step: InitializationStep) => step.status === "warning");
  const completedCount = steps.filter(
    (step: InitializationStep) => step.status === "success",
  ).length;
  const totalCount = steps.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Find error and warning steps
  const errorSteps = steps.filter((step) => step.status === "error");
  const warningSteps = steps.filter((step) => step.status === "warning");
  const problemSteps = [...errorSteps, ...warningSteps];

  // Check if error is storage-related
  const isStorageError = errorSteps.some(s =>
    s.error?.includes('transient reason') ||
    s.error?.includes('quota') ||
    s.error?.includes('out of memory') ||
    s.error?.includes('storage')
  );

  // Storage quota information
  const [storageInfo, setStorageInfo] = useState<{
    quota: number;
    usage: number;
    isLowStorage: boolean;
    isIncognito: boolean;
  } | null>(null);

  useEffect(() => {
    // Check storage quota and incognito mode when error occurs
    if (hasError && isStorageError) {
      checkStorageQuota();
    }
  }, [hasError, isStorageError]);

  const checkStorageQuota = async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const quota = estimate.quota || 0;
        const usage = estimate.usage || 0;

        // Incognito mode typically has very low quota (<50MB)
        const isIncognito = quota < 50 * 1024 * 1024;

        // Low storage if using >80% of quota
        const isLowStorage = quota > 0 && (usage / quota) > 0.8;

        setStorageInfo({
          quota,
          usage,
          isLowStorage,
          isIncognito,
        });
      }
    } catch (error) {
      console.error('Failed to check storage quota:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Calculate group status
  const getGroupStatus = (groupId: string) => {
    const group = STEP_GROUPS.find((g) => g.id === groupId);
    if (!group) return "pending";

    const groupSteps = steps.filter((step) => group.stepIds.includes(step.id));
    if (groupSteps.some((s) => s.status === "error")) return "error";
    if (groupSteps.some((s) => s.status === "warning")) return "warning";
    if (groupSteps.some((s) => s.status === "running")) return "running";
    if (groupSteps.every((s) => s.status === "success")) return "success";
    return "pending";
  };

  return (
    <div className="bg-background-screen flex min-h-dvh items-center justify-center">
      <div className="flex w-full max-w-2xl flex-col items-center gap-8 px-6">
        {/* Logo */}
        <div
          className={`${hasError ? "" : "animate-spin-slow"}`}
          style={{
            width: isMobile ? "80px" : "100px",
            height: isMobile ? "80px" : "100px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SvgIcon name="astrsk_symbol" size={isMobile ? 80 : 100} />
        </div>

        {/* Title */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-text-primary text-center text-2xl font-semibold md:text-3xl">
            {hasError
              ? "Initialization Failed"
              : isInitialized
                ? "Ready to Go!"
                : "Initializing Application"}
          </h1>
          <p className="text-text-secondary text-center text-sm md:text-base">
            {hasError
              ? "One or more initialization steps failed. Please check the details below."
              : isInitialized
                ? "All systems ready. Launching app..."
                : "Setting up your local database and services"}
          </p>
        </div>

        {/* Progress Bar */}
        {!hasError && !isInitialized && (
          <div className="w-full">
            <div className="bg-background-surface-0 h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-text-secondary mt-2 text-center text-xs">
              {completedCount} / {totalCount} steps completed
            </p>
          </div>
        )}

        {/* Steps Display - Conditional based on error/warning state */}
        {hasError || hasWarning ? (
          // ERROR/WARNING: Show detailed problem steps
          <div className="w-full space-y-2">
            {problemSteps.map((step: InitializationStep) => {
              const stepIndex = steps.findIndex((s) => s.id === step.id);
              const Icon = step.status === "warning" ? AlertTriangle : XCircle;
              const borderColor = step.status === "warning" ? "border-yellow-500/50" : "border-red-500/50";
              const bgColor = step.status === "warning" ? "bg-yellow-500/10" : "bg-red-500/10";
              const iconColor = step.status === "warning" ? "text-yellow-500" : "text-red-500";
              const textColor = step.status === "warning" ? "text-yellow-400" : "text-red-400";
              const errorBgColor = step.status === "warning" ? "bg-yellow-900/20" : "bg-red-900/20";
              const errorTextColor = step.status === "warning" ? "text-yellow-300" : "text-red-300";

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 rounded-lg border ${borderColor} ${bgColor} px-4 py-3`}
                >
                  <div className="mt-0.5">
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-text-secondary text-xs font-medium">
                          {String(stepIndex + 1).padStart(2, "0")}
                        </span>
                        <span className={`text-sm font-medium ${textColor}`}>
                          {step.label}
                        </span>
                      </div>

                      {step.startedAt && step.completedAt && (
                        <span className="text-text-secondary text-xs">
                          {Math.round(
                            (step.completedAt.getTime() - step.startedAt.getTime()) / 1000,
                          )}
                          s
                        </span>
                      )}
                    </div>

                    {step.error && (
                      <div className={`mt-2 rounded ${errorBgColor} px-3 py-2`}>
                        <p className={`text-xs ${errorTextColor}`}>{step.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // NORMAL: Show grouped progress
          <div className="w-full space-y-3">
            {STEP_GROUPS.map((group) => {
              const status = getGroupStatus(group.id);
              const Icon =
                status === "success"
                  ? CheckCircle2
                  : status === "running"
                    ? Loader2
                    : status === "warning"
                      ? AlertTriangle
                      : XCircle;

              const iconColor =
                status === "success"
                  ? "text-green-500"
                  : status === "running"
                    ? "text-blue-500"
                    : status === "warning"
                      ? "text-yellow-500"
                      : "text-gray-600";

              const bgColor =
                status === "running"
                  ? "border-blue-500/50 bg-blue-500/10"
                  : status === "success"
                    ? "border-green-500/30 bg-green-500/5"
                    : status === "warning"
                      ? "border-yellow-500/30 bg-yellow-500/5"
                      : "border-gray-700 bg-gray-800/50";

              const textColor =
                status === "running"
                  ? "text-blue-400"
                  : status === "success"
                    ? "text-green-400"
                    : status === "warning"
                      ? "text-yellow-400"
                      : "text-gray-400";

              return (
                <div
                  key={group.id}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${bgColor}`}
                >
                  <Icon
                    className={`h-5 w-5 ${iconColor} ${
                      status === "running" ? "animate-spin" : ""
                    }`}
                  />
                  <span className={`text-sm font-medium ${textColor}`}>
                    {group.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Storage Warning */}
        {hasError && isStorageError && storageInfo && (
          <div className="w-full space-y-3">
            {/* Incognito Mode Warning */}
            {storageInfo.isIncognito && (
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-4 py-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-yellow-300 text-sm font-medium mb-1">
                      Limited Storage Detected
                    </p>
                    <p className="text-yellow-200/80 text-xs">
                      This app requires IndexedDB storage. You appear to be in Incognito/Private mode
                      (available: {formatBytes(storageInfo.quota)}), which has limited storage capacity.
                      Please open this page in a normal browser window for the best experience.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Low Storage Warning (Normal Mode) */}
            {!storageInfo.isIncognito && storageInfo.isLowStorage && (
              <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 px-4 py-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-orange-300 text-sm font-medium mb-1">
                      Low Storage Space
                    </p>
                    <p className="text-orange-200/80 text-xs">
                      Your device is running low on storage
                      ({formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)} used).
                      Please free up some space and try again.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error/Warning Actions */}
        {(hasError || hasWarning) && (
          <div className="flex gap-3">
            <button
              onClick={async () => {
                if (isStorageError && storageInfo?.isIncognito) {
                  // Incognito mode: Clear all storage and try hard reload
                  try {
                    // Clear caches
                    if ('caches' in window) {
                      const names = await caches.keys();
                      await Promise.all(names.map(name => caches.delete(name)));
                    }

                    // Clear IndexedDB databases
                    if ('databases' in indexedDB) {
                      const dbs = await indexedDB.databases();
                      await Promise.all(dbs.map(db =>
                        new Promise<void>(resolve => {
                          if (db.name) {
                            const req = indexedDB.deleteDatabase(db.name);
                            req.onsuccess = () => resolve();
                            req.onerror = () => resolve();
                          } else {
                            resolve();
                          }
                        })
                      ));
                    }

                    // Clear localStorage
                    localStorage.clear();

                    // Hard reload with cache bypass
                    window.location.reload();
                  } catch (err) {
                    console.error('Failed to clear storage:', err);
                    // Fallback to normal reload
                    window.location.reload();
                  }
                } else {
                  // Normal error: simple reload
                  window.location.reload();
                }
              }}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              {isStorageError && storageInfo?.isIncognito
                ? 'Clear Storage & Retry'
                : 'Retry Initialization'}
            </button>
            <button
              onClick={() => {
                const problemDetails = problemSteps
                  .map((s: InitializationStep) => `${s.label}: ${s.error}`)
                  .join("\n");
                navigator.clipboard.writeText(problemDetails);
              }}
              className="rounded-lg border border-gray-600 bg-gray-800 px-6 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700"
            >
              Copy Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
