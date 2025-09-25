import { createFileRoute } from "@tanstack/react-router";
import { V2Layout } from "@/components-v2/layout/v2-layout";
import { ModalPages } from "@/components-v2/layout/modal-pages";
import { InitialPage } from "@/components-v2/init-page";
import DesktopApp from "@/app/v2/desktop-app";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <>
      <V2Layout>
        <InitialPage />
        <DesktopApp />
      </V2Layout>

      <ModalPages />
    </>
  );
}
