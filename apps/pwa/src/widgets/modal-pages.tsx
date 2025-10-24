import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useAppStore, Page } from "@/shared/stores/app-store";
import { OnboardingStepOnePage, OnboardingStepTwoPage } from "@/features/settings/onboarding";
import { SubscribePage, PaymentPage } from "@/features/settings/subscription";
import { SignUpPage } from "@/features/settings/account";

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
