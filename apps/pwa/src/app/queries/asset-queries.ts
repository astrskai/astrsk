import { queryOptions } from "@tanstack/react-query";
import { UniqueEntityID } from "@/shared/domain";
import { AssetService } from "@/app/services/asset-service";
import { AssetDrizzleMapper } from "@/modules/asset/mappers/asset-drizzle-mapper";
import { logger } from "@/shared/lib/logger";

export const assetQueries = {
  all: () => ["assets"] as const,

  details: () => [...assetQueries.all(), "detail"] as const,
  detail: (id?: UniqueEntityID) =>
    queryOptions({
      queryKey: [...assetQueries.details(), id?.toString() ?? ""],
      queryFn: async () => {
        if (!id) return null;
        const assetOrError = await AssetService.getAsset.execute(id);
        if (assetOrError.isFailure) {
          logger.error(
            `Failed to get asset(${id.toString()})`,
            assetOrError.getError(),
          );
          return null;
        }
        const asset = assetOrError.getValue();

        // Transform to persistence format for storage
        const persistedAsset = AssetDrizzleMapper.toPersistence(asset);

        // Return OPFS file path (for asset hook, we only need the file path)
        return persistedAsset.file_path;
      },
      select: (data) => {
        // For asset hook, we only need the file path, not the full domain object
        return data;
      },
      enabled: !!id,
    }),
    
  // New query that returns full asset metadata including mime type
  fullDetail: (id?: UniqueEntityID) =>
    queryOptions({
      queryKey: [...assetQueries.details(), "full", id?.toString() ?? ""],
      queryFn: async () => {
        if (!id) return null;
        const assetOrError = await AssetService.getAsset.execute(id);
        if (assetOrError.isFailure) {
          logger.error(
            `Failed to get asset(${id.toString()})`,
            assetOrError.getError(),
          );
          return null;
        }
        const asset = assetOrError.getValue();

        // Return full asset with metadata
        return {
          filePath: asset.filePath,
          mimeType: asset.mimeType,
          name: asset.name
        };
      },
      enabled: !!id,
    }),
};
