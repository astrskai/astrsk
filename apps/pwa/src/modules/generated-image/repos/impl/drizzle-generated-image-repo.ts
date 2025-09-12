import { desc, eq } from "drizzle-orm";

import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/utils";

import { Drizzle } from "@/db/drizzle";
import { getOneOrThrow } from "@/db/helpers/get-one-or-throw";
import { generatedImages } from "@/db/schema/generated-images";
import { Transaction } from "@/db/transaction";
import { GeneratedImage } from "@/modules/generated-image/domain";
import { GeneratedImageDrizzleMapper } from "@/modules/generated-image/mappers/generated-image-drizzle-mapper";
import { DeleteGeneratedImageRepo } from "@/modules/generated-image/repos/delete-generated-image-repo";
import { LoadGeneratedImageRepo } from "@/modules/generated-image/repos/load-generated-image-repo";
import { SaveGeneratedImageRepo } from "@/modules/generated-image/repos/save-generated-image-repo";

export class DrizzleGeneratedImageRepo
  implements SaveGeneratedImageRepo, LoadGeneratedImageRepo, DeleteGeneratedImageRepo
{
  async save(
    generatedImage: GeneratedImage,
    tx?: Transaction,
  ): Promise<Result<void>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Convert to row
      const row = GeneratedImageDrizzleMapper.toPersistence(generatedImage);

      // Insert generated image
      await db
        .insert(generatedImages)
        .values(row)
        .onConflictDoUpdate({
          target: generatedImages.id,
          set: row,
        });

      return Result.ok<void>();
    } catch (error) {
      return formatFail("Failed to save generated image", error);
    }
  }

  async getGeneratedImageById(id: UniqueEntityID): Promise<Result<GeneratedImage>> {
    const db = await Drizzle.getInstance();
    try {
      const row = await db
        .select()
        .from(generatedImages)
        .where(eq(generatedImages.id, id.toString()))
        .then(getOneOrThrow);

      const generatedImage = GeneratedImageDrizzleMapper.toDomain(row);
      return Result.ok<GeneratedImage>(generatedImage);
    } catch (error) {
      return formatFail("Failed to get generated image by id", error);
    }
  }

  async listGeneratedImages(): Promise<Result<GeneratedImage[]>> {
    const db = await Drizzle.getInstance();
    try {
      const rows = await db
        .select()
        .from(generatedImages)
        .orderBy(desc(generatedImages.created_at));

      const images = rows.map(GeneratedImageDrizzleMapper.toDomain);
      return Result.ok<GeneratedImage[]>(images);
    } catch (error) {
      return formatFail("Failed to list generated images", error);
    }
  }

  async getGeneratedImagesByCardId(cardId: UniqueEntityID): Promise<Result<GeneratedImage[]>> {
    const db = await Drizzle.getInstance();
    try {
      const rows = await db
        .select()
        .from(generatedImages)
        .where(eq(generatedImages.associated_card_id, cardId.toString()))
        .orderBy(desc(generatedImages.created_at));

      const images = rows.map(GeneratedImageDrizzleMapper.toDomain);
      return Result.ok<GeneratedImage[]>(images);
    } catch (error) {
      return formatFail("Failed to get generated images by card id", error);
    }
  }

  async getGeneratedImageByAssetId(assetId: UniqueEntityID): Promise<Result<GeneratedImage | null>> {
    const db = await Drizzle.getInstance();
    try {
      const rows = await db
        .select()
        .from(generatedImages)
        .where(eq(generatedImages.asset_id, assetId.toString()));

      if (rows.length === 0) {
        return Result.ok<GeneratedImage | null>(null);
      }

      const generatedImage = GeneratedImageDrizzleMapper.toDomain(rows[0]);
      return Result.ok<GeneratedImage | null>(generatedImage);
    } catch (error) {
      return formatFail("Failed to get generated image by asset id", error);
    }
  }

  async delete(id: UniqueEntityID): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await db
        .delete(generatedImages)
        .where(eq(generatedImages.id, id.toString()));

      return Result.ok<void>();
    } catch (error) {
      return formatFail("Failed to delete generated image", error);
    }
  }
}