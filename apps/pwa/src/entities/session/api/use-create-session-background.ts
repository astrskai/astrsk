/**
 * Background workflow generation for session creation
 *
 * This module handles the async workflow generation process that runs
 * after the initial session has been created and returned to the user.
 *
 * Process:
 * 1. Await workflow promise if provided (AI generation)
 * 2. Import AI-generated workflow to replace Simple template
 * 3. Update session with new workflow
 * 4. Mark session as "completed" or "failed"
 * 5. Show success/error toast notifications
 */

import type { QueryClient } from "@tanstack/react-query";
import type { Session } from "@/entities/session/domain/session";
import type { WorkflowState } from "@/app/services/system-agents/workflow-builder/types";
import type { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { SessionService } from "@/app/services/session-service";
import { FlowService } from "@/app/services/flow-service";
import { TableName } from "@/db/schema/table-name";
import { toastSuccess, toastError } from "@/shared/ui/toast";
import { logger } from "@/shared/lib";

export interface BackgroundGenerationParams {
  session: Session;
  workflow: WorkflowState | null;
  workflowPromise?: Promise<{ state: WorkflowState; sessionName: string } | null> | null;
  defaultLiteModel: any;
  defaultStrongModel: any;
  flowResponseTemplate: string;
  sessionId: UniqueEntityID;
  sessionName: string;
  queryClient: QueryClient;
}

/**
 * Execute background workflow generation for a session
 *
 * This function runs asynchronously after session creation completes.
 * It replaces the Simple workflow with an AI-generated workflow if available.
 *
 * @param params - Background generation parameters
 * @returns Promise that resolves when generation completes (success or failure)
 */
export async function executeBackgroundGeneration(
  params: BackgroundGenerationParams,
): Promise<void> {
  const {
    session,
    workflow,
    workflowPromise,
    defaultLiteModel,
    defaultStrongModel,
    flowResponseTemplate,
    sessionId,
    sessionName,
    queryClient,
  } = params;

  try {
    // Step 1: Resolve workflow (either from direct value or promise)
    let workflowToImport = workflow;

    if (workflowPromise) {
      const workflowResult = await workflowPromise;
      if (workflowResult) {
        workflowToImport = workflowResult.state;
      }
    }

    // Step 2: Import AI-generated workflow if available
    if (workflowToImport) {
      const { workflowStateToFlowData } = await import(
        "@/app/services/system-agents/workflow-builder/helpers"
      );

      const flowData = workflowStateToFlowData(
        workflowToImport,
        "Session Workflow",
        {
          liteModel: defaultLiteModel,
          strongModel: defaultStrongModel,
        },
        flowResponseTemplate,
      );

      // Import new workflow
      const importResult = await FlowService.importFlowWithNodes.importFromJson(
        flowData,
        sessionId,
      );

      if (importResult.isFailure) {
        throw new Error(`Failed to import AI workflow: ${importResult.getError()}`);
      }

      const aiGeneratedFlow = importResult.getValue();

      // Update session with new workflow
      session.update({
        flowId: aiGeneratedFlow.id,
      });

      const savedSessionOrError = await SessionService.saveSession.execute({
        session: session,
      });

      if (savedSessionOrError.isFailure) {
        throw new Error(
          `Failed to update session with AI workflow: ${savedSessionOrError.getError()}`,
        );
      }
    }

    // Step 3: Mark session as completed (preserve existing config)
    session.update({
      config: {
        ...session.config,
        generationStatus: "completed",
      },
    });

    const finalSessionResult = await SessionService.saveSession.execute({
      session: session,
    });

    if (finalSessionResult.isFailure) {
      throw new Error(`Failed to update session: ${finalSessionResult.getError()}`);
    }

    // Step 4: Invalidate queries to refresh UI
    queryClient.invalidateQueries({ queryKey: [TableName.Sessions] });

    // Step 5: Show success notification
    toastSuccess("Session ready!", {
      description: `"${sessionName}" is now ready to play`,
    });
  } catch (error) {
    logger.error("[executeBackgroundGeneration] Background generation failed", error);

    // Mark session as completed with generation failure note (preserve existing config)
    // Session is still playable with Simple workflow
    session.update({
      config: {
        ...session.config,
        generationStatus: "completed",
        generationError: error instanceof Error ? error.message : "Unknown error",
      },
    });

    await SessionService.saveSession.execute({ session: session });

    // Invalidate queries to refresh UI
    queryClient.invalidateQueries({ queryKey: [TableName.Sessions] });

    // Show warning notification - session is still usable but workflow generation failed
    toastError("Session created with standard workflow", {
      description: `"${sessionName}" is ready to play using standard workflow instead.`,
    });
  }
}
