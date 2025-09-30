import { queryOptions } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { SessionService } from "@/app/services/session-service";
import { SessionDrizzleMapper } from "@/modules/session/mappers/session-drizzle-mapper";
import { SearchSessionsQuery } from "@/modules/session/repos";
import { queryClient } from "@/app/queries/query-client";
import { Session } from "@/modules/session/domain/session";

// WeakMap cache for preventing unnecessary re-renders
// Uses data object references as keys for automatic garbage collection
const selectResultCache = new WeakMap<object, any>();

export const sessionQueries = {
  all: () => ["sessions"] as const,

  // List queries - not cached, stores data in detail cache
  lists: () => [...sessionQueries.all(), "list"] as const,
  list: (query: SearchSessionsQuery) =>
    queryOptions({
      queryKey: [...sessionQueries.lists(), query],
      queryFn: async () => {
        const result = await SessionService.searchSession.execute(query);
        if (result.isFailure) {
          console.error(result.getError());
          return [];
        }
        const sessions = result.getValue();

        // Store each session in detail cache
        sessions.forEach((session) => {
          queryClient.setQueryData(
            sessionQueries.detail(session.id).queryKey,
            SessionDrizzleMapper.toPersistence(session),
          );
        });

        // Return persistence objects for caching
        return sessions.map((session) =>
          SessionDrizzleMapper.toPersistence(session),
        );
      },
      select: (data) => {
        if (!data || !Array.isArray(data)) return [];
        
        const cached = selectResultCache.get(data as object);
        if (cached) return cached;
        
        const result = data.map((session) =>
          SessionDrizzleMapper.toDomain(session as any),
        );
        selectResultCache.set(data as object, result);
        return result;
      },
      gcTime: 1000 * 30, // 30 seconds cache
      staleTime: 1000 * 10, // 10 seconds stale time
    }),

  // Detail queries - cached for reuse
  details: () => [...sessionQueries.all(), "detail"] as const,
  detail: (id?: UniqueEntityID) =>
    queryOptions({
      queryKey: [...sessionQueries.details(), id?.toString() ?? ""],
      queryFn: async () => {
        if (!id) return null;
        // No network request if already cached from list query
        const sessionOrError = await SessionService.getSession.execute(id);
        if (sessionOrError.isFailure) return null;
        const session = sessionOrError.getValue();
        // Transform to persistence format for storage
        return SessionDrizzleMapper.toPersistence(session);
      },
      select: (data) => {
        if (!data) return null;
        
        const cached = selectResultCache.get(data as object);
        if (cached) return cached;
        
        const result = SessionDrizzleMapper.toDomain(data as any);
        selectResultCache.set(data as object, result);
        return result;
      },
      enabled: !!id,
    }),
};

/**
 * Helper functions to fetch sessions from cache and convert to domain objects
 * Note: queryClient.fetchQuery returns persistence objects, not domain objects
 * The select function only works in useQuery hooks, so we need to manually convert
 */

export async function fetchSession(id: UniqueEntityID): Promise<Session> {
  const data = await queryClient.fetchQuery(sessionQueries.detail(id));
  if (!data) {
    throw new Error(`Session not found: ${id.toString()}`);
  }
  return SessionDrizzleMapper.toDomain(data as any);
}
