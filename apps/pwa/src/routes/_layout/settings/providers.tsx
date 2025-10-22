import { createFileRoute } from "@tanstack/react-router";
import ModelPage from "@/features/settings/providers/model-page";
import ModelPageMobile from "@/features/settings/providers/model-page-mobile";
import { useIsMobile } from "@/components-v2/hooks/use-mobile";

export const Route = createFileRoute("/_layout/settings/providers")({
  component: ProvidersPage,
});

function ProvidersPage() {
  const isMobile = useIsMobile();

  return isMobile ? <ModelPageMobile /> : <ModelPage />;
}
