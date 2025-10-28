import { createFileRoute } from "@tanstack/react-router";
import { OssNotice } from "@/features/settings/legal";

export const Route = createFileRoute("/_layout/settings/legal/oss-notice")({
  component: OssNoticePage,
});

function OssNoticePage() {
  return <OssNotice />;
}
