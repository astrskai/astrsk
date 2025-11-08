import { createFileRoute } from "@tanstack/react-router";
import WorkflowsListPage from "@/pages/assets/workflows";

export const Route = createFileRoute("/_layout/assets/workflows/")({
  component: WorkflowsListPage,
});
