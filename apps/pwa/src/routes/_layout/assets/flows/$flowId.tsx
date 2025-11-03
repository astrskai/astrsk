import { createFileRoute, redirect } from "@tanstack/react-router";
import { FlowPanelMain } from "@/pages/assets/flows/detail";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

function FlowDetailPageWrapper() {
  const { flowId } = Route.useParams();
  return <FlowPanelMain flowId={flowId} />;
}

export const Route = createFileRoute("/_layout/assets/flows/$flowId")({
  component: FlowDetailPageWrapper,
  beforeLoad: async ({ params }) => {
    const { flowId } = params;

    if (!UniqueEntityID.isValidUUID(flowId)) {
      throw redirect({ to: "/", replace: true });
    }
  },
});
