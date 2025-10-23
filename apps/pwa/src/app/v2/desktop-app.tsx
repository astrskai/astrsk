import { OnboardingDialog } from "@/features/settings/onboarding";
import { ConvexReady } from "@/app/providers/convex-ready";
import { SubscribeChecker, SubscribeNudgeDialog } from "@/features/settings/subscription";

const DesktopApp = () => {
  return (
    <>
      <OnboardingDialog />
      <SubscribeNudgeDialog />
      <ConvexReady>
        <SubscribeChecker />
      </ConvexReady>
    </>
  );
};

export default DesktopApp;
