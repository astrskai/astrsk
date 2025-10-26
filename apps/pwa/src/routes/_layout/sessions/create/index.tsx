import { createFileRoute } from "@tanstack/react-router";
import { CreateSessionPage } from "@/pages/session";

export const Route = createFileRoute("/_layout/sessions/create/")({
  component: CreateSessionPage,
});
