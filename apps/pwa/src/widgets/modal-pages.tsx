import { useAppStore, Page } from "@/shared/stores/app-store";
import { TutorialDialog } from "@/widgets/onboarding";
// import { OnboardingStepTwoPage } from "@/pages/settings/onboarding/step-two";
import { SubscribePage } from "@/pages/settings/subscription/subscribe";
import { PaymentPage } from "@/pages/settings/subscription/payment";
import { SignUpPage } from "@/pages/settings/account/signup";

export const ModalPages = () => {
  const activePage = useAppStore.use.activePage();

  return (
    <>
      {/* TutorialDialog manages its own state via sessionOnboardingSteps.tutorialVideo */}
      <TutorialDialog />
      {/* {activePage === Page.OnboardingStepTwo && <OnboardingStepTwoPage />} */}
      {activePage === Page.Subscribe && <SubscribePage />}
      {activePage === Page.SignUp && <SignUpPage />}
      {activePage === Page.Payment && <PaymentPage />}
    </>
  );
};
