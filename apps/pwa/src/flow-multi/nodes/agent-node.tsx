// Agent node component for flow-multi system
// Displays agent information and provides panel access buttons
import { type Node, type NodeProps } from "@xyflow/react";
import { useCallback, useState, useEffect, useRef, useMemo } from "react";
import { Copy, Trash2, AlertCircle } from "lucide-react";
import { CustomHandle } from "@/flow-multi/components/custom-handle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { traverseFlowCached } from "@/flow-multi/utils/flow-traversal-cache";
import { useFlowValidation } from "@/app/hooks/use-flow-validation";
import { isAgentValid } from "@/flow-multi/utils/flow-validation";

import { useAgentStore } from "@/app/stores/agent-store";
import { Agent, ApiType, OutputFormat } from "@/modules/agent/domain/agent";
import { AgentService } from "@/app/services/agent-service";
import { FlowService } from "@/app/services/flow-service";
import { ReadyState } from "@/modules/flow/domain";
import { AgentModels } from "@/components-v2/title/create-title/step-prompts";
import { Input } from "@/components-v2/ui/input";
import { toast } from "sonner";
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { PANEL_TYPES } from "@/flow-multi/components/panel-types";
import { useAgentColor } from "@/flow-multi/hooks/use-agent-color";
import { SvgIcon } from "@/components-v2/svg-icon";
import { invalidateSingleFlowQueries } from "@/flow-multi/utils/invalidate-flow-queries";
import { invalidateSingleAgentQueries } from "@/flow-multi/utils/invalidate-agent-queries";
import { sanitizeFileName } from "@/shared/utils/file-utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components-v2/ui/dialog";
import { Button } from "@/components-v2/ui/button";
import { useQuery } from "@tanstack/react-query";
import { agentQueries } from "@/app/queries/agent-queries";
import { UniqueEntityID } from "@/shared/domain";
import { flowQueries } from "@/app/queries/flow-queries";
import { useFlowPanel } from "@/flow-multi/hooks/use-flow-panel";

/**
 * Agent node data type definition
 */
export type AgentNodeData = {
  label?: string;
  agentId?: string;
};

/**
 * Props for the AgentNodeComponent
 */
interface AgentNodeComponentProps {
  agent: Agent;
  flow: any;
  nodeId: string;
  selected?: boolean;
}

/**
 * The main component for rendering an agent node in the flow
 */
