import { DrizzleAgentRepo } from "@/entities/agent/repos/impl/drizzle-agent-repo";
import { CloneAgent } from "@/entities/agent/usecases/clone-agent";
import { DeleteAgent } from "@/entities/agent/usecases/delete-agent";
import { ExportAgentToFile } from "@/entities/agent/usecases/export-agent-to-file";
import { GetAgent } from "@/entities/agent/usecases/get-agent";
import { GetAgentModel } from "@/entities/agent/usecases/get-agent-model";
import { GetAgentName } from "@/entities/agent/usecases/get-agent-name";
import { GetAgentOutput } from "@/entities/agent/usecases/get-agent-output";
import { GetAgentParameters } from "@/entities/agent/usecases/get-agent-parameters";
import { GetAgentPrompt } from "@/entities/agent/usecases/get-agent-prompt";
import { ImportAgentFromFile } from "@/entities/agent/usecases/import-agent-from-file";
import { SaveAgent } from "@/entities/agent/usecases/save-agent";
import { SearchAgent } from "@/entities/agent/usecases/search-agent";
import { UpdateAgentModel } from "@/entities/agent/usecases/update-agent-model";
import { UpdateAgentName } from "@/entities/agent/usecases/update-agent-name";
import { UpdateAgentParameters } from "@/entities/agent/usecases/update-agent-parameters";
import { UpdateAgentOutput } from "@/entities/agent/usecases/update-agent-output";
import { UpdateAgentPrompt } from "@/entities/agent/usecases/update-agent-prompt";
import { RestoreAgentFromSnapshot } from "@/entities/agent/usecases/restore-agent-from-snapshot";
// import { UpdateLocalSyncMetadata } from "@/entities/sync/usecases/update-local-sync-metadata";

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
