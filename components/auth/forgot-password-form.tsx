"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, MailCheck } from "lucide-react";
import {
  AuthErrorBanner,
  AuthField,
  AuthHeading,
  AuthSubmit,
  authInputClass,
  DemoModeNotice,
} from "@/components/auth/auth-fields";
import { authMode, AuthServiceError, forgotPassword } from "@/lib/auth/service";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/auth/schemas";

export function ForgotPasswordForm() {
  const [complete, setComplete] = useState(false);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function submit(values: ForgotPasswordValues) {
    setServerError("");
    try {
      await forgotPassword(values.email);
      setComplete(true);
      toast.success(
        "If an account matches, reset instructions will be available.",
      );
    } catch (error) {
      setServerError(
        error instanceof AuthServiceError
          ? error.message
          : "The reset request could not be completed.",
      );
      toast.error("Unable to request a reset link.");
    }
  }
  setServerError(
    error instanceof AuthServiceError && error.status === 0
      ? "The reset request could not be sent right now. Please try again later."
      : "The reset request could not be completed. Please try again later.",
  );
  if (complete) {
    return (
      <div>
        <span className="grid size-11 place-items-center rounded-lg bg-secondary text-primary">
          <MailCheck size={21} />
        </span>
        <AuthHeading
          eyebrow="Request received"
          title="Check your inbox"
          description="If an account exists for that email, password reset instructions will be available."
        />
        {authMode === "demo" && (
          <p className="mb-5 rounded-md border border-accent/70 bg-accent/30 p-3 text-xs leading-5 text-accent-foreground">
            Demo mode does not send email. No account lookup or reset link was
            created.
          </p>
        )}
        <Link
          href="/login"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border text-sm font-medium hover:bg-muted"
        >
          <ArrowLeft size={15} /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <AuthHeading
        eyebrow="Account recovery"
        title="Reset your password"
        description="Enter the email address associated with your reading room account."
      />
      {authMode === "demo" && (
        <div className="mb-5">
          <DemoModeNotice />
        </div>
      )}
      <form noValidate onSubmit={handleSubmit(submit)} className="space-y-4">
        <AuthField
          id="email"
          label="Email address"
          error={errors.email?.message}
        >
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={authInputClass}
            {...register("email")}
          />
        </AuthField>
        <AuthErrorBanner message={serverError} />
        <AuthSubmit loading={isSubmitting}>Send reset link</AuthSubmit>
      </form>
      <Link
        href="/login"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={15} /> Back to sign in
      </Link>
    </div>
  );
}
