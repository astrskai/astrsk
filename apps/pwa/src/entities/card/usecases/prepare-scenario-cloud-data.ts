import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { ScenarioCloudData } from "@/shared/lib/cloud-upload-helpers";

import { ScenarioCard, PlotCard } from "@/entities/card/domain";
import { LoadCardRepo } from "@/entities/card/repos";
import { CardSupabaseMapper } from "@/entities/card/mappers/card-supabase-mapper";

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

      // 2. Use mapper to convert domain → cloud format (handles PlotCard migration)
      const scenarioData = CardSupabaseMapper.scenarioToCloud(card, sessionId);

      return Result.ok(scenarioData);
    } catch (error) {
      return Result.fail<ScenarioCloudData>(
        `Unexpected error preparing scenario data: ${error}`,
      );
    }
  }
}
