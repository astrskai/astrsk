import { createFileRoute } from "@tanstack/react-router";
import { CreatePlotPage } from "@/pages/asset";

export const Route = createFileRoute("/_layout/assets/create/plot/")({
  component: CreatePlotPage,
});
