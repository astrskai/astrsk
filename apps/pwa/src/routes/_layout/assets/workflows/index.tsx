import { createFileRoute } from "@tanstack/react-router";
import { FlowsListPage } from "@/pages/assets/flows";

export const Route = createFileRoute("/_layout/assets/workflows/")({
  component: FlowsListPage,
});
