import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
// import CharacterDetailPage from "@/pages/assets/characters/detail";
import CharacterDetailPage from "@/pages/assets/characters/detail-v2";
import ErrorPage from "@/pages/error";

function CharacterDetailPageWrapper() {
  return <CharacterDetailPage />;
}

export const Route = createFileRoute("/_layout/assets/characters/$characterId")(
  {
    params: z.object({
      characterId: z.string().uuid(),
    }),
    component: CharacterDetailPageWrapper,
    beforeLoad: async ({ params }) => {
      const uuid = z.string().uuid().safeParse(params.characterId);

      if (!uuid.success) {
        throw redirect({ to: "/assets/characters", replace: true });
      }
    },
    errorComponent: ({ error }) => {
      const errorMessage = error?.message || "An unexpected error occurred.";

      return (
        <ErrorPage
          title={error?.name || "An unexpected error occurred."}
          message={errorMessage}
          redirectPath="/assets/characters"
          redirectLabel="Go to characters"
          showGoBack={false}
          showGoToHome={false}
        />
      );
    },
  },
);
