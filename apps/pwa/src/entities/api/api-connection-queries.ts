import { queryOptions } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain";
import { ApiService } from "@/app/services";
import { ApiConnectionDrizzleMapper } from "@/entities/api/mappers/api-connection-drizzle-mapper";
import { ApiModel } from "@/entities/api/domain/api-model";
import { ApiConnection } from "@/entities/api/domain";
import { queryClient } from "@/shared/api/query-client";

// WeakMap cache for preventing unnecessary re-renders
// Uses data object references as keys for automatic garbage collection
const selectResultCache = new WeakMap<object, any>();

interface ListApiConnectionsParams {
  keyword?: string;
  limit?: number;
}

interface ApiConnectionWithModels {
  apiConnection: ApiConnection;
  models: ApiModel[];
}

export const apiConnectionQueries = {
  all: () => ["api_connections"] as const,

  // List queries - not cached, stores data in detail cache
  lists: () => [...apiConnectionQueries.all(), "list"] as const,
  list: (params: ListApiConnectionsParams = { keyword: "", limit: 100 }) =>
    queryOptions({
      queryKey: [...apiConnectionQueries.lists(), params],
      queryFn: async () => {
        const connectionsOrError = await ApiService.listApiConnection.execute({
          keyword: params.keyword!,
          limit: params.limit!,
        });
        if (connectionsOrError.isFailure) {
          return [];
        }
        const apiConnections = connectionsOrError.getValue();

        // Store each api connection in detail cache
        apiConnections.forEach((conn) => {
          queryClient.setQueryData(
            apiConnectionQueries.detail(conn.id).queryKey,
            ApiConnectionDrizzleMapper.toPersistence(conn),
          );
        });

        // Return persistence objects for caching
        return apiConnections.map((apiConnection) =>
          ApiConnectionDrizzleMapper.toPersistence(apiConnection),
        );
      },
      select: (data) => {
        if (!data || !Array.isArray(data)) return [];
        
        const cached = selectResultCache.get(data as object);
        if (cached) return cached;
        
        const result = data.map((apiConnection) =>
          ApiConnectionDrizzleMapper.toDomain(apiConnection as any),
        );
        
        selectResultCache.set(data as object, result);
        return result;
      },
      gcTime: 1000 * 30, // 30 seconds cache
      staleTime: 1000 * 10, // 10 seconds stale time
    }),

  // Complex composite queries - cached due to expensive operations
  withModels: () => [...apiConnectionQueries.all(), "with-models"] as const,
  listWithModels: () =>
    queryOptions({
      queryKey: [...apiConnectionQueries.withModels()],
      queryFn: async () => {
        // Get all api connections
        const connectionsOrError = await ApiService.listApiConnection.execute({
          limit: 100,
        });
        if (connectionsOrError.isFailure) {
          return [];
        }
        const connections = connectionsOrError.getValue();

        // Get models by connection
        const result: ApiConnectionWithModels[] = [];
        for (const connection of connections) {
          const modelsOrError = await ApiService.listApiModel.execute({
            apiConnectionId: connection.id,
          });
          result.push({
            apiConnection: connection,
            models: modelsOrError.isSuccess ? modelsOrError.getValue() : [],
          });
        }

        // Transform to persistence format for storage
        return result.map((item) => ({
          apiConnection: ApiConnectionDrizzleMapper.toPersistence(
            item.apiConnection,
          ),
          models: item.models.map((model) => model.props), // Serialize ApiModel props
        }));
      },
      select: (data) => {
        if (!data) return [];
        
        const cached = selectResultCache.get(data as object);
        if (cached) return cached;
        
        const result = data.map((item) => ({
          apiConnection: ApiConnectionDrizzleMapper.toDomain(
            item.apiConnection as any,
          ),
          models: item.models.map(
            (modelProps) => ApiModel.create(modelProps).getValue()!,
          ),
        }));
        
        selectResultCache.set(data as object, result);
        return result;
      },
    }),

  // Detail queries - cached for reuse
  details: () => [...apiConnectionQueries.all(), "detail"] as const,
  detail: (id?: UniqueEntityID) =>
    queryOptions({
      queryKey: [...apiConnectionQueries.details(), id?.toString() ?? ""],
      queryFn: async () => {
        if (!id) return null;
        // No network request if already cached from list query
        const apiConnectionOrError =
          await ApiService.getApiConnection.execute(id);
        if (apiConnectionOrError.isFailure) return null;
        const apiConnection = apiConnectionOrError.getValue();
        // Transform to persistence format for storage
        return ApiConnectionDrizzleMapper.toPersistence(apiConnection);
      },
      select: (data) => {
        if (!data) return null;
        
        const cached = selectResultCache.get(data as object);
        if (cached) return cached;
        
        const result = ApiConnectionDrizzleMapper.toDomain(data as any);
        selectResultCache.set(data as object, result);
        return result;
      },
      enabled: !!id,
    }),
};

/**
 * Helper functions to fetch api connections from cache and convert to domain objects
 * Note: queryClient.fetchQuery returns persistence objects, not domain objects
 * The select function only works in useQuery hooks, so we need to manually convert
 */

export async function fetchApiConnections(params: {
  keyword?: string;
  limit?: number;
} = {}): Promise<ApiConnection[]> {
  const data = await queryClient.fetchQuery(
    apiConnectionQueries.list({
      keyword: params.keyword || "",
      limit: params.limit || 100,
    })
  );

  if (!data || !Array.isArray(data)) return [];

  return data.map((conn) =>
    ApiConnectionDrizzleMapper.toDomain(conn as any)
  );
}

/**
 * Check if a specific model is available in the provider.
 * Uses cached query data for efficiency.
 * @param apiConnectionId - The API connection ID
 * @param modelId - The model ID to check
 * @returns true if model exists in the connection's model list
 */
export function isModelAvailableInProvider(
  apiConnectionId: string,
  modelId: string,
): boolean {
  // Try to get cached data from queryClient
  const cachedData = queryClient.getQueryData<ApiConnectionWithModels[]>(
    apiConnectionQueries.listWithModels().queryKey,
  );

  if (!cachedData) {
    // No cached data - assume model is available (will fail at inference if not)
    return true;
  }

  // Find the connection
  const connectionWithModels = cachedData.find(
    (item) => item.apiConnection.id.toString() === apiConnectionId,
  );

  if (!connectionWithModels) {
    return false;
  }

  // Check if model exists in the connection's model list
  return connectionWithModels.models.some((model) => model.id === modelId);
}

/**
 * Check if a default model selection is available (provider connected, model exists).
 * @param defaultModel - The default model selection to check
 * @returns true if provider is connected and model exists
 */
export function isDefaultModelAvailable(
  defaultModel: { apiConnectionId: string; modelId: string } | null,
): boolean {
  if (!defaultModel) return false;

  return isModelAvailableInProvider(
    defaultModel.apiConnectionId,
    defaultModel.modelId,
  );
}
