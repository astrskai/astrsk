import { createFileRoute } from "@tanstack/react-router";
import { CreateSessionPage } from "@/pages/sessions/new";

export const Route = createFileRoute("/_layout/sessions/new")({
  component: CreateSessionPage,
});
