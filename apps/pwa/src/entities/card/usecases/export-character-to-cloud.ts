import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import {
  ShareLinkResult,
  uploadCharacterToCloud,
  createSharedResource,
  DEFAULT_SHARE_EXPIRATION_DAYS,
} from "@/shared/lib/cloud-upload-helpers";
import { uploadAssetToSupabase } from "@/shared/lib/supabase-asset-uploader";

import { LoadAssetRepo } from "@/entities/asset/repos/load-asset-repo";
import { LoadCardRepo } from "@/entities/card/repos";
import { PrepareCharacterCloudData } from "./prepare-character-cloud-data";
import { CloneCard } from "./clone-card";
import { DeleteCard } from "./delete-card";

interface Command {
  cardId: UniqueEntityID;
  expirationDays?: number;
}

/**
 * Export character to cloud (standalone, not part of session)
 * Strategy:
 * 1. Clone the card locally (generates new UUID)
 * 2. Export the cloned card to cloud
 * 3. Delete the cloned card
 */
export class ExportCharacterToCloud
  implements UseCase<Command, Result<ShareLinkResult>> {
  private prepareCharacterData: PrepareCharacterCloudData;

  constructor(
    private loadCardRepo: LoadCardRepo,
    private loadAssetRepo: LoadAssetRepo,
    private cloneCard: CloneCard,
    private deleteCard: DeleteCard,
  ) {
    this.prepareCharacterData = new PrepareCharacterCloudData(
      loadCardRepo,
    );
  }

  async execute({
    cardId,
    expirationDays = DEFAULT_SHARE_EXPIRATION_DAYS,
  }: Command): Promise<Result<ShareLinkResult>> {
    let clonedCardId: UniqueEntityID | null = null;

    try {
      // 1. Clone the card to generate new ID
      const cloneResult = await this.cloneCard.execute({ cardId });

      if (cloneResult.isFailure) {
        return Result.fail<ShareLinkResult>(cloneResult.getError());
      }

      const clonedCard = cloneResult.getValue();
      clonedCardId = clonedCard.id;

      // Small delay to ensure database writes are committed
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 2. Prepare character data using the CLONED card ID
      const dataResult = await this.prepareCharacterData.execute({
        cardId: clonedCardId,
        sessionId: null, // Standalone
      });

      if (dataResult.isFailure) {
        return Result.fail<ShareLinkResult>(dataResult.getError());
      }

      const characterData = dataResult.getValue();

      // 3. Upload character record to cloud
      const uploadResult = await uploadCharacterToCloud(characterData);
      if (uploadResult.isFailure) {
        return Result.fail<ShareLinkResult>(uploadResult.getError());
      }

      // 4. Upload character icon asset (if exists)
      if (characterData.icon_asset_id) {
        const iconAsset = await this.loadAssetRepo.getAssetById(
          new UniqueEntityID(characterData.icon_asset_id)
        );
        if (iconAsset.isSuccess) {
          await uploadAssetToSupabase(iconAsset.getValue(), {
            characterId: characterData.id,
          });
        }
      }

      // 5. Create shared resource entry using the NEW card ID
      const shareResult = await createSharedResource(
        "character",
        clonedCardId.toString(),
        expirationDays,
      );

      if (shareResult.isFailure) {
        return Result.fail<ShareLinkResult>(shareResult.getError());
      }

      return shareResult;
    } catch (error) {
      return Result.fail<ShareLinkResult>(
        `Unexpected error exporting character to cloud: ${error}`,
      );
    } finally {
      // 5. Cleanup: Delete the temporary cloned card
      if (clonedCardId) {
        try {
          await this.deleteCard.execute(clonedCardId);
        } catch (cleanupError) {
          console.error(
            `Failed to cleanup temporary card ${clonedCardId}:`,
            cleanupError,
          );
          // Don't fail the operation if cleanup fails, but log it
        }
      }
    }
  }
}
