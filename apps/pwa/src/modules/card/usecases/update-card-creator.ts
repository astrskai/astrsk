import { Result } from "@/shared/core";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { Card } from "@/modules/card/domain";
import { LoadCardRepo, SaveCardRepo } from "@/modules/card/repos";

interface UpdateCardCreatorRequest {
  cardId: string;
  creator: string;
}

type UpdateCardCreatorResponse = Result<void>;

export class UpdateCardCreator
  implements UseCase<UpdateCardCreatorRequest, UpdateCardCreatorResponse>
{
  private loadCardRepo: LoadCardRepo;
  private saveCardRepo: SaveCardRepo;

  constructor(loadCardRepo: LoadCardRepo, saveCardRepo: SaveCardRepo) {
    this.loadCardRepo = loadCardRepo;
    this.saveCardRepo = saveCardRepo;
  }

  async execute(
    request: UpdateCardCreatorRequest,
  ): Promise<UpdateCardCreatorResponse> {
    try {
      if (this.saveCardRepo.updateCardCreator) {
        const result = await this.saveCardRepo.updateCardCreator(
          new UniqueEntityID(request.cardId),
          request.creator
        );
        return result;
      }

      const cardOrError = await this.loadCardRepo.getCardById(new UniqueEntityID(request.cardId));

      if (cardOrError.isFailure) {
        return Result.fail<void>(cardOrError.getError());
      }

      const card = cardOrError.getValue();

      if (!card) {
        return Result.fail<void>("Card not found");
      }

      const updateResult = card.update({ creator: request.creator });
      if (updateResult.isFailure) {
        return Result.fail<void>(updateResult.getError());
      }

      const saveResult = await this.saveCardRepo.saveCard(card);
      if (saveResult.isFailure) {
        return Result.fail<void>(saveResult.getError());
      }

      return Result.ok<void>();
    } catch (error) {
      console.error("Error updating card creator:", error);
      return Result.fail<void>(`Failed to update card creator: ${error}`);
    }
  }
}