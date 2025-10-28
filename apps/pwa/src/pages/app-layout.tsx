import { Outlet } from "@tanstack/react-router";
import { MainLayout } from "@/widgets/main-layout";
import { ModalPages } from "@/widgets/modal-pages";
import { OnboardingDialog } from "@/features/settings/onboarding";
import { ConvexReady } from "@/shared/ui/convex-ready";
import { SubscribeChecker, SubscribeNudgeDialog } from "@/features/settings/subscription";

export function AppLayout() {
  return (
    <>
      <MainLayout>
        <Outlet />

        {/* Global dialogs and checkers */}
        <OnboardingDialog />
        <SubscribeNudgeDialog />
        <ConvexReady>
          <SubscribeChecker />
        </ConvexReady>
      </MainLayout>

      <ModalPages />
    </>
  );
}
