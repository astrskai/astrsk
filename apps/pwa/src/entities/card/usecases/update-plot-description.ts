import { Result } from "@/shared/core";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { PlotCard } from "@/entities/card/domain";
import { LoadCardRepo, SaveCardRepo } from "@/entities/card/repos";

interface UpdatePlotDescriptionRequest {
  cardId: string;
  description: string;
}

type UpdatePlotDescriptionResponse = Result<void>;

export class UpdatePlotDescription
  implements UseCase<UpdatePlotDescriptionRequest, UpdatePlotDescriptionResponse>
{
  private loadCardRepo: LoadCardRepo;
  private saveCardRepo: SaveCardRepo;

  constructor(loadCardRepo: LoadCardRepo, saveCardRepo: SaveCardRepo) {
    this.loadCardRepo = loadCardRepo;
    this.saveCardRepo = saveCardRepo;
  }

  async execute(
    request: UpdatePlotDescriptionRequest,
  ): Promise<UpdatePlotDescriptionResponse> {
    try {
      if (this.saveCardRepo.updatePlotDescription) {
        const result = await this.saveCardRepo.updatePlotDescription(
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

      if (!card || !(card instanceof PlotCard)) {
        return Result.fail<void>("Card not found or not a plot card");
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
      console.error("Error updating plot description:", error);
      return Result.fail<void>(`Failed to update plot description: ${error}`);
    }
  }
}