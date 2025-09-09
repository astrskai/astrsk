import { DrizzleAgentRepo } from "@/modules/agent/repos/impl/drizzle-agent-repo";
import { CloneAgent } from "@/modules/agent/usecases/clone-agent";
import { DeleteAgent } from "@/modules/agent/usecases/delete-agent";
import { ExportAgentToFile } from "@/modules/agent/usecases/export-agent-to-file";
import { GetAgent } from "@/modules/agent/usecases/get-agent";
import { GetAgentModel } from "@/modules/agent/usecases/get-agent-model";
import { GetAgentName } from "@/modules/agent/usecases/get-agent-name";
import { GetAgentOutput } from "@/modules/agent/usecases/get-agent-output";
import { GetAgentParameters } from "@/modules/agent/usecases/get-agent-parameters";
import { GetAgentPrompt } from "@/modules/agent/usecases/get-agent-prompt";
import { ImportAgentFromFile } from "@/modules/agent/usecases/import-agent-from-file";
import { SaveAgent } from "@/modules/agent/usecases/save-agent";
import { SearchAgent } from "@/modules/agent/usecases/search-agent";
import { UpdateAgentModel } from "@/modules/agent/usecases/update-agent-model";
import { UpdateAgentName } from "@/modules/agent/usecases/update-agent-name";
import { UpdateAgentParameters } from "@/modules/agent/usecases/update-agent-parameters";
import { UpdateAgentOutput } from "@/modules/agent/usecases/update-agent-output";
import { UpdateAgentPrompt } from "@/modules/agent/usecases/update-agent-prompt";
import { RestoreAgentFromSnapshot } from "@/modules/agent/usecases/restore-agent-from-snapshot";
// import { UpdateLocalSyncMetadata } from "@/modules/sync/usecases/update-local-sync-metadata";

export class AgentService {
  public static agentRepo: DrizzleAgentRepo;

  public static cloneAgent: CloneAgent;
  public static deleteAgent: DeleteAgent;
  public static exportAgentToFile: ExportAgentToFile;
  public static getAgent: GetAgent;
  public static getAgentModel: GetAgentModel;
  public static getAgentName: GetAgentName;
  public static getAgentOutput: GetAgentOutput;
  public static getAgentParameters: GetAgentParameters;
  public static getAgentPrompt: GetAgentPrompt;
  public static importAgentFromFile: ImportAgentFromFile;
  public static saveAgent: SaveAgent;
  public static searchAgent: SearchAgent;
  public static updateAgentModel: UpdateAgentModel;
  public static updateAgentName: UpdateAgentName;
  public static updateAgentParameters: UpdateAgentParameters;
  public static updateAgentOutput: UpdateAgentOutput;
  public static updateAgentPrompt: UpdateAgentPrompt;
  public static restoreAgentFromSnapshot: RestoreAgentFromSnapshot;

  private constructor() {}

  public static init() // updateLocalSyncMetadata: UpdateLocalSyncMetadata,
  {
    // this.agentRepo = new DrizzleAgentRepo(updateLocalSyncMetadata);
    this.agentRepo = new DrizzleAgentRepo();
    this.cloneAgent = new CloneAgent(this.agentRepo, this.agentRepo);
    this.deleteAgent = new DeleteAgent(this.agentRepo);
    this.exportAgentToFile = new ExportAgentToFile(this.agentRepo);
    this.getAgent = new GetAgent(this.agentRepo);
    this.getAgentModel = new GetAgentModel(this.agentRepo);
    this.getAgentName = new GetAgentName(this.agentRepo);
    this.getAgentOutput = new GetAgentOutput(this.agentRepo);
    this.getAgentParameters = new GetAgentParameters();
    this.getAgentPrompt = new GetAgentPrompt(this.agentRepo);
    this.importAgentFromFile = new ImportAgentFromFile(this.agentRepo);
    this.saveAgent = new SaveAgent(this.agentRepo);
    this.searchAgent = new SearchAgent(this.agentRepo);
    this.updateAgentModel = new UpdateAgentModel(this.agentRepo);
    this.updateAgentName = new UpdateAgentName(this.agentRepo);
    this.updateAgentParameters = new UpdateAgentParameters();
    this.updateAgentOutput = new UpdateAgentOutput(this.agentRepo);
    this.updateAgentPrompt = new UpdateAgentPrompt(this.agentRepo);
    this.restoreAgentFromSnapshot = new RestoreAgentFromSnapshot(this.agentRepo);
  }
}
