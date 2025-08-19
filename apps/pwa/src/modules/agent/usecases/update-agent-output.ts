import { Result } from "@/shared/core";
import { UseCase } from "@/shared/core/use-case";
import { DrizzleAgentRepo } from "@/modules/agent/repos/impl/drizzle-agent-repo";
import { OutputFormat, SchemaField } from "@/modules/agent/domain/agent";

interface UpdateAgentOutputDTO {
  agentId: string;
  enabledStructuredOutput?: boolean;
  outputFormat?: OutputFormat;
  outputStreaming?: boolean;
  schemaName?: string;
  schemaDescription?: string;
  schemaFields?: SchemaField[];
}

type UpdateAgentOutputResponse = Result<void>;

export class UpdateAgentOutput implements UseCase<UpdateAgentOutputDTO, UpdateAgentOutputResponse> {
  constructor(private agentRepo: DrizzleAgentRepo) {}

  async execute(request: UpdateAgentOutputDTO): Promise<UpdateAgentOutputResponse> {
    try {
      const { agentId, ...outputData } = request;
      
      // Update just the output fields in the database
      const result = await this.agentRepo.updateAgentOutputFields(agentId, outputData);
      
      if (result.isFailure) {
        return Result.fail<void>(result.getError());
      }

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to update agent output: ${error}`);
    }
  }
}