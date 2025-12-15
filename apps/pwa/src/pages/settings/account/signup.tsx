import {
  SettingDetailPageType,
  Page,
  SettingPageLevel,
  SettingSubPageType,
  useAppStore,
} from "@/shared/stores/app-store";
import { cn } from "@/shared/lib";
import { Button, FloatingLabelInput, SvgIcon } from "@/shared/ui";
import { IconGoogle, IconDiscord } from "@/shared/assets/icons";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { logger } from "@/shared/lib";
import { signIn, signUp, signInWithOAuth, resetPasswordRequest, updatePassword } from "@/shared/lib/auth-actions";
import { ArrowLeft, Check, X } from "lucide-react";
import { useCallback, useState } from "react";

const SignUpStep = {
  SignUp: "sign_up",
  SignUpWithEmailAndPassword: "sign_up_with_email_and_password",
  VerifySignUpEmail: "verify_sign_up_email",
  SignIn: "sign_in",
  ForgotPassword: "forgot_password",
  NewPassword: "new_password",
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
        "group/fab absolute top-[24px] z-10 cursor-pointer rounded-full",
        "bg-surface-overlay border-border-subtle text-fg-default border-[1px]",
        "hover:bg-hover hover:text-fg-default",
        position === "top-left" ? "left-[40px]" : "right-[40px]",
        "!transition-all duration-300 ease-out",
        "h-[40px] min-w-[40px] p-0",
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
          "flex h-full flex-row items-center",
          "transition-[margin-inline] duration-300 ease-out",
          "mx-[7px] group-hover/fab:mx-[16px]",
          openned && "mx-[16px]",
        )}
      >
        {icon}
        <div
          className={cn(
            "grid transition-[margin-left,grid-template-columns,opacity] duration-300 ease-out",
            "ml-0 grid-cols-[0fr] opacity-0",
            "group-hover/fab:ml-2 group-hover/fab:grid-cols-[1fr] group-hover/fab:opacity-100",
            openned && "ml-2 grid-cols-[1fr] opacity-100",
          )}
        >
          <span className="overflow-hidden text-[14px] leading-[20px] font-medium">
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
      case SignUpStep.SignUpWithEmailAndPassword:
        setPassword("");
        setPasswordConfirm("");
        setStep(SignUpStep.SignUp);
        break;

      case SignUpStep.VerifySignUpEmail:
        setEmailCode("");
        setStep(SignUpStep.SignUpWithEmailAndPassword);
        break;

      case SignUpStep.SignIn:
        setStep(SignUpStep.SignUp);
        break;

      case SignUpStep.ForgotPassword:
        setStep(SignUpStep.SignIn);
        break;

      case SignUpStep.NewPassword:
        setStep(SignUpStep.ForgotPassword);
        break;
    }
  }, [step]);

  // States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [emailCode, setEmailCode] = useState("");

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Sign up with SSO
  const signUpWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await signInWithOAuth("google");
      if (error) {
        toastError("Failed to sign up", { description: error });
      }
    } catch (error) {
      logger.error(error);
      toastError("Failed to sign up", {
        description: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUpWithDiscord = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await signInWithOAuth("discord");
      if (error) {
        toastError("Failed to sign up", { description: error });
      }
    } catch (error) {
      logger.error(error);
      toastError("Failed to sign up", {
        description: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign up with email and password
  const signUpWithEmailAndPassword = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await signUp({ email, password });

      if (error) {
        toastError("Failed to sign up", { description: error });
        return;
      }

      // Supabase sends verification email automatically
      // Show verification step
      setStep(SignUpStep.VerifySignUpEmail);
      toastSuccess("Check your email", {
        description: "We sent you a verification link",
      });
    } catch (error) {
      logger.error(error);
      toastError("Failed to sign up", {
        description: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, password]);

  const verifySignUpEmailCode = useCallback(async () => {
    // Note: Supabase uses email link verification, not code verification
    // This is kept for UI consistency but the actual verification happens via email link
    toastSuccess("Please check your email and click the verification link");
    setActivePage(Page.Payment);
  }, [setActivePage]);

  // Sign in
  const signInWithEmailAndPassword = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await signIn({ email, password });

      if (error) {
        toastError("Failed to sign in", { description: error });
        return;
      }

      toastSuccess("Welcome back!");
      setActivePage(Page.Payment);
    } catch (error) {
      logger.error(error);
      toastError("Failed to sign in", {
        description: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, password, setActivePage]);

  // Forgot password
  const forgotPassword = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await resetPasswordRequest(email);

      if (error) {
        toastError("Failed to reset password", { description: error });
        return;
      }

      // Next step
      setPassword("");
      setPasswordConfirm("");
      toastSuccess("Check your email", {
        description: "We sent you a password reset link",
      });
      setStep(SignUpStep.NewPassword);
    } catch (error) {
      logger.error(error);
      toastError("Failed to reset password", {
        description: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  const resetPasswordHandler = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await updatePassword(password);

      if (error) {
        toastError("Failed to reset password", { description: error });
        return;
      }

      toastSuccess("Password updated successfully");
      setActivePage(Page.Payment);
    } catch (error) {
      logger.error(error);
      toastError("Failed to reset password", {
        description: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, [password, setActivePage]);

  return (
    <div className={cn("absolute inset-0 top-[var(--topbar-height)] z-40")}>
      {/* Close */}
      <button
        className="text-fg-subtle absolute top-[34px] right-[40px] z-50"
        onClick={() => {
          setActivePage(Page.Subscribe);
        }}
      >
        <X size={40} />
      </button>

      {/* Back */}
      <FloatingActionButton
        icon={<ArrowLeft className="min-h-[24px] min-w-[24px]" />}
        label="Back"
        position="top-left"
        className={cn(step === SignUpStep.SignUp && "hidden")}
        onClick={back}
      />

      {/* Main */}
      <div className="bg-surface-raised absolute inset-0">
        {/* Form */}
        <div
          className={cn(
            "absolute grid h-full w-[50%] place-content-center",
            step !== SignUpStep.SignUp && "left-[25%]",
          )}
        >
          {/* Sign Up */}
          <div
            className={cn(
              "w-[384px] flex-col items-center gap-4",
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
              <IconGoogle className="h-[18px] w-[18px]" /> Continue with Google
            </Button>
            <Button className="w-full" size="lg" onClick={signUpWithDiscord}>
              <IconDiscord className="h-[18px] w-[18px]" /> Continue with Discord
            </Button>
            <div className="text-fg-subtle text-[16px] leading-[25.6px] font-[500]">
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
            <div className="text-fg-subtle text-center text-[16px] leading-[25.6px] font-[400]">
              By clicking the button above, you agree to our
              <br />
              <button
                className="text-accent-secondary"
                onClick={() => {
                  setActivePage(Page.Settings);
                  setSettingPageLevel(SettingPageLevel.detail);
                  setSettingSubPage(SettingSubPageType.legal);
                  setSettingDetailPage(SettingDetailPageType.termOfService);
                }}
              >
                Terms of Use
              </button>
              {" and "}
              <button
                className="text-accent-secondary"
                onClick={() => {
                  setActivePage(Page.Settings);
                  setSettingPageLevel(SettingPageLevel.detail);
                  setSettingSubPage(SettingSubPageType.legal);
                  setSettingDetailPage(SettingDetailPageType.privacyPolicy);
                }}
              >
                Privacy Policy
              </button>
            </div>
          </div>

          {/* Sign Up with Email and Password */}
          <div
            className={cn(
              "w-[384px] flex-col items-center gap-4",
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
              <div className="text-fg-default mb-[8px] text-[20px] leading-[24px] font-[600]">
                Create your password
              </div>
              <div className="text-fg-subtle text-[16px] leading-[25.6px] font-[400]">
                Your password must be at least 8 characters long,
                <br />
                and include 1 symbol and 1 number.
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
              <div className="flex flex-row items-center gap-[4px]">
                <Check size={16} />
                <div className="text-fg-subtle text-[12px] leading-[15px] font-[400]">
                  Minimum 8 characters
                </div>
              </div>
              <div className="flex flex-row items-center gap-[4px]">
                <Check size={16} />
                <div className="text-fg-subtle text-[12px] leading-[15px] font-[400]">
                  At least one number
                </div>
              </div>
              <div className="flex flex-row items-center gap-[4px]">
                <Check size={16} />
                <div className="text-fg-subtle text-[12px] leading-[15px] font-[400]">
                  At least one symbol
                </div>
              </div>
              <div className="flex flex-row items-center gap-[4px]">
                <Check size={16} />
                <div className="text-fg-subtle text-[12px] leading-[15px] font-[400]">
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

          {/* Verify Sign Up Email */}
          <div
            className={cn(
              "w-[384px] flex-col items-center gap-4",
              step === SignUpStep.VerifySignUpEmail ? "flex" : "hidden",
            )}
          >
            <SvgIcon
              name="astrsk_logo_full"
              width={119}
              height={28}
              className="absolute top-[30px]"
            />
            <div className="mb-[24px] text-center">
              <div className="text-fg-default mb-[8px] text-[20px] leading-[24px] font-[600]">
                Verify your email
              </div>
              <div className="text-fg-subtle text-[16px] leading-[25.6px] font-[400]">
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
            <div className="text-fg-subtle text-[16px] leading-[25.6px] font-[400]">
              Don&apos;t see a code?{" "}
              <button
                className="text-button-background-primary"
                onClick={async () => {
                  // In Supabase, we can resend by triggering sign up again
                  // The user will receive a new verification email
                  const { error } = await signUp({ email, password });
                  if (error) {
                    toastError("Failed to resend", { description: error });
                  } else {
                    toastSuccess("Verification email sent!");
                  }
                }}
              >
                Resend to email
              </button>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={verifySignUpEmailCode}
            >
              Verify email
            </Button>
          </div>

          {/* Sign In */}
          <div
            className={cn(
              "w-[384px] flex-col items-center gap-4",
              step === SignUpStep.SignIn ? "flex" : "hidden",
            )}
          >
            <SvgIcon
              name="astrsk_logo_full"
              width={119}
              height={28}
              className="absolute top-[30px]"
            />
            <div className="text-fg-default mb-[24px] text-[20px] leading-[24px] font-[600]">
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
            {/** disabled subscribe */}
            {/* <Button
              className="w-full"
              size="lg"
              onClick={signInWithEmailAndPassword}
            >
              Sign in
            </Button> */}
            <Button
              variant="ghost"
              className="w-full"
              size="lg"
              onClick={() => {
                setStep(SignUpStep.ForgotPassword);
              }}
            >
              I forgot my password
            </Button>
          </div>

          {/* Forgot Password */}
          <div
            className={cn(
              "w-[384px] flex-col items-center gap-4",
              step === SignUpStep.ForgotPassword ? "flex" : "hidden",
            )}
          >
            <SvgIcon
              name="astrsk_logo_full"
              width={119}
              height={28}
              className="absolute top-[30px]"
            />
            <div className="mb-[24px] text-center">
              <div className="text-fg-default mb-[8px] text-[20px] leading-[24px] font-[600]">
                Forgot password
              </div>
              <div className="text-fg-subtle text-[16px] leading-[25.6px] font-[400]">
                Enter your email address. If it&apos;s correct, we&apos;ll send
                <br />
                you an email with password reset instructions.
              </div>
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
            <Button className="w-full" size="lg" onClick={forgotPassword}>
              Continue
            </Button>
          </div>

          {/* New password */}
          <div
            className={cn(
              "w-[384px] flex-col items-center gap-4",
              step === SignUpStep.NewPassword ? "flex" : "hidden",
            )}
          >
            <SvgIcon
              name="astrsk_logo_full"
              width={119}
              height={28}
              className="absolute top-[30px]"
            />
            <div className="mb-[24px] text-center">
              <div className="text-fg-default mb-[8px] text-[20px] leading-[24px] font-[600]">
                Create new password
              </div>
              <div className="text-fg-subtle text-[16px] leading-[25.6px] font-[400]">
                Your password must be at least 8 characters long,
                <br />
                and include 1 symbol and 1 number.
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
              <div className="flex flex-row items-center gap-[4px]">
                <Check size={16} />
                <div className="text-fg-subtle text-[12px] leading-[15px] font-[400]">
                  Minimum 8 characters
                </div>
              </div>
              <div className="flex flex-row items-center gap-[4px]">
                <Check size={16} />
                <div className="text-fg-subtle text-[12px] leading-[15px] font-[400]">
                  At least one number
                </div>
              </div>
              <div className="flex flex-row items-center gap-[4px]">
                <Check size={16} />
                <div className="text-fg-subtle text-[12px] leading-[15px] font-[400]">
                  At least one symbol
                </div>
              </div>
              <div className="flex flex-row items-center gap-[4px]">
                <Check size={16} />
                <div className="text-fg-subtle text-[12px] leading-[15px] font-[400]">
                  Match password confirm
                </div>
              </div>
            </div>
            <div className="text-fg-subtle text-[16px] leading-[25.6px] font-[400]">
              Don&apos;t see a code?{" "}
              <button
                className="text-accent-primary"
                onClick={forgotPassword}
              >
                Resend to email
              </button>
            </div>
            <Button className="w-full" size="lg" onClick={resetPasswordHandler} loading={isLoading}>
              Save
            </Button>
          </div>
        </div>

        {/* Visual */}
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-[50%] px-[71px] py-[127px]",
            "bg-[url('/img/subscription/bg-signup.png')] bg-cover bg-bottom bg-no-repeat",
            "hidden",
            step === SignUpStep.SignUp && "block",
          )}
        >
          <div className="text-fg-default mb-[16px] text-[32px] leading-[40px] font-[600]">
            Customize Every Detail
          </div>
          <div className="text-fg-muted text-[20px] leading-[24px] font-[500]">
            Personalize LLMs, prompts, character, and plots to create a roleplay
            that&apos;s truly yours.
          </div>
        </div>
      </div>
    </div>
  );
};

export { SignUpPage };
