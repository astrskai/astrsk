/**
 * Extension System Types
 *
 * Core type definitions for the extension/plugin architecture
 */

import { Session } from "@/modules/session/domain/session";
import { CharacterCard } from "@/modules/card/domain/character-card";

/**
 * Extension lifecycle hook names
 * These are synchronous hooks that can block execution
 */
export type ExtensionHook =
  | "session:beforeCreate"
  | "session:afterCreate"
  | "session:beforeUpdate"
  | "session:afterUpdate"
  | "message:beforeGenerate"
  | "message:afterGenerate"
  | "scenario:initialized"
  | "card:beforeCreate"
  | "card:afterCreate";

/**
 * Extension event names
 * These are asynchronous events that don't block execution
 */
export type ExtensionEvent =
  | "session:created"
  | "session:updated"
  | "message:created"
  | "card:created";

/**
 * Context data passed to hooks and event handlers
 */
export interface HookContext {
  session?: Session;
  card?: CharacterCard;
  message?: string;
  timestamp?: number;
  [key: string]: any;
}

/**
 * Hook handler function signature
 */
export type HookHandler = (context: HookContext) => void | Promise<void>;

/**
 * Event handler function signature
 */
export type EventHandler = (context: HookContext) => void | Promise<void>;

/**
 * Extension metadata
 */
export interface ExtensionMetadata {
  id: string;              // Unique extension identifier
  name: string;            // Human-readable name
  version: string;         // Semver version
  description?: string;    // Optional description
  author?: string;         // Optional author
}

/**
 * Base extension interface that all extensions must implement
 */
export interface IExtension {
  metadata: ExtensionMetadata;

  /**
   * Called when the extension is loaded
   */
  onLoad(client: IExtensionClient): void | Promise<void>;

  /**
   * Called when the extension is unloaded
   */
  onUnload?(): void | Promise<void>;
}

/**
 * Extension client interface
 * Provides APIs for extensions to interact with the core application
 */
export interface IExtensionClient {
  /**
   * Register a synchronous hook handler
   */
  on(hook: ExtensionHook, handler: HookHandler): void;

  /**
   * Register an asynchronous event handler
   */
  onEvent(event: ExtensionEvent, handler: EventHandler): void;

  /**
   * Unregister a hook handler
   */
  off(hook: ExtensionHook, handler: HookHandler): void;

  /**
   * Unregister an event handler
   */
  offEvent(event: ExtensionEvent, handler: EventHandler): void;

  /**
   * Get extension-specific storage
   */
  getStorage<T = any>(): ExtensionStorage<T>;

  /**
   * Service APIs exposed to extensions
   * SECURITY: Never expose credentials (JWT, API keys) directly!
   */
  api: {
    /**
     * Get a card by ID
     */
    getCard(cardId: any): Promise<any>;

    /**
     * Create a new character card
     */
    createCharacterCard(cardData: {
      title: string;
      name: string;
      description: string;
      tags?: string[];
    }): Promise<any>;

    /**
     * Save a card
     */
    saveCard(card: any): Promise<any>;

    /**
     * Get a session by ID
     */
    getSession(sessionId: any): Promise<any>;

    /**
     * Save a session
     */
    saveSession(session: any): Promise<any>;

    /**
     * Add a card to a session's participants
     */
    addCardToSession(
      sessionId: string,
      cardId: string,
      cardType: "character" | "plot"
    ): Promise<any>;

    /**
     * Call AI model with automatic authentication
     * Extensions use this instead of accessing JWT directly
     * @param prompt - The prompt to send to AI
     * @param options - Model configuration
     */
    callAI(prompt: string, options?: {
      modelId?: string;
      temperature?: number;
      schema?: any;
      sessionId?: string;
      feature?: string;
    }): Promise<any>;
  };
}

/**
 * Extension storage interface for persisting data
 */
export interface ExtensionStorage<T = any> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  keys(): string[];
}
