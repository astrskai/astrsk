import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { CharacterCloudData } from "@/shared/lib/cloud-upload-helpers";

import { CharacterCard } from "@/entities/card/domain";
import { LoadCardRepo } from "@/entities/card/repos";
import { CardDrizzleMapper } from "@/entities/card/mappers/card-drizzle-mapper";

interface Command {
  cardId: UniqueEntityID;
  sessionId?: UniqueEntityID | null; // If part of session, set session_id
}

/**
 * Prepare character data for cloud upload (data preparation only, no upload)
 * Can be reused by session export
 */
export class PrepareCharacterCloudData
  implements UseCase<Command, Result<CharacterCloudData>>
{
  constructor(
    private loadCardRepo: LoadCardRepo,
  ) {}

  async execute({
    cardId,
    sessionId = null,
  }: Command): Promise<Result<CharacterCloudData>> {
    try {
      // 1. Get character card
      const cardResult = await this.loadCardRepo.getCardById(cardId);
      if (cardResult.isFailure) {
        return Result.fail<CharacterCloudData>(cardResult.getError());
      }

      const card = cardResult.getValue();
      if (!(card instanceof CharacterCard)) {
        return Result.fail<CharacterCloudData>("Card is not a character card");
      }

      // 2. Use mapper to convert domain → persistence format
      const persistenceData = CardDrizzleMapper.toPersistence(card);

      // Extract only the fields we need (type-safe)
      const {
        id,
        title,
        tags,
        creator,
        card_summary,
        version,
        conceptual_origin,
        vibe_session_id,
        image_prompt,
        name,
        description,
        lorebook,
      } = persistenceData as any; // Cast only for extraction

      const { example_dialogue } = persistenceData as any; // Character-specific field

      // 3. Build Supabase data with icon_asset_id reference (asset upload happens later)
      const characterData: CharacterCloudData = {
        id,
        title,
        icon_asset_id: card.props.iconAssetId?.toString() || null, // Use cloned asset ID
        tags,
        creator,
        card_summary,
        version,
        conceptual_origin,
        vibe_session_id,
        image_prompt,
        name,
        description,
        example_dialogue,
        lorebook,
        token_count: card.props.tokenCount || 0,
        session_id: sessionId?.toString() || null,
        is_public: false,
        owner_id: null,
        created_at: card.props.createdAt.toISOString(),
        updated_at:
          card.props.updatedAt?.toISOString() || new Date().toISOString(),
      };

      return Result.ok(characterData);
    } catch (error) {
      return Result.fail<CharacterCloudData>(
        `Unexpected error preparing character data: ${error}`,
      );
    }
  }
}
