import { createFileRoute } from "@tanstack/react-router";
import RefundPolicy from "@/pages/settings/legal/refund-policy";

export const Route = createFileRoute("/_layout/settings/legal/refund-policy")({
  component: RefundPolicy,
});
