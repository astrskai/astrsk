import { useEffect } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import SessionPage from "@/components-v2/session/session-page";
import SessionPageMobile from "@/components-v2/session/mobile/session-page-mobile";
import { useSessionStore } from "@/app/stores/session-store";
import { UniqueEntityID } from "@/shared/domain";
import { useIsMobile } from "@/components-v2/hooks/use-mobile";
import { SessionService } from "@/app/services/session-service";

export const Route = createFileRoute("/_layout/sessions/$sessionId")({
  component: SessionDetailPage,
  beforeLoad: async ({ params }) => {
    const { sessionId } = params;

    if (UniqueEntityID.isValidUUID(sessionId)) {
      const result = await SessionService.getSession.execute(
        new UniqueEntityID(sessionId),
      );

      if (result.isFailure) throw redirect({ to: "/", replace: true });
    } else {
      throw redirect({ to: "/", replace: true });
    }
  },
});

function SessionDetailPage() {
  const { sessionId } = Route.useParams();
  const { selectSession } = useSessionStore();
  const isMobile = useIsMobile();

  useEffect(() => {
    selectSession(new UniqueEntityID(sessionId), "Session");
  }, [sessionId, selectSession]);

  return isMobile ? <SessionPageMobile /> : <SessionPage />;
}
