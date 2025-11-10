import { createFileRoute, redirect } from "@tanstack/react-router";
import { FlowPanelMain } from "@/pages/assets/workflows/detail";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

function WorkflowDetailPageWrapper() {
  const { workflowId } = Route.useParams();
  return <FlowPanelMain workflowId={workflowId} />;
}

export const Route = createFileRoute("/_layout/assets/workflows/$workflowId")({
  component: WorkflowDetailPageWrapper,
  beforeLoad: async ({ params }) => {
    const { workflowId } = params;

    if (!UniqueEntityID.isValidUUID(workflowId)) {
      throw redirect({ to: "/", replace: true });
    }
  },
});
