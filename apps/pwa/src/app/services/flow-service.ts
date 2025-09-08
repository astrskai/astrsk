import { LoadAgentRepo, SaveAgentRepo, DeleteAgentRepo } from "@/modules/agent/repos";
import { LoadDataStoreNodeRepo, SaveDataStoreNodeRepo } from "@/modules/data-store-node/repos";
import { LoadIfNodeRepo, SaveIfNodeRepo } from "@/modules/if-node/repos";
import { DrizzleFlowRepo } from "@/modules/flow/repos/impl/drizzle-flow-repo";
import { DrizzleDataStoreNodeRepo } from "@/modules/data-store-node/repos/impl/drizzle-data-store-node-repo";
import { DrizzleIfNodeRepo } from "@/modules/if-node/repos/impl/drizzle-if-node-repo";
import { CloneFlow } from "@/modules/flow/usecases/clone-flow";
import { CloneFlowWithNodes } from "@/modules/flow/usecases/clone-flow-with-nodes";
import { CreateFlow } from "@/modules/flow/usecases/create-flow";
import { DeleteFlow } from "@/modules/flow/usecases/delete-flow";
import { DeleteFlowWithNodes } from "@/modules/flow/usecases/delete-flow-with-nodes";
import { ExportFlowToFile } from "@/modules/flow/usecases/export-flow-to-file";
import { ExportFlowWithNodes } from "@/modules/flow/usecases/export-flow-with-nodes";
import { GetFlow } from "@/modules/flow/usecases/get-flow";
import { GetFlowWithNodes } from "@/modules/flow/usecases/get-flow-with-nodes";
import { GetModelsFromFlowFile } from "@/modules/flow/usecases/get-models-from-flow-file";
import { ImportFlowFromFile } from "@/modules/flow/usecases/import-flow-from-file";
import { ImportFlowWithNodes } from "@/modules/flow/usecases/import-flow-with-nodes";
import { ListFlowByProvider } from "@/modules/flow/usecases/list-flow-by-provider";
import { SaveFlow } from "@/modules/flow/usecases/save-flow";
import { SearchFlow } from "@/modules/flow/usecases/search-flow";
import { UpdateResponseTemplate } from "@/modules/flow/usecases/update-response-template";
import { UpdateDataStoreSchema } from "@/modules/flow/usecases/update-data-store-schema";
import { GetNode } from "@/modules/flow/usecases/get-node";
import { UpdateNodeDataStoreFields } from "@/modules/flow/usecases/update-node-data-store-fields";
import { UpdateIfNodeConditions } from "@/modules/flow/usecases/update-if-node-conditions";
import { CreateIfNodeConditions } from "@/modules/flow/usecases/create-if-node-conditions";
import { UpdateNode } from "@/modules/flow/usecases/update-node";
import { UpdateFlowName } from "@/modules/flow/usecases/update-flow-name";
import { UpdateFlowViewport } from "@/modules/flow/usecases/update-flow-viewport";
import { UpdateNodePosition } from "@/modules/flow/usecases/update-node-position";
import { UpdateNodesPositions } from "@/modules/flow/usecases/update-nodes-positions";
import { UpdatePanelLayout } from "@/modules/flow/usecases/update-panel-layout";
import { UpdateNodesAndEdges } from "@/modules/flow/usecases/update-nodes-and-edges";
import { UpdateFlowValidation } from "@/modules/flow/usecases/update-flow-validation";
import { UpdateFlowReadyState } from "@/modules/flow/usecases/update-flow-ready-state";
import { RestoreFlowFromSnapshot } from "@/modules/flow/usecases/restore-flow-from-snapshot";
// import { UpdateLocalSyncMetadata } from "@/modules/sync/usecases/update-local-sync-metadata";

export class FlowService {
  public static flowRepo: DrizzleFlowRepo;
  public static dataStoreNodeRepo: DrizzleDataStoreNodeRepo;
  public static ifNodeRepo: DrizzleIfNodeRepo;

