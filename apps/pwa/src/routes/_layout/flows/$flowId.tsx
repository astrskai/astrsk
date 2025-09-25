import { useEffect } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import FlowMultiPage from "@/flow-multi/pages/flow-multi-page";
import { useAgentStore } from "@/app/stores/agent-store";
import { useIsMobile } from "@/components-v2/hooks/use-mobile";
import FlowPageMobile from "@/components-v2/flow/flow-page-mobile";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { FlowService } from "@/app/services/flow-service";

export const Route = createFileRoute("/_layout/flows/$flowId")({
  component: FlowDetailPage,
  beforeLoad: async ({ params }) => {
    const { flowId } = params;

    if (UniqueEntityID.isValidUUID(flowId)) {
      const result = await FlowService.getFlow.execute(
        new UniqueEntityID(flowId),
      );

      if (result.isFailure) throw redirect({ to: "/", replace: true });
    } else {
      throw redirect({ to: "/", replace: true });
    }
  },
});

function FlowDetailPage() {
  const { flowId } = Route.useParams();
  const selectFlowId = useAgentStore.use.selectFlowId();
  const isMobile = useIsMobile();

  useEffect(() => {
    selectFlowId(flowId);
  }, [flowId, selectFlowId]);

  return isMobile ? <FlowPageMobile /> : <FlowMultiPage />;
}
