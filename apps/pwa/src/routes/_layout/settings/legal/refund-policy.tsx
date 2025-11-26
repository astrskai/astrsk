import { createFileRoute } from "@tanstack/react-router";
import RefundPolicyPage from "@/pages/settings/legal/refund-policy";

export const Route = createFileRoute("/_layout/settings/legal/refund-policy")({
  component: RefundPolicyPage,
});
