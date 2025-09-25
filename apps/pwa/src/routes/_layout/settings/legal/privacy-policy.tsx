import { createFileRoute } from "@tanstack/react-router";
import PrivacyPolicy from "@/components-v2/setting/privacy-policy";

export const Route = createFileRoute("/_layout/settings/legal/privacy-policy")({
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return <PrivacyPolicy />;
}
