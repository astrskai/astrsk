import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib/error-utils";
import { getTokenizer } from "@/shared/lib/tokenizer/tokenizer";
import {
  fetchScenarioFromCloud,
  fetchAssetFromCloud,
  downloadAssetFromUrl,
  type ScenarioCloudData,
} from "@/shared/lib/cloud-download-helpers";

import { SaveFileToAsset } from "@/entities/asset/usecases/save-file-to-asset";
import { ScenarioCard, Lorebook } from "@/entities/card/domain";
import { CardType } from "@/entities/card/domain/card";
import { SaveCardRepo } from "@/entities/card/repos";

interface Command {
  scenarioId: string;
  sessionId?: UniqueEntityID; // Optional - if provided, creates session-local card
}

/**
 * Import a scenario from cloud storage by ID
 *
 * This usecase:
 * 1. Fetches scenario data from Supabase (checking expiration_date)
 * 2. Downloads the icon asset if present
 * 3. Creates a new local scenario card with new IDs
 * 4. Saves the card to local database
 */
export class ImportScenarioFromCloud
  implements UseCase<Command, Result<ScenarioCard>>
{
  constructor(
    private saveFileToAsset: SaveFileToAsset,
    private saveCardRepo: SaveCardRepo,
  ) {}

  private async importIconAsset(
    iconAssetId: string | null,
  ): Promise<UniqueEntityID | undefined> {
    if (!iconAssetId) {
      return undefined;
    }

    try {
      // Fetch asset metadata from cloud
      const assetResult = await fetchAssetFromCloud(iconAssetId);
      if (assetResult.isFailure) {
        console.warn(`Failed to fetch asset metadata: ${assetResult.getError()}`);
        return undefined;
      }

      const assetData = assetResult.getValue();

      // Download asset file from URL
      const blobResult = await downloadAssetFromUrl(assetData.file_path);
      if (blobResult.isFailure) {
        console.warn(`Failed to download asset file: ${blobResult.getError()}`);
        return undefined;
      }

      // Convert blob to File
      const file = new File([blobResult.getValue()], assetData.name, {
        type: assetData.mime_type,
      });

      // Save to local storage
      const savedAssetResult = await this.saveFileToAsset.execute({ file });
      if (savedAssetResult.isFailure) {
        console.warn(`Failed to save asset locally: ${savedAssetResult.getError()}`);
        return undefined;
      }

      return savedAssetResult.getValue().id;
    } catch (error) {
      console.warn(`Error importing icon asset: ${error}`);
      return undefined;
    }
  }

  private createScenarioCardFromCloudData(
    data: ScenarioCloudData,
    iconAssetId: UniqueEntityID | undefined,
    sessionId?: UniqueEntityID,
  ): Result<ScenarioCard> {
    // Parse lorebook if present
    let lorebook: Lorebook | undefined;
    if (data.lorebook) {
      const lorebookResult = Lorebook.fromJSON(data.lorebook);
      if (lorebookResult.isSuccess) {
        lorebook = lorebookResult.getValue();
      }
    }

    return ScenarioCard.create(
      {
        iconAssetId,
        title: data.title,
        name: data.name,
        type: CardType.Scenario,
        tags: data.tags ?? [],
        creator: data.creator ?? undefined,
        cardSummary: data.card_summary ?? undefined,
        version: data.version ?? undefined,
        conceptualOrigin: data.conceptual_origin ?? undefined,
        description: data.description ?? undefined,
        firstMessages: data.first_messages ?? [],
        lorebook,
        sessionId, // If provided, creates session-local card
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      undefined, // Always generate new ID for imports
    );
  }

  async execute({
    scenarioId,
    sessionId,
  }: Command): Promise<Result<ScenarioCard>> {
    try {
      // 1. Fetch scenario data from cloud
      const scenarioResult = await fetchScenarioFromCloud(scenarioId);
      if (scenarioResult.isFailure) {
        return Result.fail(scenarioResult.getError());
      }

      const scenarioData = scenarioResult.getValue();

      // 2. Import icon asset if present
      const iconAssetId = await this.importIconAsset(scenarioData.icon_asset_id);

      // 3. Create scenario card from cloud data
      const cardResult = this.createScenarioCardFromCloudData(
        scenarioData,
        iconAssetId,
        sessionId,
      );
      if (cardResult.isFailure) {
        return Result.fail(cardResult.getError());
      }

      const card = cardResult.getValue();

      // 4. Calculate token count
      const tokenCount = ScenarioCard.calculateTokenSize(
        card.props,
        await getTokenizer(),
      );
      card.update({ tokenCount });

      // 5. Save card to local database
      const savedCardResult = await this.saveCardRepo.saveCard(card);
      if (savedCardResult.isFailure) {
        return Result.fail(savedCardResult.getError());
      }

      return Result.ok(savedCardResult.getValue() as ScenarioCard);
    } catch (error) {
      return formatFail("Failed to import scenario from cloud", error);
    }
  }
}
