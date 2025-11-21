import { Result, UseCase } from '@/shared/core';
import { UniqueEntityID } from '@/shared/domain';
import { AgentCloudData } from '@/shared/lib/cloud-upload-helpers';

import { LoadAgentRepo } from '@/entities/agent/repos/load-agent-repo';
import { AgentDrizzleMapper } from '@/entities/agent/mappers/agent-drizzle-mapper';

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

      // 2. Convert each agent to cloud format
      for (const agent of agents) {
        // Use mapper to convert domain → persistence format
        const persistenceData = AgentDrizzleMapper.toPersistence(agent);

        // Extract only the fields we need (type-safe)
        const {
          id,
          flow_id,
          name,
          description,
          target_api_type,
          api_source,
          model_id,
          model_name,
          model_tier,
          prompt_messages,
          text_prompt,
          enabled_parameters,
          parameter_values,
          enabled_structured_output,
          output_format,
          output_streaming,
          schema_name,
          schema_description,
          schema_fields,
          token_count,
          color,
        } = persistenceData as any; // Cast only for extraction

        // Build Supabase data with explicit fields
        const agentData: AgentCloudData = {
          id,
          flow_id,
          name,
          description,
          target_api_type,
          api_source,
          model_id,
          model_name,
          model_tier: model_tier || 'Light',
          prompt_messages,
          text_prompt,
          enabled_parameters,
          parameter_values,
          enabled_structured_output,
          output_format: output_format || 'structured_output',
          output_streaming: output_streaming ?? true,
          schema_name,
          schema_description,
          schema_fields,
          token_count: token_count || 0,
          color: color || '#3b82f6',
          created_at: agent.props.createdAt.toISOString(),
          updated_at:
            agent.props.updatedAt?.toISOString() || new Date().toISOString(),
        };

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
