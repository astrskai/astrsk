import { createFileRoute, redirect } from "@tanstack/react-router";
import SessionDetailPage from "@/pages/sessions/detail";
// import SessionDetailPage from "@/pages/sessions/detail-v2";
import { UniqueEntityID } from "@/shared/domain";

export const Route = createFileRoute("/_layout/sessions/$sessionId")({
  component: SessionDetailPage,
  beforeLoad: async ({ params }) => {
    const { sessionId } = params;

    if (!UniqueEntityID.isValidUUID(sessionId)) {
      throw redirect({ to: "/", replace: true });
    }
  },
});
