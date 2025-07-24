import { LoadAssetRepo } from "@/modules/asset/repos/load-asset-repo";
import { CloneAsset } from "@/modules/asset/usecases/clone-asset";
import { DeleteAsset } from "@/modules/asset/usecases/delete-asset";
import { SaveFileToAsset } from "@/modules/asset/usecases/save-file-to-asset";
import { DrizzleCardRepo } from "@/modules/card/repos/impl/drizzle-card-repo";
import {
  CloneCard,
  DeleteCard,
  ExportCardToFile,
  GetCard,
  ImportCardFromFile,
  SaveCard,
  SearchCard,
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

  private constructor() {}

  public static init(
    loadAssetRepo: LoadAssetRepo,
    deleteAsset: DeleteAsset,
    saveFileToAsset: SaveFileToAsset,
    cloneAsset: CloneAsset,
    // updateLocalSyncMetadata: UpdateLocalSyncMetadata,
  ) {
    // this.cardRepo = new DrizzleCardRepo(updateLocalSyncMetadata);
    this.cardRepo = new DrizzleCardRepo();

    this.cloneCard = new CloneCard(this.cardRepo, this.cardRepo, cloneAsset);
    this.deleteCard = new DeleteCard(this.cardRepo, deleteAsset);
    this.exportCardToFile = new ExportCardToFile(this.cardRepo, loadAssetRepo);
    this.getCard = new GetCard(this.cardRepo);
    this.importCardFromFile = new ImportCardFromFile(
      saveFileToAsset,
      this.cardRepo,
    );
    this.saveCard = new SaveCard(this.cardRepo);
    this.searchCard = new SearchCard(this.cardRepo);
  }
}
