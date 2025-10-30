import { useEffect } from "react";
import { cn } from "@/shared/lib";
import { Route } from "@/routes/_layout/assets/flows/$flowId";
import { useAgentStore } from "@/shared/stores/agent-store";

import { FlowPanelMain } from "../panels/flow-panel-main";

export default function FlowMultiPage({ className }: { className?: string }) {
  const { flowId } = Route.useParams();
  const selectFlowId = useAgentStore.use.selectFlowId();

  // Sync flowId to agent store for nodes (agent-node, if-node, data-store-node)
  // that still rely on selectedFlowId from the store
  useEffect(() => {
    selectFlowId(flowId);
  }, [flowId, selectFlowId]);

  return (
    <div className={cn("h-full w-full", className)}>
      <FlowPanelMain flowId={flowId} />
    </div>
  );
}
