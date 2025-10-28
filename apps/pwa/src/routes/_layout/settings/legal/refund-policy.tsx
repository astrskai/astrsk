import { createFileRoute } from "@tanstack/react-router";
import { RefundPolicy } from "@/features/settings/legal";

export const Route = createFileRoute("/_layout/settings/legal/refund-policy")({
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return <RefundPolicy />;
}
