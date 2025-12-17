import { CheckCircle2, Loader2, XCircle, AlertTriangle, Copy, Check, RotateCcw, Trash2 } from "lucide-react";
import {
  useInitializationStore,
  type InitializationStep,
  STEP_GROUPS,
} from "@/shared/stores/initialization-store";
import { SvgIcon } from "@/shared/ui";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useState, useEffect } from "react";
import {
  getLastMigrationError,
  type MigrationErrorDetails,
} from "@/db/migrations";

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

  // Migration error details
  const [migrationError, setMigrationError] = useState<MigrationErrorDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    // Check storage quota and incognito mode when error occurs
    if (hasError && isStorageError) {
      checkStorageQuota();
    }
  }, [hasError, isStorageError]);

  useEffect(() => {
    // Get migration error details when error occurs
    if (hasError) {
      const error = getLastMigrationError();
      setMigrationError(error);
    }
  }, [hasError]);

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

  // Copy error details to clipboard
  const copyErrorDetails = async () => {
    if (migrationError) {
      const details = [
        `=== Migration Error Details ===`,
        `Type: ${migrationError.migrationType.toUpperCase()} Migration`,
        `File: ${migrationError.migrationFilename}`,
        migrationError.migrationHash ? `Hash: ${migrationError.migrationHash}` : null,
        `Timestamp: ${migrationError.timestamp}`,
        ``,
        `Error: ${migrationError.errorMessage}`,
        ``,
        migrationError.failedQuery ? `Failed Query:\n${migrationError.failedQuery}` : null,
        ``,
        migrationError.errorStack ? `Stack Trace:\n${migrationError.errorStack}` : null,
      ].filter(Boolean).join('\n');

      await navigator.clipboard.writeText(details);
    } else {
      const problemDetails = problemSteps
        .map((s: InitializationStep) => `${s.label}: ${s.error}`)
        .join("\n");
      await navigator.clipboard.writeText(problemDetails);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset database completely
  const handleResetDatabase = async () => {
    if (!confirm('This will delete all local data. Are you sure you want to continue?')) {
      return;
    }

    setIsResetting(true);
    try {
      // Clear localStorage first (fast, no async issues)
      localStorage.clear();

      // Clear caches
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
      }

      // Clear IndexedDB databases with timeout
      // Note: deleteDatabase can block if connections are open (e.g., PGlite)
      // We use a timeout and force reload regardless
      if ('databases' in indexedDB) {
        const dbs = await indexedDB.databases();
        const deletePromises = dbs.map(db =>
          new Promise<void>(resolve => {
            if (db.name) {
              const req = indexedDB.deleteDatabase(db.name);
              req.onsuccess = () => resolve();
              req.onerror = () => resolve();
              req.onblocked = () => {
                console.warn(`IndexedDB ${db.name} is blocked, will be deleted on reload`);
                resolve(); // Don't wait, reload will clear it
              };
            } else {
              resolve();
            }
          })
        );

        // Wait max 2 seconds for DB deletion, then reload anyway
        await Promise.race([
          Promise.all(deletePromises),
          new Promise(resolve => setTimeout(resolve, 2000)),
        ]);
      }

      window.location.reload();
    } catch (error) {
      console.error('Failed to reset database:', error);
      // Force reload even on error - the reload will clear blocked connections
      window.location.reload();
    }
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
            <div className="bg-canvas h-2 w-full overflow-hidden rounded-full">
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

        {/* Migration Error Details */}
        {hasError && migrationError && (
          <div className="w-full space-y-3">
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-red-300 text-sm font-medium mb-2">
                    Database Migration Failed
                  </p>

                  {/* Error Summary */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex gap-2">
                      <span className="text-red-400/70 flex-shrink-0">Type:</span>
                      <span className="text-red-200">{migrationError.migrationType.toUpperCase()}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-red-400/70 flex-shrink-0">File:</span>
                      <span className="text-red-200 font-mono break-all">{migrationError.migrationFilename}</span>
                    </div>
                    {migrationError.migrationHash && (
                      <div className="flex gap-2">
                        <span className="text-red-400/70 flex-shrink-0">Hash:</span>
                        <span className="text-red-200 font-mono">{migrationError.migrationHash}</span>
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  <div className="mt-3 rounded bg-red-900/30 px-3 py-2">
                    <p className="text-red-200 text-xs font-mono break-all">
                      {migrationError.errorMessage}
                    </p>
                  </div>

                  {/* Failed Query (if SQL) */}
                  {migrationError.failedQuery && (
                    <div className="mt-2">
                      <p className="text-red-400/70 text-xs mb-1">Failed Query:</p>
                      <div className="rounded bg-gray-900/50 px-3 py-2 max-h-32 overflow-auto">
                        <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap break-all">
                          {migrationError.failedQuery}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error/Warning Actions */}
        {(hasError || hasWarning) && (
          <div className="w-full space-y-3">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {/* Retry Button */}
              <button
                onClick={() => window.location.reload()}
                disabled={isResetting}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Retry
              </button>

              {/* Copy Details Button */}
              <button
                onClick={copyErrorDetails}
                className="flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Details'}
              </button>

              {/* Reset Database Button */}
              <button
                onClick={handleResetDatabase}
                disabled={isResetting}
                className="flex items-center gap-2 rounded-lg border border-red-600/50 bg-red-900/20 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-900/40 disabled:opacity-50"
                title="Delete all local data and start fresh"
              >
                {isResetting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Reset Database
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
