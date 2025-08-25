import { useCallback, useEffect, useState, useRef } from "react";
import { Agent, ApiType, SchemaField } from "@/modules/agent/domain/agent";
import { Session } from "@/modules/session/domain/session";
import { Turn } from "@/modules/turn/domain/turn";
import { DataStoreSavedField } from "@/modules/turn/domain/option";
import { RenderContext } from "@/shared/prompt/domain";
import { logger } from "@/shared/utils/logger";
import { makeContext } from "@/app/services/session-play-service";

// Empty context for when no session is available
const EMPTY_CONTEXT: RenderContext = {
  cast: {
    all: [],
    active: undefined,
    inactive: []
  },
  session: {
    entries: [],
    scenario: "",
  },
  history: [],
};

// Helper function to create context for preview generation
const createRenderContext = async (session: Session | null, lastTurn: Turn | null = null): Promise<RenderContext & Record<string, unknown>> => {
  if (!session) {
    return { ...EMPTY_CONTEXT };
  }

  try {
    logger.debug("[createRenderContext] Creating context with session data");
    
    // Get the first enabled character from session
    const firstCharacterCard = session.characterCards?.find((card) => card.enabled);
    const characterCardId = firstCharacterCard?.id;
    
    logger.debug("[createRenderContext] Using characterCardId:", characterCardId?.toString());
    
    const contextResult = await makeContext({
      session,
      characterCardId,
      includeHistory: true,
    });
    
    if (contextResult.isFailure) {
      logger.error("[createRenderContext] Failed to create context:", contextResult.getError());
      return { ...EMPTY_CONTEXT };
    }

    let renderContext = { ...contextResult.getValue() };

    // Add variables from the last turn if available
    if (lastTurn?.variables) {
      const variables = lastTurn.variables;
      if (variables && Object.keys(variables).length > 0) {
        renderContext = { ...renderContext, ...variables };
        logger.debug("[createRenderContext] Added variables from last turn:", variables);
      }
    }

    // Add data store fields from the last turn if available
    if (lastTurn?.dataStore && lastTurn.dataStore.length > 0) {
      // Convert DataStoreSavedField[] to object for template access
      const dataStoreObject = Object.fromEntries(
        lastTurn.dataStore.map((field: DataStoreSavedField) => [field.name, field.value])
      );
      renderContext = { ...renderContext, ...dataStoreObject };
      logger.debug("[createRenderContext] Added data store fields from last turn:", dataStoreObject);
    }
    
    return renderContext;
  } catch (error) {
    logger.error("[createRenderContext] Error creating context:", error);
    return { ...EMPTY_CONTEXT };
  }
};

// Helper function to build schema for structured output
const buildSchema = (schemaFields: SchemaField[]): Record<string, unknown> => {
  const schema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  } = {
    type: "object",
    properties: {},
    required: [],
  };

  schemaFields.forEach((field: SchemaField) => {
    const fieldSchema: Record<string, unknown> = {
      type: field.type,
      description: field.description,
    };

    if (field.array) {
      fieldSchema.type = "array";
      fieldSchema.items = { type: field.type };
    }

    if (field.enum && field.enum.length > 0) {
      fieldSchema.enum = field.enum;
    }

    if (field.minimum !== undefined) {
      fieldSchema.minimum = field.minimum;
    }

    if (field.maximum !== undefined) {
      fieldSchema.maximum = field.maximum;
    }

    schema.properties[field.name] = fieldSchema;

    if (field.required) {
      schema.required.push(field.name);
    }
  });

  return {
    type: "json_schema",
    json_schema: {
      name: "response",
      schema: schema
    }
  };
};

// Helper function to add parameters to request data
const addParametersToRequest = (
  agent: Agent, 
  requestData: Record<string, unknown>
): void => {
  logger.debug("[addParametersToRequest] Parameter check:", {
    hasEnabledParameters: !!agent.props.enabledParameters,
    enabledParametersSize: agent.props.enabledParameters?.size || 0,
    hasParameterValues: !!agent.props.parameterValues,
    parameterValuesSize: agent.props.parameterValues?.size || 0
  });
  
  if (agent.props.enabledParameters && agent.props.enabledParameters.size > 0) {
    const enabledParams = Array.from(agent.props.enabledParameters.entries())
      .filter(([, enabled]) => enabled);
    
    logger.debug("[addParametersToRequest] Enabled parameters:", enabledParams);
    
    for (const [parameterId] of enabledParams) {
      const value = agent.props.parameterValues?.get(parameterId);
      logger.debug("[addParametersToRequest] Adding parameter:", { parameterId, value });
      requestData[parameterId] = value !== undefined ? value : true;
    }
  }
};

