import { Flow } from '@/modules/flow/domain';
import { Agent, ApiType, OutputFormat } from '@/modules/agent/domain';
import { traverseFlow } from './flow-traversal';

/**
 * Check if an individual agent is valid based on its required fields
 */
export function isAgentValid(agent: Agent): boolean {
  // Check required fields
  const hasModel = !!agent.props.modelName;
  const hasAgentName = !!agent.props.name?.trim();
  
  // Check prompt based on agent API type
  let hasPrompt = false;
  if (agent.props.targetApiType === ApiType.Chat) {
    // For chat completion, check promptMessages
    hasPrompt = !!(agent.props.promptMessages && agent.props.promptMessages.length > 0);
  } else if (agent.props.targetApiType === ApiType.Text) {
    // For text completion, check textPrompt
    // hasPrompt = !!(agent.props.textPrompt && agent.props.textPrompt.trim());
    // TODO add validation for textPrompt
    hasPrompt = true;
  }

  // Check structured output if needed
  let hasStructuredOutput = true;
  if ((agent.props.outputFormat || OutputFormat.StructuredOutput) === OutputFormat.StructuredOutput) {
    hasStructuredOutput = !!(agent.props.schemaFields && 
                           agent.props.schemaFields.length > 0);
  }

  return hasModel && hasPrompt && hasAgentName && hasStructuredOutput;
}

/**
 * Check if all connected agents in a flow are valid
 * @param flow - The flow to check
 * @param agents - Map of agent IDs to agents
 * @returns true if all connected agents are valid, false otherwise
 */
export function areAllConnectedAgentsValid(flow: Flow, agents: Map<string, Agent>): boolean {
  const traversalResult = traverseFlow(flow);
  
  // Check each agent's validity
  for (const [agentId, position] of traversalResult.agentPositions) {
    // Only check agents that are connected from start to end
    if (position.isConnectedToStart && position.isConnectedToEnd) {
      const agent = agents.get(agentId);
      if (!agent || !isAgentValid(agent)) {
        return false;
      }
    }
  }
  
  return true;
}