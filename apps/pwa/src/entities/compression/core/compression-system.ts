import { compressionApi } from "@/entities/compression/api";
import { useCompressionStore } from "@/entities/compression/stores";
import { CompressionAnchorRepo } from "@/entities/compression/repos";
import type {
  CompressionOutput,
  CompressionSegment,
} from "@/entities/compression/domain/types";
import type { InsertCompressionAnchor } from "@/db/schema/compression-anchors";
import type { LoadTurnRepo } from "@/entities/turn/repos/load-turn-repo";
import { UniqueEntityID } from "@/shared/domain";
import { sanitizeToXmlTag, fuzzyMatchCharacterName } from "@/shared/lib";

/**
 * CompressionSystem
 * High-level orchestration of compression features
 * Coordinates store, API, and repository
 */
export class CompressionSystem {
  private store = useCompressionStore.getState();
  private repo = new CompressionAnchorRepo();
  private turnRepo: LoadTurnRepo | null = null;
  private sessionId: string | null = null;
  private characterRegistry: Record<string, string> = {};

  /**
   * Initialize compression system for a session
   */
  initialize(params: {
    sessionId: string;
    characterRegistry: Record<string, string>;
    turnRepo?: LoadTurnRepo;
  }): void {
    this.sessionId = params.sessionId;
    this.characterRegistry = params.characterRegistry;
    this.turnRepo = params.turnRepo || null;
    this.store.initialize(params.sessionId);
  }

  /**
   * Compress a new message and save to DB
   * Returns compression output for storage in Turn.options[0]
   */
  async compressMessage(
    text: string,
    characterName: string,
    turnId: string,
    previousContext?: string
  ): Promise<CompressionOutput> {
    if (!this.sessionId) {
      throw new Error("CompressionSystem not initialized with session ID");
    }

    // Call compression API - backend will store anchors in Redis
    const output = await compressionApi.compress({
      text,
      type: 'message',
      characterName,
      characterRegistry: this.characterRegistry,
      previousContext,
      sessionId: this.sessionId, // Backend stores anchors in Redis by sessionId
      turnId, // Backend stores turnId for anchor cleanup on turn deletion
    });

    // Save anchors to DB for fast lookup
    // Normalize accessible_to to use sanitized character names (e.g., "John" -> "john-the-great")
    const anchorInserts: InsertCompressionAnchor[] = output.segments.map(
      (segment, index) => ({
        session_id: this.sessionId!,
        turn_id: turnId,
        anchor: segment.anchor,
        text: this.extractSegmentText(
          text,
          segment.starting_text,
          output.segments[index + 1]?.starting_text // Next segment's starting_text
        ),
        accessible_to: this.normalizeAccessibleTo(segment.accessible_to),
        starting_text: segment.starting_text,
        character_name: characterName,
      })
    );

    await this.repo.saveAnchors(anchorInserts);

    console.log(
      `[CompressionSystem] Compressed message: ${output.segments.length} anchors`
    );

    return output;
  }

