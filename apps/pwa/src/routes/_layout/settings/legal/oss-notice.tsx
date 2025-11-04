import { createFileRoute } from "@tanstack/react-router";
import OssNotice from "@/pages/settings/legal/oss-notice";

export const Route = createFileRoute("/_layout/settings/legal/oss-notice")({
  component: OssNotice,
});
