import { createFileRoute } from "@tanstack/react-router";
import TermOfService from "@/components-v2/setting/terms-of-service";

export const Route = createFileRoute(
  "/_layout/settings/legal/terms-of-service",
)({
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  return <TermOfService />;
}
