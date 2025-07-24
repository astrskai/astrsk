import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/utils/logger";

import {
  InsertApiConnection,
  SelectApiConnection,
} from "@/db/schema/api-connections";
import {
  ApiConnection,
  ApiSource,
  OpenrouterProviderSort,
} from "@/modules/api/domain";

export class ApiConnectionDrizzleMapper {
  private constructor() {}

  public static toDomain(row: SelectApiConnection): ApiConnection {
    // Create api connection
    const apiConnectionOrError = ApiConnection.create(
      {
        title: row.title,
        source: row.source as ApiSource,
        baseUrl: row.base_url ?? undefined,
        apiKey: row.api_key ?? undefined,
        modelUrls: row.model_urls ?? undefined,
        openrouterProviderSort:
          (row.openrouter_provider_sort as OpenrouterProviderSort) ?? undefined,
        updatedAt: row.updated_at,
      },
      new UniqueEntityID(row.id),
    );

    // Check error
    if (apiConnectionOrError.isFailure) {
      logger.error(apiConnectionOrError.getError());
      throw new Error(apiConnectionOrError.getError());
    }

    // Return api connection
    return apiConnectionOrError.getValue();
  }

  public static toPersistence(domain: ApiConnection): InsertApiConnection {
    return {
      id: domain.id.toString(),
      title: domain.title,
      source: domain.source,
      base_url: domain.baseUrl,
      api_key: domain.apiKey,
      model_urls: domain.modelUrls,
      openrouter_provider_sort: domain.openrouterProviderSort,
    };
  }

  public static toStorage(domain: ApiConnection): InsertApiConnection {
    const row = this.toPersistence(domain);
    return {
      ...row,
      updated_at: domain.updatedAt,
    };
  }
}
