import { createFileRoute } from "@tanstack/react-router";
import CreditUsagePage from "@/pages/settings/account/credit-usage";

export const Route = createFileRoute("/_layout/settings/account/credit-usage")({
  component: CreditUsagePage,
});