export function usePreviewGenerator(agent: Agent | null, session: Session | null, lastTurn: Turn | null = null) {
  const [preview, setPreview] = useState("");
  
  // Ref to track the current agent to prevent stale updates
  const currentAgentRef = useRef<string | null>(null);
  // Ref to track ongoing preview generation
  const generationCountRef = useRef<number>(0);
  // Flag to prevent concurrent updates
  const isUpdatingRef = useRef(false);
  
  // Generate preview function
  const generatePreview = useCallback(async (agent: Agent | null, session: Session | null = null, lastTurn: Turn | null = null) => {
    logger.debug("[generatePreview] Starting generation", { 
      hasAgent: !!agent, 
      agentId: agent?.id.toString(),
      hasSession: !!session,
      hasLastTurn: !!lastTurn
    });
    
    if (!agent) return "";

    const agentId = agent.id.toString();
    currentAgentRef.current = agentId;
    
    // Increment generation count and store current generation ID
    const currentGeneration = ++generationCountRef.current;
    logger.debug("[generatePreview] Generation #", currentGeneration);

    try {
      // Create render context using helper function
      const renderContext = await createRenderContext(session, lastTurn);

      // Generate simple API request structure
      const requestData: Record<string, unknown> = {};

      // Generate messages or prompt based on API type
      if (agent.props.targetApiType === ApiType.Chat) {
        const messagesResult = await agent.renderMessages(renderContext);
        if (messagesResult.isSuccess) {
          requestData.messages = messagesResult.getValue();
        }
      } else {
        const promptResult = await agent.renderPrompt(renderContext);
        if (promptResult.isSuccess) {
          requestData.prompt = promptResult.getValue();
        }
      }

      // Add model
      requestData.model = agent.props.modelName;

      // Add structured output schema if available
      if (agent.props.schemaFields && agent.props.schemaFields.length > 0) {
        requestData.response_format = buildSchema(agent.props.schemaFields);
      }

      // Add enabled parameters
      addParametersToRequest(agent, requestData);

      const result = JSON.stringify(requestData, null, 2);
      logger.debug("[generatePreview] Generated result", { 
        generation: currentGeneration,
        currentGeneration: generationCountRef.current,
        currentAgent: currentAgentRef.current,
        isLatest: currentGeneration === generationCountRef.current && currentAgentRef.current === agentId,
        resultLength: result.length
      });
      
      // Check if this is still the most recent generation before returning
      if (currentGeneration === generationCountRef.current && currentAgentRef.current === agentId) {
        logger.debug("[generatePreview] Returning result (latest generation)");
        return result;
      } else {
        logger.debug("[generatePreview] Returning empty (stale generation)");
        return "";
      }
    } catch (error) {
      logger.error("[usePreviewGenerator] Error generating preview:", error);
    }
    
    return "{}";
  }, []);

  // Simple, direct update function without useCallback
  const updatePreview = async () => {
    logger.debug("[usePreviewGenerator] updatePreview called", { 
      isUpdating: isUpdatingRef.current, 
      hasAgent: !!agent,
      agentId: agent?.id.toString()
    });
    
    // Prevent concurrent updates
    if (isUpdatingRef.current) {
      logger.debug("[usePreviewGenerator] Skipping update - already updating");
      return;
    }
    
    isUpdatingRef.current = true;
    
    try {
      if (!agent) {
        logger.debug("[usePreviewGenerator] No agent, setting empty preview");
        setPreview("");
        return;
      }
      
      logger.debug("[usePreviewGenerator] Calling generatePreview...");
      const result = await generatePreview(agent, session, lastTurn);
      logger.debug("[usePreviewGenerator] generatePreview result:", { 
        hasResult: !!result, 
        resultLength: result?.length || 0 
      });
      
      // Only update if result is not empty (means it's the latest generation)
      if (result) {
        setPreview(result);
        logger.debug("[usePreviewGenerator] Preview updated successfully");
      } else {
        logger.debug("[usePreviewGenerator] Empty result, not updating preview");
      }
    } catch (error) {
      logger.error("[usePreviewGenerator] Error in updatePreview:", error);
    } finally {
      isUpdatingRef.current = false;
    }
  };

  // Track previous values to detect actual changes
  const prevAgentData = useRef<string>("");
  const prevSessionId = useRef<string>("");
  const prevLastTurnId = useRef<string>("");
  const prevLastTurnData = useRef<string>("");
  const hasInitialized = useRef(false);

  // Effect with proper dependencies to ensure reactivity
  useEffect(() => {
    // Create a string representation of agent data that we care about
    const promptMessagesHash = agent?.props.promptMessages ? 
      JSON.stringify(agent.props.promptMessages.map(msg => ({ 
        id: msg.id?.toString(), 
        role: msg.props.role,
        blocks: msg.props.promptBlocks?.map(block => ({
          type: block.type,
          content: block.template,
        })) || []
      }))) : "";
    
    // Include parameter data in change detection
    const enabledParamsHash = agent?.props.enabledParameters ? 
      JSON.stringify(Array.from(agent.props.enabledParameters.entries())) : "";
    const parameterValuesHash = agent?.props.parameterValues ? 
      JSON.stringify(Array.from(agent.props.parameterValues.entries())) : "";
    
    const currentAgentData = agent ? `${agent.id}_${agent.props.updatedAt}_${agent.props.targetApiType}_${agent.props.textPrompt}_${agent.props.outputFormat}_${agent.props.enabledStructuredOutput}_${agent.props.schemaName}_${agent.props.schemaDescription}_${JSON.stringify(agent.props.schemaFields || [])}_${agent.props.apiSource}_${agent.props.modelId}_${agent.props.modelName}_${promptMessagesHash}_${enabledParamsHash}_${parameterValuesHash}` : "";
    const currentSessionId = session?.id.toString() || "";
    const currentLastTurnId = session?.turnIds?.[session.turnIds.length - 1]?.toString() || "";
    
    // Create a hash of last turn data to detect content changes
    const currentLastTurnData = lastTurn ? 
      `${lastTurn.id}_${lastTurn.props.updatedAt}_${JSON.stringify(lastTurn.variables || {})}_${JSON.stringify(lastTurn.dataStore || [])}` : "";
    
    // Check if this is the first time with an agent or if something actually changed
    const agentChanged = prevAgentData.current !== currentAgentData;
    const sessionChanged = prevSessionId.current !== currentSessionId;
    const lastTurnChanged = prevLastTurnId.current !== currentLastTurnId;
    const lastTurnDataChanged = prevLastTurnData.current !== currentLastTurnData;
    const isInitialLoad = !hasInitialized.current && agent;
    
    if (agentChanged || sessionChanged || lastTurnChanged || lastTurnDataChanged || isInitialLoad) {
      logger.debug("[usePreviewGenerator] Updating preview due to changes:", { 
        agentChanged, 
        sessionChanged, 
        lastTurnChanged,
        lastTurnDataChanged,
        isInitialLoad,
        prevData: prevAgentData.current,
        currentData: currentAgentData,
        prevLastTurnId: prevLastTurnId.current,
        currentLastTurnId: currentLastTurnId,
        prevLastTurnData: prevLastTurnData.current,
        currentLastTurnData: currentLastTurnData
      });
      
      // Update the tracked values
      prevAgentData.current = currentAgentData;
      prevSessionId.current = currentSessionId;
      prevLastTurnId.current = currentLastTurnId;
      prevLastTurnData.current = currentLastTurnData;
      hasInitialized.current = true;
      
      // Call updatePreview immediately instead of debouncing
      logger.debug("[usePreviewGenerator] About to call updatePreview");
      updatePreview();
    }
  }, [agent, session, lastTurn, updatePreview]); // Added dependencies to ensure proper reactivity

  return { preview, updatePreview };
}