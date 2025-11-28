import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib/error-utils";
import { getTokenizer } from "@/shared/lib/tokenizer/tokenizer";
import {
  fetchCharacterFromCloud,
  fetchAssetFromCloud,
  downloadAssetFromUrl,
  type CharacterCloudData,
} from "@/shared/lib/cloud-download-helpers";

import { SaveFileToAsset } from "@/entities/asset/usecases/save-file-to-asset";
import { CharacterCard, Lorebook } from "@/entities/card/domain";
import { CardType } from "@/entities/card/domain/card";
import { SaveCardRepo } from "@/entities/card/repos";

interface Command {
  characterId: string;
  sessionId?: UniqueEntityID; // Optional - if provided, creates session-local card
}

/**
 * Import a character from cloud storage by ID
 *
 * This usecase:
 * 1. Fetches character data from Supabase (checking expiration_date)
 * 2. Downloads the icon asset if present
 * 3. Creates a new local character card with new IDs
 * 4. Saves the card to local database
 */
export class ImportCharacterFromCloud
  implements UseCase<Command, Result<CharacterCard>>
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

  private createCharacterCardFromCloudData(
    data: CharacterCloudData,
    iconAssetId: UniqueEntityID | undefined,
    sessionId?: UniqueEntityID,
  ): Result<CharacterCard> {
    // Parse lorebook if present
    let lorebook: Lorebook | undefined;
    if (data.lorebook) {
      const lorebookResult = Lorebook.fromJSON(data.lorebook);
      if (lorebookResult.isSuccess) {
        lorebook = lorebookResult.getValue();
      }
    }

    return CharacterCard.create(
      {
        iconAssetId,
        title: data.title,
        name: data.name,
        type: CardType.Character,
        tags: data.tags ?? [],
        creator: data.creator ?? undefined,
        cardSummary: data.card_summary ?? undefined,
        version: data.version ?? undefined,
        conceptualOrigin: data.conceptual_origin ?? undefined,
        description: data.description ?? undefined,
        exampleDialogue: data.example_dialogue ?? undefined,
        lorebook,
        sessionId, // If provided, creates session-local card
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      undefined, // Always generate new ID for imports
    );
  }

  async execute({
    characterId,
    sessionId,
  }: Command): Promise<Result<CharacterCard>> {
    try {
      // 1. Fetch character data from cloud
      const characterResult = await fetchCharacterFromCloud(characterId);
      if (characterResult.isFailure) {
        return Result.fail(characterResult.getError());
      }

      const characterData = characterResult.getValue();

      // 2. Import icon asset if present
      const iconAssetId = await this.importIconAsset(characterData.icon_asset_id);

      // 3. Create character card from cloud data
      const cardResult = this.createCharacterCardFromCloudData(
        characterData,
        iconAssetId,
        sessionId,
      );
      if (cardResult.isFailure) {
        return Result.fail(cardResult.getError());
      }

      const card = cardResult.getValue();

      // 4. Calculate token count
      const tokenCount = CharacterCard.calculateTokenSize(
        card.props,
        getTokenizer(),
      );
      card.update({ tokenCount });

      // 5. Save card to local database
      const savedCardResult = await this.saveCardRepo.saveCard(card);
      if (savedCardResult.isFailure) {
        return Result.fail(savedCardResult.getError());
      }

      return Result.ok(savedCardResult.getValue() as CharacterCard);
    } catch (error) {
      return formatFail("Failed to import character from cloud", error);
    }
  }
}
