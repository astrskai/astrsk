import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import ScenarioDetailPage from "@/pages/assets/scenarios/detail";
import ErrorPage from "@/pages/error";

export const Route = createFileRoute("/_layout/assets/scenarios/$scenarioId")({
  params: z.object({
    scenarioId: z.string().uuid(),
  }),
  component: ScenarioDetailPage,
  beforeLoad: async ({ params }) => {
    const uuid = z.string().uuid().safeParse(params.scenarioId);

    if (!uuid.success) {
      throw redirect({ to: "/assets/scenarios", replace: true });
    }
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
