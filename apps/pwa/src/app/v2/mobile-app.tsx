import { useEffect } from "react";

import { Page, useAppStore } from "@/app/stores/app-store";

const MobileApp = () => {
  const activePage = useAppStore.use.activePage();

  useEffect(() => {
    if (activePage === Page.Init) {
      useAppStore.setState({ activePage: Page.Sessions });
    }
  }, [activePage]);

  return <></>;
};

export default MobileApp;
