import { sessionQueries } from "@/entities/session/api";
import { turnQueries } from "@/app/queries/turn-queries";
import { useAgentStore } from "@/shared/stores/agent-store";
import { Editor } from "@/shared/ui";
import {
  FlowPanelError,
  FlowPanelLoading,
  useFlowPanel,
} from "@/features/flow/hooks/use-flow-panel";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { PreviewPanelProps } from "./preview-panel-types";
import { usePreviewGenerator } from "./use-preview-generator";

export function PreviewPanel({ flowId, agentId }: PreviewPanelProps) {
  // Use the new flow panel hook
  const { agent, isLoading } = useFlowPanel({ flowId, agentId });

  // Get session management from store
  const previewSessionId = useAgentStore.use.previewSessionId();

  // Query preview session data using Tanstack Query
  const { data: previewSession } = useQuery({
    ...sessionQueries.detail(
      previewSessionId ? new UniqueEntityID(previewSessionId) : undefined,
    ),
    enabled: !!previewSessionId,
  });

  // Get last turn ID from session
  const lastTurnId = useMemo(() => {
    if (!previewSession?.turnIds || previewSession.turnIds.length === 0) {
      return null;
    }
    return previewSession.turnIds[previewSession.turnIds.length - 1];
  }, [previewSession?.turnIds]);

  // Query last turn data using Tanstack Query
  const { data: lastTurn } = useQuery({
    ...turnQueries.detail(lastTurnId ?? undefined),
    enabled: !!lastTurnId,
  });

  // Use the custom hook for preview generation
  const { preview } = usePreviewGenerator(
    agent ?? null,
    previewSession ?? null,
    lastTurn ?? null,
  );

  // Loading state
  if (isLoading) {
    return <FlowPanelLoading message="Loading agent..." />;
  }

  // Empty state
  if (!agent) {
    return <FlowPanelError message="Agent not found" />;
  }

  return (
    <div className="h-full flex flex-col bg-background-surface-2 p-4">
      {/* Preview content area - full height with Monaco editor */}
      <div className="flex-1 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal overflow-hidden">
        {preview ? (
          <Editor
            value={preview}
            language="json"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              lineNumbers: "off",
              folding: true,
              wordWrap: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              fontSize: 12,
              tabSize: 2,
              formatOnPaste: true,
              formatOnType: true,
              find: {
                autoFindInSelection: "never",
                addExtraSpaceOnTop: false,
              },
            }}
            containerClassName="h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-text-secondary">
            {agent ? "Generating preview..." : "No agent selected"}
          </div>
        )}
      </div>
    </div>
  );
}
