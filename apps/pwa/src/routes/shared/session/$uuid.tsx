import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import SharedSessionPage from "@/pages/shared/session";
import ErrorPage from "@/pages/error";

export const Route = createFileRoute("/shared/session/$uuid")({
  params: z.object({
    uuid: z.string().uuid(),
  }),
  component: SharedSessionPage,
  beforeLoad: async ({ params }) => {
    const uuid = z.string().uuid().safeParse(params.uuid);

    if (!uuid.success) {
      throw redirect({ to: "/sessions", replace: true });
    }
  },
  errorComponent: ({ error }) => {
    const errorMessage = error?.message || "An unexpected error occurred.";

    return (
      <ErrorPage
        title={error?.name || "Failed to import session"}
        message={errorMessage}
        redirectPath="/sessions"
        redirectLabel="Go to sessions"
        showGoBack={false}
        showGoToHome={true}
      />
    );
  },
});
