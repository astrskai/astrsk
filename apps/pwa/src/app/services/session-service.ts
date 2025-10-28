import { GetAsset } from "@/entities/asset/usecases/get-asset";
import { GetBackground } from "@/entities/background/usecases/get-background";
import { SaveFileToBackground } from "@/entities/background/usecases/save-file-to-background";
import {
  ExportCardToFile,
  GetCard,
  ImportCardFromFile,
} from "@/entities/card/usecases";
import { ExportFlowWithNodes } from "@/entities/flow/usecases/export-flow-with-nodes";
import { GetModelsFromFlowFile } from "@/entities/flow/usecases/get-models-from-flow-file";
import { ImportFlowWithNodes } from "@/entities/flow/usecases/import-flow-with-nodes";
import { DrizzleSessionRepo } from "@/entities/session/repos/impl/drizzle-session-repo";
import {
  AddMessage,
  BulkDeleteMessage,
  CloneSession,
  DeleteMessage,
  DeleteSession,
  ListSession,
  SaveSession,
} from "@/entities/session/usecases";
import { ExportSessionToFile } from "@/entities/session/usecases/export-session-to-file";
import { GetModelsFromSessionFile } from "@/entities/session/usecases/get-models-from-session-file";
import { GetSession } from "@/entities/session/usecases/get-session";
import { ImportCharactersFromSessionFile } from "@/entities/session/usecases/import-characters-from-session-file";
import { ImportSessionFromFile } from "@/entities/session/usecases/import-session-from-file";
import { ListSessionByCard } from "@/entities/session/usecases/list-session-by-card";
import { ListSessionByFlow } from "@/entities/session/usecases/list-session-by-flow";
import { SearchSession } from "@/entities/session/usecases/search-session";
// import { UpdateLocalSyncMetadata } from "@/entities/sync/usecases/update-local-sync-metadata";
import { SaveFlowRepo } from "@/entities/flow/repos";
import { DrizzleTurnRepo } from "@/entities/turn/repos/impl/drizzle-turn-repo";
import { GetTurn } from "@/entities/turn/usecases/get-turn";

export class SessionService {
  public static sessionRepo: DrizzleSessionRepo;

  public static addMessage: AddMessage;
  public static bulkDeleteMessage: BulkDeleteMessage;
  public static cloneSession: CloneSession;
  public static deleteMessage: DeleteMessage;
  public static deleteSession: DeleteSession;
  public static getSession: GetSession;
  public static getModelsFromSessionFile: GetModelsFromSessionFile;
  public static importCharactersFromSessionFile: ImportCharactersFromSessionFile;
  public static listSession: ListSession;
  public static saveSession: SaveSession;
  public static searchSession: SearchSession;
  public static exportSessionToFile: ExportSessionToFile;
  public static importSessionFromFile: ImportSessionFromFile;
  public static listSessionByCard: ListSessionByCard;
  public static listSessionByFlow: ListSessionByFlow;

  public static init(
    turnRepo: DrizzleTurnRepo, // TODO: replace to interface
    getCard: GetCard,
    // updateLocalSyncMetadata: UpdateLocalSyncMetadata,
    exportFlowWithNodes: ExportFlowWithNodes,
    exportCardToFile: ExportCardToFile,
    getBackground: GetBackground,
    getAsset: GetAsset,
    getTurn: GetTurn,
    importFlowWithNodes: ImportFlowWithNodes,
    importCardFromFile: ImportCardFromFile,
    saveFileToBackground: SaveFileToBackground,
    saveFlowRepo: SaveFlowRepo,
    getModelsFromFlowFile: GetModelsFromFlowFile,
  ) {
    this.sessionRepo = new DrizzleSessionRepo();

    this.addMessage = new AddMessage(
      turnRepo,
      this.sessionRepo,
      this.sessionRepo,
    );
    this.bulkDeleteMessage = new BulkDeleteMessage(
      turnRepo,
      this.sessionRepo,
      this.sessionRepo,
    );
    this.cloneSession = new CloneSession(
      this.sessionRepo,
      this.sessionRepo,
      turnRepo,
      this.addMessage,
    );
    this.deleteMessage = new DeleteMessage(
      turnRepo,
      this.sessionRepo,
      this.sessionRepo,
    );
    this.deleteSession = new DeleteSession(
      this.sessionRepo,
      turnRepo,
      this.sessionRepo,
    );
    this.getSession = new GetSession(this.sessionRepo);
    this.getModelsFromSessionFile = new GetModelsFromSessionFile(
      getModelsFromFlowFile
    );
    this.importCharactersFromSessionFile =
      new ImportCharactersFromSessionFile();
    this.listSession = new ListSession(this.sessionRepo);
    this.saveSession = new SaveSession(this.sessionRepo);
    this.searchSession = new SearchSession(this.sessionRepo);
    this.exportSessionToFile = new ExportSessionToFile(
      this.sessionRepo,
      exportFlowWithNodes,
      exportCardToFile,
      getBackground,
      getAsset,
      getTurn,
    );
    this.importSessionFromFile = new ImportSessionFromFile(
      this.sessionRepo,
      importFlowWithNodes,
      importCardFromFile,
      saveFileToBackground,
      this.addMessage,
    );
    this.listSessionByCard = new ListSessionByCard(this.sessionRepo);
    this.listSessionByFlow = new ListSessionByFlow(this.sessionRepo);
  }
}
