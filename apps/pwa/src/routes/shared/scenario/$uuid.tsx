import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import SharedScenarioPage from "@/pages/shared/scenario";
import ErrorPage from "@/pages/error";

export const Route = createFileRoute("/shared/scenario/$uuid")({
  params: z.object({
    uuid: z.string().uuid(),
  }),
  component: SharedScenarioPage,
  beforeLoad: async ({ params }) => {
    const uuid = z.string().uuid().safeParse(params.uuid);

    if (!uuid.success) {
      throw redirect({ to: "/assets/scenarios", replace: true });
    }
  },
  errorComponent: ({ error }) => {
    const errorMessage = error?.message || "An unexpected error occurred.";

    return (
      <ErrorPage
        title={error?.name || "Failed to import scenario"}
        message={errorMessage}
        redirectPath="/assets/scenarios"
        redirectLabel="Go to scenarios"
        showGoBack={false}
        showGoToHome={true}
      />
    );
  },
});
