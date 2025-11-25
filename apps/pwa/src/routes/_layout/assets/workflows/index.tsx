import { createFileRoute } from "@tanstack/react-router";
import { WorkflowsPage } from "@/pages/assets/workflows";

export const Route = createFileRoute("/_layout/assets/workflows/")({
  component: WorkflowsPage,
});
