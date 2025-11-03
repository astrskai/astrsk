import { createFileRoute } from "@tanstack/react-router";
import { SessionsPage } from "@/pages/sessions";

export const Route = createFileRoute("/_layout/sessions/")({
  component: SessionsPage,
});
