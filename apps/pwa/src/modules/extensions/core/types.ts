/**
 * Extension System Types
 *
 * Core type definitions for the extension/plugin architecture
 */

import { Session, CardListItem } from "@/modules/session/domain/session";
import { CharacterCard } from "@/modules/card/domain/character-card";
import { Turn } from "@/modules/turn/domain/turn";
import { DataStoreSavedField } from "@/modules/turn/domain/option";
import { Message } from "@/shared/prompt/domain/renderable";
import { MessageRole } from "@/shared/prompt/domain";

// Re-export types that extensions commonly need
export type { CardListItem, DataStoreSavedField, Message, MessageRole };

/**
 * Extension lifecycle hook names
 * These are synchronous hooks that can block execution
 */
export type ExtensionHook =
  | "session:beforeCreate"
  | "session:afterCreate"
  | "session:beforeUpdate"
  | "session:afterUpdate"
  | "scenario:afterAdd"        // After scenario is added to session
  | "prompt:afterRender"       // After prompt messages rendered, before LLM execution
  | "card:beforeCreate"
  | "card:afterCreate"
  | "turn:afterCreate"         // After turn is created (includes new messages, regenerations, and updates)
  | "turn:beforeUpdate"
  | "turn:afterDelete";

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
  turn?: Turn;
  message?: string;
  messageId?: any;  // UniqueEntityID for message/turn (used for UI blocking in extensions)
  timestamp?: number;

  /**
   * Prompt messages for prompt:afterRender hook
   *
   * This is the COMPLETE array that will be sent to LLM, containing:
   * - Fixed agent messages (system prompts, character cards, ###ROLEPLAY_MEMORY### tag, etc.)
   * - History messages (actual conversation turns)
   *
   * ⚠️ IMPORTANT: Role (system/user/assistant) does NOT distinguish fixed vs history!
   * History can be positioned anywhere in the array (not just at the end).
   *
   * To get ONLY conversation history, use `context.history` instead.
   *
   * Extensions can modify this array directly (e.g., inject memories, modify content)
   */
  messages?: Message[];

  /**
   * Agent entity for prompt:afterRender hook
   */
  agent?: any;

  /**
   * Full render context for prompt:afterRender hook
   *
   * Contains:
   * - `history`: HistoryItem[] - ONLY conversation turns (separate from fixed agent messages)
   * - `char`, `user`, `cast`: Character information
   * - `toggle`, `variables`: Template data
   *
   * Use `context.history` to distinguish conversation history from fixed agent prompts.
   */
  context?: any;

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
     * Get turn history for a session
     */
    getTurnHistory(sessionId: string, options?: {
      limit?: number;
      cursor?: string;
    }): Promise<any>;

    /**
     * Get a specific turn by ID
     */
    getTurn(turnId: string): Promise<any>;

    /**
     * Update a turn
     */
    updateTurn(turn: Turn): Promise<any>;

    /**
     * Delete a turn
     */
    deleteTurn(turnId: string): Promise<any>;

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

    /**
     * Add a lorebook entry to a character card
     * Handles all domain object creation internally
     * Returns Result with entryId property added on success
     */
    addLorebookEntryToCard(params: {
      cardId: string;
      name: string;
      keys: string[];
      content: string;
      enabled?: boolean;
      recallRange?: number;
    }): Promise<any>;

    /**
     * UI APIs for extensions
     */
    ui: {
      /**
       * Show a dialog to the user and wait for response
       */
      showDialog(config: {
        title: string;
        description?: string;
        content: any;
        buttons: Array<{
          label: string;
          variant?: "default" | "outline" | "ghost" | "destructive";
          value: string;
        }>;
        maxWidth?: string;
      }): Promise<string>;
    };
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
