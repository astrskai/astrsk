import { DrizzleAgentRepo } from "@/modules/agent/repos/impl/drizzle-agent-repo";
import { CloneAgent } from "@/modules/agent/usecases/clone-agent";
import { DeleteAgent } from "@/modules/agent/usecases/delete-agent";
import { ExportAgentToFile } from "@/modules/agent/usecases/export-agent-to-file";
import { GetAgent } from "@/modules/agent/usecases/get-agent";
import { ImportAgentFromFile } from "@/modules/agent/usecases/import-agent-from-file";
import { SaveAgent } from "@/modules/agent/usecases/save-agent";
import { SearchAgent } from "@/modules/agent/usecases/search-agent";
// import { UpdateLocalSyncMetadata } from "@/modules/sync/usecases/update-local-sync-metadata";

export class AgentService {
  public static agentRepo: DrizzleAgentRepo;

  public static cloneAgent: CloneAgent;
  public static deleteAgent: DeleteAgent;
  public static exportAgentToFile: ExportAgentToFile;
  public static getAgent: GetAgent;
  public static importAgentFromFile: ImportAgentFromFile;
  public static saveAgent: SaveAgent;
  public static searchAgent: SearchAgent;

  private constructor() {}

  public static init() // updateLocalSyncMetadata: UpdateLocalSyncMetadata,
  {
    // this.agentRepo = new DrizzleAgentRepo(updateLocalSyncMetadata);
    this.agentRepo = new DrizzleAgentRepo();
    this.cloneAgent = new CloneAgent(this.agentRepo, this.agentRepo);
    this.deleteAgent = new DeleteAgent(this.agentRepo);
    this.exportAgentToFile = new ExportAgentToFile(this.agentRepo);
    this.getAgent = new GetAgent(this.agentRepo);
    this.importAgentFromFile = new ImportAgentFromFile(this.agentRepo);
    this.saveAgent = new SaveAgent(this.agentRepo);
    this.searchAgent = new SearchAgent(this.agentRepo);
  }
}
