import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPolicy } from "@/features/settings/legal";

export const Route = createFileRoute("/_layout/settings/legal/privacy-policy")({
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return <PrivacyPolicy />;
}
