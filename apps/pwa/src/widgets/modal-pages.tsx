import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useAppStore, Page } from "@/shared/stores/app-store";
import { OnboardingStepOnePage } from "@/pages/settings/onboarding/onboarding-step-one-page";
import { OnboardingStepTwoPage } from "@/pages/settings/onboarding/onboarding-step-two-page";
import { SubscribePage } from "@/pages/settings/subscription/subscribe-page";
import { PaymentPage } from "@/pages/settings/subscription/payment-page";
import { SignUpPage } from "@/pages/settings/account/signup-page";

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
