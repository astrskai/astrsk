import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Transaction } from "@/db/transaction";
import { CloneAsset } from "@/entities/asset/usecases/clone-asset";
import { Card } from "@/entities/card/domain";
import { LoadCardRepo, SaveCardRepo } from "@/entities/card/repos";

interface Command {
  cardId: UniqueEntityID;
  sessionId?: UniqueEntityID; // Optional - if provided, creates session-local copy
  tx?: Transaction;
  /** Optional predefined ID for the cloned card (used for cloud export to avoid popup blockers) */
  clonedCardId?: UniqueEntityID;
}

export class CloneCard implements UseCase<Command, Result<Card>> {
  constructor(
    private saveCardRepo: SaveCardRepo,
    private loadCardRepo: LoadCardRepo,
    private cloneAsset: CloneAsset,
  ) {}

  async execute({ cardId, sessionId, tx, clonedCardId }: Command): Promise<Result<Card>> {
    try {
      // Fetch the original card
      const originalCardOrError = await this.loadCardRepo.getCardById(
        cardId,
        tx,
      );
      if (originalCardOrError.isFailure) {
        throw new Error(originalCardOrError.getError());
      }
      const originalCard = originalCardOrError.getValue();

      // Check if the original card has an asset
      let iconAssetId = originalCard.props.iconAssetId;
      if (iconAssetId) {
        // Clone asset
        const clonedAssetOrError = await this.cloneAsset.execute({
          assetId: iconAssetId,
        });
        if (clonedAssetOrError.isFailure) {
          throw new Error(clonedAssetOrError.getError());
        }
        const clonedAsset = clonedAssetOrError.getValue();
        iconAssetId = clonedAsset.id;
      }

      // Use predefined ID if provided, otherwise generate new ID
      const newCardId = clonedCardId ?? new UniqueEntityID();

      // Clone card (optionally with sessionId for session-local copy)
      const clonedCard = originalCard
        .clone(newCardId, {
          iconAssetId: iconAssetId,
          sessionId: sessionId, // If provided, creates session-local copy
        })
        .throwOnFailure()
        .getValue();

      // Save the cloned card
      const savedCard = (await this.saveCardRepo.saveCard(clonedCard, tx))
        .throwOnFailure()
        .getValue();

      // Return saved card
      return Result.ok(savedCard);
    } catch (error) {
      return formatFail("Failed to clone card", error);
    }
  }
}
