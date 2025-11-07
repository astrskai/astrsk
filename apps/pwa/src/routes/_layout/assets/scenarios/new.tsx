import { createFileRoute } from "@tanstack/react-router";
import { CreatePlotPage } from "@/pages/assets/scenarios/new";

export const Route = createFileRoute("/_layout/assets/scenarios/new")({
  component: CreatePlotPage,
});
