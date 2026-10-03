"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  AuthErrorBanner,
  AuthField,
  AuthHeading,
  AuthSubmit,
  DemoModeNotice,
  PasswordField,
} from "@/components/auth/auth-fields";
import { authMode, AuthServiceError, resetPassword } from "@/lib/auth/service";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/auth/schemas";

export function ResetPasswordForm({ token }: { token?: string }) {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function submit(values: ResetPasswordValues) {
    setServerError("");
    if (!token) {
      setServerError(
        "This reset link is missing its token. Request a new link to continue.",
      );
      return;
    }
    try {
      await resetPassword(token, values.password);
      setSuccess(true);
      toast.success("Password reset completed.");
    } catch (error) {
      setServerError(
        error instanceof AuthServiceError
          ? error.message
          : "This reset link may be invalid or expired.",
      );
      toast.error("Password reset could not be completed.");
    }
  }

  if (success)
    return (
      <div>
        <AuthHeading
          eyebrow="Password updated"
          title="You’re ready to sign in"
          description="Your password has been updated by the authentication service."
        />
        <Link
          href="/login"
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Continue to sign in
        </Link>
      </div>
    );

  return (
    <div>
      <AuthHeading
        eyebrow="Secure your account"
        title="Choose a new password"
        description="Use at least 8 characters with uppercase, lowercase, and a number."
      />
      {authMode === "demo" && (
        <div className="mb-5">
          <DemoModeNotice />
        </div>
      )}
      <form noValidate onSubmit={handleSubmit(submit)} className="space-y-4">
        <AuthField
          id="new-password"
          label="New password"
          error={errors.password?.message}
        >
          <PasswordField
            id="new-password"
            registration={register("password")}
            autoComplete="new-password"
            error={errors.password?.message}
          />
        </AuthField>
        <AuthField
          id="confirm-password"
          label="Confirm new password"
          error={errors.confirmPassword?.message}
        >
          <PasswordField
            id="confirm-password"
            registration={register("confirmPassword")}
            autoComplete="new-password"
            placeholder="Enter it again"
            error={errors.confirmPassword?.message}
          />
        </AuthField>
        <AuthErrorBanner message={serverError} />
        {token ? (
          <AuthSubmit loading={isSubmitting}>Update password</AuthSubmit>
        ) : (
          <Link
            href="/forgot-password"
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Request a new reset link
          </Link>
        )}
      </form>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
