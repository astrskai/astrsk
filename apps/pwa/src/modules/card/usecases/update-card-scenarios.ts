import { Result } from "@/shared/core";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { PlotCard } from "@/modules/card/domain";
import { LoadCardRepo, SaveCardRepo } from "@/modules/card/repos";

interface UpdateCardScenariosRequest {
  cardId: string;
  scenarios: Array<{
    name: string;
    description: string;
  }>;
}

type UpdateCardScenariosResponse = Result<void>;

export class UpdateCardScenarios
  implements UseCase<UpdateCardScenariosRequest, UpdateCardScenariosResponse>
{
  private loadCardRepo: LoadCardRepo;
  private saveCardRepo: SaveCardRepo;

  constructor(loadCardRepo: LoadCardRepo, saveCardRepo: SaveCardRepo) {
    this.loadCardRepo = loadCardRepo;
    this.saveCardRepo = saveCardRepo;
  }

  async execute(
    request: UpdateCardScenariosRequest,
  ): Promise<UpdateCardScenariosResponse> {
    try {
      if (this.saveCardRepo.updateCardScenarios) {
        const result = await this.saveCardRepo.updateCardScenarios(
          new UniqueEntityID(request.cardId),
          request.scenarios
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

      const updateResult = card.update({ scenarios: request.scenarios });
      if (updateResult.isFailure) {
        return Result.fail<void>(updateResult.getError());
      }

      const saveResult = await this.saveCardRepo.saveCard(card);
      if (saveResult.isFailure) {
        return Result.fail<void>(saveResult.getError());
      }

      return Result.ok<void>();
    } catch (error) {
      console.error("Error updating card scenarios:", error);
      return Result.fail<void>(`Failed to update card scenarios: ${error}`);
    }
  }
}