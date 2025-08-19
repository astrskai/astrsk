import { Result } from "@/shared/core";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { CharacterCard } from "@/modules/card/domain";
import { LoadCardRepo, SaveCardRepo } from "@/modules/card/repos";

interface UpdateCharacterDescriptionRequest {
  cardId: string;
  description: string;
}

type UpdateCharacterDescriptionResponse = Result<void>;

export class UpdateCharacterDescription
  implements UseCase<UpdateCharacterDescriptionRequest, UpdateCharacterDescriptionResponse>
{
  private loadCardRepo: LoadCardRepo;
  private saveCardRepo: SaveCardRepo;

  constructor(loadCardRepo: LoadCardRepo, saveCardRepo: SaveCardRepo) {
    this.loadCardRepo = loadCardRepo;
    this.saveCardRepo = saveCardRepo;
  }

  async execute(
    request: UpdateCharacterDescriptionRequest,
  ): Promise<UpdateCharacterDescriptionResponse> {
    try {
      if (this.saveCardRepo.updateCharacterDescription) {
        const result = await this.saveCardRepo.updateCharacterDescription(
          new UniqueEntityID(request.cardId),
          request.description
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

      const updateResult = card.update({ description: request.description });
      if (updateResult.isFailure) {
        return Result.fail<void>(updateResult.getError());
      }

      const saveResult = await this.saveCardRepo.saveCard(card);
      if (saveResult.isFailure) {
        return Result.fail<void>(saveResult.getError());
      }

      return Result.ok<void>();
    } catch (error) {
      console.error("Error updating character description:", error);
      return Result.fail<void>(`Failed to update character description: ${error}`);
    }
  }
}