import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import CharacterEditorPage from "@/pages/assets/characters/editor";
import ErrorPage from "@/pages/error";

export const Route = createFileRoute("/_layout/assets/characters/{-$characterId}")(
  {
    params: z.object({
      characterId: z.string().optional(),
    }),
    component: CharacterEditorPage,
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
