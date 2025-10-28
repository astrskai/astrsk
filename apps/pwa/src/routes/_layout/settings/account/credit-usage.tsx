import { createFileRoute } from "@tanstack/react-router";
import { CreditUsagePage } from "@/features/settings/account";
import { ConvexReady } from "@/shared/ui/convex-ready";

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