function AgentNodeComponent({ agent, flow, nodeId, selected }: AgentNodeComponentProps) {
  // Get updateAgent from flow panel hook
  const { updateAgent } = useFlowPanel({ flowId: flow?.id?.toString() || '' });
  
  // Get store functions from unified AgentStore
  const notifyAgentUpdate = useAgentStore.use.notifyAgentUpdate();
  const updateAllTabTitles = useAgentStore.use.updateAllTabTitles();
  
  // Listen for agent updates to ensure re-render when agent data changes
  const agentUpdateTimestamp = useAgentStore.use.agentUpdateTimestamp();
  const lastUpdatedAgentId = useAgentStore.use.lastUpdatedAgentId();
  
  // Local state for name input
  const [editingName, setEditingName] = useState(agent.props.name);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  
  // Get panel open states and flowId from dockview context
  const { flowId, openPanel, closePanel, isPanelOpen, updateAgentPanelStates } = useFlowPanelContext();
  
  // Use flow validation hook
  const { isValid: isFlowValid } = useFlowValidation(flowId ? new UniqueEntityID(flowId) : null);
  
  // Check if model is selected
  const hasModel = !!agent.props.modelName;
  
  // Use centralized color hook with flow validity
  const { hexColor: agentColor, opacity: agentOpacity } = useAgentColor({ 
    agent,
    flow,
    withAlpha: false, // We'll handle opacity differently for the node
    isFlowValid
  });
  
  // Apply opacity to the color for disconnected state
  const colorWithOpacity = agentOpacity < 1 
    ? `${agentColor}${Math.round(agentOpacity * 255).toString(16).padStart(2, '0')}` // Add alpha channel to hex
    : agentColor;
    
  
  // Check agent-specific panel states
  const agentIdStr = agent.id.toString();
  const panelStates = {
    prompt: isPanelOpen(PANEL_TYPES.PROMPT, agentIdStr),
    parameter: isPanelOpen(PANEL_TYPES.PARAMETER, agentIdStr), 
    structuredOutput: isPanelOpen(PANEL_TYPES.STRUCTURED_OUTPUT, agentIdStr),
    preview: isPanelOpen(PANEL_TYPES.PREVIEW, agentIdStr)
  };
  
  // Get the current agent from flow for real-time updates
  const currentAgent = agent;

  // Calculate stats for display - memoized to update when agent data changes
  const { promptType, parameterCount, hasPrompt, hasAgentName, hasStructuredOutput, isConnectedStartToEnd } = useMemo(() => {
    
    const isChat = currentAgent.props.targetApiType === ApiType.Chat;
    const hasPromptContent = isChat 
      ? (currentAgent.props.promptMessages && currentAgent.props.promptMessages.length > 0)
      : true;
    
    const hasName = currentAgent.props.name && currentAgent.props.name.trim().length > 0;
    const hasOutput = currentAgent.props.enabledStructuredOutput === true && currentAgent.props.schemaFields && currentAgent.props.schemaFields.length > 0;
    
    // Check if agent is connected from start to end
    const traversalResult = traverseFlowCached(flow);
    const agentPosition = traversalResult.agentPositions.get(agent.id.toString());
    const isConnected = agentPosition && agentPosition.isConnectedToStart && agentPosition.isConnectedToEnd;
    
    return {
      promptType: isChat ? "Chat" : "Text",
      parameterCount: Array.from(currentAgent.props.enabledParameters?.values() || []).filter(enabled => enabled === true).length,
      hasPrompt: hasPromptContent,
      hasAgentName: hasName,
      hasStructuredOutput: hasOutput,
      isConnectedStartToEnd: isConnected
    };
  }, [
    agent.id, 
    flow.props.nodes,
    flow.props.edges,
    agent.props.targetApiType, 
    agent.props.enabledParameters, 
    agent.props.schemaFields,
    agent.props.promptMessages,
    agent.props.textPrompt,
    agent.props.name,
    currentAgent.props.enabledStructuredOutput,
    currentAgent.props.outputFormat,
    // React to agent update notifications for this specific agent
    lastUpdatedAgentId === agent.id.toString() ? agentUpdateTimestamp : 0
  ]);

  // Track previous connectivity state to only update when it changes
  const prevIsConnectedRef = useRef<boolean | undefined>(undefined);
  
  // Update agent panel states when connectivity changes
  useEffect(() => {
    // Only update if connectivity state actually changed
    if (prevIsConnectedRef.current !== isConnectedStartToEnd) {
      prevIsConnectedRef.current = isConnectedStartToEnd;
      updateAgentPanelStates(agent.id.toString());
    }
  }, [isConnectedStartToEnd, updateAgentPanelStates, agent.id]);

  // Update local editing name when agent changes (with ref to prevent infinite loops)
  const agentNameRef = useRef(agent.props.name);
  useEffect(() => {
    if (agentNameRef.current !== agent.props.name) {
      agentNameRef.current = agent.props.name;
      setEditingName(agent.props.name);
    }
  }, [agent.props.name]);

  // Function to update agent name references in all agents' prompt messages, schema field descriptions, and flow response template
  // Helper function to get all agents from flow nodes
  const getAllAgentsFromFlow = useCallback(async (flow: any): Promise<Map<string, Agent>> => {
    const agentNodes = flow.props.nodes.filter((n: any) => n.type === 'agent');
    const agentMap = new Map<string, Agent>();
    
    // Fetch all agents
    for (const node of agentNodes) {
      const agentId = node.data?.agentId || node.id;
      try {
        const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
        if (agentResult.isSuccess) {
          agentMap.set(agentId, agentResult.getValue());
        }
      } catch (error) {
        console.warn(`Failed to load agent ${agentId}:`, error);
      }
    }
    
    return agentMap;
  }, []);

  const updateAgentReferences = useCallback(async (oldName: string, newName: string, currentAgentId: string, currentFlow: any) => {
    // Get all agents from flow nodes
    const flowAgents = await getAllAgentsFromFlow(currentFlow);
    
    console.log('🔍 DEBUG: updateAgentReferences called', {
      oldName,
      newName,
      currentAgentId,
      totalAgents: flowAgents.size,
      hasResponseTemplate: !!currentFlow?.props?.responseTemplate,
      responseTemplateLength: currentFlow?.props?.responseTemplate?.length || 0
    });
    
    const oldSanitizedName = sanitizeFileName(oldName);
    const newSanitizedName = sanitizeFileName(newName);
    
    console.log('🔍 DEBUG: Sanitized names', {
      oldSanitizedName,
      newSanitizedName
    });
    
    if (oldSanitizedName === newSanitizedName) {
      console.log('🔍 DEBUG: No changes needed - sanitized names are the same');
      return { updatedAgents: [], responseTemplateChanged: false, totalReferencesUpdated: 0 }; // No changes needed
    }
    
    const updatedAgents: Agent[] = [];
    let totalReferencesUpdated = 0;
    
    // Create regex pattern for any variable reference starting with old agent name
    const agentNamePattern = new RegExp(`\\{\\{${oldSanitizedName}\\.`, 'g');
    
    console.log('🔍 DEBUG: Regex pattern created', {
      agentNamePattern: agentNamePattern.source
    });
    
    flowAgents.forEach((agent, agentId) => {
      console.log('🔍 DEBUG: Checking agent', { 
        agentId, 
        agentName: agent.props.name,
        promptMessagesCount: agent.props.promptMessages?.length || 0,
        isCurrentAgent: agentId === currentAgentId
      });
      
      let agentChanged = false;
      
      // Check and update textPrompt for text-based agents
      let updatedTextPrompt = agent.props.textPrompt;
      if (updatedTextPrompt) {
        console.log('🔍 DEBUG: Checking textPrompt', {
          agentId,
          hasTextPrompt: true,
          textPromptLength: updatedTextPrompt.length,
          textPrompt: updatedTextPrompt
        });
        
        // Replace agent name references
        if (agentNamePattern.test(updatedTextPrompt)) {
          const matches = updatedTextPrompt.match(new RegExp(`\\{\\{${oldSanitizedName}\\.`, 'g'));
          if (matches) {
            totalReferencesUpdated += matches.length;
          }
          console.log('🔍 DEBUG: Found agent name pattern in textPrompt', {
            agentId,
            pattern: agentNamePattern.source,
            matches: matches
          });
          updatedTextPrompt = updatedTextPrompt.replace(new RegExp(`\\{\\{${oldSanitizedName}\\.`, 'g'), `{{${newSanitizedName}.`);
          agentChanged = true;
        }
        
        if (agentChanged) {
          console.log('🔍 DEBUG: TextPrompt changed', {
            agentId,
            originalTextPrompt: agent.props.textPrompt,
            updatedTextPrompt
          });
        }
      } else {
        console.log('🔍 DEBUG: No textPrompt to check', { agentId });
      }
      
      // Check and update promptMessages for chat-based agents
      const updatedMessages = agent.props.promptMessages.map(message => {
        let messageChanged = false;
        
        console.log('🔍 DEBUG: Checking message', { 
          messageId: message.id.toString(),
          messageType: message.props.type,
          hasPromptBlocks: !!message.props.promptBlocks,
          promptBlocksCount: message.props.promptBlocks?.length || 0
        });
        
        // Check if message has promptBlocks and handle accordingly
        if (!message.props.promptBlocks) {
          console.log('🔍 DEBUG: Message has no promptBlocks, skipping');
          return message;
        }
        
        const updatedBlocks = message.props.promptBlocks.map((block: any, blockIndex: number) => {
          console.log('🔍 DEBUG: Checking block', { 
            blockIndex,
            blockId: block.id?.toString(),
            blockType: block.props?.type,
            hasTemplate: !!block.props?.template,
            templateLength: block.props?.template?.length || 0,
            template: block.props?.template
          });
          
          if (block.props.type === 'plain' && block.props.template) {
            let updatedTemplate = block.props.template;
            
            console.log('🔍 DEBUG: Block template before replacement', { 
              blockIndex,
              template: updatedTemplate
            });
            
            // Replace agent name references
            if (agentNamePattern.test(updatedTemplate)) {
              const matches = updatedTemplate.match(new RegExp(`\\{\\{${oldSanitizedName}\\.`, 'g'));
              if (matches) {
                totalReferencesUpdated += matches.length;
              }
              console.log('🔍 DEBUG: Found agent name pattern match', { 
                blockIndex,
                pattern: agentNamePattern.source,
                matches: matches
              });
              updatedTemplate = updatedTemplate.replace(new RegExp(`\\{\\{${oldSanitizedName}\\.`, 'g'), `{{${newSanitizedName}.`);
              messageChanged = true;
            }
            
            console.log('🔍 DEBUG: Block template after replacement', { 
              blockIndex,
              template: updatedTemplate,
              changed: messageChanged
            });
            
            if (messageChanged) {
              const updateResult = block.update({ template: updatedTemplate });
              if (updateResult.isSuccess) {
                console.log('🔍 DEBUG: Block update successful', { blockIndex });
                return block; // Return the updated block object itself
              } else {
                console.log('🔍 DEBUG: Block update failed', { blockIndex, error: updateResult.getError() });
                return block;
              }
            }
          }
          return block;
        });
        
        if (messageChanged) {
          agentChanged = true;
          console.log('🔍 DEBUG: Message changed, updating', { messageId: message.id.toString() });
          const updateResult = message.update({ promptBlocks: updatedBlocks });
          if (updateResult.isSuccess) {
            console.log('🔍 DEBUG: Message update successful', { messageId: message.id.toString() });
            return message; // Return the updated message object itself
          } else {
            console.log('🔍 DEBUG: Message update failed', { messageId: message.id.toString(), error: updateResult.getError() });
            return message;
          }
        }
        return message;
      });
      
      // Check and update schema field descriptions
      let updatedSchemaFields = agent.props.schemaFields;
      if (updatedSchemaFields && updatedSchemaFields.length > 0) {
        console.log('🔍 DEBUG: Checking schema fields', {
          agentId,
          schemaFieldsCount: updatedSchemaFields.length
        });
        
        const newSchemaFields = updatedSchemaFields.map((field, fieldIndex) => {
          if (field.description && agentNamePattern.test(field.description)) {
            const matches = field.description.match(new RegExp(`\\{\\{${oldSanitizedName}\\.`, 'g'));
            if (matches) {
              totalReferencesUpdated += matches.length;
            }
            console.log('🔍 DEBUG: Found agent name pattern in schema field description', {
              fieldIndex,
              fieldName: field.name,
              pattern: agentNamePattern.source,
              matches: matches
            });
            
            const updatedDescription = field.description.replace(new RegExp(`\\{\\{${oldSanitizedName}\\.`, 'g'), `{{${newSanitizedName}.`);
            agentChanged = true;
            
            console.log('🔍 DEBUG: Schema field description updated', {
              fieldIndex,
              fieldName: field.name,
              originalDescription: field.description,
              updatedDescription
            });
            
            return {
              ...field,
              description: updatedDescription
            };
          }
          return field;
        });
        
        if (agentChanged) {
          updatedSchemaFields = newSchemaFields;
        }
      }
      
      if (agentChanged) {
        console.log('🔍 DEBUG: Agent changed, updating agent', { 
          agentId, 
          agentName: agent.props.name,
          updatedMessagesCount: updatedMessages.length,
          textPromptChanged: updatedTextPrompt !== agent.props.textPrompt,
          schemaFieldsChanged: updatedSchemaFields !== agent.props.schemaFields
        });
        
        // Build update object with promptMessages, textPrompt, and schemaFields
        const updateData: any = { promptMessages: updatedMessages as any };
        if (updatedTextPrompt !== agent.props.textPrompt) {
          updateData.textPrompt = updatedTextPrompt;
        }
        if (updatedSchemaFields !== agent.props.schemaFields) {
          updateData.schemaFields = updatedSchemaFields;
        }
        
        const updatedAgent = agent.update(updateData);
        if (updatedAgent.isSuccess) {
          updatedAgents.push(updatedAgent.getValue());
          console.log('🔍 DEBUG: Agent successfully updated and added to list', { agentId });
        } else {
          console.log('🔍 DEBUG: Failed to update agent', { agentId, error: updatedAgent.getError() });
        }
      } else {
        console.log('🔍 DEBUG: No changes found for agent', { agentId, agentName: agent.props.name });
      }
    });
    
    // Update flow response template
    let responseTemplateChanged = false;
    let updatedResponseTemplate = currentFlow.props.responseTemplate;
    
    if (updatedResponseTemplate) {
      console.log('🔍 DEBUG: Checking response template', {
        originalTemplate: updatedResponseTemplate
      });
      
      // Replace agent name references
      if (agentNamePattern.test(updatedResponseTemplate)) {
        const matches = updatedResponseTemplate.match(new RegExp(`\\{\\{${oldSanitizedName}\\.`, 'g'));
        if (matches) {
          totalReferencesUpdated += matches.length;
        }
        console.log('🔍 DEBUG: Found agent name pattern in response template', {
          pattern: agentNamePattern.source,
          matches: matches
        });
        updatedResponseTemplate = updatedResponseTemplate.replace(new RegExp(`\\{\\{${oldSanitizedName}\\.`, 'g'), `{{${newSanitizedName}.`);
        responseTemplateChanged = true;
      }
      
      if (responseTemplateChanged) {
        console.log('🔍 DEBUG: Response template changed', {
          originalTemplate: currentFlow.props.responseTemplate,
          updatedTemplate: updatedResponseTemplate
        });
        // Update the flow's response template
        currentFlow.props.responseTemplate = updatedResponseTemplate;
      } else {
        console.log('🔍 DEBUG: No changes found in response template');
      }
    } else {
      console.log('🔍 DEBUG: No response template to check');
    }
    
    console.log('🔍 DEBUG: updateAgentReferences complete', {
      totalUpdatedAgents: updatedAgents.length,
      updatedAgentIds: updatedAgents.map(a => a.id.toString()),
      responseTemplateChanged,
      totalReferencesUpdated
    });
    
    return { updatedAgents, responseTemplateChanged, totalReferencesUpdated };
  }, [getAllAgentsFromFlow]);

  // Save function for agent name
  const saveAgentName = useCallback(
    async (newName: string, agentId: string, currentName: string) => {
      const trimmedName = newName.trim();
      
      // Validation: Check if name is empty or unchanged
      if (!trimmedName || trimmedName === currentName) return;
      
      // Validation: Check if name is at least 3 characters
      if (trimmedName.length < 3) {
        toast.error("Agent name must be at least 3 characters long");
        setEditingName(currentName); // Reset to original name
        return;
      }
      
      // Validation: Check if name starts with a number
      if (/^[0-9]/.test(trimmedName)) {
        toast.error("Agent name cannot start with a number");
        setEditingName(currentName); // Reset to original name
        return;
      }
      
      setIsSaving(true);
      try {
        console.log('🔧 Agent name save started:', { 
          agentId, 
          newName: trimmedName, 
          currentName 
        });
        
        // Get fresh agent data using AgentService
        const agentResult = await AgentService.getAgent.execute(new UniqueEntityID(agentId));
        if (agentResult.isFailure) {
          throw new Error("Agent not found");
        }
        const currentAgent = agentResult.getValue();

        console.log('🔧 Current agent found:', {
          agentId,
          currentAgentName: currentAgent.props.name,
          aboutToUpdateTo: trimmedName
        });

        // Get fresh flow data using FlowService
        const flowResult = await FlowService.getFlow.execute(new UniqueEntityID(flowId));
        if (flowResult.isFailure) {
          throw new Error("Flow not found");
        }
        const currentFlow = flowResult.getValue();

        // Update agent name references in other agents' prompt messages, schema field descriptions, and flow response template
        const { updatedAgents: agentsWithUpdatedReferences, responseTemplateChanged, totalReferencesUpdated } = await updateAgentReferences(
          currentName, 
          trimmedName, 
          agentId, 
          currentFlow
        );

        const updatedAgent = currentAgent.update({ name: trimmedName });
        if (updatedAgent.isFailure) {
          throw new Error(updatedAgent.getError());
        }

        console.log('🔧 Agent updated in memory:', {
          agentId,
          updatedName: updatedAgent.getValue().props.name,
          otherAgentsUpdated: agentsWithUpdatedReferences.length,
          responseTemplateChanged
        });

        // Save the renamed agent using updateAgent
        await updateAgent(agentId, { name: trimmedName });

        // Save all agents that had their references updated
        for (const agentWithUpdatedRefs of agentsWithUpdatedReferences) {
          // Extract just the updated properties from the agent
          const updates: any = {};
          if (agentWithUpdatedRefs.props.promptMessages) {
            updates.promptMessages = agentWithUpdatedRefs.props.promptMessages;
          }
          if (agentWithUpdatedRefs.props.schemaFields) {
            updates.schemaFields = agentWithUpdatedRefs.props.schemaFields;
          }
          if (agentWithUpdatedRefs.props.schemaDescription) {
            updates.schemaDescription = agentWithUpdatedRefs.props.schemaDescription;
          }
          
          await updateAgent(agentWithUpdatedRefs.id.toString(), updates);
        }
        
        console.log('🔧 Agent saved to database:', {
          agentId,
          savedName: trimmedName
        });
        
        console.log('🔧 Agents saved:', {
          renamedAgent: agentId,
          renamedAgentName: trimmedName,
          updatedReferences: agentsWithUpdatedReferences.length
        });
        
        // Notify that agents were updated for preview panel refresh
        notifyAgentUpdate(agentId);
        agentsWithUpdatedReferences.forEach(updatedAgent => {
          notifyAgentUpdate(updatedAgent.id.toString());
        });
        
        // Flow state update is already handled by updateAgent
        // Save the updated flow if response template changed
        if (responseTemplateChanged) {
          const savedFlowResult = await FlowService.saveFlow.execute(currentFlow);
          if (savedFlowResult.isFailure) {
            throw new Error(savedFlowResult.getError());
          }
        }
        
        console.log('🔧 Flow saved with updated agents');
        
        // BLOCKED: Don't update the store with selectFlow to prevent all panels from refreshing
        // const savedFlow = savedFlowResult.getValue();
        // await selectFlow(savedFlow);
        
        console.log('🔧 Flow saved successfully');
        
        // Update all tab titles to reflect the new agent name
        updateAgentPanelStates(agentId);
        
        console.log('🔧 Tab titles update triggered');
        
        // Invalidate queries for all updated agents
        await invalidateSingleAgentQueries(agentId);
        for (const updatedAgent of agentsWithUpdatedReferences) {
          await invalidateSingleAgentQueries(updatedAgent.id.toString());
        }
        
        if (totalReferencesUpdated > 0) {
          const changes = [];
          if (agentsWithUpdatedReferences.length > 0) {
            changes.push(`${agentsWithUpdatedReferences.length} agent(s)`);
          }
          if (responseTemplateChanged) {
            changes.push("response design");
          }
          toast.success(`Agent name updated and ${totalReferencesUpdated} reference(s) in ${changes.join(" and ")} were updated`);
        } else {
          toast.success("Agent name updated");
        }
      } catch (error) {
        toast.error("Failed to update agent name", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        setEditingName(currentName); // Reset on error
      } finally {
        setIsSaving(false);
      }
    },
    [flowId, notifyAgentUpdate, updateAllTabTitles, updateAgentReferences, getAllAgentsFromFlow, updateAgent]
  );

  // Handle model change - remove dependencies to avoid circular updates
  const handleModelChange = useCallback(async (modelName?: string, _isDirtyFromModel?: boolean, modelInfo?: { apiSource?: string; modelId?: string }) => {
    if (!modelName) return;
    
    setIsSaving(true);
    try {
      // Build the update object with all model information
      const updateData: any = {
        apiSource: modelInfo?.apiSource,
        modelId: modelInfo?.modelId,
        modelName: modelName,
      };

      // Use updateAgent which handles flow state and invalidation
      await updateAgent(agent.id.toString(), updateData);
      
      // Notify that agent was updated for preview panel refresh
      notifyAgentUpdate(agent.id.toString());
      
    } catch (error) {
      toast.error("Failed to update model", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  }, [agent.id, updateAgent, notifyAgentUpdate]);

  // Handle name input changes
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setEditingName(newName);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Blur will trigger the save
    } else if (e.key === 'Escape') {
      setEditingName(agent.props.name); // Reset to original name
      e.currentTarget.blur();
    }
  }, [agent.props.name]);

  // Panel button handlers - use context openPanel
  const handlePromptClick = useCallback(() => {
    openPanel(PANEL_TYPES.PROMPT, agent.id.toString());
  }, [agent.id, openPanel]);

  const handleParametersClick = useCallback(() => {
    openPanel(PANEL_TYPES.PARAMETER, agent.id.toString());
  }, [agent.id, openPanel]);

  const handleStructuredOutputClick = useCallback(() => {
    openPanel(PANEL_TYPES.STRUCTURED_OUTPUT, agent.id.toString());
  }, [agent.id, openPanel]);

  const handlePreviewClick = useCallback(() => {
    openPanel(PANEL_TYPES.PREVIEW, agent.id.toString());
  }, [agent.id, openPanel]);

  // Double-click handlers to close panels
  const handlePromptDoubleClick = useCallback(() => {
    const panelId = `${PANEL_TYPES.PROMPT}-${agent.id.toString()}`;
    closePanel(panelId);
  }, [agent.id, closePanel]);

  const handleParametersDoubleClick = useCallback(() => {
    const panelId = `${PANEL_TYPES.PARAMETER}-${agent.id.toString()}`;
    closePanel(panelId);
  }, [agent.id, closePanel]);

  const handleStructuredOutputDoubleClick = useCallback(() => {
    const panelId = `${PANEL_TYPES.STRUCTURED_OUTPUT}-${agent.id.toString()}`;
    closePanel(panelId);
  }, [agent.id, closePanel]);

  const handlePreviewDoubleClick = useCallback(() => {
    const panelId = `${PANEL_TYPES.PREVIEW}-${agent.id.toString()}`;
    closePanel(panelId);
  }, [agent.id, closePanel]);

  const handleCopyClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Use flow panel's copy method if available
    if ((window as any).flowPanelCopyAgent) {
      (window as any).flowPanelCopyAgent(agent.id.toString());
    } else {
      toast.error("Copy function not available");
    }
  }, [agent.id]);

  const handleDeleteClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpenDelete(true);
  }, []);

  const handleDelete = useCallback(async () => {
    setIsOpenDelete(false);
    
    // Use flow panel's delete method if available
    if ((window as any).flowPanelDeleteAgent) {
      (window as any).flowPanelDeleteAgent(agent.id.toString());
    } else {
      toast.error("Delete function not available");
    }
  }, [agent.id]);



  // Check if agent is valid (has all required fields)
  // Only show validation errors if agent is connected from start to end
  const shouldShowValidation = isConnectedStartToEnd;
  const isCurrentAgentValid = shouldShowValidation ? isAgentValid(currentAgent) : true;
  
  return (
    <div 
      className={`group/node w-80 rounded-lg inline-flex justify-between items-center ${
        !isCurrentAgentValid
          ? "bg-background-surface-2 outline-2 outline-status-destructive-light"
          : selected
            ? "bg-background-surface-3 outline-2 outline-accent-primary shadow-lg"
            : "bg-background-surface-3 outline-1 outline-border-light"
      }`}
    >
      <div className="flex-1 p-4 inline-flex flex-col justify-start items-start gap-4">
        {/* Agent Name Section - Direct Input */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <div className="self-stretch inline-flex justify-start items-center gap-1">
            {shouldShowValidation && !hasAgentName && (
              <AlertCircle className="min-w-4 min-h-4 text-status-destructive-light" />
            )}
            <div className="justify-start"><span className="text-text-body text-[10px] font-medium">Agent node</span><span className="text-status-required text-[10px] font-medium">*</span></div>
          </div>
          <Input
            value={editingName}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // Save on blur if name has changed
              if (editingName.trim() && editingName.trim() !== agent.props.name) {
                saveAgentName(editingName, agent.id.toString(), agent.props.name);
              } else if (!editingName.trim()) {
                // Reset to original name if empty
                setEditingName(agent.props.name);
              }
            }}
            onMouseDown={(e) => {
              // Prevent drag when clicking on input
              console.log("Mouse down");
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              // Prevent drag for touch/pointer events
              console.log("Pointer down");
              e.stopPropagation();
            }}
            placeholder="Enter agent name"
            disabled={isSaving}
            className={`nodrag ${shouldShowValidation && !hasAgentName ? "outline-status-destructive-light" : ""}`}
          />
        </div>
        
        {/* Model Selection Section */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <div className="self-stretch inline-flex justify-start items-center gap-1">
            {shouldShowValidation && !hasModel && (
              <AlertCircle className="min-w-4 min-h-4 text-status-destructive-light" />
            )}
            <div className="justify-start"><span className="text-text-body text-xs font-medium">Model</span><span className="text-status-required text-xs font-medium">*</span></div>
          </div>
          <div className="self-stretch min-w-0 nodrag">
            <AgentModels
              agent={agent}
              modelChanged={handleModelChange}
            />
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="self-stretch flex flex-col gap-2">
          <div className="flex gap-2">
            {/* Prompt Button */}
            <button 
              onClick={handlePromptClick}
              // onDoubleClick={handlePromptDoubleClick}
              className={`flex-1 h-20 px-2 pt-1.5 pb-2.5 rounded-lg outline outline-offset-[-1px] transition-all inline-flex flex-col justify-center items-center ${
                shouldShowValidation && !hasPrompt
                  ? panelStates.prompt
                    ? 'bg-background-surface-light outline-status-destructive-light hover:opacity-70'
                    : 'bg-background-surface-4 outline-status-destructive-light hover:bg-background-surface-5'
                  : panelStates.prompt 
                    ? 'bg-background-surface-light outline-border-light hover:opacity-70' 
                    : 'bg-background-surface-4 outline-border-light hover:bg-background-surface-5'
              }`}
            >
              <div className={`self-stretch text-center justify-start text-2xl font-medium leading-10 ${
                panelStates.prompt ? 'text-text-contrast-text' : 'text-text-primary'
              }`}>{promptType}</div>
              <div className="self-stretch text-center justify-start">
                <span className={`text-xs font-medium ${panelStates.prompt ? 'text-text-info' : 'text-text-secondary'}`}>Prompt</span>
                <span className="text-status-required text-xs font-medium">*</span>
              </div>
            </button>
            
            {/* Parameters Button */}
            <button 
              onClick={handleParametersClick}
              // onDoubleClick={handleParametersDoubleClick}
              className={`flex-1 h-20 px-2 pt-1.5 pb-2.5 rounded-lg outline outline-offset-[-1px] transition-all inline-flex flex-col justify-center items-center ${
                panelStates.parameter
                  ? 'bg-background-surface-light outline-border-light hover:opacity-70' 
                  : 'bg-background-surface-4 outline-border-light hover:bg-background-surface-5'
              }`}
            >
              <div className={`self-stretch text-center justify-start text-2xl font-medium leading-10 ${
                panelStates.parameter ? 'text-text-contrast-text' : 'text-text-primary'
              }`}>{parameterCount}</div>
              <div className={`self-stretch text-center justify-start text-xs font-medium ${
                panelStates.parameter ? 'text-text-info' : 'text-text-secondary'
              }`}>Parameters</div>
            </button>
          </div>
          
          <div className="flex gap-2">
            {/* Structured Output Button */}
            <button 
              onClick={handleStructuredOutputClick}
              // onDoubleClick={handleStructuredOutputDoubleClick}
              className={`flex-1 h-20 px-2 pt-1.5 pb-2.5 rounded-lg outline outline-offset-[-1px] transition-all inline-flex flex-col justify-center items-center ${
                shouldShowValidation && (currentAgent.props.outputFormat || OutputFormat.StructuredOutput) === OutputFormat.StructuredOutput && !hasStructuredOutput
                  ? panelStates.structuredOutput
                    ? 'bg-background-surface-light outline-status-destructive-light hover:opacity-70'
                    : 'bg-background-surface-4 outline-status-destructive-light hover:bg-background-surface-5'
                  : panelStates.structuredOutput
                    ? 'bg-background-surface-light outline-border-light hover:opacity-70' 
                    : 'bg-background-surface-4 outline-border-light hover:bg-background-surface-5'
              }`}
            >
              <div className={`self-stretch text-center justify-start text-xl font-medium leading-9 ${
                panelStates.structuredOutput ? 'text-text-contrast-text' : 'text-text-primary'
              }`}>
                {currentAgent.props.outputFormat === OutputFormat.TextOutput ? 'Response' : 'Structured'}
              </div>
              <div className="self-stretch text-center justify-start">
                <span className={`text-xs font-medium ${panelStates.structuredOutput ? 'text-text-info' : 'text-text-secondary'}`}>
                  Output
                </span>

                  <span className="text-status-required text-xs font-medium">*</span>

              </div>
            </button>
            
            {/* Preview Button */}
            <button 
              onClick={handlePreviewClick}
              // onDoubleClick={handlePreviewDoubleClick}
              className={`flex-1 h-20 px-2 pt-1.5 pb-2.5 rounded-lg outline outline-offset-[-1px] transition-all inline-flex flex-col justify-center items-center gap-2 ${
                panelStates.preview
                  ? 'bg-background-surface-light outline-border-light hover:opacity-70' 
                  : 'bg-background-surface-4 outline-border-light hover:bg-background-surface-5'
              }`}
            >
              <div className="pt-[1px]"/>
              <div className="w-6 h-6 relative overflow-hidden">
                <SvgIcon name="preview" className={`min-w-4 min-h-4 ${
                  panelStates.preview ? 'text-text-contrast-text' : 'text-text-primary'
                }`} />
              </div>
              <div className={`self-stretch text-center justify-start text-xs font-medium ${
                panelStates.preview ? 'text-text-info' : 'text-text-secondary'
              }`}>Preview</div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Action Buttons Panel */}
      <div 
        className="self-stretch px-2 py-4 rounded-tr-lg rounded-br-lg inline-flex flex-col justify-start items-start gap-3"
        style={{ backgroundColor: colorWithOpacity }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={handleCopyClick}
              className="w-6 h-6 relative overflow-hidden hover:opacity-80 transition-opacity group/copy"
            >
              <Copy className="min-w-4 min-h-5 text-text-contrast-text"/>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" variant="button">
            <p>Copy</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={handleDeleteClick}
              className="w-6 h-6 relative overflow-hidden hover:opacity-80 transition-opacity group/delete"
            >
              <Trash2 className="min-w-4 min-h-5 text-text-contrast-text"/>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" variant="button">
            <p>Delete</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isOpenDelete} onOpenChange={setIsOpenDelete}>
        <DialogContent hideClose>
          <DialogHeader>
            <DialogTitle>Delete agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete agent "{agent.props.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="lg">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" size="lg" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* React Flow Handles */}
      <CustomHandle variant="output" nodeId={nodeId} />
      <CustomHandle variant="input" nodeId={nodeId} />
    </div>
  );
}

