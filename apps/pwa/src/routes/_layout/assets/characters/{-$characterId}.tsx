import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import CharacterEditorPage from "@/pages/assets/characters/editor";
import CharacterDetailPage from "@/pages/assets/characters/detail";
import ErrorPage from "@/pages/error";

// Search params schema
const searchSchema = z.object({
  mode: z.enum(["view", "edit"]).optional().default("view"),
});

// Component that switches between view and edit mode
function CharacterPage() {
  const { mode } = Route.useSearch();
  const { characterId } = Route.useParams();

  // "new" always goes to editor (create mode)
  // "edit" mode goes to editor
  // Default "view" mode shows detail page
  if (characterId === "new" || mode === "edit") {
    return <CharacterEditorPage />;
  }

  return <CharacterDetailPage />;
}

export const Route = createFileRoute("/_layout/assets/characters/{-$characterId}")(
  {
    params: z.object({
      characterId: z.string().optional(),
    }),
    validateSearch: searchSchema,
    component: CharacterPage,
    beforeLoad: async ({ params }) => {
      // "new" is a special value for create mode
      if (params.characterId && params.characterId !== "new") {
        // Validate UUID for edit mode
        const uuid = z.string().uuid().safeParse(params.characterId);

        if (!uuid.success) {
          throw redirect({ to: "/assets/characters", replace: true });
        }
      }
      // If characterId is "new" or undefined, it's create mode - allow through
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
