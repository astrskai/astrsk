import SessionPage from "@/features/session/session-page";
import SessionPageMobile from "@/features/session/mobile/session-page-mobile";
import { useIsMobile } from "@/shared/hooks/use-mobile";

export function SessionDetailPage() {
  const isMobile = useIsMobile();

  return isMobile ? <SessionPageMobile /> : <SessionPage />;
}
