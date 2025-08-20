import { Result } from "@/shared/core";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { CharacterCard } from "@/modules/card/domain";
import { LoadCardRepo, SaveCardRepo } from "@/modules/card/repos";

interface UpdateCharacterNameRequest {
  cardId: string;
  name: string;
}

type UpdateCharacterNameResponse = Result<void>;

export class UpdateCharacterName
  implements UseCase<UpdateCharacterNameRequest, UpdateCharacterNameResponse>
{
  private loadCardRepo: LoadCardRepo;
  private saveCardRepo: SaveCardRepo;

  constructor(loadCardRepo: LoadCardRepo, saveCardRepo: SaveCardRepo) {
    this.loadCardRepo = loadCardRepo;
    this.saveCardRepo = saveCardRepo;
  }

  async execute(
    request: UpdateCharacterNameRequest,
  ): Promise<UpdateCharacterNameResponse> {
    try {
      if (this.saveCardRepo.updateCharacterName) {
        const result = await this.saveCardRepo.updateCharacterName(
          new UniqueEntityID(request.cardId),
          request.name
        );
        return result;
      }

      const cardOrError = await this.loadCardRepo.getCardById(new UniqueEntityID(request.cardId));

      if (cardOrError.isFailure) {
        return Result.fail<void>(cardOrError.getError());
      }

      const card = cardOrError.getValue();

      if (!card || !(card instanceof CharacterCard)) {
        return Result.fail<void>("Card not found or not a character card");
      }

      const updateResult = card.update({ name: request.name });
      if (updateResult.isFailure) {
        return Result.fail<void>(updateResult.getError());
      }

      const saveResult = await this.saveCardRepo.saveCard(card);
      if (saveResult.isFailure) {
        return Result.fail<void>(saveResult.getError());
      }

      return Result.ok<void>();
    } catch (error) {
      console.error("Error updating character name:", error);
      return Result.fail<void>(`Failed to update character name: ${error}`);
    }
  }
}