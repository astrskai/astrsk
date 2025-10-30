import { createFileRoute, redirect } from "@tanstack/react-router";
import { AssetDetailPage } from "@/pages/assets/asset-detail";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

function PlotDetailPageWrapper() {
  const { plotId } = Route.useParams();
  return <AssetDetailPage cardId={plotId} />;
}

export const Route = createFileRoute("/_layout/assets/plots/$plotId")({
  component: PlotDetailPageWrapper,
  beforeLoad: async ({ params }) => {
    const { plotId } = params;

    if (!UniqueEntityID.isValidUUID(plotId)) {
      throw redirect({ to: "/", replace: true });
    }
  },
});
