import { createFileRoute } from "@tanstack/react-router";
import { PlotsListPage } from "@/pages/asset/plots";

export const Route = createFileRoute("/_layout/assets/plots/")({
  component: PlotsListPage,
});
