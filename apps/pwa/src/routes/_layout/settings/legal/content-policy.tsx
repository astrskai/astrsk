import { createFileRoute } from "@tanstack/react-router";
import ContentPolicy from "@/components-v2/setting/content-policy";

export const Route = createFileRoute("/_layout/settings/legal/content-policy")({
  component: ContentPolicyPage,
});

function ContentPolicyPage() {
  return <ContentPolicy />;
}
