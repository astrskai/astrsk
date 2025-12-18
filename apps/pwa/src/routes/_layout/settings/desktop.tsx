import { createFileRoute } from "@tanstack/react-router";
import DesktopAppPage from "@/pages/settings/desktop";

export const Route = createFileRoute("/_layout/settings/desktop")({
  component: DesktopAppPage,
});
