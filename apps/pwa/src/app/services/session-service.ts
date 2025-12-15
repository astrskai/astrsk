import { GetAsset } from "@/entities/asset/usecases/get-asset";
import { CloneAsset } from "@/entities/asset/usecases/clone-asset";
import { SaveFileToAsset } from "@/entities/asset/usecases/save-file-to-asset";
import { GetBackground } from "@/entities/background/usecases/get-background";
import { CloneBackground } from "@/entities/background/usecases/clone-background";
import { SaveFileToBackground } from "@/entities/background/usecases/save-file-to-background";
import {
  ExportCardToFile,
  GetCard,
  ImportCardFromFile,
} from "@/entities/card/usecases";
import { PrepareCharacterCloudData } from "@/entities/card/usecases/prepare-character-cloud-data";
import { PrepareScenarioCloudData } from "@/entities/card/usecases/prepare-scenario-cloud-data";
import { ExportFlowWithNodes } from "@/entities/flow/usecases/export-flow-with-nodes";
import { GetModelsFromFlowFile } from "@/entities/flow/usecases/get-models-from-flow-file";
import { ImportFlowWithNodes } from "@/entities/flow/usecases/import-flow-with-nodes";
import { CloneFlow } from "@/entities/flow/usecases/clone-flow";
import { PrepareFlowCloudData } from "@/entities/flow/usecases/prepare-flow-cloud-data";
import { CloneCard } from "@/entities/card/usecases/clone-card";
import { DrizzleSessionRepo } from "@/entities/session/repos/impl/drizzle-session-repo";
import {
  AddMessage,
  BulkDeleteMessage,
  ClonePlaySession,
  CloneSession,
  DeleteMessage,
  DeleteSession,
  GetSessionListItems,
  ListSession,
  SaveSession,
} from "@/entities/session/usecases";
import { CloneTemplateSession } from "@/entities/session/usecases/clone-template-session";
import { ExportSessionToFile } from "@/entities/session/usecases/export-session-to-file";
import { ExportSessionToCloud } from "@/entities/session/usecases/export-session-to-cloud";
import { ImportSessionFromCloud } from "@/entities/session/usecases/import-session-from-cloud";
import { PrepareSessionCloudData } from "@/entities/session/usecases/prepare-session-cloud-data";
import { GetModelsFromSessionFile } from "@/entities/session/usecases/get-models-from-session-file";
import { GetSession } from "@/entities/session/usecases/get-session";
import { ImportCharactersFromSessionFile } from "@/entities/session/usecases/import-characters-from-session-file";
import { ImportSessionFromFile } from "@/entities/session/usecases/import-session-from-file";
import { ListSessionByCard } from "@/entities/session/usecases/list-session-by-card";
import { ListSessionByFlow } from "@/entities/session/usecases/list-session-by-flow";
import { SearchSession } from "@/entities/session/usecases/search-session";
import { PrepareAgentsCloudData } from "@/entities/agent/usecases/prepare-agents-cloud-data";
import { PrepareDataStoreNodesCloudData } from "@/entities/data-store-node/usecases/prepare-data-store-nodes-cloud-data";
import { PrepareIfNodesCloudData } from "@/entities/if-node/usecases/prepare-if-nodes-cloud-data";
import { LoadAssetRepo } from "@/entities/asset/repos/load-asset-repo";
import { SaveAssetRepo } from "@/entities/asset/repos/save-asset-repo";
import { LoadBackgroundRepo } from "@/entities/background/repos/load-background-repo";
import { LoadCardRepo, SaveCardRepo } from "@/entities/card/repos";
import { LoadFlowRepo, SaveFlowRepo } from "@/entities/flow/repos";
import { LoadAgentRepo, SaveAgentRepo } from "@/entities/agent/repos";
import { LoadDataStoreNodeRepo, SaveDataStoreNodeRepo } from "@/entities/data-store-node/repos";
import { LoadIfNodeRepo, SaveIfNodeRepo } from "@/entities/if-node/repos";
// import { UpdateLocalSyncMetadata } from "@/entities/sync/usecases/update-local-sync-metadata";
import { DrizzleTurnRepo } from "@/entities/turn/repos/impl/drizzle-turn-repo";
import { GetTurn } from "@/entities/turn/usecases/get-turn";

export class SessionService {
  public static sessionRepo: DrizzleSessionRepo;