  /**
   * Retrieve relevant context for a user query
   * Returns hybrid context: compressed XML with relevant anchors decompressed inline
   *
   * Example output:
   * <yui>
   * <unrelated-anchor/>
   *
   * [Decompressed text for relevant anchor about conversation]
   *
   * <another-unrelated-anchor/>
   * </yui>
   *
   * @param recentUncompressedContext - Last 4 messages uncompressed (for retrieval agent context)
   */
  async retrieveContext(
    userQuery: string,
    characterName: string,
    compressedContext: string,
    recentUncompressedContext?: string
  ): Promise<string> {
    if (!this.sessionId) {
      throw new Error("CompressionSystem not initialized with session ID");
    }

    // Combine compressed and recent uncompressed for retrieval agent to analyze
    // This gives the LLM full context to make informed decisions about which anchors are relevant
    const fullContextForRetrieval = recentUncompressedContext
      ? `${compressedContext}\n\n${recentUncompressedContext}`
      : compressedContext;

    // Call retrieval API to get relevant anchor names
    // Backend searches Redis by sessionId and returns relevant anchor names
    const retrievalResult = await compressionApi.retrieve({
      query: userQuery,
      compressedText: fullContextForRetrieval,
      requestingCharacter: characterName,
      sessionId: this.sessionId, // Backend uses sessionId to search Redis
    });

    const { relevantAnchors, key_concepts, response_goal } = retrievalResult;

    if (relevantAnchors.length === 0) {
      console.log("[CompressionSystem] No relevant anchors found for query");
      return compressedContext; // Return full compressed context if no relevant anchors
    }

    // Fetch ONLY the relevant anchors from DB (optimized batch query)
    // This is much more efficient than fetching all session anchors
    const anchorMappings = await this.repo.findAnchorsByNames(
      this.sessionId,
      relevantAnchors
    );

    // Build hybrid context: keep compressed XML but replace relevant anchor tags with decompressed text
    // Example: <yui><anchor1/><relevant-anchor/>...<anchor5/></yui>
    //       -> <yui><anchor1/>\n\nDecompressed text for relevant-anchor\n\n...<anchor5/></yui>
    let hybridContext = compressedContext;

    // Track occurrence index for each anchor to replace in turn order
    const anchorOccurrences: Record<string, number> = {};

    for (const anchorName of relevantAnchors) {
      const anchorInstances = anchorMappings[anchorName];
      if (!anchorInstances || anchorInstances.length === 0) continue;

      // Initialize occurrence counter for this anchor
      if (!anchorOccurrences[anchorName]) {
        anchorOccurrences[anchorName] = 0;
      }

      // Replace each occurrence sequentially with the correct turn's content
      // Use replace callback to handle multiple occurrences
      // Escape regex metacharacters to prevent unexpected matching behavior
      const escapedAnchorName = anchorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const anchorTagRegex = new RegExp(`<${escapedAnchorName}\\s*/>`, 'g');
      hybridContext = hybridContext.replace(
        anchorTagRegex,
        () => {
          const index = anchorOccurrences[anchorName];
          // Use the corresponding turn's content, or fallback to last instance if we run out
          const anchorData = anchorInstances[index] || anchorInstances[anchorInstances.length - 1];
          anchorOccurrences[anchorName]++;
          return `\n\n${anchorData.text}\n\n`;
        }
      );
    }

    console.log(
      `[CompressionSystem] Retrieved ${relevantAnchors.length} anchors, decompressed ${Object.keys(anchorMappings).length} anchors into hybrid context`
    );
    console.log(`[CompressionSystem] Relevant anchors: [${relevantAnchors.join(", ")}]`);
    console.log(`[CompressionSystem] Key concepts: ${key_concepts?.join(", ") || "(none)"}`);
    console.log(`[CompressionSystem] Response goal: ${response_goal || "(none)"}`);
    console.log(`[CompressionSystem] Hybrid context length: ${hybridContext.length} chars (was ${compressedContext.length} chars compressed)`);

    return hybridContext;
  }

  /**
   * Handle a full query with compression/retrieval/response
   * Used for chat completion agents with compression enabled
   */
  async handleQuery(
    userQuery: string,
    characterName: string,
    systemPrompt: string,
    compressedContext: string
  ): Promise<string> {
    // Retrieve relevant context
    const decompressedContext = await this.retrieveContext(
      userQuery,
      characterName,
      compressedContext
    );

    // Generate response with decompressed context
    const response = await compressionApi.generateResponse({
      user_query: userQuery,
      system_prompt: systemPrompt,
      decompressed_context: decompressedContext,
      character_name: characterName,
    });

    return response;
  }

