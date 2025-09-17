import { createPortal } from "react-dom";

import { Page, useAppStore } from "@/app/stores/app-store";
import CardPage from "@/components-v2/card/card-page";
import { CardPanelMain } from "@/components-v2/card/panels/card-panel-main";
import { InitialPage } from "@/components-v2/init-page";
import { cn } from "@/components-v2/lib/utils";
import { LoadingOverlay } from "@/components-v2/loading-overlay";
import CreateSessionPage from "@/components-v2/session/create-session-page";
import SessionPage from "@/components-v2/session/session-page";
import { OnboardingDialog } from "@/components-v2/setting/onboarding-genre-dialog";
import SettingPage from "@/components-v2/setting/setting-page";
import FlowMultiPage from "@/flow-multi/pages/flow-multi-page";
import { ConvexReady } from "@/components-v2/convex-ready";
import { SubscribeChecker } from "@/components-v2/setting/subscribe-checker";

const DesktopApp = () => {
  const selectedCardId = useAppStore.use.selectedCardId();
  const activePage = useAppStore.use.activePage();

  return (
    <>
      <LoadingOverlay />
      <InitialPage className={cn(activePage !== Page.Init && "hidden")} />
      <SessionPage className={cn(activePage !== Page.Sessions && "hidden")} />
      {activePage === Page.CreateSession &&
        createPortal(<CreateSessionPage />, document.body)}
      <FlowMultiPage className={cn(activePage !== Page.Flow && "hidden")} />
      <CardPage
        className={cn(
          activePage !== Page.Cards &&
            activePage !== Page.CardsCreatePlot &&
            activePage !== Page.CardsCreateCharacter &&
            "hidden",
        )}
      />
      <SettingPage className={cn(activePage !== Page.Settings && "hidden")} />
      {activePage === Page.CardPanel && selectedCardId && (
        <CardPanelMain cardId={selectedCardId} />
      )}
      <OnboardingDialog />
      <ConvexReady>
        <SubscribeChecker />
      </ConvexReady>
    </>
  );
};

export default DesktopApp;