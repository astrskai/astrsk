import { useEffect } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import SessionPage from "@/features/session/session-page";
import SessionPageMobile from "@/features/session/mobile/session-page-mobile";
import { useSessionStore } from "@/app/stores/session-store";
import { UniqueEntityID } from "@/shared/domain";
import { useIsMobile } from "@/components-v2/hooks/use-mobile";

export const Route = createFileRoute("/_layout/sessions/$sessionId")({
  component: SessionDetailPage,
  beforeLoad: async ({ params }) => {
    const { sessionId } = params;

    if (!UniqueEntityID.isValidUUID(sessionId)) {
      throw redirect({ to: "/", replace: true });
    }
  },
});

function SessionDetailPage() {
  const { sessionId } = Route.useParams();
  const selectSession = useSessionStore.use.selectSession();
  const isMobile = useIsMobile();

  useEffect(() => {
    selectSession(new UniqueEntityID(sessionId), "Session");
  }, [sessionId, selectSession]);

  return isMobile ? <SessionPageMobile /> : <SessionPage />;
}
