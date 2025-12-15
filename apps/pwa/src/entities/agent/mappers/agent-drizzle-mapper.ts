import { parse, stringify } from "superjson";

import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib/logger";

import { SelectAgent, InsertAgent } from "@/db/schema/agents";
import { Agent, ApiType, OutputFormat, ModelTier, parsePromptMessage, PromptMessage } from "@/entities/agent/domain";

export class AgentDrizzleMapper {
  private constructor() {}

  /**
   * Parse raw JSON array from string (superjson or regular JSON format)
   */
  private static parseRawMessages(messages: any): any[] {
    if (!messages) return [];

    // Already an array
    if (Array.isArray(messages)) return messages;

    // String - try to parse
    if (typeof messages === "string") {
      try {
        // First try superjson.parse (for local DB format)
        const superjsonResult = parse(messages);
        if (Array.isArray(superjsonResult)) {
          return superjsonResult;
        }
      } catch {
        // superjson.parse failed, try regular JSON
      }

      try {
        // Try regular JSON.parse (for cloud format)
        const jsonResult = JSON.parse(messages);
        if (Array.isArray(jsonResult)) {
          return jsonResult;
        }
        // Check if it's superjson wrapper format
        if (jsonResult && typeof jsonResult === "object" && "json" in jsonResult) {
          return jsonResult.json || [];
        }
      } catch {
        // Both failed
      }
    }

    // Object with json wrapper (already parsed superjson format)
    if (messages && typeof messages === "object" && "json" in messages) {
      return messages.json || [];
    }

    return [];
  }

  /**
   * Parse prompt_messages and convert to PromptMessage domain entities.
   * Handles both superjson (local DB) and regular JSON (cloud) formats.
   */
  private static parsePromptMessages(messages: any): PromptMessage[] {
    const rawMessages = this.parseRawMessages(messages);

    // Check if messages are already PromptMessage domain entities
    // (they would have .id and .props properties)
    if (rawMessages.length > 0 && rawMessages[0]?.props?.role !== undefined) {
      return rawMessages as PromptMessage[];
    }

    // Convert raw JSON objects to PromptMessage domain entities
    return rawMessages
      .map((msg: any) => {
        const result = parsePromptMessage(msg);
        if (result.isFailure) {
          logger.error(`Failed to parse prompt message: ${result.getError()}`);
          return null;
        }
        return result.getValue();
      })
      .filter((msg): msg is PromptMessage => msg !== null);
  }

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
        useDefaultModel: row.use_default_model ?? true,
        promptMessages: this.parsePromptMessages(row.prompt_messages),
        textPrompt: row.text_prompt ?? "",
        enabledParameters: new Map(Object.entries(row.enabled_parameters || {})),
        parameterValues: new Map(Object.entries(row.parameter_values || {})),
        enabledStructuredOutput: row.enabled_structured_output,
        outputFormat:
          (row.output_format as OutputFormat) ?? OutputFormat.StructuredOutput,
        outputStreaming: row.output_streaming ?? true,
        schemaName: row.schema_name ?? undefined,
        schemaDescription: row.schema_description ?? undefined,
        tokenCount: row.token_count ?? 0,
        schemaFields: row.schema_fields ?? undefined,
        color: row.color,
        flowId: new UniqueEntityID(row.flow_id),
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
      flow_id: props.flowId.toString(),
      name: props.name,
      description: props.description,
      target_api_type: props.targetApiType,
      api_source: props.apiSource,
      model_id: props.modelId,
      model_name: props.modelName,
      model_tier: props.modelTier ?? undefined,
      use_default_model: props.useDefaultModel,
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
