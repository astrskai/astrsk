import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail, sanitizeToXmlTag } from "@/shared/lib";

import { Transaction } from "@/db/transaction";
import { Turn } from "@/entities/turn/domain/turn";
import { Option } from "@/entities/turn/domain/option";
import { SaveTurnRepo } from "@/entities/turn/repos/save-turn-repo";
import { LoadTurnRepo } from "@/entities/turn/repos/load-turn-repo";
import { CompressionSystem } from "@/entities/compression";
import { useCompressionStore } from "@/entities/compression/stores/compression-store";
import type { CompressionSegment } from "@/entities/compression/domain/types";
import { fetchSessionCharacterRegistry } from "@/entities/session/api/query-factory";

/**
 * Compress a turn's content using the compression system
 *
 * This runs after a turn is saved to compress its content and save anchors.
 * Compression is always enabled by default (90% size reduction).
 *
 * Updates the turn's options[0] with compression segments and saves to DB.
 *
 * The compression context (hybrid compressed + uncompressed) is retrieved from the
 * compression store if available (set by buildCompressionContext), otherwise falls back
 * to building uncompressed context from last 4 turns.
 */
export async function compressTurn(params: {
  turnId: UniqueEntityID;
  sessionId: UniqueEntityID;
  loadTurnRepo: LoadTurnRepo;
  saveTurnRepo: SaveTurnRepo;
  tx?: Transaction;
}): Promise<Result<Turn>> {
  const { turnId, sessionId, loadTurnRepo, saveTurnRepo, tx } = params;

  try {
    // Get character registry from TanStack Query cache (or DB if not cached)
    // Note: This is likely already cached from buildCompressionContext call
    const characterRegistry = await fetchSessionCharacterRegistry(sessionId.toString());

    // Load turn
    const turnResult = await loadTurnRepo.getTurnById(turnId, tx);
    if (turnResult.isFailure) {
      return formatFail("Failed to load turn", turnResult.getError());
    }
    const turn = turnResult.getValue();

    // Get content to compress (from options[0])
    const content = turn.content;
    if (!content || content.trim().length === 0) {
      // No content to compress
      return Result.ok(turn);
    }

    // Get character name (for compression)
    // Logic: char_name exists → sanitize it, char_id exists → 'user', else → 'scenario'
    const rawName = turn.characterName || (turn.characterCardId ? 'user' : 'scenario');
    const characterName = sanitizeToXmlTag(rawName);

    // Initialize compression system (always needed for compressMessage)
    const compressionSystem = new CompressionSystem();
    compressionSystem.initialize({
      sessionId: sessionId.toString(),
      characterRegistry,
    });

    // Try to get compression context from store (set by buildCompressionContext)
    // This contains the hybrid compressed context with relevant anchors already decompressed
    let previousContext: string | null = useCompressionStore.getState().getAndClearCompressionContext();

    if (!previousContext) {
      // Fallback: Build uncompressed context from last 4 turns
      previousContext = await compressionSystem.buildUncompressedContext();
      console.log('[Compression] Built fallback uncompressed context (no hybrid context in store)');
    }

    // Compress the message with previous context
    const compressionOutput = await compressionSystem.compressMessage(
      content,
      characterName,
      turnId.toString(),
      previousContext || undefined
    );

    // Build compressed XML from segments: <characterName><anchor1/><anchor2/>...</characterName>
    const compressedText = `<${characterName.toLowerCase()}>\n${compressionOutput.segments.map((s: CompressionSegment) => `<${s.anchor}/>`).join('\n')}\n</${characterName.toLowerCase()}>`;

    // Update ONLY the selected option with compression data
    // Keep all other options intact (important for regeneration feature)
    const updatedOption = Option.create({
      content: turn.selectedOption.content,
      tokenSize: turn.selectedOption.tokenSize,
      variables: turn.selectedOption.variables,
      assetId: turn.selectedOption.assetId,
      dataStore: turn.selectedOption.dataStore,
      translations: turn.selectedOption.translations,
      compressionSegments: compressionOutput.segments,
      compressedText: compressedText, // Store pre-built compressed XML
    }).getValue();

    // Replace only the selected option, keep all others
    const updatedOptions = [...turn.options];
    updatedOptions[turn.selectedOptionIndex] = updatedOption;

    // Create new turn with all options preserved
    const updatedTurn = Turn.create({
      sessionId: turn.sessionId,
      characterCardId: turn.characterCardId,
      characterName: turn.characterName,
      options: updatedOptions,
      selectedOptionIndex: turn.selectedOptionIndex,
      createdAt: turn.createdAt,
      updatedAt: new Date(), // Update timestamp
    }, turn.id).getValue();

    // Save updated turn
    const savedTurnResult = await saveTurnRepo.saveTurn(updatedTurn, tx);
    if (savedTurnResult.isFailure) {
      return formatFail("Failed to save compressed turn", savedTurnResult.getError());
    }

    console.log(`[Compression] Compressed turn ${turnId.toString()}: ${compressionOutput.segments.length} segments`);

    return Result.ok(savedTurnResult.getValue());
  } catch (error) {
    // Check if this is a network error (backend not running)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('404') || errorMessage.includes('Failed to fetch')) {
      console.warn(
        '[Compression] Compression backend not available (is the server running on VITE_COMPRESSION_API_URL?). Turn saved without compression.',
      );
      // Return the uncompressed turn - graceful degradation
      const turnResult = await loadTurnRepo.getTurnById(turnId, tx);
      if (turnResult.isFailure) {
        return formatFail("Failed to load turn after compression error", turnResult.getError());
      }
      return Result.ok(turnResult.getValue());
    }

    // For other errors, fail normally
    return formatFail("Failed to compress turn", error);
  }
}
