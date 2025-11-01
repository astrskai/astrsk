import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useAppStore, Page } from "@/shared/stores/app-store";
import { OnboardingStepOnePage } from "@/pages/settings/onboarding/step-one";
import { OnboardingStepTwoPage } from "@/pages/settings/onboarding/step-two";
import { SubscribePage } from "@/pages/settings/subscription/subscribe";
import { PaymentPage } from "@/pages/settings/subscription/payment";
import { SignUpPage } from "@/pages/settings/account/signup";

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
