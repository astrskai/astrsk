import { Result, UseCase } from '@/shared/core';
import { UniqueEntityID } from '@/shared/domain';
import { AgentCloudData } from '@/shared/lib/cloud-upload-helpers';

import { LoadAgentRepo } from '@/entities/agent/repos/load-agent-repo';
import { AgentSupabaseMapper } from '@/entities/agent/mappers/agent-supabase-mapper';

interface Command {
  flowId: UniqueEntityID;
}

/**
 * Prepare all agents for a flow for cloud upload (data preparation only, no upload)
 * Can be reused by session export
 */
export class PrepareAgentsCloudData
  implements UseCase<Command, Result<AgentCloudData[]>> {
  constructor(private loadAgentRepo: LoadAgentRepo) { }

  async execute({ flowId }: Command): Promise<Result<AgentCloudData[]>> {
    try {
      // 1. Get all agents for this flow
      const agentsResult = await this.loadAgentRepo.getAgentsByFlowId(flowId);
      if (agentsResult.isFailure) {
        return Result.fail<AgentCloudData[]>(agentsResult.getError());
      }

      const agents = agentsResult.getValue();
      const agentCloudDataList: AgentCloudData[] = [];

      // 2. Convert each agent to cloud format using mapper
      for (const agent of agents) {
        const agentData = AgentSupabaseMapper.toCloud(agent);
        agentCloudDataList.push(agentData);
      }

      return Result.ok(agentCloudDataList);
    } catch (error) {
      return Result.fail<AgentCloudData[]>(
        `Unexpected error preparing agents data: ${error}`
      );
    }
  }
}