  /**
   * Build uncompressed XML context from last 4 turns in session
   * Used as previousContext parameter for compression API
   *
   * Format: <characterName>\nfull message content\n</characterName>
   *
   * @returns Uncompressed XML context of last 4 messages
   */
  async buildUncompressedContext(): Promise<string> {
    if (!this.sessionId) {
      throw new Error("CompressionSystem not initialized with session ID");
    }

    // Get last 4 turns from DB
    const anchors = await this.repo.findAnchorsBySessionId(this.sessionId);

    if (anchors.length === 0) {
      return "";
    }

    // Group by turn_id and get last 4 turns
    const turnMap = new Map<string, typeof anchors>();
    for (const anchor of anchors) {
      if (!turnMap.has(anchor.turn_id)) {
        turnMap.set(anchor.turn_id, []);
      }
      turnMap.get(anchor.turn_id)!.push(anchor);
    }

    // Get last 4 turn IDs (sorted by order they appear)
    const turnIds = Array.from(turnMap.keys()).slice(-4);

    // Build uncompressed XML for last 4 turns
    const uncompressedBlocks: string[] = [];
    for (const turnId of turnIds) {
      const turnAnchors = turnMap.get(turnId)!;
      if (turnAnchors.length === 0) continue;

      // Use first anchor's character name for the block
      // Fallback to 'scenario' if no character_name (should not happen with correct data)
      const rawName = turnAnchors[0].character_name || 'scenario';
      const characterName = sanitizeToXmlTag(rawName);

      // Concatenate all anchor texts for this turn
      const fullContent = turnAnchors.map(a => a.text).join('\n');

      uncompressedBlocks.push(`<${characterName}>\n${fullContent}\n</${characterName}>`);
    }

    const uncompressedContext = uncompressedBlocks.join('\n');

    console.log(
      `[CompressionSystem] Built uncompressed context: ${uncompressedBlocks.length} messages from last ${turnIds.length} turns`
    );

    return uncompressedContext;
  }

