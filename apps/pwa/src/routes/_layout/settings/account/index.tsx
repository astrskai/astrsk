import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/components-v2/setting/account-page";
import { ConvexReady } from "@/components-v2/convex-ready";

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
