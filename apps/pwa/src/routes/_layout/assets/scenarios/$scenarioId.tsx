import { createFileRoute, redirect } from "@tanstack/react-router";
import CharacterPlotDetailPage from "@/pages/assets/characters/detail";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

function PlotDetailPageWrapper() {
  const { scenarioId } = Route.useParams();
  return <CharacterPlotDetailPage cardId={scenarioId} />;
}

export const Route = createFileRoute("/_layout/assets/scenarios/$scenarioId")({
  component: PlotDetailPageWrapper,
  beforeLoad: async ({ params }) => {
    const { scenarioId } = params;

    if (!UniqueEntityID.isValidUUID(scenarioId)) {
      throw redirect({ to: "/", replace: true });
    }
  },
});
