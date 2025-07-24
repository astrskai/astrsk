// import { UpdateLocalSyncMetadata } from "@/modules/sync/usecases/update-local-sync-metadata";
import { DrizzleTurnRepo } from "@/modules/turn/repos/impl/drizzle-turn-repo";
import { GetTurn } from "@/modules/turn/usecases/get-turn";
import { TranslateTurn } from "@/modules/turn/usecases/translate-turn";
import { UpdateTurn } from "@/modules/turn/usecases/update-turn";

export class TurnService {
  public static turnRepo: DrizzleTurnRepo;
  public static getTurn: GetTurn;
  public static translateTurn: TranslateTurn;
  public static updateTurn: UpdateTurn;

  public static init() {
    this.turnRepo = new DrizzleTurnRepo();

    this.getTurn = new GetTurn(this.turnRepo);
    this.translateTurn = new TranslateTurn(this.turnRepo, this.turnRepo);
    this.updateTurn = new UpdateTurn(this.turnRepo, this.turnRepo);
  }
}
