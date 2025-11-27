import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import ScenarioEditorPage from "@/pages/assets/scenarios/editor";
import ErrorPage from "@/pages/error";

export const Route = createFileRoute("/_layout/assets/scenarios/{-$scenarioId}")({
  params: z.object({
    scenarioId: z.string().optional(),
  }),
  component: ScenarioEditorPage,
  beforeLoad: async ({ params }) => {
    // "new" is a special value for create mode
    if (params.scenarioId && params.scenarioId !== "new") {
      // Validate UUID for edit mode
      const uuid = z.string().uuid().safeParse(params.scenarioId);

      if (!uuid.success) {
        throw redirect({ to: "/assets/scenarios", replace: true });
      }
    }
    // If scenarioId is "new" or undefined, it's create mode - allow through
  },
  errorComponent: ({ error }) => {
    const errorMessage = error?.message || "An unexpected error occurred.";

    return (
      <ErrorPage
        title={error?.name || "An unexpected error occurred."}
        message={errorMessage}
        redirectPath="/assets/scenarios"
        redirectLabel="Go to scenarios"
        showGoBack={false}
        showGoToHome={false}
      />
    );
  },
});
