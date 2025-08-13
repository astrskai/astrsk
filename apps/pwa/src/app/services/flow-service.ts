import { LoadAgentRepo, SaveAgentRepo, DeleteAgentRepo } from "@/modules/agent/repos";
import { DrizzleFlowRepo } from "@/modules/flow/repos/impl/drizzle-flow-repo";
import { CloneFlow } from "@/modules/flow/usecases/clone-flow";
import { CreateFlow } from "@/modules/flow/usecases/create-flow";
import { DeleteFlow } from "@/modules/flow/usecases/delete-flow";
import { ExportFlowToFile } from "@/modules/flow/usecases/export-flow-to-file";
import { GetFlow } from "@/modules/flow/usecases/get-flow";
import { GetModelsFromFlowFile } from "@/modules/flow/usecases/get-models-from-flow-file";
import { ImportFlowFromFile } from "@/modules/flow/usecases/import-flow-from-file";
import { ListFlowByProvider } from "@/modules/flow/usecases/list-flow-by-provider";
import { SaveFlow } from "@/modules/flow/usecases/save-flow";
import { SearchFlow } from "@/modules/flow/usecases/search-flow";
// import { UpdateLocalSyncMetadata } from "@/modules/sync/usecases/update-local-sync-metadata";

export class FlowService {
  public static flowRepo: DrizzleFlowRepo;

  public static cloneFlow: CloneFlow;
  public static createFlow: CreateFlow;
  public static deleteFlow: DeleteFlow;
  public static exportFlowToFile: ExportFlowToFile;
  public static getFlow: GetFlow;
  public static getModelsFromFlowFile: GetModelsFromFlowFile;
  public static importFlowFromFile: ImportFlowFromFile;
  public static saveFlow: SaveFlow;
  public static searchFlow: SearchFlow;
  public static listFlowByProvider: ListFlowByProvider;

  private constructor() {}

  public static init(loadAgentRepo: LoadAgentRepo, saveAgentRepo: SaveAgentRepo, deleteAgentRepo: DeleteAgentRepo) {
    this.flowRepo = new DrizzleFlowRepo();

    // Initialize the use cases
    this.cloneFlow = new CloneFlow(this.flowRepo, this.flowRepo, loadAgentRepo, saveAgentRepo);
    this.createFlow = new CreateFlow(saveAgentRepo, this.flowRepo);
    this.deleteFlow = new DeleteFlow(this.flowRepo, this.flowRepo, deleteAgentRepo);
    this.exportFlowToFile = new ExportFlowToFile(this.flowRepo, loadAgentRepo);
    this.getFlow = new GetFlow(this.flowRepo);
    this.getModelsFromFlowFile = new GetModelsFromFlowFile();
    this.importFlowFromFile = new ImportFlowFromFile(this.flowRepo, saveAgentRepo);
    this.saveFlow = new SaveFlow(this.flowRepo);
    this.searchFlow = new SearchFlow(this.flowRepo);
    this.listFlowByProvider = new ListFlowByProvider(this.flowRepo);
  }
}