  /**
   * Build compressed XML context from turns in session
   * Used for retrieval API input
   *
   * Format: <characterName><anchor1/><anchor2/>...</characterName>
   *
   * This method fetches the pre-built compressedText from each turn's Option
   * and concatenates them, instead of rebuilding from scratch.
   *
   * @param filterCharacterName - Optional character name to filter by access control
   *                              If provided, only includes anchors accessible to this character
   * @param includeFirstN - Number of turns to include from the start (default 0 = all turns).
   *                        Example: For 7 messages (3 to compress, 4 recent uncompressed), pass includeFirstN=3.
   */
  async buildCompressedContext(filterCharacterName?: string, includeFirstN: number = 0): Promise<string> {
    if (!this.sessionId) {
      throw new Error("CompressionSystem not initialized with session ID");
    }

    // If turnRepo is available, use stored compressedText from turns
    if (this.turnRepo) {
      const turnsResult = await this.turnRepo.getTurnsBySessionId(
        new UniqueEntityID(this.sessionId)
      );

      if (turnsResult.isFailure) {
        console.error("[CompressionSystem] Failed to fetch turns:", turnsResult.getError());
        return "";
      }

      const allTurns = turnsResult.getValue();
      if (allTurns.length === 0) {
        console.log("[CompressionSystem] No turns found for session");
        return "";
      }

      console.log(`[CompressionSystem] Total turns fetched: ${allTurns.length}, includeFirstN: ${includeFirstN}`);

      // Include only first N turns (e.g., first 3 for compression when we have 7 messages)
      const turns = includeFirstN > 0 ? allTurns.slice(0, includeFirstN) : allTurns;

      console.log(`[CompressionSystem] Turns after inclusion: ${turns.length} (requested ${includeFirstN || 'all'})`);

      if (turns.length === 0) {
        console.log(`[CompressionSystem] No turns to compress (includeFirstN=${includeFirstN})`);
        return "";
      }

      // Filter and collect compressedText from each turn's selected option
      // Build hybrid context: use compressed where available, fallback to uncompressed
      const contextBlocks: string[] = [];
      let totalAnchors = 0;
      let includedAnchors = 0;
      let uncompressedCount = 0;
      const MAX_UNCOMPRESSED = 20; // Safety limit for uncompressed messages

      // Normalize filter character name using registry
      const normalizedFilterName = filterCharacterName
        ? this.normalizeCharacterName(filterCharacterName)
        : null;

      for (const turn of turns) {
        const compressedText = turn.selectedOption.compressedText;

        // Handle turns without compression data (mixed sessions: old uncompressed + new compressed)
        if (!compressedText) {
          // Limit uncompressed messages to prevent context explosion
          if (uncompressedCount >= MAX_UNCOMPRESSED) {
            console.log(`[CompressionSystem] Skipping uncompressed turn (limit ${MAX_UNCOMPRESSED} reached)`);
            continue;
          }

          // Build uncompressed block for this turn
          const rawName = turn.characterName || 'unknown';
          const characterName = sanitizeToXmlTag(rawName);
          const content = turn.content || '';
          const uncompressedBlock = `<${characterName}>\n${content}\n</${characterName}>`;

          contextBlocks.push(uncompressedBlock);
          uncompressedCount++;
          console.log(`[CompressionSystem] Using uncompressed turn ${uncompressedCount}/${MAX_UNCOMPRESSED}`);
          continue;
        }

        // Count total anchors
        const segments = turn.selectedOption.compressionSegments || [];
        totalAnchors += segments.length;

        // If filtering by character, check access control
        if (normalizedFilterName) {
          // Filter segments by access control
          const accessibleSegments = segments.filter((segment: CompressionSegment) =>
            this.isAccessibleTo(segment.accessible_to, normalizedFilterName)
          );

          // Skip turn if no accessible segments
          if (accessibleSegments.length === 0) continue;

          includedAnchors += accessibleSegments.length;

          // Rebuild compressedText with only accessible anchors
          const rawName = turn.characterName || 'unknown';
          const characterName = sanitizeToXmlTag(rawName);
          const anchorTags = accessibleSegments.map((s: CompressionSegment) => `<${s.anchor}/>`).join('\n');
          const filteredCompressedText = `<${characterName}>\n${anchorTags}\n</${characterName}>`;

          contextBlocks.push(filteredCompressedText);
        } else {
          // No filtering - use stored compressedText as-is
          includedAnchors += segments.length;
          contextBlocks.push(compressedText);
        }
      }

      if (contextBlocks.length === 0) {
        const msg = normalizedFilterName
          ? `No anchors accessible to character: ${filterCharacterName}`
          : "No context available (no compressed or uncompressed turns)";
        console.log(`[CompressionSystem] ${msg}`);
        return "";
      }

      const compressedContext = contextBlocks.join('\n\n');

      const filterInfo = normalizedFilterName
        ? ` (filtered for character: ${filterCharacterName})`
        : '';
      console.log(
        `[CompressionSystem] Built hybrid context: ${includedAnchors}/${totalAnchors} anchors, ${contextBlocks.length} turns (${uncompressedCount} uncompressed)${filterInfo}`
      );

      return compressedContext;
    }

    // FALLBACK: If no turnRepo, use anchor-based rebuild (legacy behavior)
    console.warn("[CompressionSystem] No turnRepo provided, falling back to anchor-based rebuild");

    const anchors = await this.repo.findAnchorsBySessionId(this.sessionId);

    if (anchors.length === 0) {
      console.log("[CompressionSystem] No compressed anchors found for session");
      return "";
    }

    // Normalize filter character name using registry
    const normalizedFilterName = filterCharacterName
      ? this.normalizeCharacterName(filterCharacterName)
      : null;

    // Filter anchors by access control if character name provided
    const filteredAnchors = normalizedFilterName
      ? anchors.filter(anchor => this.isAccessibleTo(anchor.accessible_to, normalizedFilterName))
      : anchors;

    if (filteredAnchors.length === 0) {
      console.log(`[CompressionSystem] No anchors accessible to character: ${filterCharacterName}`);
      return "";
    }

    // Group anchors by turn_id to reconstruct compressedText for each turn
    const turnMap = new Map<string, typeof anchors>();
    for (const anchor of filteredAnchors) {
      if (!turnMap.has(anchor.turn_id)) {
        turnMap.set(anchor.turn_id, []);
      }
      turnMap.get(anchor.turn_id)!.push(anchor);
    }

    // Build compressed XML blocks per turn
    const compressedBlocks: string[] = [];
    for (const turnAnchors of turnMap.values()) {
      if (turnAnchors.length === 0) continue;

      // Use first anchor's character name for the block
      // Fallback to 'scenario' if no character_name (should not happen with correct data)
      const rawName = turnAnchors[0].character_name || 'scenario';
      const characterName = sanitizeToXmlTag(rawName);

      // Reconstruct compressedText: <characterName><anchor1/><anchor2/>...</characterName>
      const anchorTags = turnAnchors.map(a => `<${a.anchor}/>`).join('\n');
      const compressedText = `<${characterName}>\n${anchorTags}\n</${characterName}>`;

      compressedBlocks.push(compressedText);
    }

    const compressedContext = compressedBlocks.join('\n\n');

    const filterInfo = normalizedFilterName
      ? ` (filtered for character: ${filterCharacterName})`
      : '';
    console.log(
      `[CompressionSystem] Built compressed context (fallback): ${filteredAnchors.length}/${anchors.length} anchors, ${compressedBlocks.length} turns${filterInfo}`
    );

    return compressedContext;
  }

