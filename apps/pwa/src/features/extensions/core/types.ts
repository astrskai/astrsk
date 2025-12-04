/**
 * Extension System Types
 *
 * Core type definitions for the extension/plugin architecture
 * Adapted for current FSD-compliant monorepo structure
 */

import type { Variable } from "@/shared/prompt/domain/variable";

/**
 * Extension lifecycle hook names
 * These are synchronous hooks that can block execution
 */
export type ExtensionHook =
  | "flow:afterCreate"
  | "flow:afterLoad"
  | "prompt:afterRender"
  | "turn:afterCreate"
  | "turn:afterDelete"
  | "session:beforeCreate"
  | "session:afterCreate"
  | "session:onLoad"
  | "scenario:afterAdd"
  | "card:afterCreate";

/**
 * Extension event names
 * These are asynchronous events that don't block execution
 */
export type ExtensionEvent =
  | "flow:created"
  | "session:created"
  | "session:updated"
  | "message:created";

/**
 * Context data passed to hooks and event handlers
 */
export interface HookContext {
  flow?: any;
  session?: any;
  card?: any;
  turn?: any;
  agent?: any;
  messages?: any[];
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
 * Extension storage interface for persisting data
 */
export interface ExtensionStorage<T = any> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  keys(): string[];
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
   * Register a UI component for a specific slot
   */
  registerUIComponent(config: {
    id: string;
    slot: string;
    order?: number;
    render: (
      context: ExtensionUIRenderContext,
      hooks: ExtensionHooks,
      queries: ExtensionQueries
    ) => any;
  }): void;

  /**
   * Unregister a UI component
   */
  unregisterUIComponent(componentId: string): void;

  /**
   * Register a variable group with label and description
   * Allows extensions to define their own variable groups in the UI
   * Example: registerVariableGroup('scenario', { displayName: 'Scenario', description: 'Variables related to the scenario' })
   */
  registerVariableGroup(
    groupId: string,
    label: { displayName: string; description: string }
  ): void;

  /**
   * Register variables to the variable library
   * Allows extensions to add custom template variables
   */
  registerVariables(variables: Variable[]): void;

  /**
   * Register an object type with its fields for variable expansion
   * Example: registerObjectType('Scenario', ['id', 'name', 'description', 'entries'])
   * This enables nested variable paths like {{scenario.name}}, {{scenario.description}}
   */
  registerObjectType(typeName: string, fields: string[]): void;

  /**
   * Service APIs exposed to extensions
   * SECURITY: Never expose credentials (JWT, API keys) directly!
   */
  api: {
    // Minimal API for MVP - can be expanded later
    [key: string]: any;
  };
}

/**
 * React hooks exposed to extensions
 * Scalable: Add new hooks without breaking existing extensions
 */
export interface ExtensionHooks {
  useQuery?: any; // TanStack Query useQuery hook
  useMutation?: any; // TanStack Query useMutation hook
  // Future hooks can be added here
}

/**
 * Query factories exposed to extensions
 * Extensions share the same cache as the main app for reactive updates
 * Scalable: Add new query factories without breaking existing extensions
 */
export interface ExtensionQueries {
  sessionQueries?: any; // sessionQueries.detail(id) for reactive session data
  flowQueries?: any; // flowQueries.detail(id) for reactive flow data
  CardType?: any; // CardType enum for filtering cards (Character, Plot, etc.)
  // Future query factories can be added here
}

/**
 * Context provided to extension UI render functions
 * Slot-specific data only (React, components, disabled, callbacks, etc.)
 */
export interface ExtensionUIRenderContext {
  /** React library for createElement, Fragment, etc. */
  React: any;
  /** UI components exposed by the PWA */
  components: {
    UserInputCharacterButton?: any;
    // Future components can be added here without breaking existing extensions
  };
  /** Generate character message (for trigger system) */
  generateCharacterMessage?: (
    characterCardId: any,
    regenerateMessageId?: any,
    triggerType?: string
  ) => Promise<void>;
  /** Additional context data from the slot (e.g., disabled, callbacks, sessionId) */
  [key: string]: any;
}

/**
 * Extension UI component registration
 */
export interface ExtensionUIComponent {
  id: string;
  extensionId: string;
  slot: string; // e.g., "session-input-buttons"
  order?: number; // Display order (lower = first)
  render: (
    context: ExtensionUIRenderContext,
    hooks: ExtensionHooks,
    queries: ExtensionQueries
  ) => any; // Returns React element
}

/**
 * Re-export core types that extensions need access to
 */
export { NodeType } from "@/entities/flow/model/node-types";
export type { DataStoreSavedField } from "@/entities/turn/domain/option";
export type { CardListItem } from "@/entities/session/domain/session";
export type { Message } from "@/shared/prompt/domain/renderable";
