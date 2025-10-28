import { createFileRoute, redirect } from "@tanstack/react-router";
import { FlowDetailPage } from "@/pages/flow-detail-page";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

export const Route = createFileRoute("/_layout/flows/$flowId")({
  component: FlowDetailPage,
  beforeLoad: async ({ params }) => {
    const { flowId } = params;

    if (!UniqueEntityID.isValidUUID(flowId)) {
      throw redirect({ to: "/", replace: true });
    }
  },
});
