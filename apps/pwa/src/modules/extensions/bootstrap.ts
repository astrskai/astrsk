/**
 * Extension System Bootstrap
 *
 * Initializes and manages all extensions
 */

import { extensionRegistry } from "./core/extension-registry";
import { logger } from "@/shared/utils/logger";
import {  ExtensionHook, ExtensionEvent, HookContext } from "./core/types";

/**
 * Initialize all extensions
 * Call this when the app starts
 */
export async function initializeExtensions(): Promise<void> {
  console.log("🔌 [Extensions] Initializing extension system");
  logger.info("[Extensions] Initializing extension system");

  try {
    // Dynamically import and register NPC plugin
    // Extensions are physically separated during development but bundled in production
    // Security is enforced through the extension client API
    // @ts-expect-error - Extensions types are not available to pwa TypeScript
    const { NpcPlugin } = await import("@extensions/npc/npc-plugin");
    const npcPlugin = new NpcPlugin();
    await extensionRegistry.register(npcPlugin);

    console.log("✅ [Extensions] All extensions loaded successfully");
    logger.info("[Extensions] All extensions loaded successfully");
  } catch (error) {
    console.error("❌ [Extensions] Failed to initialize extensions", error);
    logger.error("[Extensions] Failed to initialize extensions", { error });
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
