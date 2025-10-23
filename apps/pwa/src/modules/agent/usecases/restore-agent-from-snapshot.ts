import { Result, UseCase } from "@/shared/core";
import { formatFail } from "@/shared/lib";

import { Agent } from "@/modules/agent/domain";
import { SaveAgentRepo } from "@/modules/agent/repos/save-agent-repo";
import { AgentDrizzleMapper } from "@/modules/agent/mappers/agent-drizzle-mapper";
import { SelectAgent } from "@/db/schema/agents";

export class RestoreAgentFromSnapshot implements UseCase<SelectAgent, Result<Agent>> {
  constructor(private saveAgentRepo: SaveAgentRepo) {}

  async execute(agentDbFormat: SelectAgent): Promise<Result<Agent>> {
    try {
      // Use AgentDrizzleMapper to convert database format to domain object
      // This handles all the complex object reconstruction properly
      const agent = AgentDrizzleMapper.toDomain(agentDbFormat);

      // Use the existing save functionality to restore the agent
      const restoredAgentResult = await this.saveAgentRepo.saveAgent(agent);
      return restoredAgentResult;
    } catch (error) {
      return formatFail("Failed to restore agent from snapshot", error);
    }
  }
}