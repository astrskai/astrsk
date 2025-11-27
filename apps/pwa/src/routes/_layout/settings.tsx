import {
  createFileRoute,
  Outlet,
  useRouter,
  useLocation,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import NotFound from "@/pages/not-found";

export const Route = createFileRoute("/_layout/settings")({
  component: SettingsLayout,
  notFoundComponent: NotFound,
});

const ROUTE_TITLES: Record<string, string> = {
  "/settings": "Settings",
  "/settings/providers": "Model Providers",
  "/settings/account": "Account & Subscription",
  "/settings/account/credit-usage": "Credit Usage",
  "/settings/legal": "Legal",
  "/settings/legal/privacy-policy": "Privacy Policy",
  "/settings/legal/terms-of-service": "Terms of Service",
  "/settings/legal/content-policy": "Content Policy",
  "/settings/legal/refund-policy": "Refund Policy",
  "/settings/legal/oss-notice": "Open Source Notice",
  "/settings/advanced": "Advanced Preferences",
  "/settings/advanced/initialization-logs": "Initialization Logs",
  "/settings/advanced/migration-history": "Migration History",
};

function SettingsLayout() {
  const router = useRouter();
  const location = useLocation();

  const isRoot = location.pathname === "/settings";
  const title = ROUTE_TITLES[location.pathname] ?? "Settings";

  const handleBack = () => {
    const segments = location.pathname.split("/").filter(Boolean);
    if (segments.length > 1) {
      const parentPath = "/" + segments.slice(0, -1).join("/");
      router.navigate({ to: parentPath });
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {!isRoot && (
        <header className="mx-auto flex w-full max-w-3xl items-center gap-2 p-4">
          <button
            onClick={handleBack}
            className="text-fg-muted hover:bg-surface-overlay hover:text-fg-default flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-fg-default text-xl font-bold">{title}</h1>
        </header>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 pb-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
