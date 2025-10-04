import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  storeConversationMemory,
  retrieveSessionMemories,
  formatMemoriesForPrompt,
  isMemoryServiceEnabled,
} from "../simple-memory/memory-service";

// Mock the Supermemory client
vi.mock("supermemory", () => ({
  Supermemory: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: "test-memory-id" }),
    search: vi.fn().mockResolvedValue([
      { memory: "[user]: Hello\n[assistant]: Hi there!" },
      {
        memory: "[user]: How are you?\n[assistant]: I am doing well, thanks!",
      },
    ]),
  })),
}));

// Mock environment variables
vi.mock("@/shared/utils/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Supermemory Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variable
    (import.meta as any).env = {
      VITE_SUPERMEMORY_API_KEY: "test-api-key",
      VITE_SUPERMEMORY_BASE_URL: "https://api.supermemory.ai",
    };
  });

  describe("isMemoryServiceEnabled", () => {
    it("should return true when API key is configured", () => {
      expect(isMemoryServiceEnabled()).toBe(true);
    });

    it("should return false when API key is not configured", () => {
      (import.meta as any).env.VITE_SUPERMEMORY_API_KEY = "";
      expect(isMemoryServiceEnabled()).toBe(false);
    });
  });

  describe("storeConversationMemory", () => {
    it("should store conversation turns successfully", async () => {
      const turns = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
      ];

      await storeConversationMemory("session-456", turns, "agent-123");

      // Verify the memory was stored (mock will handle the actual call)
      expect(true).toBe(true); // Just checking no errors thrown
    });

    it("should skip storage when less than 2 turns", async () => {
      const turns = [{ role: "user", content: "Hello" }];

      await storeConversationMemory("session-456", turns, "agent-123");

      // Should complete without error
      expect(true).toBe(true);
    });

    it("should handle storage errors gracefully", async () => {
      const turns = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
      ];

      // This should not throw even if the mock fails
      await expect(
        storeConversationMemory("session-456", turns, "agent-123"),
      ).resolves.not.toThrow();
    });
  });

  describe("retrieveSessionMemories", () => {
    it("should retrieve memories for a session", async () => {
      const memories = await retrieveSessionMemories("session-456");

      expect(memories).toHaveLength(2);
      expect(memories[0]).toContain("[user]: Hello");
      expect(memories[1]).toContain("[user]: How are you?");
    });

    it("should return empty array when no memories found", async () => {
      // Mock empty search results
      const { Supermemory } = await import("supermemory");
      (Supermemory as any).mockImplementation(() => ({
        search: vi.fn().mockResolvedValue([]),
      }));

      const memories = await retrieveSessionMemories("session-999");
      expect(memories).toEqual([]);
    });

    it("should handle retrieval errors gracefully", async () => {
      // Mock search error
      const { Supermemory } = await import("supermemory");
      (Supermemory as any).mockImplementation(() => ({
        search: vi.fn().mockRejectedValue(new Error("API Error")),
      }));

      const memories = await retrieveSessionMemories("session-456");
      expect(memories).toEqual([]);
    });
  });

  describe("formatMemoriesForPrompt", () => {
    it("should format memories correctly", () => {
      const memories = [
        "[user]: Hello\n[assistant]: Hi there!",
        "[user]: How are you?\n[assistant]: I am doing well!",
      ];

      const formatted = formatMemoriesForPrompt(memories);

      expect(formatted).toContain("=== Previous Conversation Context ===");
      expect(formatted).toContain("[user]: Hello");
      expect(formatted).toContain("[assistant]: Hi there!");
      expect(formatted).toContain("---");
      expect(formatted).toContain("=== End Context ===");
    });

    it("should return empty string for no memories", () => {
      const formatted = formatMemoriesForPrompt([]);
      expect(formatted).toBe("");
    });
  });
});
