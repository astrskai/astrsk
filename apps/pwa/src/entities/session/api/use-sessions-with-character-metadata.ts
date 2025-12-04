/**
 * useSessionsWithCharacterMetadata Hook
 *
 * Batch Prefetch Pattern for Session + Character Data
 *
 * **Why this approach?**
 * - ✅ Perfect data consistency: Character info managed in single source (card table)
 * - ✅ TanStack Query caching: Character fetched once, reused across all sessions
 * - ✅ Auto-invalidation: Character updates automatically refresh all views
 * - ✅ Parallel fetching: All characters loaded simultaneously via useQueries
 * - ✅ Zero synchronization logic: No denormalization sync headaches
 *
 * **Performance:**
 * - Initial load: N character API calls (but cached forever)
 * - Subsequent loads: 0 additional calls (cache hit)
 * - Character update: Auto-refresh via query invalidation
 *
 * **Comparison to Denormalization:**
 *
 * | Metric                  | Batch Prefetch | Denormalization |
 * |-------------------------|----------------|-----------------|
 * | Read Performance        | ⭐⭐⭐⭐         | ⭐⭐⭐⭐⭐       |
 * | Write Performance       | ⭐⭐⭐⭐⭐       | ⭐⭐            |
 * | Data Consistency        | ⭐⭐⭐⭐⭐       | ⭐⭐            |
 * | Code Complexity         | ⭐⭐⭐⭐         | ⭐⭐⭐          |
 * | Sync Risk               | ⭐⭐⭐⭐⭐ (None) | ⭐⭐ (High)     |
 */

import { useQuery, useQueries } from "@tanstack/react-query";
import { cardQueries } from "@/entities/card/api/query-factory";
import { sessionQueries } from "@/entities/session/api/query-factory";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { Session } from "@/entities/session/domain";

export interface CharacterMetadata {
  name: string; // CharacterCard name is required, but may be empty string
  iconAssetId?: string;
}

export interface SessionWithCharacterMetadata {
  session: Session;
  characterAvatars: CharacterMetadata[];
}

export interface SessionListFilters {
  keyword?: string;
  sort?: string;
  isPlaySession?: boolean;
}

/**
 * Hook to fetch sessions with character metadata prefetched in parallel
 *
 * @example
 * ```tsx
 * const { sessions, isLoading } = useSessionsWithCharacterMetadata({
 *   keyword: "adventure",
 *   sort: "updated_at_desc"
 * });
 *
 * sessions.map(({ session, characterAvatars }) => (
 *   <SessionCard
 *     title={session.title}
 *     characterAvatars={characterAvatars}
 *   />
 * ))
 * ```
 */
export function useSessionsWithCharacterMetadata(filters: SessionListFilters = {}) {
  // 1. Fetch all sessions with filters
  const { data: sessions = [], ...sessionQuery } = useQuery(
    sessionQueries.list(filters)
  );

  // 2. Extract unique character IDs from all sessions (only enabled characters)
  const uniqueCharacterIds = Array.from(
    new Set(
      sessions.flatMap((session) =>
        session.characterCards
          .filter((card) => card.enabled)
          .map((card) => card.id.toString())
      )
    )
  );

  // 3. Batch prefetch all character cards in parallel
  // TanStack Query automatically deduplicates and caches
  const characterQueries = useQueries({
    queries: uniqueCharacterIds.map((characterId) =>
      cardQueries.detail(characterId)
    ),
  });

  // 4. Build character metadata map from cache
  const characterMetadataMap = new Map<string, CharacterMetadata>();

  for (const query of characterQueries) {
    if (query.data && query.data instanceof CharacterCard) {
      const card = query.data as CharacterCard;
      // Only add characters with names (skip if name is undefined/empty)
      if (card.props.name) {
        characterMetadataMap.set(card.id.toString(), {
          name: card.props.name,
          iconAssetId: card.props.iconAssetId?.toString(),
        });
      }
    }
  }

  // 5. Enrich sessions with character metadata (only enabled characters)
  const enrichedSessions: SessionWithCharacterMetadata[] = sessions.map((session) => ({
    session,
    characterAvatars: session.characterCards
      .filter((card) => card.enabled)
      .map((card) => characterMetadataMap.get(card.id.toString()))
      .filter((metadata): metadata is CharacterMetadata => metadata !== undefined),
  }));

  return {
    sessions: enrichedSessions,
    // Combined loading state (backward compatibility)
    isLoading: sessionQuery.isLoading || characterQueries.some((q) => q.isLoading),
    // Granular loading states for progressive rendering
    isSessionsLoading: sessionQuery.isLoading,
    areCharactersLoading: characterQueries.some((q) => q.isLoading),
    isError: sessionQuery.isError || characterQueries.some((q) => q.isError),
    error: sessionQuery.error,
  };
}
