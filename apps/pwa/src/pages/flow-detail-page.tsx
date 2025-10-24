import { useEffect } from "react";
import { Route } from "@/routes/_layout/flows/$flowId";
import FlowMultiPage from "@/features/flow/flow-multi/pages/flow-multi-page";
import { useAgentStore } from "@/app/stores/agent-store";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import FlowPageMobile from "@/features/flow/flow-page-mobile";

export function FlowDetailPage() {
  const { flowId } = Route.useParams();
  const selectFlowId = useAgentStore.use.selectFlowId();
  const isMobile = useIsMobile();

  useEffect(() => {
    selectFlowId(flowId);
  }, [flowId, selectFlowId]);

  return isMobile ? <FlowPageMobile /> : <FlowMultiPage />;
}
