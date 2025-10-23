import { Result } from "@/shared/core";
import { UseCase } from "@/shared/core/use-case";
import { UniqueEntityID } from "@/shared/domain";
import { DrizzleAgentRepo } from "@/entities/agent/repos/impl/drizzle-agent-repo";
import { OutputFormat, SchemaField } from "@/entities/agent/domain/agent";

interface GetAgentOutputDTO {
  agentId: string;
}

export interface AgentOutputResult {
  enabledStructuredOutput: boolean;
  outputFormat?: OutputFormat;
  outputStreaming?: boolean;
  schemaName?: string;
  schemaDescription?: string;
  schemaFields: SchemaField[];
  name: string;
}

type GetAgentOutputResponse = Result<AgentOutputResult>;

export class GetAgentOutput implements UseCase<GetAgentOutputDTO, GetAgentOutputResponse> {
  constructor(private agentRepo: DrizzleAgentRepo) {}

  async execute(request: GetAgentOutputDTO): Promise<GetAgentOutputResponse> {
    try {
      const agentId = new UniqueEntityID(request.agentId);
      
      // Get just the output fields from the database
      const outputData = await this.agentRepo.getAgentOutputFields(agentId);
      
      if (!outputData) {
        return Result.fail<AgentOutputResult>("Agent not found");
      }

      return Result.ok<AgentOutputResult>(outputData);
    } catch (error) {
      return Result.fail<AgentOutputResult>(`Failed to get agent output: ${error}`);
    }
  }
}