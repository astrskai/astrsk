import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/features/settings/account";
import { ConvexReady } from "@/components/system/convex-ready";

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
