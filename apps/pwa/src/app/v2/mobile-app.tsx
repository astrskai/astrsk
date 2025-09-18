import { createPortal } from "react-dom";
import { useEffect } from "react";

import { Page, useAppStore } from "@/app/stores/app-store";
import CardPageMobile from "@/components-v2/card/mobile/card-page-mobile";
import { cn } from "@/components-v2/lib/utils";
import { LoadingOverlay } from "@/components-v2/loading-overlay";
import ModelPageMobile from "@/components-v2/model/model-page-mobile";
import CreateSessionPage from "@/components-v2/session/create-session-page";
import SessionPageMobile from "@/components-v2/session/mobile/session-page-mobile";
import SettingPageMobile from "@/components-v2/setting/setting-page-mobile";
import FlowPageMobile from "@/components-v2/flow/flow-page-mobile";

const MobileApp = () => {
  const activePage = useAppStore.use.activePage();

  useEffect(() => {
    if (activePage === Page.Init) {
      useAppStore.setState({ activePage: Page.Sessions });
    }
  }, [activePage]);

  return (
    <>
      <LoadingOverlay />
      <SessionPageMobile
        className={cn(activePage !== Page.Sessions && "hidden")}
      />
      {activePage === Page.CreateSession &&
        createPortal(<CreateSessionPage />, document.body)}
      <ModelPageMobile
        className={cn(activePage !== Page.Connections && "hidden")}
      />
      <FlowPageMobile
        className={cn(activePage !== Page.Flow && "hidden")}
      />
      <CardPageMobile
        className={cn(
          activePage !== Page.Cards &&
            activePage !== Page.CardsCreatePlot &&
            activePage !== Page.CardsCreateCharacter &&
            "hidden",
        )}
      />
      <SettingPageMobile
        className={cn(activePage !== Page.Settings && "hidden")}
      />
    </>
  );
};

export default MobileApp;