  public static cloneFlow: CloneFlow;
  public static cloneFlowWithNodes: CloneFlowWithNodes;
  public static createFlow: CreateFlow;
  public static deleteFlow: DeleteFlow;
  public static deleteFlowWithNodes: DeleteFlowWithNodes;
  public static exportFlowToFile: ExportFlowToFile;
  public static exportFlowWithNodes: ExportFlowWithNodes;
  public static getFlow: GetFlow;
  public static getFlowWithNodes: GetFlowWithNodes;
  public static getModelsFromFlowFile: GetModelsFromFlowFile;
  public static importFlowFromFile: ImportFlowFromFile;
  public static importFlowWithNodes: ImportFlowWithNodes;
  public static saveFlow: SaveFlow;
  public static searchFlow: SearchFlow;
  public static listFlowByProvider: ListFlowByProvider;
  public static updateResponseTemplate: UpdateResponseTemplate;
  public static updateDataStoreSchema: UpdateDataStoreSchema;
  public static getNode: GetNode;
  public static updateNodeDataStoreFields: UpdateNodeDataStoreFields;
  public static updateIfNodeConditions: UpdateIfNodeConditions;
  public static createIfNodeConditions: CreateIfNodeConditions;
  public static updateNode: UpdateNode;
  public static updateFlowName: UpdateFlowName;
  public static updateFlowViewport: UpdateFlowViewport;
  public static updateNodePosition: UpdateNodePosition;
  public static updateNodesPositions: UpdateNodesPositions;
  public static updatePanelLayout: UpdatePanelLayout;
  public static updateNodesAndEdges: UpdateNodesAndEdges;
  public static updateFlowValidation: UpdateFlowValidation;
  public static updateFlowReadyState: UpdateFlowReadyState;
  public static restoreFlowFromSnapshot: RestoreFlowFromSnapshot;

  private constructor() {}

  public static init(loadAgentRepo: LoadAgentRepo, saveAgentRepo: SaveAgentRepo, deleteAgentRepo: DeleteAgentRepo) {
    this.flowRepo = new DrizzleFlowRepo();
    this.dataStoreNodeRepo = new DrizzleDataStoreNodeRepo();
    this.ifNodeRepo = new DrizzleIfNodeRepo();

    // Initialize the use cases
    this.cloneFlow = new CloneFlow(this.flowRepo, this.flowRepo, loadAgentRepo, saveAgentRepo);
    this.cloneFlowWithNodes = new CloneFlowWithNodes(
      this.flowRepo, 
      this.flowRepo, 
      loadAgentRepo, 
      saveAgentRepo, 
      this.dataStoreNodeRepo, 
      this.dataStoreNodeRepo, 
      this.ifNodeRepo, 
      this.ifNodeRepo
    );
    this.createFlow = new CreateFlow(saveAgentRepo, this.flowRepo);
    this.deleteFlow = new DeleteFlow(this.flowRepo, this.flowRepo, deleteAgentRepo);
    this.deleteFlowWithNodes = new DeleteFlowWithNodes(
      this.flowRepo, 
      this.flowRepo, 
      deleteAgentRepo,
      this.dataStoreNodeRepo,
      this.ifNodeRepo
    );
    this.exportFlowToFile = new ExportFlowToFile(this.flowRepo, loadAgentRepo);
    this.exportFlowWithNodes = new ExportFlowWithNodes(this.flowRepo, loadAgentRepo, this.dataStoreNodeRepo, this.ifNodeRepo);
    this.getFlow = new GetFlow(this.flowRepo);
    this.getFlowWithNodes = new GetFlowWithNodes(this.flowRepo, this.dataStoreNodeRepo, this.ifNodeRepo);
    this.getModelsFromFlowFile = new GetModelsFromFlowFile();
    this.importFlowFromFile = new ImportFlowFromFile(this.flowRepo, saveAgentRepo);
    this.importFlowWithNodes = new ImportFlowWithNodes(this.flowRepo, saveAgentRepo, this.dataStoreNodeRepo, this.ifNodeRepo);
    this.saveFlow = new SaveFlow(this.flowRepo);
    this.searchFlow = new SearchFlow(this.flowRepo);
    this.listFlowByProvider = new ListFlowByProvider(this.flowRepo);
    this.updateResponseTemplate = new UpdateResponseTemplate();
    this.updateDataStoreSchema = new UpdateDataStoreSchema();
    this.getNode = new GetNode(this.flowRepo);
    this.updateNodeDataStoreFields = new UpdateNodeDataStoreFields(this.flowRepo);
    this.updateIfNodeConditions = new UpdateIfNodeConditions(this.flowRepo);
    this.createIfNodeConditions = new CreateIfNodeConditions(this.flowRepo);
    this.updateNode = new UpdateNode(this.flowRepo);
    this.updateFlowName = new UpdateFlowName(this.flowRepo, this.flowRepo);
    this.updateFlowViewport = new UpdateFlowViewport(this.flowRepo, this.flowRepo);
    this.updateNodePosition = new UpdateNodePosition(this.flowRepo);
    this.updateNodesPositions = new UpdateNodesPositions(this.flowRepo);
    this.updatePanelLayout = new UpdatePanelLayout(this.flowRepo, this.flowRepo);
    this.updateNodesAndEdges = new UpdateNodesAndEdges(this.flowRepo);
    this.updateFlowValidation = new UpdateFlowValidation(this.flowRepo);
    this.updateFlowReadyState = new UpdateFlowReadyState(this.flowRepo);
    this.restoreFlowFromSnapshot = new RestoreFlowFromSnapshot(this.flowRepo);
  }
}
