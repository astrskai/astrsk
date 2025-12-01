import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import SharedCharacterPage from "@/pages/shared/character";
import ErrorPage from "@/pages/error";

export const Route = createFileRoute("/shared/character/$uuid")({
  params: z.object({
    uuid: z.string().uuid(),
  }),
  component: SharedCharacterPage,
  beforeLoad: async ({ params }) => {
    const uuid = z.string().uuid().safeParse(params.uuid);

    if (!uuid.success) {
      throw redirect({ to: "/assets/characters", replace: true });
    }
  },
  errorComponent: ({ error }) => {
    const errorMessage = error?.message || "An unexpected error occurred.";

    return (
      <ErrorPage
        title={error?.name || "Failed to import character"}
        message={errorMessage}
        redirectPath="/assets/characters"
        redirectLabel="Go to characters"
        showGoBack={false}
        showGoToHome={true}
      />
    );
  },
});
