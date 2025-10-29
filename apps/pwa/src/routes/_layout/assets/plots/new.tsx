import { createFileRoute } from "@tanstack/react-router";
import { CreatePlotPage } from "@/pages/asset/plots/new-plot";

export const Route = createFileRoute("/_layout/assets/plots/new")({
  component: CreatePlotPage,
});
