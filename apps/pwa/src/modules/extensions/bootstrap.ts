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
    // Dynamically import and register NPC extension
    // Extensions are physically separated during development but bundled in production
    // Security is enforced through the extension client API
    const { NpcExtension } = await import("@extensions/npc/npc-extension");
    const npcExtension = new NpcExtension();
    await extensionRegistry.register(npcExtension);

    // Dynamically import and register Lorebook extension
    // Runs async alongside NPC extraction
    const { LorebookExtension } = await import("@extensions/lorebook/lorebook-extension");
    const lorebookExtension = new LorebookExtension();
    await extensionRegistry.register(lorebookExtension);

    // Dynamically import and register Supermemory extension
    // Manages semantic memory storage and retrieval for roleplay sessions
    const { SupermemoryExtension } = await import("@extensions/supermemory/supermemory-extension");
    const supermemoryExtension = new SupermemoryExtension();
    await extensionRegistry.register(supermemoryExtension);

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

// Global callback for UI blocking - set by SessionMessagesAndUserInputs component
let blockUICallback: ((turnId: string | null, agentName?: string, modelName?: string) => void) | null = null;

/**
 * Register UI blocking callback from SessionMessagesAndUserInputs
 * This allows extensions to control the streamingMessageId state
 */
export function registerUIBlockingCallback(callback: (turnId: string | null, agentName?: string, modelName?: string) => void): void {
  blockUICallback = callback;
}

/**
 * Block UI interactions by setting streamingMessageId
 * Called by extensions to block character buttons, send button, and message actions
 * @param turnId - The turn ID to block
 * @param agentName - Optional agent name to display (defaults to "Extension")
 * @param modelName - Optional model name to display (defaults to "Processing")
 */
export function blockUIForTurn(turnId: string, agentName?: string, modelName?: string): void {
  if (blockUICallback) {
    blockUICallback(turnId, agentName || "Extension", modelName || "Processing");
  } else {
    console.warn("[Extensions] UI blocking callback not registered");
  }
}

/**
 * Unblock UI interactions by clearing streamingMessageId
 * Called by extensions when operations complete
 */
export function unblockUI(): void {
  if (blockUICallback) {
    blockUICallback(null);
  } else {
    console.warn("[Extensions] UI blocking callback not registered");
  }
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
