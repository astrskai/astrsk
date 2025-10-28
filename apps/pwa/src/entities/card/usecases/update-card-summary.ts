import { Result } from "@/shared/core";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { LoadCardRepo, SaveCardRepo } from "@/entities/card/repos";

interface UpdateCardSummaryRequest {
  cardId: string;
  cardSummary: string;
}

type UpdateCardSummaryResponse = Result<void>;

export class UpdateCardSummary
  implements UseCase<UpdateCardSummaryRequest, UpdateCardSummaryResponse>
{
  private loadCardRepo: LoadCardRepo;
  private saveCardRepo: SaveCardRepo;

  constructor(loadCardRepo: LoadCardRepo, saveCardRepo: SaveCardRepo) {
    this.loadCardRepo = loadCardRepo;
    this.saveCardRepo = saveCardRepo;
  }

  async execute(
    request: UpdateCardSummaryRequest,
  ): Promise<UpdateCardSummaryResponse> {
    try {
      if (this.saveCardRepo.updateCardSummary) {
        const result = await this.saveCardRepo.updateCardSummary(
          new UniqueEntityID(request.cardId),
          request.cardSummary,
        );
        return result;
      }

      const cardOrError = await this.loadCardRepo.getCardById(
        new UniqueEntityID(request.cardId),
      );

      if (cardOrError.isFailure) {
        return Result.fail<void>(cardOrError.getError());
      }

      const card = cardOrError.getValue();

      if (!card) {
        return Result.fail<void>("Card not found");
      }

      const updateResult = card.update({ cardSummary: request.cardSummary });
      if (updateResult.isFailure) {
        return Result.fail<void>(updateResult.getError());
      }

      const saveResult = await this.saveCardRepo.saveCard(card);
      if (saveResult.isFailure) {
        return Result.fail<void>(saveResult.getError());
      }

      return Result.ok<void>();
    } catch (error) {
      console.error("Error updating card summary:", error);
      return Result.fail<void>(`Failed to update card summary: ${error}`);
    }
  }
}
