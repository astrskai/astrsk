import { createFileRoute } from "@tanstack/react-router";
import RecoveryPage from "@/pages/settings/advanced/recovery";

export const Route = createFileRoute("/_layout/settings/advanced/recovery/")({
  component: RecoveryPage,
});
