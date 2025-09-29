import { useIsMobile } from "@/components-v2/hooks/use-mobile";
import { useAppStore, Page } from "@/app/stores/app-store";
import { OnboardingStepOnePage } from "@/components-v2/setting/onboarding-step-one-page";
import { OnboardingStepTwoPage } from "@/components-v2/setting/onboarding-step-two-page";
import { SubscribePage } from "@/components-v2/setting/subscribe-page";
import { SignUpPage } from "@/components-v2/setting/signup-page";
import { PaymentPage } from "@/components-v2/setting/payment-page";

export const ModalPages = () => {
  const isMobile = useIsMobile();
  const activePage = useAppStore.use.activePage();

  if (isMobile) return null;

  return (
    <>
      {activePage === Page.OnboardingStepOne && <OnboardingStepOnePage />}
      {activePage === Page.OnboardingStepTwo && <OnboardingStepTwoPage />}
      {activePage === Page.Subscribe && <SubscribePage />}
      {activePage === Page.SignUp && <SignUpPage />}
      {activePage === Page.Payment && <PaymentPage />}
    </>
  );
};
