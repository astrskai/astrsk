import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";
import { AgentCloudData } from "@/shared/lib/cloud-upload-helpers";

import { Agent } from "@/entities/agent/domain";

/**
 * Mapper for converting between Agent domain entities and Supabase cloud data format.
 *
 * Naming conventions:
 * - Cloud/Supabase: snake_case (e.g., target_api_type, prompt_messages)
 * - Domain: camelCase (e.g., targetApiType, promptMessages)
 *
 * Note: During import, agent IDs are remapped using the provided newNodeId.
 * The flowId is also remapped to the new local flow ID.
 */
export class AgentSupabaseMapper {
  private constructor() {}

  // ============================================
  // Agent: Cloud → Domain
  // ============================================

  /**
   * Convert agent cloud data to domain entity.
   * Note: Uses provided new IDs for imports to avoid conflicts.
   *
   * @param data Cloud data from Supabase
   * @param newFlowId New local flow ID
   * @param newNodeId New node ID for this agent
   * @param modelOverride Optional model override (for changing API source/model during import)
   */
  public static fromCloud(
    data: AgentCloudData,
    newFlowId: string,
    newNodeId: string,
    modelOverride?: { apiSource: string; modelId: string; modelName: string },
  ): Result<Agent> {
    // Parse promptMessages - cloud may store it as JSON string or superjson string
    let promptMessages: any[] = [];
    if (data.prompt_messages) {
      if (typeof data.prompt_messages === "string") {
        try {
          // Try parsing as JSON first
          const parsed = JSON.parse(data.prompt_messages);
          // Check if it's superjson format (has "json" and optionally "meta" keys)
          if (parsed && typeof parsed === "object" && "json" in parsed) {
            // It's superjson format - extract the actual data
            promptMessages = parsed.json || [];
          } else if (Array.isArray(parsed)) {
            // It's regular JSON array
            promptMessages = parsed;
          } else {
            promptMessages = [];
          }
        } catch {
          promptMessages = [];
        }
      } else if (Array.isArray(data.prompt_messages)) {
        // Already an array
        promptMessages = data.prompt_messages;
      }
    }

    // Convert cloud data to agent JSON format for Agent.fromJSON
    const agentJson = {
      name: data.name,
      description: data.description,
      targetApiType: data.target_api_type,
      apiSource: modelOverride?.apiSource ?? data.api_source,
      modelId: modelOverride?.modelId ?? data.model_id,
      modelName: modelOverride?.modelName ?? data.model_name,
      modelTier: data.model_tier,
      promptMessages,
      textPrompt: data.text_prompt,
      enabledParameters: data.enabled_parameters,
      parameterValues: data.parameter_values,
      enabledStructuredOutput: data.enabled_structured_output,
      outputFormat: data.output_format,
      outputStreaming: data.output_streaming,
      schemaName: data.schema_name,
      schemaDescription: data.schema_description,
      schemaFields: data.schema_fields,
      tokenCount: data.token_count,
      color: data.color,
      flowId: newFlowId,
    };

    const agentResult = Agent.fromJSON(agentJson);
    if (agentResult.isFailure) {
      return Result.fail(agentResult.getError());
    }

    // Create agent with the new ID
    return Agent.create(
      agentResult.getValue().props,
      new UniqueEntityID(newNodeId),
    );
  }

  // ============================================
  // Agent: Domain → Cloud
  // ============================================

  /**
   * Convert agent domain entity to cloud data format.
   * Uses standard JSON serialization (not superjson).
   *
   * @param agent Agent to convert
   */
  public static toCloud(agent: Agent): AgentCloudData {
    const props = agent.props;

    return {
      id: agent.id.toString(),
      flow_id: props.flowId.toString(),
      name: props.name,
      description: props.description,
      target_api_type: props.targetApiType,
      api_source: props.apiSource ?? null,
      model_id: props.modelId ?? null,
      model_name: props.modelName ?? null,
      model_tier: props.modelTier || "Light",
      // Use standard JSON for cloud storage
      prompt_messages: JSON.stringify(props.promptMessages || []),
      text_prompt: props.textPrompt ?? "",
      enabled_parameters: Object.fromEntries(props.enabledParameters),
      parameter_values: Object.fromEntries(props.parameterValues),
      enabled_structured_output: props.enabledStructuredOutput,
      output_format: props.outputFormat || "structured_output",
      output_streaming: props.outputStreaming ?? true,
      schema_name: props.schemaName ?? null,
      schema_description: props.schemaDescription ?? null,
      schema_fields: props.schemaFields,
      token_count: props.tokenCount || 0,
      color: props.color || "#3b82f6",
      created_at: props.createdAt.toISOString(),
      updated_at: props.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
