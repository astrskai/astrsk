import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { V2Layout } from "@/components-v2/layout/v2-layout";
import { ModalPages } from "@/components-v2/layout/modal-pages";
import { InitialPage } from "@/components-v2/init-page";
import DesktopApp from "@/app/v2/desktop-app";
import { Page, useAppStore } from "@/app/stores/app-store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const setActivePage = useAppStore.use.setActivePage();

  useEffect(() => {
    setActivePage(Page.Init);
  }, [setActivePage]);

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
