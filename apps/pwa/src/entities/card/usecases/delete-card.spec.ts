import { beforeEach, describe, expect, it } from "vitest";

import { DrizzleAssetRepo } from "@/entities/asset/repos/impl/drizzle-asset-repo";
import { DeleteAsset } from "@/entities/asset/usecases/delete-asset";
import { CharacterCard } from "@/entities/card/domain";
import { DrizzleCardRepo } from "@/entities/card/repos/impl/drizzle-card-repo";
import { DeleteCard } from "@/entities/card/usecases";
import { UpdateLocalSyncMetadata } from "@/entities/sync/usecases/update-local-sync-metadata";

describe("DeleteCard", () => {
  let target: DeleteCard;

  let cardRepo: DrizzleCardRepo;

  beforeEach(async () => {
    const updateLocalSyncMetadata = new UpdateLocalSyncMetadata();
    const assetRepo = new DrizzleAssetRepo(updateLocalSyncMetadata);
    const deleteAsset = new DeleteAsset(assetRepo);
    cardRepo = new DrizzleCardRepo(updateLocalSyncMetadata);

    target = new DeleteCard(cardRepo, deleteAsset);
  });

  it("[C-U-DC-001] 카드 삭제 - 카드를 DB에서 삭제한다.", async () => {
    // Given
    const card = CharacterCard.create({
      title: "title-test",
    }).getValue();
    await cardRepo.saveCard(card);

    // When
    await target.execute(card.id);

    // Then
    const result = await cardRepo.getCardById(card.id);
    expect(result.isFailure).toBe(true);
  });
});