  /**
   * Extract text segment from original content
   * Uses starting_text as reference point and extracts up to next segment or end
   *
   * Supports fuzzy matching for cases where backend LLM adds quotes/punctuation
   */
  private extractSegmentText(
    originalText: string,
    startingText: string,
    nextStartingText?: string
  ): string {
    // Helper: Normalize text to letters and spaces only for matching
    const normalizeForMatching = (text: string): string => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove all punctuation, keep only letters, numbers, spaces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    };

    // Try exact match first
    let startIndex = originalText.indexOf(startingText);

    // Fallback 1: Try normalized letter-only match (ignoring punctuation)
    if (startIndex === -1) {
      const normalizedOriginal = normalizeForMatching(originalText);
      const normalizedStarting = normalizeForMatching(startingText);

      if (normalizedStarting.length >= 3) {
        const normalizedIndex = normalizedOriginal.indexOf(normalizedStarting);

        if (normalizedIndex !== -1) {
          // Find the corresponding position in the original text
          // by counting non-punctuation characters
          let charCount = 0;
          for (let i = 0; i < originalText.length; i++) {
            const normalizedChar = normalizeForMatching(originalText[i]);
            if (normalizedChar.length > 0) {
              if (charCount === normalizedIndex) {
                startIndex = i;
                console.warn(
                  `[CompressionSystem] Used normalized match: "${startingText}" (ignoring punctuation)`
                );
                break;
              }
              charCount += normalizedChar.length;
            }
          }
        }
      }
    }

    // Fallback 2: Try partial match with first few words (minimum 3 words or 10 chars)
    if (startIndex === -1) {
      // Extract core content (remove quotes, punctuation from both ends)
      const coreStartingText = startingText
        .replace(/^["''""\s]+|["''""\s]+$/g, '') // Remove quotes/spaces from ends
        .trim();

      // Validation: Must have at least 3 characters
      if (coreStartingText.length < 3) {
        console.warn(
          `[CompressionSystem] starting_text too short for partial match: "${startingText}"`
        );
      } else {
        // Use first 10 characters or 3 words, whichever is longer
        const words = coreStartingText.split(/\s+/).filter(w => w.length > 0);
        const partialMatch = words.length >= 3
          ? words.slice(0, 3).join(' ')
          : coreStartingText.slice(0, Math.min(10, coreStartingText.length));

        // Try normalized partial match
        const normalizedOriginal = normalizeForMatching(originalText);
        const normalizedPartial = normalizeForMatching(partialMatch);

        const matchIndex = normalizedOriginal.indexOf(normalizedPartial);
        if (matchIndex !== -1) {
          // Find corresponding position in original text
          let charCount = 0;
          for (let i = 0; i < originalText.length; i++) {
            const normalizedChar = normalizeForMatching(originalText[i]);
            if (normalizedChar.length > 0) {
              if (charCount === matchIndex) {
                startIndex = i;
                console.warn(
                  `[CompressionSystem] Used normalized partial match: "${startingText}" -> "${partialMatch}"`
                );
                break;
              }
              charCount += normalizedChar.length;
            }
          }
        }
      }
    }

