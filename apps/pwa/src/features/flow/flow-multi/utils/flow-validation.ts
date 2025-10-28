import { Agent, ApiType, OutputFormat } from '@/entities/agent/domain';

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
  if (agent.props.enabledStructuredOutput) {
    hasStructuredOutput = !!(agent.props.schemaFields && 
                           agent.props.schemaFields.length > 0);
  }

  return hasModel && hasPrompt && hasAgentName && hasStructuredOutput;
}
