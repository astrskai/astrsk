import { Outlet } from "@tanstack/react-router";
import { V2Layout } from "@/widgets/v2-layout";
import { ModalPages } from "@/widgets/modal-pages";
import DesktopApp from "@/app/v2/desktop-app";

export function AppLayout() {
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
