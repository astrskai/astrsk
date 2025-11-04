import { createFileRoute } from "@tanstack/react-router";
import TermsOfService from "@/pages/settings/legal/terms-of-service";

export const Route = createFileRoute(
  "/_layout/settings/legal/terms-of-service",
)({
  component: TermsOfService,
});
