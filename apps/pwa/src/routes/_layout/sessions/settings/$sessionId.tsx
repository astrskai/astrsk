import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import ErrorPage from "@/pages/error";
import { SessionSettingsPage } from "@/pages/sessions/session-settings-page";

export const Route = createFileRoute("/_layout/sessions/settings/$sessionId")({
  params: z.object({
    sessionId: z.string().uuid(),
  }),
  component: SessionSettingsPage,
  beforeLoad: async ({ params }) => {
    const uuid = z.string().uuid().safeParse(params.sessionId);

    if (!uuid.success) {
      throw redirect({ to: "/sessions", replace: true });
    }
  },
  errorComponent: ({ error }) => {
    const errorMessage = error?.message || "An unexpected error occurred.";

    return (
      <ErrorPage
        title={error?.name || "An unexpected error occurred."}
        message={errorMessage}
        redirectPath="/sessions"
        redirectLabel="Go to sessions"
        showGoBack={false}
        showGoToHome={false}
      />
    );
  },
});
