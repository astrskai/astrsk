import { createFileRoute } from "@tanstack/react-router";
import { ContentPolicy } from "@/features/settings/legal";

export const Route = createFileRoute("/_layout/settings/legal/content-policy")({
  component: ContentPolicyPage,
});

function ContentPolicyPage() {
  return <ContentPolicy />;
}
