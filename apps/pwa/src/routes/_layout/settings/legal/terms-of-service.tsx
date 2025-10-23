import { createFileRoute } from "@tanstack/react-router";
import { TermsOfService as TermOfService } from "@/features/settings/legal";

export const Route = createFileRoute(
  "/_layout/settings/legal/terms-of-service",
)({
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  return <TermOfService />;
}
