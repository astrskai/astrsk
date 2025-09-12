import { UniqueEntityID } from "@/shared/domain";

import {
  InsertGeneratedImage,
  SelectGeneratedImage,
} from "@/db/schema/generated-images";
import { GeneratedImage } from "../domain";

export class GeneratedImageDrizzleMapper {
  public static toDomain(raw: SelectGeneratedImage): GeneratedImage {
    const generatedImageOrError = GeneratedImage.create(
      {
        name: raw.name,
        assetId: new UniqueEntityID(raw.asset_id),
        prompt: raw.prompt,
        style: raw.style ?? undefined,
        aspectRatio: raw.aspect_ratio ?? undefined,
        mediaType: raw.media_type ?? undefined,
        thumbnailAssetId: raw.thumbnail_asset_id ? new UniqueEntityID(raw.thumbnail_asset_id) : undefined,
        associatedCardId: raw.associated_card_id ? new UniqueEntityID(raw.associated_card_id) : undefined,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
      },
      new UniqueEntityID(raw.id),
    );

    if (generatedImageOrError.isFailure) {
      throw new Error(generatedImageOrError.getError());
    }

    return generatedImageOrError.getValue();
  }

  public static toPersistence(generatedImage: GeneratedImage): InsertGeneratedImage {
    return {
      id: generatedImage.id.toString(),
      name: generatedImage.name,
      asset_id: generatedImage.assetId.toString(),
      prompt: generatedImage.prompt,
      style: generatedImage.style ?? null,
      aspect_ratio: generatedImage.aspectRatio ?? null,
      media_type: generatedImage.mediaType ?? null,
      thumbnail_asset_id: generatedImage.thumbnailAssetId?.toString() ?? null,
      associated_card_id: generatedImage.associatedCardId?.toString() ?? null,
      created_at: generatedImage.createdAt,
      updated_at: generatedImage.updatedAt,
    };
  }
}