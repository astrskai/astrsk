import FlowMultiPage from "@/features/flow/flow-multi/pages/flow-multi-page";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import FlowPageMobile from "@/features/flow/flow-page-mobile";

export function FlowDetailPage() {
  const isMobile = useIsMobile();

  return isMobile ? <FlowPageMobile /> : <FlowMultiPage />;
}
