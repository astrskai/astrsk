import { createFileRoute } from "@tanstack/react-router";
import SettingPage from "@/components-v2/setting/setting-page";
import SettingPageMobile from "@/components-v2/setting/setting-page-mobile";
import { useIsMobile } from "@/components-v2/hooks/use-mobile";

export const Route = createFileRoute("/_layout/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  const isMobile = useIsMobile();

  return isMobile ? <SettingPageMobile /> : <SettingPage />;
}