export type AgentNode = Node<AgentNodeData>;

/**
 * Default export for ReactFlow node registration
 */
export default function AgentNode({
  id,
  data,
  selected,
}: NodeProps<AgentNode>) {
  // Get the selected flow ID from agent store
  const selectedFlowId = useAgentStore.use.selectedFlowId();
  
  // Use React Query to get the flow data - this will automatically update when invalidated
  const { data: selectedFlow } = useQuery({
    ...flowQueries.detail(selectedFlowId ? new UniqueEntityID(selectedFlowId) : undefined),
    enabled: !!selectedFlowId
  });
  
  // Use the agentId from node data, fallback to node id for backward compatibility
  const agentId = data?.agentId || id;
  const { data: agent, isLoading: isLoadingAgent, error: agentError } = useQuery(agentQueries.detail(new UniqueEntityID(agentId)));

  if (!selectedFlow) {
    return (
      <div className="w-80 bg-[#fafafa] rounded-lg border border-[#e5e7eb] p-4">
        <div className="text-[#6b7280] text-sm">Loading flow...</div>
      </div>
    );
  }

  if (isLoadingAgent) {
    return (
      <div className="w-80 bg-[#fafafa] rounded-lg border border-[#e5e7eb] p-4">
        <div className="text-[#6b7280] text-sm">Loading agent...</div>
      </div>
    );
  }

  if (!agent || agentError) {
    return (
      <div className="w-80 bg-[#fee2e2] rounded-lg border-2 border-[#ef4444] p-4">
        <div className="flex items-center gap-2 text-[#dc2626] font-medium">
          <AlertCircle className="w-4 h-4" />
          <span>Agent not found</span>
        </div>
        <div className="text-[#7f1d1d] text-sm mt-2">
          This agent has been deleted. Remove this node to fix the flow.
        </div>
        <CustomHandle variant="output" nodeId={id} />
        <CustomHandle variant="input" nodeId={id} />
      </div>
    );
  }

  // Pass the data prop to the component
  return <AgentNodeComponent agent={agent} flow={selectedFlow} nodeId={id} selected={selected} />;
}
