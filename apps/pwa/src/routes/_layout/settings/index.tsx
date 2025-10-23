import { createFileRoute } from "@tanstack/react-router";
import SettingPage from "@/features/settings/setting-page";
import SettingPageMobile from "@/features/settings/setting-page-mobile";
import { useIsMobile } from "@/shared/hooks/use-mobile";

export const Route = createFileRoute("/_layout/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  const isMobile = useIsMobile();

  return isMobile ? <SettingPageMobile /> : <SettingPage />;
}