  public static addMessage: AddMessage;
  public static bulkDeleteMessage: BulkDeleteMessage;
  public static clonePlaySession: ClonePlaySession;
  public static cloneTemplateSession: CloneTemplateSession;
  public static cloneSession: CloneSession;
  public static deleteMessage: DeleteMessage;
  public static deleteSession: DeleteSession;
  public static getSession: GetSession;
  public static getModelsFromSessionFile: GetModelsFromSessionFile;
  public static importCharactersFromSessionFile: ImportCharactersFromSessionFile;
  public static getSessionListItems: GetSessionListItems;
  public static listSession: ListSession;
  public static saveSession: SaveSession;
  public static searchSession: SearchSession;
  public static exportSessionToFile: ExportSessionToFile;
  public static exportSessionToCloud: ExportSessionToCloud;
  public static importSessionFromCloud: ImportSessionFromCloud;
  public static importSessionFromFile: ImportSessionFromFile;
  public static listSessionByCard: ListSessionByCard;
  public static listSessionByFlow: ListSessionByFlow;

  public static init(
    turnRepo: DrizzleTurnRepo, // TODO: replace to interface
    // updateLocalSyncMetadata: UpdateLocalSyncMetadata,
    exportFlowWithNodes: ExportFlowWithNodes,
    exportCardToFile: ExportCardToFile,
    getBackground: GetBackground,
    getAsset: GetAsset,
    getTurn: GetTurn,
    importFlowWithNodes: ImportFlowWithNodes,
    importCardFromFile: ImportCardFromFile,
    saveFileToBackground: SaveFileToBackground,
    saveFileToAsset: SaveFileToAsset,
    getModelsFromFlowFile: GetModelsFromFlowFile,
    cloneFlow: CloneFlow,
    cloneCard: CloneCard,
    cloneAsset: CloneAsset,
    cloneBackground: CloneBackground,
    loadAssetRepo: LoadAssetRepo,
    saveAssetRepo: SaveAssetRepo,
    loadBackgroundRepo: LoadBackgroundRepo,
    loadCardRepo: LoadCardRepo,
    loadFlowRepo: LoadFlowRepo,
    loadAgentRepo: LoadAgentRepo,
    loadDataStoreNodeRepo: LoadDataStoreNodeRepo,
    loadIfNodeRepo: LoadIfNodeRepo,
    saveCardRepo: SaveCardRepo,
    saveFlowRepo: SaveFlowRepo,
    saveAgentRepo: SaveAgentRepo,
    saveDataStoreNodeRepo: SaveDataStoreNodeRepo,
    saveIfNodeRepo: SaveIfNodeRepo,
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
      cloneCard,
      cloneFlow,
      cloneAsset,
      cloneBackground,
    );
    this.clonePlaySession = new ClonePlaySession(
      this.cloneSession,
      this.sessionRepo,
    );
    this.cloneTemplateSession = new CloneTemplateSession(
      this.cloneSession,
      this.sessionRepo,
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
    this.getSessionListItems = new GetSessionListItems(this.sessionRepo);
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

    // Cloud export initialization
    const prepareCharacterData = new PrepareCharacterCloudData(
      loadCardRepo,
    );
    const prepareScenarioData = new PrepareScenarioCloudData(
      loadCardRepo,
    );
    const prepareFlowData = new PrepareFlowCloudData(
      loadFlowRepo,
      loadAgentRepo,
    );
    const prepareAgentsData = new PrepareAgentsCloudData(
      loadAgentRepo,
    );
    const prepareDataStoreNodesData = new PrepareDataStoreNodesCloudData(
      loadDataStoreNodeRepo,
    );
    const prepareIfNodesData = new PrepareIfNodesCloudData(
      loadIfNodeRepo,
    );
    const prepareSessionData = new PrepareSessionCloudData(
      this.sessionRepo,
      prepareCharacterData,
      prepareScenarioData,
      prepareFlowData,
      prepareAgentsData,
      prepareDataStoreNodesData,
      prepareIfNodesData,
      loadBackgroundRepo,
    );

    this.exportSessionToCloud = new ExportSessionToCloud(
      this.cloneSession,
      this.deleteSession,
      prepareSessionData,
      this.sessionRepo,
      this.sessionRepo,
      loadAssetRepo,
      saveAssetRepo,
    );

    this.importSessionFromFile = new ImportSessionFromFile(
      this.sessionRepo,
      importFlowWithNodes,
      importCardFromFile,
      saveFileToBackground,
      saveFileToAsset,
      this.addMessage,
    );

    // Cloud import initialization
    this.importSessionFromCloud = new ImportSessionFromCloud(
      this.sessionRepo,
      saveCardRepo,
      saveFlowRepo,
      saveAgentRepo,
      saveDataStoreNodeRepo,
      saveIfNodeRepo,
      saveFileToAsset,
      saveFileToBackground,
    );

    this.listSessionByCard = new ListSessionByCard(this.sessionRepo);
    this.listSessionByFlow = new ListSessionByFlow(this.sessionRepo);
  }
}
