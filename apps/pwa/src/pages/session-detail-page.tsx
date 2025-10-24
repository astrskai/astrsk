import { useEffect } from "react";
import { Route } from "@/routes/_layout/sessions/$sessionId";
import SessionPage from "@/features/session/session-page";
import SessionPageMobile from "@/features/session/mobile/session-page-mobile";
import { useSessionStore } from "@/app/stores/session-store";
import { UniqueEntityID } from "@/shared/domain";
import { useIsMobile } from "@/shared/hooks/use-mobile";

export function SessionDetailPage() {
  const { sessionId } = Route.useParams();
  const selectSession = useSessionStore.use.selectSession();
  const isMobile = useIsMobile();

  useEffect(() => {
    selectSession(new UniqueEntityID(sessionId), "Session");
  }, [sessionId, selectSession]);

  return isMobile ? <SessionPageMobile /> : <SessionPage />;
}
