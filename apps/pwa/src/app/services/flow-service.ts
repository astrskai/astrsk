import { LoadAgentRepo, SaveAgentRepo, DeleteAgentRepo } from "@/entities/agent/repos";
import { LoadDataStoreNodeRepo, SaveDataStoreNodeRepo } from "@/entities/data-store-node/repos";
import { LoadIfNodeRepo, SaveIfNodeRepo } from "@/entities/if-node/repos";
import { DrizzleFlowRepo } from "@/entities/flow/repos/impl/drizzle-flow-repo";
import { DrizzleDataStoreNodeRepo } from "@/entities/data-store-node/repos/impl/drizzle-data-store-node-repo";
import { DrizzleIfNodeRepo } from "@/entities/if-node/repos/impl/drizzle-if-node-repo";
import { CloneFlow } from "@/entities/flow/usecases/clone-flow";
import { CloneFlowWithNodes } from "@/entities/flow/usecases/clone-flow-with-nodes";
import { CreateFlow } from "@/entities/flow/usecases/create-flow";
import { DeleteFlow } from "@/entities/flow/usecases/delete-flow";
import { DeleteFlowWithNodes } from "@/entities/flow/usecases/delete-flow-with-nodes";
import { ExportFlowToFile } from "@/entities/flow/usecases/export-flow-to-file";
import { ExportFlowWithNodes } from "@/entities/flow/usecases/export-flow-with-nodes";
import { GetFlow } from "@/entities/flow/usecases/get-flow";
import { GetFlowWithNodes } from "@/entities/flow/usecases/get-flow-with-nodes";
import { GetModelsFromFlowFile } from "@/entities/flow/usecases/get-models-from-flow-file";
import { ImportFlowFromFile } from "@/entities/flow/usecases/import-flow-from-file";
import { ImportFlowWithNodes } from "@/entities/flow/usecases/import-flow-with-nodes";
import { ListFlowByProvider } from "@/entities/flow/usecases/list-flow-by-provider";
import { SaveFlow } from "@/entities/flow/usecases/save-flow";
import { SearchFlow } from "@/entities/flow/usecases/search-flow";
import { UpdateResponseTemplate } from "@/entities/flow/usecases/update-response-template";
import { UpdateDataStoreSchema } from "@/entities/flow/usecases/update-data-store-schema";
import { GetNode } from "@/entities/flow/usecases/get-node";
import { UpdateNodeDataStoreFields } from "@/entities/flow/usecases/update-node-data-store-fields";
import { UpdateIfNodeConditions } from "@/entities/flow/usecases/update-if-node-conditions";
import { CreateIfNodeConditions } from "@/entities/flow/usecases/create-if-node-conditions";
import { UpdateNode } from "@/entities/flow/usecases/update-node";
import { UpdateFlowName } from "@/entities/flow/usecases/update-flow-name";
import { UpdateFlowViewport } from "@/entities/flow/usecases/update-flow-viewport";
import { UpdateNodePosition } from "@/entities/flow/usecases/update-node-position";
import { UpdateNodesPositions } from "@/entities/flow/usecases/update-nodes-positions";
import { UpdatePanelLayout } from "@/entities/flow/usecases/update-panel-layout";
import { UpdateNodesAndEdges } from "@/entities/flow/usecases/update-nodes-and-edges";
import { UpdateFlowValidation } from "@/entities/flow/usecases/update-flow-validation";
import { UpdateFlowReadyState } from "@/entities/flow/usecases/update-flow-ready-state";
import { RestoreFlowFromSnapshot } from "@/entities/flow/usecases/restore-flow-from-snapshot";
// import { UpdateLocalSyncMetadata } from "@/entities/sync/usecases/update-local-sync-metadata";

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
