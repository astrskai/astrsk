import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { cardKeys, cardQueries } from "./query-factory";
import { CardService } from "../../../app/services/card-service";
import { UniqueEntityID } from "../../../shared/domain";
import { CharacterCard, PlotCard } from "../domain";
import { SearchCardsSort } from "../repos";
import { Result } from "../../../shared/core";

// Mock CardService
vi.mock("../../../app/services/card-service", () => ({
  CardService: {
    searchCard: {
      execute: vi.fn(),
    },
    getCard: {
      execute: vi.fn(),
    },
    updateCardTitle: {
      execute: vi.fn(),
    },
    updateCardSummary: {
      execute: vi.fn(),
    },
    updateCharacterName: {
      execute: vi.fn(),
    },
    updateCharacterDescription: {
      execute: vi.fn(),
    },
    updateCharacterExampleDialogue: {
      execute: vi.fn(),
    },
    updateCardTags: {
      execute: vi.fn(),
    },
    updateCardVersion: {
      execute: vi.fn(),
    },
    updateCardConceptualOrigin: {
      execute: vi.fn(),
    },
    updateCardCreator: {
      execute: vi.fn(),
    },
  },
}));

describe("Card Query Factory", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  describe("Query Keys", () => {
    describe("cardKeys", () => {
      it("should generate correct key for all cards", () => {
        expect(cardKeys.all).toEqual(["cards"]);
      });

      it("should generate correct key for lists", () => {
        expect(cardKeys.lists()).toEqual(["cards", "list"]);
      });

      it("should generate correct key for list with filters", () => {
        const filters = {
          keyword: "test",
          limit: 10,
          sort: SearchCardsSort.Latest,
        };
        expect(cardKeys.list(filters)).toEqual(["cards", "list", filters]);
      });

      it("should generate correct key for list without filters", () => {
        expect(cardKeys.list()).toEqual(["cards", "list"]);
      });

      it("should generate correct key for details", () => {
        expect(cardKeys.details()).toEqual(["cards", "detail"]);
      });

      it("should generate correct key for detail with id", () => {
        const cardId = "test-card-id";
        expect(cardKeys.detail(cardId)).toEqual(["cards", "detail", cardId]);
      });

      it("should generate correct key for imagePrompt", () => {
        const cardId = "test-card-id";
        expect(cardKeys.imagePrompt(cardId)).toEqual([
          "cards",
          "detail",
          cardId,
          "imagePrompt",
        ]);
      });

      it("should generate correct key for lorebook", () => {
        const cardId = "test-card-id";
        expect(cardKeys.lorebook(cardId)).toEqual([
          "cards",
          "detail",
          cardId,
          "lorebook",
        ]);
      });

      it("should generate correct key for first messages", () => {
        const cardId = "test-card-id";
        expect(cardKeys.firstMessages(cardId)).toEqual([
          "cards",
          "detail",
          cardId,
          "firstMessages",
        ]);
      });

      it("should generate correct key for specific first message", () => {
        const cardId = "test-card-id";
        const firstMessageId = "first-message-1";
        expect(cardKeys.firstMessage(cardId, firstMessageId)).toEqual([
          "cards",
          "detail",
          cardId,
          "firstMessages",
          firstMessageId,
        ]);
      });
    });

    describe("Hierarchical key structure", () => {
      it("should maintain proper hierarchy for invalidation", () => {
        const cardId = "test-id";

        // All card-related keys should start with ["cards"]
        expect(cardKeys.all[0]).toBe("cards");
        expect(cardKeys.lists()[0]).toBe("cards");
        expect(cardKeys.detail(cardId)[0]).toBe("cards");
        expect(cardKeys.lorebook(cardId)[0]).toBe("cards");
        expect(cardKeys.imagePrompt(cardId)[0]).toBe("cards");
        expect(cardKeys.firstMessages(cardId)[0]).toBe("cards");

        // Detail-related keys should include "detail" and cardId
        expect(cardKeys.detail(cardId)).toContain("detail");
        expect(cardKeys.detail(cardId)).toContain(cardId);
        expect(cardKeys.lorebook(cardId)).toContain("detail");
        expect(cardKeys.lorebook(cardId)).toContain(cardId);
        expect(cardKeys.imagePrompt(cardId)).toContain("detail");
        expect(cardKeys.imagePrompt(cardId)).toContain(cardId);
        expect(cardKeys.firstMessages(cardId)).toContain("detail");
        expect(cardKeys.firstMessages(cardId)).toContain(cardId);
      });
    });
  });

  describe("Query Options", () => {
    describe("cardQueries.list", () => {
      it("should create query options with default filters", () => {
        const options = cardQueries.list();

        expect(options.queryKey).toEqual(["cards", "list", {}]);
        expect(options.staleTime).toBe(1000 * 10); // 10 seconds
        expect(options.gcTime).toBe(1000 * 60); // 1 minute
      });

      it("should create query options with custom filters", () => {
        const filters = {
          keyword: "test",
          limit: 50,
          sort: SearchCardsSort.Oldest,
          type: ["character" as const],
        };
        const options = cardQueries.list(filters);

        expect(options.queryKey).toEqual(["cards", "list", filters]);
      });

      it("should handle successful search", async () => {
        const mockCards = [
          CharacterCard.create({ title: "Card 1" }).getValue(),
          CharacterCard.create({ title: "Card 2" }).getValue(),
        ];

        vi.mocked(CardService.searchCard.execute).mockResolvedValue(
          Result.ok(mockCards),
        );

        const options = cardQueries.list({ keyword: "test" });
        const result = await options.queryFn?.({
          signal: new AbortController().signal,
        } as any);

        expect(result).toEqual(mockCards);
        expect(CardService.searchCard.execute).toHaveBeenCalledWith({
          keyword: "test",
          limit: 100,
          sort: SearchCardsSort.Latest,
          type: [],
        });
      });

      it("should return empty array on search failure", async () => {
        vi.mocked(CardService.searchCard.execute).mockResolvedValue(
          Result.fail("Search failed"),
        );

        const options = cardQueries.list();
        const result = await options.queryFn?.({
          signal: new AbortController().signal,
        } as any);

        expect(result).toEqual([]);
      });
    });

    describe("cardQueries.detail", () => {
      it("should create query options for card detail", () => {
        const cardId = "test-card-id";
        const options = cardQueries.detail(cardId);

        expect(options.queryKey).toEqual(["cards", "detail", cardId]);
        expect(options.staleTime).toBe(1000 * 30); // 30 seconds
      });

      it("should handle successful card fetch", async () => {
        const mockCard = CharacterCard.create({
          title: "Test Card",
        }).getValue();

        vi.mocked(CardService.getCard.execute).mockResolvedValue(
          Result.ok(mockCard),
        );

        const options = cardQueries.detail("test-id");
        const result = await options.queryFn?.({
          signal: new AbortController().signal,
        } as any);

        expect(result).toBeDefined();
        expect(CardService.getCard.execute).toHaveBeenCalledWith(
          new UniqueEntityID("test-id"),
        );
      });

      it("should return null on fetch failure", async () => {
        vi.mocked(CardService.getCard.execute).mockResolvedValue(
          Result.fail("Not found"),
        );

        const options = cardQueries.detail("test-id");
        const result = await options.queryFn?.({
          signal: new AbortController().signal,
        } as any);

        expect(result).toBeNull();
      });

      it("should use select function with caching", () => {
        const options = cardQueries.detail("test-id");

        expect(options.select).toBeDefined();
        expect(typeof options.select).toBe("function");
      });
    });

    describe("cardQueries.imagePrompt", () => {
      it("should create query options for image prompt", () => {
        const cardId = "test-card-id";
        const options = cardQueries.imagePrompt(cardId);

        expect(options.queryKey).toEqual([
          "cards",
          "detail",
          cardId,
          "imagePrompt",
        ]);
        expect(options.staleTime).toBe(1000 * 5); // 5 seconds
        expect(options.gcTime).toBe(1000 * 30); // 30 seconds
      });

      it("should return image prompt from card", async () => {
        const mockCard = CharacterCard.create({
          title: "Test",
          imagePrompt: "Beautiful landscape",
        }).getValue();

        vi.mocked(CardService.getCard.execute).mockResolvedValue(
          Result.ok(mockCard),
        );

        const options = cardQueries.imagePrompt("test-id");
        const result = await options.queryFn?.({
          signal: new AbortController().signal,
        } as any);

        expect(result).toBe("Beautiful landscape");
      });

      it("should return empty string if no image prompt", async () => {
        const mockCard = CharacterCard.create({
          title: "Test",
        }).getValue();

        vi.mocked(CardService.getCard.execute).mockResolvedValue(
          Result.ok(mockCard),
        );

        const options = cardQueries.imagePrompt("test-id");
        const result = await options.queryFn?.({
          signal: new AbortController().signal,
        } as any);

        expect(result).toBe("");
      });
    });

    describe("cardQueries.lorebook", () => {
      it("should create query options for lorebook", () => {
        const cardId = "test-card-id";
        const options = cardQueries.lorebook(cardId);

        expect(options.queryKey).toEqual([
          "cards",
          "detail",
          cardId,
          "lorebook",
        ]);
        expect(options.staleTime).toBe(1000 * 30);
      });

      it("should use select function with caching", () => {
        const options = cardQueries.lorebook("test-id");

        expect(options.select).toBeDefined();
        expect(typeof options.select).toBe("function");
      });
    });

    describe("cardQueries.firstMessages", () => {
      it("should create query options for first messages", () => {
        const cardId = "test-card-id";
        const options = cardQueries.firstMessages(cardId);

        expect(options.queryKey).toEqual([
          "cards",
          "detail",
          cardId,
          "firstMessages",
        ]);
        expect(options.staleTime).toBe(1000 * 30);
      });

      it("should return first messages for plot card", async () => {
        const mockScenarios = [
          { name: "Scenario 1", description: "First scenario" },
          { name: "Scenario 2", description: "Second scenario" },
        ];

        const mockCard = PlotCard.create({
          title: "Test Plot",
          scenarios: mockScenarios,
        }).getValue();

        vi.mocked(CardService.getCard.execute).mockResolvedValue(
          Result.ok(mockCard),
        );

        const options = cardQueries.firstMessages("test-id");
        const result = await options.queryFn?.({
          signal: new AbortController().signal,
        } as any);

        expect(result).toEqual(mockScenarios);
      });

      it("should return empty array for character card", async () => {
        const mockCard = CharacterCard.create({
          title: "Test Character",
        }).getValue();

        vi.mocked(CardService.getCard.execute).mockResolvedValue(
          Result.ok(mockCard),
        );

        const options = cardQueries.firstMessages("test-id");
        const result = await options.queryFn?.({
          signal: new AbortController().signal,
        } as any);

        expect(result).toEqual([]);
      });

      it("should return empty array on fetch failure", async () => {
        vi.mocked(CardService.getCard.execute).mockResolvedValue(
          Result.fail("Not found"),
        );

        const options = cardQueries.firstMessages("test-id");
        const result = await options.queryFn?.({
          signal: new AbortController().signal,
        } as any);

        expect(result).toEqual([]);
      });
    });

    describe("cardQueries.firstMessage", () => {
      it("should create query options for specific first message", () => {
        const cardId = "test-card-id";
        const firstMessageId = "first-message-1";
        const options = cardQueries.firstMessage(cardId, firstMessageId);

        expect(options.queryKey).toEqual([
          "cards",
          "detail",
          cardId,
          "firstMessages",
          firstMessageId,
        ]);
        expect(options.staleTime).toBe(1000 * 30);
      });

      it("should return specific first message", async () => {
        const mockScenarios = [
          { id: "scenario-1", name: "Scenario 1", description: "First" },
          { id: "scenario-2", name: "Scenario 2", description: "Second" },
        ];

        const mockCard = PlotCard.create({
          title: "Test Plot",
          scenarios: mockScenarios,
        }).getValue();

        vi.mocked(CardService.getCard.execute).mockResolvedValue(
          Result.ok(mockCard),
        );

        const options = cardQueries.firstMessage("test-id", "Scenario 1");
        const result = await options.queryFn?.({
          signal: new AbortController().signal,
        } as any);

        expect(result).toEqual(mockScenarios[0]);
      });

      it("should return null if first message not found", async () => {
        const mockCard = PlotCard.create({
          title: "Test Plot",
          scenarios: [],
        }).getValue();

        vi.mocked(CardService.getCard.execute).mockResolvedValue(
          Result.ok(mockCard),
        );

        const options = cardQueries.firstMessage("test-id", "non-existent");
        const result = await options.queryFn?.({
          signal: new AbortController().signal,
        } as any);

        expect(result).toBeNull();
      });
    });
  });

  describe("Cache Management", () => {
    it("should set appropriate stale times for different query types", () => {
      // Quick updates (5 seconds)
      expect(cardQueries.imagePrompt("id").staleTime).toBe(1000 * 5);

      // Standard updates (10 seconds)
      expect(cardQueries.list().staleTime).toBe(1000 * 10);

      // Medium updates (30 seconds)
      expect(cardQueries.detail("id").staleTime).toBe(1000 * 30);
      expect(cardQueries.lorebook("id").staleTime).toBe(1000 * 30);
      expect(cardQueries.firstMessages("id").staleTime).toBe(1000 * 30);
    });

    it("should set appropriate garbage collection times", () => {
      expect(cardQueries.list().gcTime).toBe(1000 * 60); // 1 minute
      expect(cardQueries.imagePrompt("id").gcTime).toBe(1000 * 30); // 30 seconds
    });
  });
});
