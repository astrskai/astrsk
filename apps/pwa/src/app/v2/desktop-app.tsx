import { OnboardingDialog } from "@/components-v2/setting/onboarding-genre-dialog";
import { ConvexReady } from "@/components-v2/convex-ready";
import { SubscribeChecker } from "@/components-v2/setting/subscribe-checker";
import { SubscribeNudgeDialog } from "@/components-v2/setting/subscribe-nudge-dialog";

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
