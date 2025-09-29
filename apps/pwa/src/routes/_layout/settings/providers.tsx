import { createFileRoute } from "@tanstack/react-router";
import ModelPage from "@/components-v2/setting/model-page";
import ModelPageMobile from "@/components-v2/model/model-page-mobile";
import { useIsMobile } from "@/components-v2/hooks/use-mobile";

export const Route = createFileRoute("/_layout/settings/providers")({
  component: ProvidersPage,
});

function ProvidersPage() {
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? <ModelPageMobile /> : <ModelPage />}
    </>
  );
}
