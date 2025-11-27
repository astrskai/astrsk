import { createFileRoute } from "@tanstack/react-router";
import ProvidersPage from "@/pages/settings/providers";

export const Route = createFileRoute("/_layout/settings/providers")({
  component: ProvidersPage,
});
