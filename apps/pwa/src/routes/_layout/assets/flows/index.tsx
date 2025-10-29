import { createFileRoute } from "@tanstack/react-router";
import { FlowsListPage } from "@/pages/asset/flows";

export const Route = createFileRoute("/_layout/assets/flows/")({
  component: FlowsListPage,
});
