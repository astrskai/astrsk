import { initServices } from "@/app/services/init-services";
import { initStores } from "@/shared/stores/init-stores";
import { useInitializationStore, loadInitializationLog } from "@/shared/stores/initialization-store";
import { runUnifiedMigrations, hasPendingMigrations } from "@/db/migrations";
import { logger } from "@/shared/lib/logger";

/**
 * Run the full initialization process
 * This function is designed to be called from React components (e.g., in useEffect)
 * Returns a promise that resolves when initialization is complete
 */
export async function runInitialization(): Promise<{ success: boolean; error?: Error }> {
  const startTime = performance.now();

  const { startStep, completeStep, warnStep, failStep, saveLog, setShowProgressScreen } =
    useInitializationStore.getState();

  // Check previous initialization log
  const previousLog = loadInitializationLog();
  const isFirstInstall = !previousLog;

  // Progress callback
  const onProgress = (
    stepId: string,
    status: "start" | "success" | "warning" | "error",
    error?: string,
  ) => {
    if (status === "start") {
      startStep(stepId);
    } else if (status === "success") {
      completeStep(stepId);
    } else if (status === "warning") {
      warnStep(stepId, error || "Unknown warning");
    } else if (status === "error") {
      failStep(stepId, error || "Unknown error");
    }
  };

  let needsMigration = false;

  try {
    // Wait for render to stabilize before initializing DB
    // This helps iOS Safari stabilize storage context after redirects
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 100)));

    // Request persistent storage to reduce eviction risk on iOS
    try {
      const persisted = await navigator.storage?.persist?.();
      logger.debug(`Storage persistence: ${persisted ? "granted" : "denied or unavailable"}`);
    } catch {
      logger.debug("Storage persistence API not available");
    }

    // Step 1: Initialize database engine (PGlite)
    onProgress("database-engine", "start");

    const dbCheckStart = performance.now();
    needsMigration = await hasPendingMigrations();
    const dbCheckDuration = performance.now() - dbCheckStart;

    logger.debug(`⏱️ DB initialization took ${Math.round(dbCheckDuration)}ms`);
    onProgress("database-engine", "success");

    // App update with new migrations: upgrade to progress screen
    if (needsMigration && !isFirstInstall) {
      setShowProgressScreen(true);
    }

    logger.debug(`🔍 Pending migrations: ${needsMigration}`);

    // Step 2: Migrate database (only if there are pending migrations)
    if (needsMigration) {
      logger.debug("🔨 Running database migrations...");
      await runUnifiedMigrations(onProgress);
    } else {
      logger.debug("⏭️ No pending migrations, skipping migration steps");
      // Mark migration steps as success immediately
      onProgress("database-init", "start");
      onProgress("database-init", "success");
      onProgress("migration-schema", "start");
      onProgress("migration-schema", "success");
      onProgress("check-migrations", "start");
      onProgress("check-migrations", "success");
      onProgress("run-migrations", "start");
      onProgress("run-migrations", "success");
    }

    // Step 3: Init services
    logger.debug("🔧 Initializing services...");
    await initServices(onProgress);

    // Step 4: Init stores
    logger.debug("📦 Initializing stores...");
    await initStores(onProgress);

    // Calculate initialization time
    const initTime = performance.now() - startTime;
    logger.debug(`✅ Initialization completed in ${Math.round(initTime)}ms`);

    // Save initialization log on first install or when migrations were executed
    if (isFirstInstall || needsMigration) {
      saveLog(Math.round(initTime));
    }

    // Navigate to home on first install (before router initializes)
    if (isFirstInstall && window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }

    return { success: true };
  } catch (error) {
    logger.error("Failed to initialize app:", error);

    // On failure, persist the current step states as a log
    if (isFirstInstall || needsMigration) {
      const initTime = performance.now() - startTime;
      saveLog(Math.round(initTime));
    }

    // Show progress screen with error state
    setShowProgressScreen(true);

    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}
