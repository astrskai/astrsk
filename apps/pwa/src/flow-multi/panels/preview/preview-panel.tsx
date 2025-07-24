import { useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components-v2/ui/select";
import { Editor } from "@/components-v2/editor";
import { useAgentStore } from "@/app/stores/agent-store";
import { 
  useFlowPanel, 
  FlowPanelLoading, 
  FlowPanelError 
} from "@/flow-multi/hooks/use-flow-panel";
import { PreviewPanelProps } from "./preview-panel-types";
import { useQuery } from "@tanstack/react-query";
import { sessionQueries } from "@/app/queries/session-queries";
import { usePreviewGenerator } from "./use-preview-generator";

export function PreviewPanel({ flowId, agentId }: PreviewPanelProps) {
  // Use the new flow panel hook
  const { 
    agent, 
    flow,
    isLoading, 
  } = useFlowPanel({ flowId, agentId });

  // Get session management from store
  const previewSession = useAgentStore.use.previewSession();
  const setPreviewSession = useAgentStore.use.setPreviewSession();

  // Fetch sessions for the current flow
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    ...sessionQueries.list({}), // SearchSessionsQuery doesn't have flowId
    enabled: !!flow,
  });

  // Use the custom hook for preview generation
  const { preview } = usePreviewGenerator(agent ?? null, previewSession);

  // Handle session selection
  const handleSessionChange = useCallback((sessionId: string) => {
    if (sessionId === "none") {
      setPreviewSession(null);
    } else {
      const selectedSession = sessions.find(
        (s) => s.id.toString() === sessionId,
      );
      if (selectedSession) {
        setPreviewSession(selectedSession);
      }
    }
  }, [sessions, setPreviewSession]);

  // Loading state
  if (isLoading) {
    return <FlowPanelLoading message="Loading preview..." />;
  }

  // Empty state
  if (!agent) {
    return <FlowPanelError message="Agent not found" />;
  }

  return (
    <div className="h-full flex flex-col bg-background-surface-2 p-4">
      {/* Session selector */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="text-text-body text-[10px] font-medium leading-none">
            Session
          </div>
        </div>
        <Select
          value={previewSession?.id.toString() || "none"}
          onValueChange={handleSessionChange}
        >
          <SelectTrigger className="w-full min-h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal">
            <SelectValue placeholder="Select session" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {isLoadingSessions ? (
              <SelectItem value="loading" disabled>
                Loading sessions...
              </SelectItem>
            ) : (
              sessions.map((session) => (
                <SelectItem
                  key={session.id.toString()}
                  value={session.id.toString()}
                >
                  {session.props.title ||
                    `Session ${session.id.toString().slice(0, 8)}`}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

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
                addExtraSpaceOnTop: false
              }
            }}
            containerClassName="h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-text-secondary">
            {agent ? 'Generating preview...' : 'No agent selected'}
          </div>
        )}
      </div>
    </div>
  );
}