import { InitialPage } from "@/pages/initial-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/")({
  component: Index,
});

function Index() {
  return (
    <>
      <InitialPage />
    </>
  );
}
