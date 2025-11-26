import { HomePage } from "@/pages/home";
import { createFileRoute } from "@tanstack/react-router";
import SettingsSamplePage from "@/pages/settings-sample";

export const Route = createFileRoute("/_layout/")({
  component: SettingsSamplePage,
});
