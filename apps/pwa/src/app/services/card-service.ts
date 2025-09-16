import { LoadAssetRepo } from "@/modules/asset/repos/load-asset-repo";
import { CloneAsset } from "@/modules/asset/usecases/clone-asset";

import { SaveFileToAsset } from "@/modules/asset/usecases/save-file-to-asset";
import { LoadGeneratedImageRepo } from "@/modules/generated-image/repos/load-generated-image-repo";
import { DrizzleCardRepo } from "@/modules/card/repos/impl/drizzle-card-repo";
import {
  CloneCard,
  DeleteCard,
  ExportCardToFile,
  GetCard,
  ImportCardFromFile,
  SaveCard,
  SearchCard,
  UpdateCardTitle,
  UpdateCardSummary,
  UpdateCardVersion,
  UpdateCardConceptualOrigin,
  UpdateCardIconAsset,
  UpdateCharacterName,
  UpdateCharacterDescription,
  UpdateCharacterExampleDialogue,
  UpdateCardTags,
  UpdateCardCreator,
  UpdateCardLorebook,
  UpdateCardScenarios,
  UpdatePlotDescription,
  RestoreCardFromSnapshot,
} from "@/modules/card/usecases";
// import { UpdateLocalSyncMetadata } from "@/modules/sync/usecases/update-local-sync-metadata";

export class CardService {
  public static cardRepo: DrizzleCardRepo;

  public static cloneCard: CloneCard;
  public static deleteCard: DeleteCard;
  public static exportCardToFile: ExportCardToFile;
  public static getCard: GetCard;
  public static importCardFromFile: ImportCardFromFile;
  public static saveCard: SaveCard;
  public static searchCard: SearchCard;
  public static updateCardTitle: UpdateCardTitle;
  public static updateCardSummary: UpdateCardSummary;
  public static updateCardVersion: UpdateCardVersion;
  public static updateCardConceptualOrigin: UpdateCardConceptualOrigin;
  public static updateCardIconAsset: UpdateCardIconAsset;
  public static updateCharacterName: UpdateCharacterName;
  public static updateCharacterDescription: UpdateCharacterDescription;
  public static updateCharacterExampleDialogue: UpdateCharacterExampleDialogue;
  public static updateCardTags: UpdateCardTags;
  public static updateCardCreator: UpdateCardCreator;
  public static updateCardLorebook: UpdateCardLorebook;
  public static updateCardScenarios: UpdateCardScenarios;
  public static updatePlotDescription: UpdatePlotDescription;
  public static restoreCardFromSnapshot: RestoreCardFromSnapshot;

  private constructor() {}

  public static init(
    loadAssetRepo: LoadAssetRepo,
    saveFileToAsset: SaveFileToAsset,
    cloneAsset: CloneAsset,
    generatedImageRepo: LoadGeneratedImageRepo,
    // updateLocalSyncMetadata: UpdateLocalSyncMetadata,
  ) {
    // this.cardRepo = new DrizzleCardRepo(updateLocalSyncMetadata);
    this.cardRepo = new DrizzleCardRepo();

    this.cloneCard = new CloneCard(this.cardRepo, this.cardRepo, cloneAsset);
    this.deleteCard = new DeleteCard(this.cardRepo);
    this.exportCardToFile = new ExportCardToFile(
      this.cardRepo,
      loadAssetRepo,
      generatedImageRepo,
    );
    this.getCard = new GetCard(this.cardRepo);
    this.importCardFromFile = new ImportCardFromFile(
      saveFileToAsset,
      this.cardRepo,
    );
    this.saveCard = new SaveCard(this.cardRepo);
    this.searchCard = new SearchCard(this.cardRepo);
    this.updateCardTitle = new UpdateCardTitle(this.cardRepo, this.cardRepo);
    this.updateCardSummary = new UpdateCardSummary(
      this.cardRepo,
      this.cardRepo,
    );
    this.updateCardVersion = new UpdateCardVersion(
      this.cardRepo,
      this.cardRepo,
    );
    this.updateCardConceptualOrigin = new UpdateCardConceptualOrigin(
      this.cardRepo,
      this.cardRepo,
    );
    this.updateCardIconAsset = new UpdateCardIconAsset(this.cardRepo);
    this.updateCharacterName = new UpdateCharacterName(
      this.cardRepo,
      this.cardRepo,
    );
    this.updateCharacterDescription = new UpdateCharacterDescription(
      this.cardRepo,
      this.cardRepo,
    );
    this.updateCharacterExampleDialogue = new UpdateCharacterExampleDialogue(
      this.cardRepo,
      this.cardRepo,
    );
    this.updateCardTags = new UpdateCardTags(this.cardRepo, this.cardRepo);
    this.updateCardCreator = new UpdateCardCreator(
      this.cardRepo,
      this.cardRepo,
    );
    this.updateCardLorebook = new UpdateCardLorebook(
      this.cardRepo,
      this.cardRepo,
    );
    this.updateCardScenarios = new UpdateCardScenarios(
      this.cardRepo,
      this.cardRepo,
    );
    this.updatePlotDescription = new UpdatePlotDescription(
      this.cardRepo,
      this.cardRepo,
    );
    this.restoreCardFromSnapshot = new RestoreCardFromSnapshot(this.cardRepo);
  }
}
