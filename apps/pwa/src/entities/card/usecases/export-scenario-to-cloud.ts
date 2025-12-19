import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import {
  ShareLinkResult,
  uploadScenarioToCloud,
  createSharedResource,
  DEFAULT_SHARE_EXPIRATION_DAYS,
} from "@/shared/lib/cloud-upload-helpers";
import { uploadAssetToSupabase } from "@/shared/lib/supabase-asset-uploader";

import { LoadAssetRepo } from "@/entities/asset/repos/load-asset-repo";
import { LoadCardRepo } from "@/entities/card/repos";
import { PrepareScenarioCloudData } from "./prepare-scenario-cloud-data";
import { CloneCard } from "./clone-card";
import { DeleteCard } from "./delete-card";

interface Command {
  cardId: UniqueEntityID;
  expirationDays?: number;
  /** Optional predefined cloned card ID (avoids popup blocker by allowing immediate URL construction) */
  clonedCardId?: UniqueEntityID;
}

/**
 * Export scenario to cloud (standalone, not part of session)
 * Strategy:
 * 1. Clone the card locally (generates new UUID)
 * 2. Export the cloned card to cloud
 * 3. Delete the cloned card
 */
export class ExportScenarioToCloud
  implements UseCase<Command, Result<ShareLinkResult>>
{
  private prepareScenarioData: PrepareScenarioCloudData;

  constructor(
    private loadCardRepo: LoadCardRepo,
    private loadAssetRepo: LoadAssetRepo,
    private cloneCard: CloneCard,
    private deleteCard: DeleteCard,
  ) {
    this.prepareScenarioData = new PrepareScenarioCloudData(
      loadCardRepo,
    );
  }

  async execute({
    cardId,
    expirationDays = DEFAULT_SHARE_EXPIRATION_DAYS,
    clonedCardId: providedClonedCardId,
  }: Command): Promise<Result<ShareLinkResult>> {
    // Use provided cloned card ID (for immediate URL construction) or generate new one
    const clonedCardId = providedClonedCardId ?? new UniqueEntityID();

    try {
      // 1. Clone the card with predefined ID to avoid popup blocker issues
      const cloneResult = await this.cloneCard.execute({
        cardId,
        clonedCardId, // Use predefined ID
      });

      if (cloneResult.isFailure) {
        return Result.fail<ShareLinkResult>(cloneResult.getError());
      }

      const clonedCard = cloneResult.getValue();

      // Small delay to ensure database writes are committed
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 2. Prepare scenario data using the CLONED card ID
      const dataResult = await this.prepareScenarioData.execute({
        cardId: clonedCardId,
        sessionId: null, // Standalone
      });

      if (dataResult.isFailure) {
        return Result.fail<ShareLinkResult>(dataResult.getError());
      }

      const scenarioData = dataResult.getValue();

      // 3. Upload scenario icon asset FIRST (before scenario record)
      // Assets must exist before records that reference them via FK
      // Upload icon asset if present (linked via scenario.icon_asset_id forward FK)
      if (scenarioData.icon_asset_id) {
        const iconAsset = await this.loadAssetRepo.getAssetById(
          new UniqueEntityID(scenarioData.icon_asset_id)
        );
        if (iconAsset.isSuccess) {
          const assetUploadResult = await uploadAssetToSupabase(iconAsset.getValue());
          if (assetUploadResult.isFailure) {
            return Result.fail<ShareLinkResult>(
              `Failed to upload scenario icon asset: ${assetUploadResult.getError()}`
            );
          }
        } else {
          // Asset not found locally - clear the reference so scenario can be uploaded
          scenarioData.icon_asset_id = null;
        }
      }

      // 4. Upload scenario record to cloud (asset already exists)
      const uploadResult = await uploadScenarioToCloud(scenarioData);
      if (uploadResult.isFailure) {
        return Result.fail<ShareLinkResult>(uploadResult.getError());
      }

      // 5. Create shared resource entry using the NEW card ID
      const shareResult = await createSharedResource(
        "scenario",
        clonedCardId.toString(),
        expirationDays,
      );

      if (shareResult.isFailure) {
        return Result.fail<ShareLinkResult>(shareResult.getError());
      }

      return shareResult;
    } catch (error) {
      return Result.fail<ShareLinkResult>(
        `Unexpected error exporting scenario to cloud: ${error}`,
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
