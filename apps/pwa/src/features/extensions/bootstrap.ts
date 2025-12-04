/**
 * Extension System Bootstrap
 *
 * Initializes and manages all extensions
 */

import { extensionRegistry } from "./core/extension-registry";
import { ExtensionHook, ExtensionEvent, HookContext } from "./core/types";
import { logger } from "@/shared/lib/logger";

/**
 * Initialize all extensions with auto-discovery
 * Automatically loads all extensions from apps/extensions/ folder
 *
 * Benefits:
 * - No need to modify bootstrap.ts when adding new extensions
 * - Works with Vite HMR (hot module replacement)
 * - Better developer experience
 */
export async function initializeExtensions(): Promise<void> {
  console.log("🔌 [Extensions] Initializing extension system");
  logger.info("[Extensions] Initializing extension system");

  try {
    // Auto-discover extensions using Vite's glob import
    // This automatically finds all index.ts files in apps/extensions/*/ folders
    // Path: apps/pwa/src/app/extensions/bootstrap.ts → ../../../../ → apps/
    const extensionModules = import.meta.glob("../../../../extensions/*/index.ts", {
      eager: false, // Lazy load for better performance
    });

    let loadedCount = 0;
    const errors: Array<{ name: string; error: any }> = [];

    // Load each extension
    for (const [path, importFn] of Object.entries(extensionModules)) {
      try {
        // Extract extension name from path (e.g., "../../../extensions/trigger-system/index.ts" -> "trigger-system")
        const extensionName = path.split("/").slice(-2, -1)[0];

        console.log(`🔌 [Extensions] Loading extension: ${extensionName}`);

        // Dynamically import the extension
        const module = (await importFn()) as any;

        // Find the extension class (assumes exported with "Extension" suffix)
        // e.g., TriggerSystemExtension, NpcExtension, etc.
        const ExtensionClass = Object.values(module).find(
          (exp: any) => exp?.prototype?.onLoad
        );

        if (!ExtensionClass) {
          console.warn(`⚠️ [Extensions] No extension class found in ${extensionName}`);
          continue;
        }

        // Instantiate and register
        const extension = new (ExtensionClass as any)();
        await extensionRegistry.register(extension);

        loadedCount++;
      } catch (error) {
        const extensionName = path.split("/").slice(-2, -1)[0];
        console.error(`❌ [Extensions] Failed to load ${extensionName}:`, error);
        errors.push({ name: extensionName, error });
      }
    }

    if (loadedCount > 0) {
      console.log(`✅ [Extensions] Loaded ${loadedCount} extension(s) successfully`);
      logger.info(`[Extensions] Loaded ${loadedCount} extension(s) successfully`);
    } else {
      console.log("ℹ️ [Extensions] No extensions found");
      logger.info("[Extensions] No extensions found");
    }

    if (errors.length > 0) {
      console.warn(`⚠️ [Extensions] ${errors.length} extension(s) failed to load`);
      logger.warn(`[Extensions] ${errors.length} extension(s) failed to load`, { errors });
    }
  } catch (error) {
    console.error("❌ [Extensions] Failed to initialize extension system", error);
    logger.error("[Extensions] Failed to initialize extension system", { error });
  }
}

/**
 * Trigger an extension hook
 * Use this to notify extensions of synchronous events
 */
export async function triggerExtensionHook(
  hook: ExtensionHook,
  context: HookContext,
): Promise<void> {
  await extensionRegistry.triggerHook(hook, context);
}

/**
 * Emit an extension event
 * Use this to notify extensions of asynchronous events
 */
export function emitExtensionEvent(
  event: ExtensionEvent,
  context: HookContext,
): void {
  extensionRegistry.emitEvent(event, context);
}

/**
 * Cleanup extensions
 * Call this when the app is shutting down
 */
export async function cleanupExtensions(): Promise<void> {
  logger.info("[Extensions] Cleaning up extensions");

  const extensions = extensionRegistry.getExtensions();
  for (const extension of extensions) {
    await extensionRegistry.unregister(extension.metadata.id);
  }

  logger.info("[Extensions] All extensions cleaned up");
}

/**
 * Block UI for a specific turn (placeholder)
 * TODO: Implement UI blocking mechanism for turn operations
 */
export function blockUIForTurn(
  turnId: string,
  extensionName: string,
  reason: string
): void {
  // Placeholder - implement UI blocking logic
  console.log(
    `[Extensions] Blocking UI for turn: ${turnId} (${extensionName}: ${reason})`
  );
}

/**
 * Unblock UI (placeholder)
 * TODO: Implement UI unblocking mechanism
 */
export function unblockUI(): void {
  // Placeholder - implement UI unblocking logic
  console.log(`[Extensions] Unblocking UI`);
}
