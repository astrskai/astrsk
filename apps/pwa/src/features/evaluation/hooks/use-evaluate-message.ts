/**
 * useEvaluateMessage Hook
 * Evaluates an agent message and generates a comprehensive report
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MessageEvaluator, type EvaluationContext } from '@/entities/evaluation';
import { useEvaluationStore } from '@/shared/stores/evaluation-store';
import { fetchAgent } from '@/entities/agent/api/query-factory';
import { fetchFlow } from '@/entities/flow/api/query-factory';
import { fetchSession } from '@/entities/session/api';
import { fetchTurn } from '@/entities/turn/api/turn-queries';
import { turnQueries } from '@/entities/turn/api/turn-queries';
import { sessionQueries } from '@/entities/session/api/query-factory';
import { UniqueEntityID } from '@/shared/domain';
import type { Turn } from '@/entities/turn/domain/turn';
import { logger } from '@/shared/lib/logger';

export interface EvaluateMessageOptions {
  messageId: string;
  sessionId: string;

  // Optional: Override default evaluator config
  enabledChecks?: {
    behaviorAnalysis?: boolean;
    contextAnalysis?: boolean;
    stateAnalysis?: boolean;
    promptAnalysis?: boolean;
  };
}

export const useEvaluateMessage = () => {
  const queryClient = useQueryClient();
  const { startEvaluation, setReport, finishEvaluation, openReportModal } = useEvaluationStore();

  const evaluate = useCallback(
    async (options: EvaluateMessageOptions) => {
      const startTime = Date.now();

      try {
        logger.info('[Evaluation] Starting evaluation for message', options.messageId);

        startEvaluation(options.messageId);

        // Step 1: Fetch the message
        const message = await fetchTurn(new UniqueEntityID(options.messageId));
        if (!message) {
          throw new Error('Message not found');
        }

        logger.info('[Evaluation] Message fetched', { messageId: options.messageId });

        // Step 2: Fetch the session
        const session = await fetchSession(new UniqueEntityID(options.sessionId));
        if (!session) {
          throw new Error('Session not found');
        }

        logger.info('[Evaluation] Session fetched', { sessionId: options.sessionId });

        // Step 3: Fetch the flow
        if (!session.props.flowId) {
          throw new Error('Session has no associated flow');
        }
        const flow = await fetchFlow(session.props.flowId);

        logger.info('[Evaluation] Flow fetched', { flowId: flow.id.toString() });

        // Step 4: Fetch all turns in the session
        const allTurnIds = session.props.turnIds;
        const allTurns: Turn[] = [];
        for (const turnId of allTurnIds) {
          const turn = await fetchTurn(turnId);
          if (turn) {
            allTurns.push(turn);
          }
        }

        logger.info('[Evaluation] All turns fetched', { turnCount: allTurns.length });

        // Step 5: Find the agent that generated this message
        // Look through flow nodes to find the agent
        const characterCardId = message.props.characterCardId;
        if (!characterCardId) {
          throw new Error('Message has no associated character card');
        }

        // Find agent nodes in the flow
        const agentNodes = flow.props.nodes.filter((node) => node.type === 'agent');
        if (agentNodes.length === 0) {
          throw new Error('Flow has no agent nodes');
        }

        // For now, use the first agent node
        // TODO: Improve this to find the specific agent that generated this message
        const agentNode = agentNodes[0];
        const agent = await fetchAgent(new UniqueEntityID(agentNode.id));

        logger.info('[Evaluation] Agent fetched', { agentId: agent.id.toString(), agentName: agent.props.name });

        // Step 6: Build evaluation context
        // For now, we'll create a simplified context
        // In a full implementation, you'd capture the actual prompt messages used during generation
        const promptMessages = await buildPromptMessages(agent, session, allTurns, message);

        logger.info('[Evaluation] Prompt messages built', { promptMessageCount: promptMessages.length });

        const context: EvaluationContext = {
          message,
          agent,
          flow,
          session,
          allTurns,
          promptMessages,
          modelParameters: buildModelParameters(agent),
          executionTimeMs: 0, // Not available in retrospective evaluation
        };

        // Step 7: Run evaluation
        const evaluator = new MessageEvaluator(options.enabledChecks);
        const report = await evaluator.evaluate(context);

        const evaluationTime = Date.now() - startTime;
        logger.info('[Evaluation] Evaluation completed', {
          messageId: options.messageId,
          overallScore: report.overallScore,
          issuesCount: report.issues.length,
          evaluationTimeMs: evaluationTime,
        });

        // Step 8: Save report
        setReport(report);
        finishEvaluation();

        // Step 9: Open modal
        openReportModal(options.messageId);

        return report;
      } catch (error) {
        logger.error('[Evaluation] Evaluation failed', error);
        finishEvaluation();
        throw error;
      }
    },
    [startEvaluation, setReport, finishEvaluation, openReportModal],
  );

  return { evaluate };
};

/**
 * Build prompt messages from agent configuration
 * This is a simplified version - ideally we'd capture the actual prompt during generation
 */
async function buildPromptMessages(
  agent: any,
  session: any,
  allTurns: Turn[],
  currentMessage: Turn,
): Promise<Array<{ role: string; content: string }>> {
  const messages: Array<{ role: string; content: string }> = [];

  // Build a simplified context for analysis
  // In a real implementation, you'd use the actual prompt rendering logic
  try {
    // Add system message if agent has one
    const systemMessages = agent.props.promptMessages?.filter((pm: any) => pm.role === 'system') ?? [];
    for (const sysMsg of systemMessages) {
      if (sysMsg.enabled !== false) {
        const content = sysMsg.promptBlocks?.map((block: any) => block.content).join('\n') ?? '';
        messages.push({ role: 'system', content });
      }
    }

    // Add conversation history
    const historyMessages = agent.props.promptMessages?.filter((pm: any) => pm.type === 'history') ?? [];
    if (historyMessages.length > 0) {
      // Include recent turns as history
      const recentTurns = allTurns.slice(-5); // Last 5 turns
      for (const turn of recentTurns) {
        if (turn.id.equals(currentMessage.id)) continue; // Don't include current message

        const role = turn.props.characterCardId ? 'assistant' : 'user';
        messages.push({ role, content: turn.content });
      }
    }

    // Add user message prompts
    const userMessages = agent.props.promptMessages?.filter((pm: any) => pm.role === 'user') ?? [];
    for (const userMsg of userMessages) {
      if (userMsg.enabled !== false && userMsg.type === 'plain') {
        const content = userMsg.promptBlocks?.map((block: any) => block.content).join('\n') ?? '';
        messages.push({ role: 'user', content });
      }
    }
  } catch (error) {
    logger.warn('[Evaluation] Failed to build prompt messages, using empty array', error);
  }

  return messages;
}

/**
 * Build model parameters from agent configuration
 */
function buildModelParameters(agent: any): Record<string, any> {
  const parameters: Record<string, any> = {};

  try {
    if (agent.props.parameterValues) {
      for (const [key, value] of agent.props.parameterValues.entries()) {
        parameters[key] = value;
      }
    }
  } catch (error) {
    logger.warn('[Evaluation] Failed to build model parameters', error);
  }

  return parameters;
}