    if (startIndex === -1) {
      console.warn(
        `[CompressionSystem] Could not find starting_text: "${startingText}"`
      );
      console.warn(
        `[CompressionSystem] Original text snippet: "${originalText.substring(0, 100)}..."`
      );
      return originalText;
    }

    // If there's a next segment, extract up to it; otherwise extract to end
    if (nextStartingText) {
      const endIndex = originalText.indexOf(nextStartingText, startIndex + startingText.length);
      if (endIndex !== -1) {
        return originalText.substring(startIndex, endIndex).trim();
      }
    }

    // No next segment or next segment not found - extract to end
    return originalText.substring(startIndex).trim();
  }

  /**
   * Normalize character name for comparison
   * Uses character registry to map display names to normalized names with fuzzy matching
   * Falls back to lowercase if not in registry
   *
   * Example: "Yui" -> "yui" (via registry) or "Ren" -> "ren" (fallback)
   * Example: "Alise" -> "alice" (fuzzy match with registry)
   */
  private normalizeCharacterName(characterName: string): string {
    const normalized = characterName.toLowerCase().trim();

    // Check if this is a display name in the registry using fuzzy matching
    for (const [normalizedName, displayName] of Object.entries(this.characterRegistry)) {
      if (fuzzyMatchCharacterName(displayName, characterName)) {
        return normalizedName;
      }
    }

    // If not in registry, return lowercase version
    return normalized;
  }

  /**
   * Normalize accessible_to array from compression agent output
   * Converts character names to sanitized kebab-case format
   * Expands "*" to current session's character list
   *
   * Example: ["John", "Alice"] -> ["john-the-great", "alice"]
   * Example: ["*"] -> ["john-the-great", "alice", "scenario"]
   */
  private normalizeAccessibleTo(accessibleTo: string[]): string[] {
    // If "*", expand to all characters in registry + system characters
    if (accessibleTo.includes("*")) {
      const allCharacters = new Set<string>();
      // Add all characters from registry (already sanitized keys)
      Object.keys(this.characterRegistry).forEach(name => allCharacters.add(name));

      // Always include common system characters
      allCharacters.add("scenario");
      allCharacters.add("user");

      return Array.from(allCharacters);
    }

    // Normalize each character name using registry + fuzzy matching
    return accessibleTo.map(name => {
      // Try to find matching display name in registry
      for (const [sanitizedName, displayName] of Object.entries(this.characterRegistry)) {
        if (fuzzyMatchCharacterName(displayName, name)) {
          return sanitizedName; // Return sanitized version
        }
      }

      // Fallback: sanitize the name ourselves
      return sanitizeToXmlTag(name);
    });
  }

  /**
   * Check if anchor is accessible to a character
   * Uses fuzzy matching to handle slight name variations
   * @param accessibleTo - Array of character names who can access this anchor (["*"] means all)
   * @param characterName - Character name to check
   */
  private isAccessibleTo(accessibleTo: string[], characterName: string): boolean {
    // "*" means accessible to all characters
    if (accessibleTo.includes("*")) {
      return true;
    }

    // Use fuzzy matching to check if character name matches any in the access list
    return accessibleTo.some(name => fuzzyMatchCharacterName(name, characterName));
  }

  /**
   * Clear system state
   */
  reset(): void {
    this.sessionId = null;
    this.characterRegistry = {};
    this.store.reset();
    console.log("[CompressionSystem] Reset");
  }
}
