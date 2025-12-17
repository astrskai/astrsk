import { createFileRoute } from "@tanstack/react-router";
import RemoteScriptPage from "@/pages/settings/advanced/recovery/remote-script";

export const Route = createFileRoute("/_layout/settings/advanced/recovery/remote-script")({
  component: RemoteScriptPage,
});
