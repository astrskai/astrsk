/**
 * Extension Registry
 *
 * Manages the lifecycle of all extensions and provides the hook system
 */

import {
  IExtension,
  ExtensionHook,
  ExtensionEvent,
  HookContext,
} from "./types";
import { ExtensionClient } from "./extension-client";

/**
 * Registry for managing extensions
 */
export class ExtensionRegistry {
  private extensions = new Map<string, IExtension>();
  private clients = new Map<string, ExtensionClient>();
  private static instance: ExtensionRegistry;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ExtensionRegistry {
    if (!ExtensionRegistry.instance) {
      ExtensionRegistry.instance = new ExtensionRegistry();
    }
    return ExtensionRegistry.instance;
  }

  /**
   * Register and load an extension
   */
  async register(extension: IExtension): Promise<void> {
    const { id } = extension.metadata;

    if (this.extensions.has(id)) {
      console.warn(`Extension ${id} is already registered`);
      return;
    }

    // Create client for this extension
    const client = new ExtensionClient(id);
    this.clients.set(id, client);

    // Store extension
    this.extensions.set(id, extension);

    // Call onLoad
    try {
      await extension.onLoad(client);
      console.log(`Extension ${id} loaded successfully`);
    } catch (error) {
      console.error(`Failed to load extension ${id}:`, error);
      // Cleanup on failure
      this.extensions.delete(id);
      this.clients.delete(id);
      throw error;
    }
  }

  /**
   * Unregister and unload an extension
   */
  async unregister(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId);
    const client = this.clients.get(extensionId);

    if (!extension || !client) {
      console.warn(`Extension ${extensionId} is not registered`);
      return;
    }

    // Call onUnload if defined
    try {
      if (extension.onUnload) {
        await extension.onUnload();
      }
    } catch (error) {
      console.error(`Error during extension ${extensionId} unload:`, error);
    }

    // Clear all handlers
    client.clearAllHandlers();

    // Remove from registry
    this.extensions.delete(extensionId);
    this.clients.delete(extensionId);

    console.log(`Extension ${extensionId} unloaded successfully`);
  }

  /**
   * Trigger a synchronous hook
   * All registered handlers will be called in sequence
   */
  async triggerHook(hook: ExtensionHook, context: HookContext): Promise<void> {
    const handlers: Array<() => Promise<void>> = [];

    // Collect all handlers for this hook from all extensions
    for (const client of this.clients.values()) {
      const hookHandlers = client.getHookHandlers(hook);
      for (const handler of hookHandlers) {
        handlers.push(async () => {
          try {
            await handler(context);
          } catch (error) {
            console.error(`Error in hook ${hook} handler:`, error);
          }
        });
      }
    }

    // Execute all handlers sequentially
    for (const handler of handlers) {
      await handler();
    }
  }

  /**
   * Emit an asynchronous event
   * All registered handlers will be called without blocking
   */
  emitEvent(event: ExtensionEvent, context: HookContext): void {
    const handlers: Array<() => Promise<void>> = [];

    // Collect all handlers for this event from all extensions
    for (const client of this.clients.values()) {
      const eventHandlers = client.getEventHandlers(event);
      for (const handler of eventHandlers) {
        handlers.push(async () => {
          try {
            await handler(context);
          } catch (error) {
            console.error(`Error in event ${event} handler:`, error);
          }
        });
      }
    }

    // Execute all handlers asynchronously without blocking
    Promise.all(handlers.map((h) => h())).catch((error) => {
      console.error(`Error processing event ${event}:`, error);
    });
  }

  /**
   * Get all registered extensions
   */
  getExtensions(): IExtension[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Get a specific extension by ID
   */
  getExtension(extensionId: string): IExtension | undefined {
    return this.extensions.get(extensionId);
  }

  /**
   * Check if an extension is registered
   */
  hasExtension(extensionId: string): boolean {
    return this.extensions.has(extensionId);
  }

  /**
   * Get the client for a specific extension
   */
  getClient(extensionId: string): ExtensionClient | undefined {
    return this.clients.get(extensionId);
  }
}

/**
 * Global extension registry instance
 */
export const extensionRegistry = ExtensionRegistry.getInstance();
