import {
  LegalPageType,
  Page,
  SettingPageLevel,
  SettingSubPageType,
  useAppStore,
} from "@/app/stores/app-store";
import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Button } from "@/components-v2/ui/button";
import { FloatingLabelInput } from "@/components-v2/ui/floating-label-input";
import { toastSuccess } from "@/components-v2/ui/toast-success";
import { logger } from "@/shared/utils";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { ArrowLeft, Check } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const SignUpStep = {
  SignUp: "sign_up",
  SignUpWithEmailAndPassword: "sign_up_with_email_and_password",
  VerifyEmail: "verify_email",
  SignIn: "sign_in",
  ForgotPassword: "forgot_password", // TODO: reset password
  NewPassword: "new_password", // TODO: reset password
} as const;

type SignUpStep = (typeof SignUpStep)[keyof typeof SignUpStep];

function FloatingActionButton({
  className,
  onClick,
  ref,
  position,
  icon,
  label,
  openned,
  ...props
}: React.ComponentProps<typeof Button> & {
  icon?: React.ReactNode;
  label?: string;
  position: "top-left" | "top-right";
  openned?: boolean;
}) {
  return (
    <Button
      className={cn(
        "group/fab z-10 absolute top-[24px] rounded-full cursor-pointer",
        "bg-button-background-floating border-[1px] border-border-light text-text-primary",
        "hover:bg-background-card hover:text-text-primary",
        position === "top-left" ? "left-[40px]" : "right-[40px]",
        "!transition-all ease-out duration-300",
        "min-w-[40px] h-[40px] p-0",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
      }}
      ref={ref}
      {...props}
    >
      <div
        className={cn(
          "h-full flex flex-row items-center",
          "transition-[margin-inline] ease-out duration-300",
          "mx-[7px] group-hover/fab:mx-[16px]",
          openned && "mx-[16px]",
        )}
      >
        {icon}
        <div
          className={cn(
            "grid transition-[margin-left,grid-template-columns,opacity] ease-out duration-300",
            "ml-0 grid-cols-[0fr] opacity-0",
            "group-hover/fab:ml-2 group-hover/fab:grid-cols-[1fr] group-hover/fab:opacity-100",
            openned && "ml-2 grid-cols-[1fr] opacity-100",
          )}
        >
          <span className="overflow-hidden font-medium text-[14px] leading-[20px]">
            {label}
          </span>
        </div>
        <span className="sr-only">{label}</span>
      </div>
    </Button>
  );
}

