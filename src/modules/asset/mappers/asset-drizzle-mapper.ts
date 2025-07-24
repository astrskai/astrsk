import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/utils";

import { InsertAsset, SelectAsset } from "@/db/schema/assets";
import { Asset } from "@/modules/asset/domain/asset";

export class AssetDrizzleMapper {
  private constructor() {}

  public static toDomain(row: SelectAsset): Asset {
    // Create asset
    const assetOrError = Asset.create(
      {
        hash: row.hash,
        name: row.name,
        sizeByte: row.size_byte,
        mimeType: row.mime_type,
        filePath: row.file_path,
        updatedAt: row.updated_at,
      },
      new UniqueEntityID(row.id),
    );

    // Check error
    if (assetOrError.isFailure) {
      logger.error(assetOrError.getError());
      throw new Error(assetOrError.getError());
    }

    // Return asset
    return assetOrError.getValue();
  }

  public static toPersistence(domain: Asset): InsertAsset {
    return {
      id: domain.id.toString(),
      hash: domain.hash,
      name: domain.name,
      size_byte: domain.sizeByte,
      mime_type: domain.mimeType,
      file_path: domain.filePath,
    };
  }

  public static toStorage(domain: Asset): InsertAsset {
    const row = this.toPersistence(domain);
    return {
      ...row,
      updated_at: domain.updatedAt,
    };
  }
}
