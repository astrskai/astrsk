import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/pages/app-layout";

export const Route = createFileRoute("/_layout")({
  component: AppLayout,
});
