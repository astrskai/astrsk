import { createFileRoute, redirect } from "@tanstack/react-router";
import CharacterPlotDetailPage from "@/pages/assets/character-plot-detail";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";

function CharacterDetailPageWrapper() {
  const { characterId } = Route.useParams();
  return <CharacterPlotDetailPage cardId={characterId} />;
}

export const Route = createFileRoute("/_layout/assets/characters/$characterId")(
  {
    component: CharacterDetailPageWrapper,
    beforeLoad: async ({ params }) => {
      const { characterId } = params;

      if (!UniqueEntityID.isValidUUID(characterId)) {
        throw redirect({ to: "/", replace: true });
      }
    },
  },
);
