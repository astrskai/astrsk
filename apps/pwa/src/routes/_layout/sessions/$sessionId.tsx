import { createFileRoute, redirect } from "@tanstack/react-router";
import SessionPage from "@/pages/sessions/detail";
import { UniqueEntityID } from "@/shared/domain";

export const Route = createFileRoute("/_layout/sessions/$sessionId")({
  component: SessionPage,
  beforeLoad: async ({ params }) => {
    const { sessionId } = params;

    if (!UniqueEntityID.isValidUUID(sessionId)) {
      throw redirect({ to: "/", replace: true });
    }
  },
});
