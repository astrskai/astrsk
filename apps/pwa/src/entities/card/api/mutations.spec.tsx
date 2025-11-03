/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { ReactNode } from "react";
import {
  useUpdateCardTitle,
  useUpdateCardSummary,
  useUpdateCharacterName,
  useUpdateCharacterDescription,
  useUpdateCharacterExampleDialogue,
  useUpdateCardTags,
  useUpdateCardVersion,
  useUpdateCardConceptualOrigin,
  useUpdateCardCreator,
  useUpdateCardLorebook,
  useUpdatePlotDescription,
  useUpdateCardScenarios,
} from "./mutations";
import { CardService } from "@/app/services/card-service";
import { Result } from "@/shared/core";
import { cardKeys } from "./query-factory";

// Mock CardService
vi.mock("@/app/services/card-service", () => ({
  CardService: {
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
    updateCardLorebook: {
      execute: vi.fn(),
    },
    updatePlotDescription: {
      execute: vi.fn(),
    },
    updateCardScenarios: {
      execute: vi.fn(),
    },
  },
}));

describe("Card Mutations", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("useUpdateCardTitle", () => {
    const cardId = "test-card-id";

    beforeEach(() => {
      // Set initial data in cache using persistence format
      queryClient.setQueryData(cardKeys.detail(cardId), {
        id: cardId,
        common: {
          title: "Original Title",
          updated_at: new Date("2024-01-01"),
        },
      });

      // Set list data
      queryClient.setQueryData(cardKeys.lists(), [
        {
          id: cardId,
          title: "Original Title",
          updatedAt: new Date("2024-01-01"),
        },
      ]);
    });

    it("should update card title successfully", async () => {
      vi.mocked(CardService.updateCardTitle.execute).mockResolvedValue(
        Result.ok(undefined),
      );

      const { result } = renderHook(() => useUpdateCardTitle(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync("New Title");
      });

      expect(CardService.updateCardTitle.execute).toHaveBeenCalledWith({
        cardId,
        title: "New Title",
      });
    });

    it("should handle optimistic updates for title", async () => {
      vi.mocked(CardService.updateCardTitle.execute).mockImplementation(
        () => new Promise(() => {}), // Never resolves to test optimistic update
      );

      const { result } = renderHook(() => useUpdateCardTitle(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutateAsync("New Title").catch(() => {});
      });

      // Check optimistic update in detail query (persistence format)
      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;
      expect(detailData.common.title).toBe("New Title");
      expect(detailData.common.updated_at).toBeInstanceOf(Date);

      // Check optimistic update in list query
      const listData = queryClient.getQueryData(cardKeys.lists()) as any;
      expect(listData[0].title).toBe("New Title");
      expect(listData[0].updatedAt).toBeInstanceOf(Date);
    });

    it("should rollback on error", async () => {
      vi.mocked(CardService.updateCardTitle.execute).mockResolvedValue(
        Result.fail("Update failed"),
      );

      const { result } = renderHook(() => useUpdateCardTitle(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync("New Title");
        } catch (error) {
          // Expected error
        }
      });

      // Check rollback
      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;
      expect(detailData.common.title).toBe("Original Title");

      const listData = queryClient.getQueryData(cardKeys.lists()) as any;
      expect(listData[0].title).toBe("Original Title");
    });
  });

  describe("useUpdateCardSummary", () => {
    const cardId = "test-card-id";

    beforeEach(() => {
      queryClient.setQueryData(cardKeys.detail(cardId), {
        id: cardId,
        common: {
          title: "Test Card",
          card_summary: "Original Summary",
          updated_at: new Date("2024-01-01"),
        },
      });
    });

    it("should update card summary successfully", async () => {
      vi.mocked(CardService.updateCardSummary.execute).mockResolvedValue(
        Result.ok(undefined),
      );

      const { result } = renderHook(() => useUpdateCardSummary(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync("New Summary");
      });

      expect(CardService.updateCardSummary.execute).toHaveBeenCalledWith({
        cardId,
        cardSummary: "New Summary",
      });
    });

    it("should manage cursor state", () => {
      const { result } = renderHook(() => useUpdateCardSummary(cardId), {
        wrapper: createWrapper(),
      });

      expect(result.current.hasCursor).toBe(false);

      act(() => {
        result.current.setCursorActive(true);
      });

      expect(result.current.hasCursor).toBe(true);

      act(() => {
        result.current.setCursorActive(false);
      });

      expect(result.current.hasCursor).toBe(false);
    });

    it("should handle optimistic updates for summary", async () => {
      vi.mocked(CardService.updateCardSummary.execute).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(() => useUpdateCardSummary(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutateAsync("New Summary").catch(() => {});
      });

      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;
      expect(detailData.common.card_summary).toBe("New Summary");
      expect(detailData.common.updated_at).toBeInstanceOf(Date);
    });
  });

  describe("useUpdateCharacterName", () => {
    const cardId = "test-card-id";

    beforeEach(() => {
      queryClient.setQueryData(cardKeys.detail(cardId), {
        id: cardId,
        common: {
          title: "Test Card",
          updated_at: new Date("2024-01-01"),
        },
        character: {
          name: "Original Name",
          description: "Test description",
        },
      });
    });

    it("should update character name successfully", async () => {
      vi.mocked(CardService.updateCharacterName.execute).mockResolvedValue(
        Result.ok(undefined),
      );

      const { result } = renderHook(() => useUpdateCharacterName(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync("New Name");
      });

      expect(CardService.updateCharacterName.execute).toHaveBeenCalledWith({
        cardId,
        name: "New Name",
      });
    });

    it("should handle optimistic updates for character name", async () => {
      vi.mocked(CardService.updateCharacterName.execute).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(() => useUpdateCharacterName(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutateAsync("New Name").catch(() => {});
      });

      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;
      expect(detailData.character.name).toBe("New Name");
      expect(detailData.common.updated_at).toBeInstanceOf(Date);
    });

    it("should not update if character data is missing", async () => {
      // Set data without character field
      queryClient.setQueryData(cardKeys.detail(cardId), {
        id: cardId,
        common: {
          title: "Test Card",
          updated_at: new Date("2024-01-01"),
        },
      });

      vi.mocked(CardService.updateCharacterName.execute).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(() => useUpdateCharacterName(cardId), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate("New Name");
      });

      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;
      expect(detailData.character).toBeUndefined();
    });
  });

  describe("useUpdateCharacterDescription", () => {
    const cardId = "test-card-id";

    beforeEach(() => {
      queryClient.setQueryData(cardKeys.detail(cardId), {
        id: cardId,
        common: {
          title: "Test Card",
          updated_at: new Date("2024-01-01"),
        },
        character: {
          name: "Test Name",
          description: "Original Description",
        },
      });
    });

    it("should update character description successfully", async () => {
      vi.mocked(
        CardService.updateCharacterDescription.execute,
      ).mockResolvedValue(Result.ok(undefined));

      const { result } = renderHook(
        () => useUpdateCharacterDescription(cardId),
        {
          wrapper: createWrapper(),
        },
      );

      await act(async () => {
        await result.current.mutateAsync("New Description");
      });

      expect(
        CardService.updateCharacterDescription.execute,
      ).toHaveBeenCalledWith({
        cardId,
        description: "New Description",
      });
    });

    it("should handle optimistic updates for character description", async () => {
      vi.mocked(
        CardService.updateCharacterDescription.execute,
      ).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(
        () => useUpdateCharacterDescription(cardId),
        {
          wrapper: createWrapper(),
        },
      );

      await act(async () => {
        result.current.mutateAsync("New Description").catch(() => {});
      });

      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;
      expect(detailData.character.description).toBe("New Description");
      expect(detailData.common.updated_at).toBeInstanceOf(Date);
    });
  });

  describe("useUpdateCharacterExampleDialogue", () => {
    const cardId = "test-card-id";

    beforeEach(() => {
      queryClient.setQueryData(cardKeys.detail(cardId), {
        id: cardId,
        common: {
          title: "Test Card",
          updated_at: new Date("2024-01-01"),
        },
        character: {
          name: "Test Name",
          example_dialogue: "Original Dialogue",
        },
      });
    });

    it("should update character example dialogue successfully", async () => {
      vi.mocked(
        CardService.updateCharacterExampleDialogue.execute,
      ).mockResolvedValue(Result.ok(undefined));

      const { result } = renderHook(
        () => useUpdateCharacterExampleDialogue(cardId),
        {
          wrapper: createWrapper(),
        },
      );

      await act(async () => {
        await result.current.mutateAsync("New Dialogue");
      });

      expect(
        CardService.updateCharacterExampleDialogue.execute,
      ).toHaveBeenCalledWith({
        cardId,
        exampleDialogue: "New Dialogue",
      });
    });

    it("should handle optimistic updates for example dialogue", async () => {
      vi.mocked(
        CardService.updateCharacterExampleDialogue.execute,
      ).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(
        () => useUpdateCharacterExampleDialogue(cardId),
        {
          wrapper: createWrapper(),
        },
      );

      await act(async () => {
        result.current.mutateAsync("New Dialogue").catch(() => {});
      });

      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;
      expect(detailData.character.example_dialogue).toBe("New Dialogue");
      expect(detailData.common.updated_at).toBeInstanceOf(Date);
    });
  });

  describe("useUpdateCardTags", () => {
    const cardId = "test-card-id";

    beforeEach(() => {
      queryClient.setQueryData(cardKeys.detail(cardId), {
        id: cardId,
        common: {
          title: "Test Card",
          tags: ["tag1", "tag2"],
          updated_at: new Date("2024-01-01"),
        },
      });
    });

    it("should update card tags successfully", async () => {
      vi.mocked(CardService.updateCardTags.execute).mockResolvedValue(
        Result.ok(undefined),
      );

      const { result } = renderHook(() => useUpdateCardTags(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync(["tag3", "tag4"]);
      });

      expect(CardService.updateCardTags.execute).toHaveBeenCalledWith({
        cardId,
        tags: ["tag3", "tag4"],
      });
    });

    it("should handle optimistic updates for tags", async () => {
      vi.mocked(CardService.updateCardTags.execute).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(() => useUpdateCardTags(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutateAsync(["tag3", "tag4"]).catch(() => {});
      });

      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;
      expect(detailData.common.tags).toEqual(["tag3", "tag4"]);
      expect(detailData.common.updated_at).toBeInstanceOf(Date);
    });
  });

  describe("useUpdateCardVersion", () => {
    const cardId = "test-card-id";

    beforeEach(() => {
      queryClient.setQueryData(cardKeys.detail(cardId), {
        id: cardId,
        common: {
          title: "Test Card",
          version: "1.0.0",
          updated_at: new Date("2024-01-01"),
        },
      });
    });

    it("should update card version successfully", async () => {
      vi.mocked(CardService.updateCardVersion.execute).mockResolvedValue(
        Result.ok(undefined),
      );

      const { result } = renderHook(() => useUpdateCardVersion(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync("2.0.0");
      });

      expect(CardService.updateCardVersion.execute).toHaveBeenCalledWith({
        cardId,
        version: "2.0.0",
      });
    });

    it("should handle optimistic updates for version", async () => {
      vi.mocked(CardService.updateCardVersion.execute).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(() => useUpdateCardVersion(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutateAsync("2.0.0").catch(() => {});
      });

      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;
      expect(detailData.common.version).toBe("2.0.0");
      expect(detailData.common.updated_at).toBeInstanceOf(Date);
    });
  });

  describe("useUpdateCardConceptualOrigin", () => {
    const cardId = "test-card-id";

    beforeEach(() => {
      queryClient.setQueryData(cardKeys.detail(cardId), {
        id: cardId,
        common: {
          title: "Test Card",
          conceptual_origin: "Original Concept",
          updated_at: new Date("2024-01-01"),
        },
      });
    });

    it("should update card conceptual origin successfully", async () => {
      vi.mocked(
        CardService.updateCardConceptualOrigin.execute,
      ).mockResolvedValue(Result.ok(undefined));

      const { result } = renderHook(
        () => useUpdateCardConceptualOrigin(cardId),
        {
          wrapper: createWrapper(),
        },
      );

      await act(async () => {
        await result.current.mutateAsync("New Concept");
      });

      expect(
        CardService.updateCardConceptualOrigin.execute,
      ).toHaveBeenCalledWith({
        cardId,
        conceptualOrigin: "New Concept",
      });
    });

    it("should handle optimistic updates for conceptual origin", async () => {
      vi.mocked(
        CardService.updateCardConceptualOrigin.execute,
      ).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(
        () => useUpdateCardConceptualOrigin(cardId),
        {
          wrapper: createWrapper(),
        },
      );

      await act(async () => {
        result.current.mutateAsync("New Concept").catch(() => {});
      });

      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;
      expect(detailData.common.conceptual_origin).toBe("New Concept");
      expect(detailData.common.updated_at).toBeInstanceOf(Date);
    });
  });

  describe("useUpdateCardCreator", () => {
    const cardId = "test-card-id";

    beforeEach(() => {
      queryClient.setQueryData(cardKeys.detail(cardId), {
        id: cardId,
        common: {
          title: "Test Card",
          creator: "Original Creator",
          updated_at: new Date("2024-01-01"),
        },
      });
    });

    it("should update card creator successfully", async () => {
      vi.mocked(CardService.updateCardCreator.execute).mockResolvedValue(
        Result.ok(undefined),
      );

      const { result } = renderHook(() => useUpdateCardCreator(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync("New Creator");
      });

      expect(CardService.updateCardCreator.execute).toHaveBeenCalledWith({
        cardId,
        creator: "New Creator",
      });
    });

    it("should handle optimistic updates for creator", async () => {
      vi.mocked(CardService.updateCardCreator.execute).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(() => useUpdateCardCreator(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutateAsync("New Creator").catch(() => {});
      });

      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;
      expect(detailData.common.creator).toBe("New Creator");
      expect(detailData.common.updated_at).toBeInstanceOf(Date);
    });
  });

  describe("useUpdateCardLorebook", () => {
    const cardId = "test-card-id";

    it("should handle optimistic updates for character card lorebook", async () => {
      // Setup character card with persistence format
      queryClient.setQueryData(cardKeys.detail(cardId), {
        id: cardId,
        common: {
          title: "Test Character Card",
          updated_at: new Date("2024-01-01"),
        },
        character: {
          name: "Test Character",
          lorebook: null, // Initial state
        },
      });

      const newLorebook = {
        entries: [
          { name: "Test Entry", content: "Test Content", enabled: true },
        ],
      };

      vi.mocked(CardService.updateCardLorebook.execute).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(() => useUpdateCardLorebook(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutateAsync(newLorebook).catch(() => {});
      });

      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;

      // Verify lorebook is in character, not common
      expect(detailData.character.lorebook).toEqual(newLorebook);
      expect(detailData.common.lorebook).toBeUndefined();
      expect(detailData.common.updated_at).toBeInstanceOf(Date);
    });

    it("should handle optimistic updates for plot card lorebook", async () => {
      // Setup plot card with persistence format
      queryClient.setQueryData(cardKeys.detail(cardId), {
        id: cardId,
        common: {
          title: "Test Plot Card",
          updated_at: new Date("2024-01-01"),
        },
        plot: {
          description: "Test plot description",
          scenarios: [],
          lorebook: null,
        },
      });

      const newLorebook = {
        entries: [
          { name: "World Entry", content: "World Content", enabled: true },
        ],
      };

      vi.mocked(CardService.updateCardLorebook.execute).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(() => useUpdateCardLorebook(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutateAsync(newLorebook).catch(() => {});
      });

      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;

      // Verify lorebook is in plot, not common
      expect(detailData.plot.lorebook).toEqual(newLorebook);
      expect(detailData.common.lorebook).toBeUndefined();
      expect(detailData.common.updated_at).toBeInstanceOf(Date);
    });

    it("should handle clearing lorebook from character card", async () => {
      queryClient.setQueryData(cardKeys.detail(cardId), {
        id: cardId,
        common: {
          title: "Test Character Card",
          updated_at: new Date("2024-01-01"),
        },
        character: {
          name: "Test Character",
          lorebook: {
            entries: [{ name: "Old", content: "Old", enabled: true }],
          },
        },
      });

      vi.mocked(CardService.updateCardLorebook.execute).mockImplementation(
        () => new Promise(() => {}),
      );

      const { result } = renderHook(() => useUpdateCardLorebook(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutateAsync(null).catch(() => {});
      });

      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;
      expect(detailData.character.lorebook).toBeNull();
    });
  });

  describe("useUpdatePlotDescription", () => {
    const cardId = "test-card-id";

    beforeEach(() => {
      queryClient.setQueryData(cardKeys.detail(cardId), {
        id: cardId,
        common: {
          title: "Test Plot Card",
          updated_at: new Date("2024-01-01"),
        },
        plot: {
          description: "Original Description",
          scenarios: [],
        },
      });
    });

    it("should update plot description successfully", async () => {
      vi.mocked(CardService.updatePlotDescription.execute).mockResolvedValue(
        Result.ok(undefined),
      );

      const { result } = renderHook(() => useUpdatePlotDescription(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync("New Plot Description");
      });

      expect(CardService.updatePlotDescription.execute).toHaveBeenCalledWith({
        cardId,
        description: "New Plot Description",
      });
    });

    it("should handle optimistic updates for plot description", async () => {
      vi.mocked(CardService.updatePlotDescription.execute).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(() => useUpdatePlotDescription(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutateAsync("New Plot Description").catch(() => {});
      });

      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;

      // Verify description is in plot, not at root
      expect(detailData.plot.description).toBe("New Plot Description");
      expect(detailData.description).toBeUndefined();
      expect(detailData.common.updated_at).toBeInstanceOf(Date);
    });

    it("should not update if plot data is missing", async () => {
      // Set data without plot field (character card)
      queryClient.setQueryData(cardKeys.detail(cardId), {
        id: cardId,
        common: {
          title: "Test Character Card",
          updated_at: new Date("2024-01-01"),
        },
        character: {
          name: "Test Character",
        },
      });

      vi.mocked(CardService.updatePlotDescription.execute).mockImplementation(
        () => new Promise(() => {}),
      );

      const { result } = renderHook(() => useUpdatePlotDescription(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutateAsync("New Plot Description").catch(() => {});
      });

      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;
      expect(detailData.plot).toBeUndefined();
      expect(detailData.character).toBeDefined();
    });
  });

  describe("useUpdateCardScenarios", () => {
    const cardId = "test-card-id";

    beforeEach(() => {
      queryClient.setQueryData(cardKeys.detail(cardId), {
        id: cardId,
        common: {
          title: "Test Plot Card",
          updated_at: new Date("2024-01-01"),
        },
        plot: {
          description: "Test Plot",
          scenarios: [
            { id: "1", name: "Original Scenario", description: "Original" },
          ],
        },
      });
    });

    it("should update card scenarios successfully", async () => {
      const newScenarios = [
        { id: "1", name: "Updated Scenario", description: "Updated" },
        { id: "2", name: "New Scenario", description: "New" },
      ];

      vi.mocked(CardService.updateCardScenarios.execute).mockResolvedValue(
        Result.ok(undefined),
      );

      const { result } = renderHook(() => useUpdateCardScenarios(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync(newScenarios);
      });

      expect(CardService.updateCardScenarios.execute).toHaveBeenCalledWith({
        cardId,
        scenarios: newScenarios,
      });
    });

    it("should handle optimistic updates for scenarios", async () => {
      const newScenarios = [
        { id: "1", name: "Updated Scenario", description: "Updated" },
        { id: "2", name: "New Scenario", description: "New" },
      ];

      vi.mocked(CardService.updateCardScenarios.execute).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(() => useUpdateCardScenarios(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutateAsync(newScenarios).catch(() => {});
      });

      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;

      // Verify scenarios are in plot, not at root
      expect(detailData.plot.scenarios).toEqual(newScenarios);
      expect(detailData.scenarios).toBeUndefined();
      expect(detailData.common.updated_at).toBeInstanceOf(Date);
    });

    it("should handle clearing scenarios", async () => {
      vi.mocked(CardService.updateCardScenarios.execute).mockImplementation(
        () => new Promise(() => {}),
      );

      const { result } = renderHook(() => useUpdateCardScenarios(cardId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutateAsync([]).catch(() => {});
      });

      const detailData = queryClient.getQueryData(
        cardKeys.detail(cardId),
      ) as any;
      expect(detailData.plot.scenarios).toEqual([]);
    });
  });
});
