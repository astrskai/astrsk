/**
 * Extension Client Implementation
 *
 * Provides the API surface for extensions to interact with the core application
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

  /**
   * Service APIs exposed to extensions
   * Extensions should use these instead of importing services directly
   * SECURITY: Never expose credentials directly!
   */
  public api = {
    getCard: async (cardId: any) => {
      const { CardService } = await import("@/app/services/card-service");
      return await CardService.getCard.execute(cardId);
    },

    createCharacterCard: async (cardData: any) => {
      const { CharacterCard } = await import("@/modules/card/domain/character-card");
      const { CardService } = await import("@/app/services/card-service");

      // Create card using domain factory (internal to pwa)
      const cardResult = CharacterCard.create(cardData);
      if (cardResult.isFailure) {
        return cardResult;  // Return failure result
      }

      const card = cardResult.getValue();

      // Save card to database
      return await CardService.saveCard.execute(card);
    },

    saveCard: async (card: any) => {
      const { CardService } = await import("@/app/services/card-service");
      return await CardService.saveCard.execute(card);
    },

    getSession: async (sessionId: any) => {
      const { SessionService } = await import("@/app/services/session-service");
      return await SessionService.getSession.execute(sessionId);
    },

    saveSession: async (session: any) => {
      const { SessionService } = await import("@/app/services/session-service");
      return await SessionService.saveSession.execute({ session });
    },

    /**
     * Add a card to a session's participants
     * Invalidates both session and card queries for UI updates
     */
    addCardToSession: async (sessionId: string, cardId: string, cardType: "character" | "plot") => {
      const { SessionService } = await import("@/app/services/session-service");
      const { UniqueEntityID } = await import("@/shared/domain");
      const { CardType } = await import("@/modules/card/domain");

      // Get session
      const sessionResult = await SessionService.getSession.execute(
        new UniqueEntityID(sessionId)
      );

      if (sessionResult.isFailure) {
        return sessionResult;
      }

      const session = sessionResult.getValue();

      // Add card to session
      const addResult = session.addCard(
        new UniqueEntityID(cardId),
        cardType === "character" ? CardType.Character : CardType.Plot
      );

      if (addResult.isFailure) {
        return addResult;
      }

      // Save updated session
      const saveResult = await SessionService.saveSession.execute({ session });

      // Invalidate queries to trigger UI updates
      if (saveResult.isSuccess) {
        try {
          const { queryClient } = await import("@/app/queries/query-client");
          const { sessionQueries } = await import("@/app/queries/session-queries");
          const { cardQueries } = await import("@/app/queries/card/query-factory");

          // Invalidate session (for session participants view)
          await queryClient.invalidateQueries({
            queryKey: sessionQueries.detail(new UniqueEntityID(sessionId)).queryKey,
          });

          // Invalidate card list (for left navigation)
          await queryClient.invalidateQueries({
            queryKey: cardQueries.list().queryKey,
          });

          // Invalidate specific card detail
          await queryClient.invalidateQueries({
            queryKey: cardQueries.detail(new UniqueEntityID(cardId)).queryKey,
          });

          console.log("[Extension Client] Invalidated session and card queries for UI update");
        } catch (error) {
          // Don't fail the operation if invalidation fails
          console.warn("[Extension Client] Failed to invalidate queries:", error);
        }
      }

      return saveResult;
    },

    /**
     * Call AI model with automatic authentication
     * JWT is handled internally - extensions never see credentials
     */
    callAI: async (prompt: string, options?: any) => {
      const { generateObject } = await import("ai");
      const { createOpenAI } = await import("@ai-sdk/openai");
      const { useAppStore } = await import("@/app/stores/app-store");

      // Get JWT internally - extension never sees it
      const jwt = useAppStore.getState().jwt;

      // Default model
      const modelId = options?.modelId || "openai-compatible:google/gemini-2.5-flash";
      const [providerSource, parsedModelId] = modelId.split(":");

      // Setup provider
      const astrskBaseUrl = `${import.meta.env.VITE_CONVEX_SITE_URL}/serveModel/${providerSource}`;
      let oaiCompBaseUrl = astrskBaseUrl ?? "";
      if (!oaiCompBaseUrl.endsWith("/v1")) {
        oaiCompBaseUrl += "/v1";
      }

      const provider = createOpenAI({
        apiKey: "DUMMY",
        baseURL: oaiCompBaseUrl,
      });

      const model = ("chat" in provider && typeof provider.chat === "function")
        ? (provider as any).chat(parsedModelId)
        : provider.languageModel(parsedModelId);

      // Build headers with JWT (internally)
      const headers = jwt
        ? {
            Authorization: `Bearer ${jwt}`,
            "x-astrsk-credit-log": JSON.stringify({
              feature: options?.feature || "extension",
              sessionId: options?.sessionId,
            }),
          }
        : undefined;

      // Call AI with schema if provided
      if (options?.schema) {
        return await generateObject({
          model,
          schema: options.schema,
          prompt,
          temperature: options?.temperature || 0.7,
          ...(headers && { headers }),
        });
      } else {
        // Plain text generation
        const { generateText } = await import("ai");
        return await generateText({
          model,
          prompt,
          temperature: options?.temperature || 0.7,
          ...(headers && { headers }),
        });
      }
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
   * Internal method to clear all handlers (used during unload)
   */
  clearAllHandlers(): void {
    this.hookHandlers.clear();
    this.eventHandlers.clear();
  }
}
