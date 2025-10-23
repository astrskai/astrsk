import { createFileRoute } from "@tanstack/react-router";
import CreateSessionPage from "@/features/session/create-session-page";

export const Route = createFileRoute("/sessions/create")({
  component: CreateSessionPageRoute,
});

function CreateSessionPageRoute() {
  return <CreateSessionPage />;
}
