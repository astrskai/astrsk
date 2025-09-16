import { parse, stringify } from "superjson";

import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/utils/logger";

import { SelectAgent, InsertAgent } from "@/db/schema/agents";
import { Agent, ApiType, OutputFormat, ModelTier } from "@/modules/agent/domain";

export class AgentDrizzleMapper {
  private constructor() {}

  /**
   * Convert database row to domain entity
   */
  public static toDomain(row: SelectAgent): Agent {
    const agentOrError = Agent.create(
      {
        name: row.name.trim() || "Untitled Agent",
        description: row.description,
        targetApiType: row.target_api_type as ApiType,
        apiSource: row.api_source ?? undefined,
        modelId: row.model_id ?? undefined,
        modelName: row.model_name ?? undefined,
        modelTier: (row.model_tier ?? undefined) as ModelTier | undefined,
        promptMessages: row.prompt_messages ? (parse(row.prompt_messages) || []) : [],
        textPrompt: row.text_prompt ?? "",
        enabledParameters: new Map(Object.entries(row.enabled_parameters)),
        parameterValues: new Map(Object.entries(row.parameter_values)),
        enabledStructuredOutput: row.enabled_structured_output,
        outputFormat:
          (row.output_format as OutputFormat) ?? OutputFormat.StructuredOutput,
        outputStreaming: row.output_streaming ?? true,
        schemaName: row.schema_name ?? undefined,
        schemaDescription: row.schema_description ?? undefined,
        tokenCount: row.token_count ?? 0,
        schemaFields: row.schema_fields ?? undefined,
        color: row.color,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      new UniqueEntityID(row.id),
    );

    // Check error
    if (agentOrError.isFailure) {
      logger.error(agentOrError.getError());
      throw new Error(agentOrError.getError());
    }

    // Return agent
    return agentOrError.getValue();
  }

  /**
   * Convert domain entity to database row
   */
  public static toPersistence(agent: Agent): InsertAgent {
    const props = agent.props;

    return {
      id: agent.id.toString(),
      name: props.name,
      description: props.description,
      target_api_type: props.targetApiType,
      api_source: props.apiSource,
      model_id: props.modelId,
      model_name: props.modelName,
      model_tier: props.modelTier ?? undefined,
      prompt_messages: stringify(props.promptMessages || []),
      text_prompt: props.textPrompt ?? "",
      enabled_parameters: Object.fromEntries(props.enabledParameters),
      parameter_values: Object.fromEntries(props.parameterValues),
      enabled_structured_output: props.enabledStructuredOutput,
      output_format: props.outputFormat,
      output_streaming: props.outputStreaming,
      schema_name: props.schemaName,
      schema_description: props.schemaDescription,
      token_count: props.tokenCount,
      schema_fields: props.schemaFields,
      color: props.color,
    };
  }

  /**
   * Convert domain entity to storage with timestamps
   */
  public static toStorage(agent: Agent): InsertAgent {
    const row = this.toPersistence(agent);
    return {
      ...row,
      created_at: agent.props.createdAt,
      updated_at: agent.props.updatedAt,
    };
  }
}
