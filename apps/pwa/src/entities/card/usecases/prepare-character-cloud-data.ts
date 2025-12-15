import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { CharacterCloudData } from "@/shared/lib/cloud-upload-helpers";

import { CharacterCard } from "@/entities/card/domain";
import { LoadCardRepo } from "@/entities/card/repos";
import { CardSupabaseMapper } from "@/entities/card/mappers/card-supabase-mapper";

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

      // 2. Use mapper to convert domain → cloud format
      const characterData = CardSupabaseMapper.characterToCloud(card, sessionId);

      return Result.ok(characterData);
    } catch (error) {
      return Result.fail<CharacterCloudData>(
        `Unexpected error preparing character data: ${error}`,
      );
    }
  }
}
