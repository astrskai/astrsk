import { createFileRoute, Outlet } from "@tanstack/react-router";
import { V2Layout } from "@/components-v2/layout/v2-layout";
import { ModalPages } from "@/components-v2/layout/modal-pages";
import DesktopApp from "@/app/v2/desktop-app";

export const Route = createFileRoute("/_layout")({
  component: LayoutWrapper,
});

function LayoutWrapper() {
  return (
    <>
      <V2Layout>
        <Outlet />
        <DesktopApp />
      </V2Layout>

      <ModalPages />
    </>
  );
}
