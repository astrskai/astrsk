import { createFileRoute } from "@tanstack/react-router";
import { PlotsListPage } from "@/pages/assets/scenarios";

export const Route = createFileRoute("/_layout/assets/scenarios/")({
  component: PlotsListPage,
});
