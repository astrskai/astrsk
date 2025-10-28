import { InitialScreen } from "@/shared/ui/initial-screen";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/")({
  component: Index,
});

function Index() {
  return <InitialScreen />;
}