const SignUpPage = () => {
  // Page navigation
  const setActivePage = useAppStore.use.setActivePage();
  const setSettingPageLevel = useAppStore.use.setSettingPageLevel();
  const setSettingSubPage = useAppStore.use.setSettingSubPage();
  const setSettingDetailPage = useAppStore.use.setSettingDetailPage();

  // Step navigation
  const [step, setStep] = useState<SignUpStep>(SignUpStep.SignUp);
  const back = useCallback(() => {
    switch (step) {
      case "sign_up_with_email_and_password":
        setPassword("");
        setPasswordConfirm("");
        setStep(SignUpStep.SignUp);
        break;
      case "verify_email":
        setEmailCode("");
        setStep(SignUpStep.SignUpWithEmailAndPassword);
        break;
      case "sign_in":
        setStep(SignUpStep.SignUp);
        break;
      case "forgot_password":
      case "new_password":
        setStep(SignUpStep.SignIn);
        break;
    }
  }, [step]);

  // States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [emailCode, setEmailCode] = useState("");

  // Sign up with SSO
  const {
    isLoaded: isLoadedSignUp,
    signUp,
    setActive: setActiveSignUp,
  } = useSignUp();
  const signUpWithGoogle = useCallback(() => {
    // Check sign up is loaded
    if (!isLoadedSignUp) {
      return;
    }

    try {
      // Try to sign up with google
      signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/",
        redirectUrlComplete: "/",
      });
    } catch (error) {
      logger.error(error);
      toast.error("Failed to sign up", {
        description: JSON.stringify(error),
      });
    }
  }, [isLoadedSignUp, signUp]);
  const signUpWithDiscord = useCallback(() => {
    // Check sign up is loaded
    if (!isLoadedSignUp) {
      return;
    }

    try {
      // Try to sign up with google
      signUp.authenticateWithRedirect({
        strategy: "oauth_discord",
        redirectUrl: "/",
        redirectUrlComplete: "/",
      });
    } catch (error) {
      logger.error(error);
      toast.error("Failed to sign up", {
        description: JSON.stringify(error),
      });
    }
  }, [isLoadedSignUp, signUp]);

  // Sign up with email and password
  const signUpWithEmailAndPassword = useCallback(async () => {
    // Check sign up is loaded
    if (!isLoadedSignUp) {
      return;
    }

    try {
      // Try to sign up
      await signUp.create({
        emailAddress: email,
        password: password,
      });

      // Send verify email code
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      // Step to verify email code
      setStep(SignUpStep.VerifyEmail);
    } catch (error) {
      logger.error(error);
      toast.error("Failed to sign up", {
        description: JSON.stringify(error),
      });
    }
  }, [email, isLoadedSignUp, password, signUp]);
  const verifyEmailCode = useCallback(async () => {
    // Check sign up is loaded
    if (!isLoadedSignUp) {
      return;
    }

    try {
      // Verify code
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: emailCode,
      });

      // Success to sign up
      if (signUpAttempt.status === "complete") {
        await setActiveSignUp({
          session: signUpAttempt.createdSessionId,
        });
        toastSuccess({
          title: "Welcome to astrsk!",
          details: "Your account is ready to use",
        });
        setActivePage(Page.Payment);
      } else {
        // Failed to sign up
        toast.error(signUpAttempt.status);
      }
    } catch (error) {
      logger.error(error);
      toast.error("Failed to verify email code", {
        description: JSON.stringify(error),
      });
    }
  }, [emailCode, isLoadedSignUp, setActivePage, setActiveSignUp, signUp]);

  // Sign in
  const {
    isLoaded: isLoadedSignIn,
    signIn,
    setActive: setActiveSignIn,
  } = useSignIn();
  const signInWithEmailAndPassword = useCallback(async () => {
    // Check sign in is loaded
    if (!isLoadedSignIn) {
      return;
    }

    try {
      // Try to sign in
      const signInAttempt = await signIn.create({
        identifier: email,
        password: password,
      });

      // Success to sign in
      if (signInAttempt.status === "complete") {
        await setActiveSignIn({
          session: signInAttempt.createdSessionId,
        });
        setActivePage(Page.Payment);
      } else {
        // Failed to sign in
        toast.error(signInAttempt.status);
      }
    } catch (error) {
      logger.error(error);
      toast.error("Failed to sign in", {
        description: JSON.stringify(error),
      });
    }
  }, [email, isLoadedSignIn, password, setActiveSignIn, setActivePage, signIn]);

  return (
    <div className={cn("z-40 absolute inset-0 top-[38px]")}>
      {/* Close */}
      <button
        className="z-50 absolute top-[34px] right-[40px] text-text-subtle"
        onClick={() => {
          setActivePage(Page.Subscribe);
        }}
      >
        <SvgIcon name="window_close" size={40} />
      </button>

      {/* Back */}
      <FloatingActionButton
        icon={<ArrowLeft className="min-w-[24px] min-h-[24px]" />}
        label="Back"
        position="top-left"
        className={cn(step === SignUpStep.SignUp && "hidden")}
        onClick={back}
      />

      {/* Main */}
      <div className="absolute inset-0 bg-background-surface-2">
        {/* Form */}
        <div
          className={cn(
            "absolute w-[50%] h-full grid place-content-center",
            step !== SignUpStep.SignUp && "left-[25%]",
          )}
        >
          {/* Sign Up */}
          <div
            className={cn(
              "w-[384px] flex-col gap-4 items-center",
              step === SignUpStep.SignUp ? "flex" : "hidden",
            )}
          >
            <SvgIcon
              name="astrsk_logo_full"
              width={119}
              height={28}
              className="mb-[24px]"
            />
            <Button className="w-full" size="lg" onClick={signUpWithGoogle}>
              <SvgIcon name="google" size={18} /> Continue with Google
            </Button>
            <Button className="w-full" size="lg" onClick={signUpWithDiscord}>
              <SvgIcon name="discord" size={18} /> Continue with Discord
            </Button>
            <div className="text-[16px] leading-[25.6px] font-[500] text-text-subtle">
              or
            </div>
            <FloatingLabelInput
              label="Email"
              type="email"
              className="w-[384px]"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                setStep(SignUpStep.SignUpWithEmailAndPassword);
              }}
            >
              Sign up with email
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              size="lg"
              onClick={() => {
                setStep(SignUpStep.SignIn);
              }}
            >
              I already have an account
            </Button>
            <div className="text-center text-[16px] leading-[25.6px] font-[400] text-text-subtle">
              By clicking the button above, you agree to our
              <br />
              <button
                className="text-secondary-normal"
                onClick={() => {
                  setActivePage(Page.Settings);
                  setSettingPageLevel(SettingPageLevel.detail);
                  setSettingSubPage(SettingSubPageType.legal);
                  setSettingDetailPage(LegalPageType.termOfService);
                }}
              >
                Terms of Use
              </button>
              {" and "}
              <button
                className="text-secondary-normal"
                onClick={() => {
                  setActivePage(Page.Settings);
                  setSettingPageLevel(SettingPageLevel.detail);
                  setSettingSubPage(SettingSubPageType.legal);
                  setSettingDetailPage(LegalPageType.privacyPolicy);
                }}
              >
                Privacy Policy
              </button>
            </div>
          </div>

          {/* Sign Up with Email and Password */}
          <div
            className={cn(
              "w-[384px] flex-col gap-4 items-center",
              step === SignUpStep.SignUpWithEmailAndPassword
                ? "flex"
                : "hidden",
            )}
          >
            <SvgIcon
              name="astrsk_logo_full"
              width={119}
              height={28}
              className="absolute top-[30px]"
            />
            <div className="mb-[24px] text-center">
              <div className="mb-[8px] text-[20px] leading-[24px] font-[600] text-text-primary">
                Create your password
              </div>
              <div className="text-[16px] leading-[25.6px] font-[400] text-text-subtle">
                Your password must be at least 8 characters long, and include 1
                symbol and 1 number.
              </div>
            </div>
            <FloatingLabelInput
              label="Password"
              type="password"
              className="w-[384px]"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
            <FloatingLabelInput
              label="Password confirm"
              type="password"
              className="w-[384px]"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
              }}
            />
            <div className="flex flex-col gap-[8px]">
              <div className="flex flex-row gap-[4px] items-center">
                <Check size={16} />
                <div className="text-[12px] leading-[15px] font-[400] text-text-subtle">
                  Minimum 8 characters
                </div>
              </div>
              <div className="flex flex-row gap-[4px] items-center">
                <Check size={16} />
                <div className="text-[12px] leading-[15px] font-[400] text-text-subtle">
                  At least one number
                </div>
              </div>
              <div className="flex flex-row gap-[4px] items-center">
                <Check size={16} />
                <div className="text-[12px] leading-[15px] font-[400] text-text-subtle">
                  At least one symbol
                </div>
              </div>
              <div className="flex flex-row gap-[4px] items-center">
                <Check size={16} />
                <div className="text-[12px] leading-[15px] font-[400] text-text-subtle">
                  Match password confirm
                </div>
              </div>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={signUpWithEmailAndPassword}
            >
              Create password
            </Button>
          </div>

          {/* Verify Email */}
          <div
            className={cn(
              "w-[384px] flex-col gap-4 items-center",
              step === SignUpStep.VerifyEmail ? "flex" : "hidden",
            )}
          >
            <SvgIcon
              name="astrsk_logo_full"
              width={119}
              height={28}
              className="absolute top-[30px]"
            />
            <div className="mb-[24px] text-center">
              <div className="mb-[8px] text-[20px] leading-[24px] font-[600] text-text-primary">
                Verify you email
              </div>
              <div className="text-[16px] leading-[25.6px] font-[400] text-text-subtle">
                We just sent a 6-digit code to
                <br />
                {email}, enter it below:
              </div>
            </div>
            <FloatingLabelInput
              label="Code"
              type="number"
              className="w-[384px]"
              value={emailCode}
              onChange={(e) => {
                setEmailCode(e.target.value);
              }}
            />
            <div className="text-[16px] leading-[25.6px] font-[400] text-text-subtle">
              Don&apos;t see a code?{" "}
              <button
                className="text-button-background-primary"
                onClick={() => {
                  // TODO: resend verify email code
                }}
              >
                Resend to email
              </button>
            </div>
            <Button className="w-full" size="lg" onClick={verifyEmailCode}>
              Verify email
            </Button>
          </div>

          {/* Sign In */}
          <div
            className={cn(
              "w-[384px] flex-col gap-4 items-center",
              step === SignUpStep.SignIn ? "flex" : "hidden",
            )}
          >
            <SvgIcon
              name="astrsk_logo_full"
              width={119}
              height={28}
              className="absolute top-[30px]"
            />
            <div className="mb-[24px] text-[20px] leading-[24px] font-[600] text-text-primary">
              Welcome back
            </div>
            <FloatingLabelInput
              label="Email"
              type="email"
              className="w-[384px]"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
            <FloatingLabelInput
              label="Password"
              type="password"
              className="w-[384px]"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
            <Button
              className="w-full"
              size="lg"
              onClick={signInWithEmailAndPassword}
            >
              Sign in
            </Button>
            <Button variant="ghost" className="w-full" size="lg">
              I forgot my password
            </Button>
          </div>
        </div>

        {/* Visual */}
        <div
          className={cn(
            "absolute top-0 right-0 w-[50%] h-full px-[71px] py-[127px]",
            "bg-[url('/img/subscription/bg-signup.png')] bg-cover bg-bottom bg-no-repeat",
            "hidden",
            step === SignUpStep.SignUp && "block",
          )}
        >
          <div className="mb-[16px] text-[32px] leading-[40px] font-[600] text-text-primary">
            Customize Every Detail
          </div>
          <div className="text-[20px] leading-[24px] font-[500] text-text-muted-title">
            Personalize LLMs, prompts, character, and plots to create a roleplay
            that&apos;s truly yours.
          </div>
        </div>
      </div>
    </div>
  );
};

export { SignUpPage };
