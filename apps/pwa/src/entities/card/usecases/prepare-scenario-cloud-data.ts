import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import {
  ScenarioCloudData,
  uploadAssetIfExists,
} from "@/shared/lib/cloud-upload-helpers";

import { LoadAssetRepo } from "@/entities/asset/repos/load-asset-repo";
import { ScenarioCard, PlotCard } from "@/entities/card/domain";
import { LoadCardRepo } from "@/entities/card/repos";
import { CardDrizzleMapper } from "@/entities/card/mappers/card-drizzle-mapper";

interface Command {
  cardId: UniqueEntityID;
  sessionId?: UniqueEntityID | null; // If part of session, set session_id
}

/**
 * Prepare scenario data for cloud upload (data preparation only, no upload)
 * Can be reused by session export
 */
export class PrepareScenarioCloudData
  implements UseCase<Command, Result<ScenarioCloudData>>
{
  constructor(
    private loadCardRepo: LoadCardRepo,
    private loadAssetRepo: LoadAssetRepo,
  ) {}

  async execute({
    cardId,
    sessionId = null,
  }: Command): Promise<Result<ScenarioCloudData>> {
    try {
      // 1. Get scenario card
      const cardResult = await this.loadCardRepo.getCardById(cardId);
      if (cardResult.isFailure) {
        return Result.fail<ScenarioCloudData>(cardResult.getError());
      }

      const card = cardResult.getValue();

      // Accept both ScenarioCard and PlotCard (legacy, auto-migrate to scenario during export)
      if (!(card instanceof ScenarioCard) && !(card instanceof PlotCard)) {
        return Result.fail<ScenarioCloudData>("Card is not a scenario or plot card");
      }

      // Log migration for plot cards
      if (card instanceof PlotCard) {
        console.log(`Migrating PlotCard ${card.id.toString()} to ScenarioCard format for cloud export`);
      }

      // 2. Upload icon asset if exists
      const iconAssetId = await uploadAssetIfExists(
        card.props.iconAssetId,
        (id) => this.loadAssetRepo.getAssetById(id),
      );

      // 3. Use mapper to convert domain → persistence format
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

      // Handle PlotCard → ScenarioCard migration
      // PlotCard has 'scenarios' field, ScenarioCard has 'first_messages' field
      let first_messages;
      if (card instanceof PlotCard) {
        // Migrate: PlotCard.scenarios → ScenarioCard.first_messages
        first_messages = (persistenceData as any).scenarios ?? [];
      } else {
        // ScenarioCard: use first_messages directly
        first_messages = (persistenceData as any).first_messages ?? [];
      }

      // 4. Build Supabase data with explicit fields
      const scenarioData: ScenarioCloudData = {
        id,
        title,
        icon_asset_id: iconAssetId,
        tags,
        creator,
        card_summary,
        version,
        conceptual_origin,
        vibe_session_id,
        image_prompt,
        name,
        description,
        first_messages,
        lorebook,
        session_id: sessionId?.toString() || null,
        is_public: false,
        owner_id: null,
        created_at: card.props.createdAt.toISOString(),
        updated_at:
          card.props.updatedAt?.toISOString() || new Date().toISOString(),
      };

      return Result.ok(scenarioData);
    } catch (error) {
      return Result.fail<ScenarioCloudData>(
        `Unexpected error preparing scenario data: ${error}`,
      );
    }
  }
}
