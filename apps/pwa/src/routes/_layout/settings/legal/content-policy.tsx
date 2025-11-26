import { createFileRoute } from "@tanstack/react-router";
import ContentPolicyPage from "@/pages/settings/legal/content-policy";

export const Route = createFileRoute("/_layout/settings/legal/content-policy")({
  component: ContentPolicyPage,
});
