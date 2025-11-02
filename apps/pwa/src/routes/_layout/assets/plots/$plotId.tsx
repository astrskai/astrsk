import { createFileRoute, redirect } from "@tanstack/react-router";
import CharacterPlotDetailPage from "@/pages/assets/characters/detail";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

function PlotDetailPageWrapper() {
  const { plotId } = Route.useParams();
  return <CharacterPlotDetailPage cardId={plotId} />;
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
