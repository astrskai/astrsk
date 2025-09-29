import { createFileRoute } from "@tanstack/react-router";
import OssNotice from "@/components-v2/setting/oss-notice";

export const Route = createFileRoute("/_layout/settings/legal/oss-notice")({
  component: OssNoticePage,
});

function OssNoticePage() {
  return <OssNotice />;
}
