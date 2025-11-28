import { useState } from "react";
import { Shield } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/ui/forms/button";
import { Input } from "@/shared/ui/input";
import { AuthLayout, AuthBadge, PasswordChecklist } from "./ui";
import { PasswordInputRHF } from "@/shared/ui/forms";

// --- Types ---
interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

// --- Main Page ---
export function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  const onSubmit = (_data: SignUpFormData) => {
    setIsLoading(true);
    // TODO: Implement actual sign up logic

    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <AuthLayout>
      {/* Badge */}
      <AuthBadge icon={Shield} text="Privacy-First Architecture" />

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-fg-default mb-2 text-3xl font-extrabold tracking-tight">
          Create your account
        </h1>
        <p className="text-fg-subtle text-sm">
          We'll send a verification link to your email.
        </p>
      </div>

      {/* Sign Up Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-fg-subtle block text-xs font-medium"
          >
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            className={`bg-surface-raised h-11 rounded-xl ${errors.email ? "border-status-error" : ""}`}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: "Please enter a valid email address.",
              },
            })}
          />
          {errors.email && (
            <p className="text-status-error flex items-center gap-1 text-xs">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-fg-subtle block text-xs font-medium"
          >
            Password
          </label>
          <PasswordInputRHF<SignUpFormData>
            id="password"
            name="password"
            register={register}
            error={errors.password?.message}
            rules={{
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters long",
              },
            }}
          />
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-fg-subtle block text-xs font-medium"
          >
            Confirm Password
          </label>
          <PasswordInputRHF<SignUpFormData>
            id="confirmPassword"
            name="confirmPassword"
            register={register}
            error={errors.confirmPassword?.message}
            rules={{
              required: "Please confirm your password",
              validate: (value) =>
                value === password || "Passwords do not match",
            }}
          />
          {errors.confirmPassword && (
            <p className="text-status-error flex items-center gap-1 text-xs">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Password Requirements Checklist */}
        <PasswordChecklist
          password={password ?? ""}
          confirmPassword={confirmPassword ?? ""}
        />

        {/* Terms Notice */}
        <p className="text-fg-subtle text-xs leading-relaxed">
          By continuing, you agree to our{" "}
          <Link
            to="/settings/legal/terms-of-service"
            className="text-fg-muted hover:text-brand-400 underline underline-offset-2 transition-colors"
          >
            Terms of Use
          </Link>{" "}
          and{" "}
          <Link
            to="/settings/legal/privacy-policy"
            className="text-fg-muted hover:text-brand-400 underline underline-offset-2 transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <Button
          type="submit"
          size="lg"
          loading={isLoading}
          className="shadow-brand-600/20 w-full font-semibold shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
        >
          Create Account
        </Button>
      </form>

      {/* Sign In Prompt */}
      <div className="text-fg-subtle mt-8 text-center text-sm">
        Already have an account?{" "}
        <Link
          to="/sign-in"
          className="text-fg-default decoration-border-muted hover:text-brand-400 font-semibold underline underline-offset-4 transition-all"
        >
          Log in
        </Link>
      </div>
    </AuthLayout>
  );
}
