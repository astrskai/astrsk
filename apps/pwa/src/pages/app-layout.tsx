import { Outlet } from "@tanstack/react-router";
import { MainLayout } from "@/widgets/main-layout";
import { ModalPages } from "@/widgets/modal-pages";
import DesktopApp from "@/app/v2/desktop-app";

export function AppLayout() {
  return (
    <>
      <MainLayout>
        <Outlet />
        <DesktopApp />
      </MainLayout>

      <ModalPages />
    </>
  );
}
