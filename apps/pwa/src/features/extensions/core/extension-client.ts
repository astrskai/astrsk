/**
 * Extension Client Implementation
 *
 * Provides the API surface for extensions to interact with the core application
 * Simplified MVP version for trigger extension
 */

import {
  IExtensionClient,
  ExtensionHook,
  ExtensionEvent,
  HookHandler,
  EventHandler,
  ExtensionStorage,
} from "./types";

/**
 * Simple in-memory storage implementation for extensions
 */
class InMemoryExtensionStorage<T = any> implements ExtensionStorage<T> {
  private data = new Map<string, T>();

  get(key: string): T | undefined {
    return this.data.get(key);
  }

  set(key: string, value: T): void {
    this.data.set(key, value);
  }

  remove(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }

  keys(): string[] {
    return Array.from(this.data.keys());
  }
}

/**
 * Extension client implementation
 */
export class ExtensionClient implements IExtensionClient {
  private hookHandlers = new Map<ExtensionHook, Set<HookHandler>>();
  private eventHandlers = new Map<ExtensionEvent, Set<EventHandler>>();
  private storage: ExtensionStorage;
  private uiComponents = new Map<string, any>(); // Map<componentId, ExtensionUIComponent>

  /**
   * Service APIs exposed to extensions
   * MVP: Minimal implementation - can be expanded later
   */
  public api = {
    /**
     * Add nodes to a flow
     * Uses optimistic updates for immediate UI feedback
     */
    addNodesToFlow: async (params: {
      flowId: string;
      nodes: any[];
    }) => {
      // Dynamic import to avoid circular dependencies
      const { FlowService } = await import("@/app/services/flow-service");
      const { UniqueEntityID } = await import("@/shared/domain/unique-entity-id");
      const { queryClient } = await import("@/shared/api/query-client");
      const { flowKeys } = await import("@/entities/flow/api/query-factory");

      // 1. Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: flowKeys.detail(params.flowId) });

      // 2. Snapshot current flow for rollback
      const previousFlow = queryClient.getQueryData(flowKeys.detail(params.flowId));

      // 3. Optimistically update cache immediately (like mutations do)
      queryClient.setQueryData(flowKeys.detail(params.flowId), (old: any) => {
        if (!old) return old;

        // Cache stores persistence format (InsertFlow) with direct nodes array
        return {
          ...old,
          nodes: [...(old.nodes || []), ...params.nodes],
          updated_at: new Date(),
        };
      });

      try {
        // 4. Get the current flow from domain
        const flowOrError = await FlowService.getFlow.execute(
          new UniqueEntityID(params.flowId)
        );
        if (flowOrError.isFailure) {
          throw new Error(`Failed to get flow: ${flowOrError.getError()}`);
        }

        const flow = flowOrError.getValue();

        // 5. Add new nodes to existing nodes
        const updatedNodes = [...flow.props.nodes, ...params.nodes];

        // 6. Update flow with new nodes
        const updatedFlowOrError = flow.update({ nodes: updatedNodes });
        if (updatedFlowOrError.isFailure) {
          throw new Error(`Failed to update flow: ${updatedFlowOrError.getError()}`);
        }

        // 7. Save updated flow to database
        const savedFlowOrError = await FlowService.saveFlow.execute(
          updatedFlowOrError.getValue()
        );
        if (savedFlowOrError.isFailure) {
          throw new Error(`Failed to save flow: ${savedFlowOrError.getError()}`);
        }

        // 8. Refetch immediately to ensure UI updates (not just invalidate)
        await queryClient.refetchQueries({
          queryKey: flowKeys.detail(params.flowId),
        });
      } catch (error) {
        // 9. Rollback optimistic update on error
        if (previousFlow) {
          queryClient.setQueryData(flowKeys.detail(params.flowId), previousFlow);
        }
        throw error;
      }
    },

    /**
     * Lorebook store access for extensions
     * Extensions can use this to track lorebook entries without importing zustand
     */
    get lorebookStore() {
      // Dynamic import to avoid circular dependencies
      const { useLorebookStore } = require("@/shared/stores/lorebook-store");
      return useLorebookStore.getState();
    },

    /**
     * NPC store access for extensions
     * Extensions can use this to track NPCs without importing zustand
     */
    get npcStore() {
      // Dynamic import to avoid circular dependencies
      const { useNpcStore } = require("@/shared/stores/npc-store");
      return useNpcStore.getState();
    },
  };

  constructor(private extensionId: string) {
    this.storage = new InMemoryExtensionStorage();
  }

  on(hook: ExtensionHook, handler: HookHandler): void {
    if (!this.hookHandlers.has(hook)) {
      this.hookHandlers.set(hook, new Set());
    }
    this.hookHandlers.get(hook)!.add(handler);
  }

  onEvent(event: ExtensionEvent, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(hook: ExtensionHook, handler: HookHandler): void {
    const handlers = this.hookHandlers.get(hook);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  offEvent(event: ExtensionEvent, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  getStorage<T = any>(): ExtensionStorage<T> {
    return this.storage as ExtensionStorage<T>;
  }

  /**
   * Internal method to get all handlers for a specific hook
   */
  getHookHandlers(hook: ExtensionHook): Set<HookHandler> {
    return this.hookHandlers.get(hook) || new Set();
  }

  /**
   * Internal method to get all handlers for a specific event
   */
  getEventHandlers(event: ExtensionEvent): Set<EventHandler> {
    return this.eventHandlers.get(event) || new Set();
  }

  /**
   * Register a UI renderer for a specific slot
   * The render function receives context, hooks (useQuery, etc.), and queries (sessionQueries, etc.)
   */
  registerUIComponent(config: {
    id: string;
    slot: string;
    order?: number;
    render: (context: any, hooks: any, queries: any) => any;
  }): void {
    this.uiComponents.set(config.id, {
      ...config,
      extensionId: this.extensionId,
    });
  }

  /**
   * Unregister a UI component
   */
  unregisterUIComponent(componentId: string): void {
    this.uiComponents.delete(componentId);
  }

  /**
   * Register a variable group with label and description
   * Allows extensions to define their own variable groups in the UI
   */
  registerVariableGroup(
    groupId: string,
    label: { displayName: string; description: string }
  ): void {
    // Dynamic import to avoid circular dependencies
    import("@/shared/prompt/domain/variable").then(({ VariableLibrary }) => {
      VariableLibrary.registerVariableGroup(groupId, label);
    });
  }

  /**
   * Register variables to the variable library
   * Allows extensions to add custom template variables
   */
  registerVariables(variables: any[]): void {
    // Dynamic import to avoid circular dependencies
    import("@/shared/prompt/domain/variable").then(({ VariableLibrary }) => {
      VariableLibrary.addVariables(variables);
    });
  }

  /**
   * Register an object type with its fields for variable expansion
   * Example: registerObjectType('Scenario', ['id', 'name', 'description', 'entries'])
   * This enables nested variable paths like {{scenario.name}}, {{scenario.description}}
   */
  registerObjectType(typeName: string, fields: string[]): void {
    // Dynamic import to avoid circular dependencies
    import("@/shared/prompt/domain/variable").then(({ VariableLibrary }) => {
      VariableLibrary.registerObjectType(typeName, fields);
    });
  }

  /**
   * Internal method to get all UI components
   */
  getUIComponents(): Map<string, any> {
    return this.uiComponents;
  }

  /**
   * Internal method to clear all handlers (used during unload)
   */
  clearAllHandlers(): void {
    this.hookHandlers.clear();
    this.eventHandlers.clear();
    this.uiComponents.clear();
  }
}
