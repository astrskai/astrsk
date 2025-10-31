import { createFileRoute } from "@tanstack/react-router";
import ModelPage from "@/pages/settings/providers/model-page";

export const Route = createFileRoute("/_layout/settings/providers")({
  component: ModelPage,
});
