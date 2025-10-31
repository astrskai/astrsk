import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/pages/settings/account/account-page";
import { ConvexReady } from "@/shared/ui/convex-ready";

export const Route = createFileRoute("/_layout/settings/account/")({
  component: AccountPageRoute,
});

function AccountPageRoute() {
  return (
    <ConvexReady>
      <AccountPage />
    </ConvexReady>
  );
}
