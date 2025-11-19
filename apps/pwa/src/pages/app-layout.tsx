import { Outlet } from "@tanstack/react-router";
import { MainLayout } from "@/widgets/main-layout";
import { ModalPages } from "@/widgets/modal-pages";
import { OnboardingDialog } from "@/widgets/dialog/onboarding-dialog";
import { ConvexReady } from "@/shared/ui/convex-ready";
import { SubscribeChecker } from "@/widgets/dialog/subscribe-checker";
import { SubscribeNudgeDialog } from "@/widgets/dialog/subscribe-nudge-dialog";
import { ErrorDetailsDialog, MigrationDetailsDialog } from "@/shared/ui/dialogs";

export function AppLayout() {
  return (
    <>
      <MainLayout>
        <Outlet />

        {/* Global dialogs and checkers */}
        <OnboardingDialog />
        <SubscribeNudgeDialog />
        <ErrorDetailsDialog />
        <MigrationDetailsDialog />
        <ConvexReady>
          <SubscribeChecker />
        </ConvexReady>
      </MainLayout>

      <ModalPages />
    </>
  );
}
