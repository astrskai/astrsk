import { InitialPage } from "@/components/system/init-page";
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
