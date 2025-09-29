import { createFileRoute } from "@tanstack/react-router";
import RefundPolicy from "@/components-v2/setting/refund-policy";

export const Route = createFileRoute("/_layout/settings/legal/refund-policy")({
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return <RefundPolicy />;
}
