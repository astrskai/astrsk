import { GetAsset } from "@/modules/asset/usecases/get-asset";
import { GetBackground } from "@/modules/background/usecases/get-background";
import { SaveFileToBackground } from "@/modules/background/usecases/save-file-to-background";
import {
  ExportCardToFile,
  GetCard,
  ImportCardFromFile,
} from "@/modules/card/usecases";
import { ExportFlowWithNodes } from "@/modules/flow/usecases/export-flow-with-nodes";
import { GetModelsFromFlowFile } from "@/modules/flow/usecases/get-models-from-flow-file";
import { ImportFlowWithNodes } from "@/modules/flow/usecases/import-flow-with-nodes";
import { DrizzleSessionRepo } from "@/modules/session/repos/impl/drizzle-session-repo";
import {
  AddMessage,
  BulkDeleteMessage,
  CloneSession,
  DeleteMessage,
  DeleteSession,
  ListSession,
  SaveSession,
} from "@/modules/session/usecases";
import { ExportSessionToFile } from "@/modules/session/usecases/export-session-to-file";
import { GetModelsFromSessionFile } from "@/modules/session/usecases/get-models-from-session-file";
import { GetSession } from "@/modules/session/usecases/get-session";
import { ImportCharactersFromSessionFile } from "@/modules/session/usecases/import-characters-from-session-file";
import { ImportSessionFromFile } from "@/modules/session/usecases/import-session-from-file";
import { ImportSessionFromFileV1 } from "@/modules/session/usecases/import-session-from-file-v1";
import { ListSessionByCard } from "@/modules/session/usecases/list-session-by-card";
import { ListSessionByFlow } from "@/modules/session/usecases/list-session-by-flow";
import { SearchSession } from "@/modules/session/usecases/search-session";
// import { UpdateLocalSyncMetadata } from "@/modules/sync/usecases/update-local-sync-metadata";
import { SaveFlowRepo } from "@/modules/flow/repos";
import { DrizzleTurnRepo } from "@/modules/turn/repos/impl/drizzle-turn-repo";
import { GetTurn } from "@/modules/turn/usecases/get-turn";

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
  public static importSessionFromFileV1: ImportSessionFromFileV1;
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
    this.importSessionFromFileV1 = new ImportSessionFromFileV1(
      this.importCharactersFromSessionFile,
      getCard,
      this.sessionRepo,
      this.addMessage,
    );
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
