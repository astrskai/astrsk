import { useAgentStore } from "@/app/stores/agent-store";
import { cn } from "@/components-v2/lib/utils";

// Import components
import { FlowPanelMain } from "../panels/flow-panel-main";

export default function FlowMultiPage({ className }: { className?: string }) {
  const selectedFlowId = useAgentStore.use.selectedFlowId();
  
  return (
    <div className={cn("h-full w-full", className)}>
      <FlowPanelMain
        flowId={selectedFlowId}
      />
    </div>
  );
}