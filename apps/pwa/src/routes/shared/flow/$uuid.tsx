import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import SharedFlowPage from "@/pages/shared/flow";
import ErrorPage from "@/pages/error";

export const Route = createFileRoute("/shared/flow/$uuid")({
  params: z.object({
    uuid: z.string().uuid(),
  }),
  component: SharedFlowPage,
  beforeLoad: async ({ params }) => {
    const uuid = z.string().uuid().safeParse(params.uuid);

    if (!uuid.success) {
      throw redirect({ to: "/assets/workflows", replace: true });
    }
  },
  errorComponent: ({ error }) => {
    const errorMessage = error?.message || "An unexpected error occurred.";

    return (
      <ErrorPage
        title={error?.name || "Failed to import workflow"}
        message={errorMessage}
        redirectPath="/assets/workflows"
        redirectLabel="Go to workflows"
        showGoBack={false}
        showGoToHome={true}
      />
    );
  },
});
