import { createFileRoute } from "@tanstack/react-router";
import CreditUsagePage from "@/components-v2/setting/credit-usage-page";
import { ConvexReady } from "@/components/system/convex-ready";

export const Route = createFileRoute("/_layout/settings/account/credit-usage")({
  component: CreditUsagePageRoute,
});

function CreditUsagePageRoute() {
  return (
    <ConvexReady>
      <CreditUsagePage />
    </ConvexReady>
  );
}
