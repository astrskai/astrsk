import { createFileRoute } from "@tanstack/react-router";
import PrivacyPolicyPage from "@/pages/settings/legal/privacy-policy";

export const Route = createFileRoute("/_layout/settings/legal/privacy-policy")({
  component: PrivacyPolicyPage,
});
