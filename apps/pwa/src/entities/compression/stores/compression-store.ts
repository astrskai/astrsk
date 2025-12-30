import { create } from "zustand";
import type { AnchorData } from "@/entities/compression/domain/types";
import { CompressionAnchorRepo } from "@/entities/compression/repos";

/**
 * Compression Store State
 * Simple wrapper around repository for anchor lookups
 * All anchor keys stored in DB, no in-memory cache needed
 */
interface CompressionStoreState {
  // Current session ID (for scoping queries)
  sessionId: string | null;

  // Repository instance
  repo: CompressionAnchorRepo;

  // Temporary storage for compression context (hybrid compressed + uncompressed)
  // Set by buildCompressionContext, consumed by compressTurn, then cleared
  compressionContext: string | null;

  // ========================================
  // ACTIONS
  // ========================================

  /**
   * Initialize store for a new session
   */
  initialize: (sessionId: string) => void;

  /**
   * Get anchor data by name from DB
   */
  getAnchor: (anchorName: string) => Promise<AnchorData | null>;

  /**
   * Get multiple anchors by names from DB
   * Returns arrays of anchor instances (supports duplicate anchor names across turns)
   */
  getAnchors: (anchorNames: string[]) => Promise<Record<string, AnchorData[]>>;

  /**
   * Get all anchors for a character from DB
   */
  getAnchorsByCharacter: (characterName: string) => Promise<Record<string, AnchorData>>;

  /**
   * Set compression context (called by buildCompressionContext)
   */
  setCompressionContext: (context: string) => void;

  /**
   * Get and clear compression context (called by compressTurn)
   */
  getAndClearCompressionContext: () => string | null;

  /**
   * Clear session context
   */
  reset: () => void;
}

/**
 * Compression Store
 * Simple DB-backed anchor storage
 */
export const useCompressionStore = create<CompressionStoreState>((set, get) => ({
  // Initial state
  sessionId: null,
  repo: new CompressionAnchorRepo(),
  compressionContext: null,

  /**
   * Initialize for new session
   */
  initialize: (sessionId: string) => {
    set({ sessionId, compressionContext: null });
    console.log(`[CompressionStore] Initialized for session ${sessionId}`);
  },

  /**
   * Get single anchor from DB
   */
  getAnchor: async (anchorName: string) => {
    const { sessionId, repo } = get();

    if (!sessionId) {
      console.warn("[CompressionStore] getAnchor called without session ID");
      return null;
    }

    return repo.findAnchorByName(sessionId, anchorName);
  },

  /**
   * Get multiple anchors from DB (optimized batch query)
   */
  getAnchors: async (anchorNames: string[]) => {
    const { sessionId, repo } = get();

    if (!sessionId) {
      console.warn("[CompressionStore] getAnchors called without session ID");
      return {};
    }

    return repo.findAnchorsByNames(sessionId, anchorNames);
  },

  /**
   * Get anchors for specific character from DB
   */
  getAnchorsByCharacter: async (characterName: string) => {
    const { sessionId, repo } = get();

    if (!sessionId) {
      console.warn(
        "[CompressionStore] getAnchorsByCharacter called without session ID"
      );
      return {};
    }

    return repo.findAnchorsByCharacter(sessionId, characterName);
  },

  /**
   * Set compression context (called by buildCompressionContext)
   */
  setCompressionContext: (context: string) => {
    set({ compressionContext: context });
    console.log(`[CompressionStore] Stored compression context (${context.length} chars)`);
  },

  /**
   * Get and clear compression context (called by compressTurn)
   * Returns the stored context and immediately clears it
   */
  getAndClearCompressionContext: () => {
    const { compressionContext } = get();
    set({ compressionContext: null });
    if (compressionContext) {
      console.log(`[CompressionStore] Retrieved and cleared compression context (${compressionContext.length} chars)`);
    }
    return compressionContext;
  },

  /**
   * Clear session context
   */
  reset: () => {
    set({ sessionId: null, compressionContext: null });
    console.log("[CompressionStore] Session context cleared");
  },
}));
