import { Result } from "@/shared/core";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { CharacterCard, PlotCard } from "@/entities/card/domain";
import { Lorebook } from "@/entities/card/domain/lorebook";
import { LoadCardRepo, SaveCardRepo } from "@/entities/card/repos";

interface UpdateCardLorebookRequest {
  cardId: string;
  lorebook?: Lorebook;
}

type UpdateCardLorebookResponse = Result<void>;

export class UpdateCardLorebook
  implements UseCase<UpdateCardLorebookRequest, UpdateCardLorebookResponse>
{
  private loadCardRepo: LoadCardRepo;
  private saveCardRepo: SaveCardRepo;

  constructor(loadCardRepo: LoadCardRepo, saveCardRepo: SaveCardRepo) {
    this.loadCardRepo = loadCardRepo;
    this.saveCardRepo = saveCardRepo;
  }

  async execute(
    request: UpdateCardLorebookRequest,
  ): Promise<UpdateCardLorebookResponse> {
    try {
      if (this.saveCardRepo.updateCardLorebook) {
        const result = await this.saveCardRepo.updateCardLorebook(
          new UniqueEntityID(request.cardId),
          request.lorebook ? request.lorebook.toJSON() : { entries: [] }
        );
        return result;
      }

      const cardOrError = await this.loadCardRepo.getCardById(new UniqueEntityID(request.cardId));

      if (cardOrError.isFailure) {
        return Result.fail<void>(cardOrError.getError());
      }

      const card = cardOrError.getValue();

      if (!card || !(card instanceof CharacterCard || card instanceof PlotCard)) {
        return Result.fail<void>("Card not found or not a character/plot card");
      }

      const updateResult = card.update({ lorebook: request.lorebook });
      if (updateResult.isFailure) {
        return Result.fail<void>(updateResult.getError());
      }

      const saveResult = await this.saveCardRepo.saveCard(card);
      if (saveResult.isFailure) {
        return Result.fail<void>(saveResult.getError());
      }

      return Result.ok<void>();
    } catch (error) {
      console.error("Error updating card lorebook:", error);
      return Result.fail<void>(`Failed to update card lorebook: ${error}`);
    }
  }
}