import {
  createFileRoute,
  Outlet,
  useRouter,
  useLocation,
} from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { FloatingActionButton } from "@/shared/ui";
import { Button } from "@/shared/ui/forms";
import { TopNavigation } from "@/widgets/top-navigation";
import NotFound from "@/pages/not-found";
import { getSettingsTitle } from "@/shared/config/settings-routes";

export const Route = createFileRoute("/_layout/settings")({
  component: SettingsLayoutWrapper,
  notFoundComponent: NotFound,
});

function SettingsLayoutWrapper() {
  const router = useRouter();
  const location = useLocation();

  const handleBack = () => {
    // Get parent route by removing the last segment
    const pathSegments = location.pathname.split("/").filter(Boolean);

    if (pathSegments.length <= 1) {
      // Already at /settings, shouldn't happen due to isSettingsRoot check
      return;
    }

    // Navigate to parent route
    // /settings/providers -> /settings
    // /settings/account/credit-usage -> /settings/account
    // /settings/legal/privacy-policy -> /settings/legal
    const parentPath = "/" + pathSegments.slice(0, -1).join("/");
    router.navigate({ to: parentPath });
  };

  // Only show back navigation on settings sub-routes, not on /settings root
  const isSettingsRoot = location.pathname === "/settings";

  return (
    <>
      {/* Desktop: FloatingActionButton */}
      {!isSettingsRoot && (
        <div className="hidden md:block">
          <FloatingActionButton
            icon={<ArrowLeft className="min-h-[24px] min-w-[24px]" />}
            label="Back"
            position="top-left"
            className="z-50"
            onClick={handleBack}
          />
        </div>
      )}

      {/* Mobile: TopNavigation with Back Button */}
      {!isSettingsRoot && (
        <div className="md:hidden">
          <TopNavigation
            title={getSettingsTitle(location.pathname)}
            leftAction={
              <Button
                className="text-text-primary hover:text-text-primary/80"
                variant="ghost"
                icon={<ChevronLeft className="h-6 w-6" />}
                onClick={handleBack}
              />
            }
          />
        </div>
      )}

      <Outlet />
    </>
  );
}
