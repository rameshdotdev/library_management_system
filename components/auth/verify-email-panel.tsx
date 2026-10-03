"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CircleAlert, MailCheck } from "lucide-react";
import {
  AuthField,
  AuthHeading,
  AuthSubmit,
  authInputClass,
  DemoModeNotice,
} from "@/components/auth/auth-fields";
import {
  authMode,
  AuthServiceError,
  resendVerificationEmail,
  verifyEmail,
} from "@/lib/auth/service";

type VerificationStatus = "checking" | "success" | "invalid" | "missing";

export function VerifyEmailPanel({
  token,
  initialEmail = "",
}: {
  token?: string;
  initialEmail?: string;
}) {
  const [status, setStatus] = useState<VerificationStatus>(
    token ? "checking" : "missing",
  );
  const [email, setEmail] = useState(initialEmail);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void verifyEmail(token)
      .then(() => {
        if (!cancelled) {
          setStatus("success");
          toast.success("Email address verified.");
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStatus("invalid");
          setMessage(
            error instanceof AuthServiceError
              ? error.message
              : "This verification link may be invalid or expired.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setResending(true);
    try {
      await resendVerificationEmail(email.trim());
      setMessage(
        "If this address has a pending account, a new verification email will be sent.",
      );
      toast.success("Verification request received.");
    } catch (error) {
      setMessage(
        error instanceof AuthServiceError
          ? error.message
          : "The request could not be completed.",
      );
      toast.error("Verification email was not sent.");
    } finally {
      setResending(false);
    }
  }

  if (status === "checking")
    return (
      <div className="py-8 text-center">
        <div className="mx-auto size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="mt-4 text-sm text-muted-foreground">
          Verifying your email…
        </p>
      </div>
    );
  if (status === "success")
    return (
      <div>
        <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
          <MailCheck size={21} />
        </span>
        <AuthHeading
          eyebrow="Email verified"
          title="You’re all set"
          description="Your email address was verified. Sign in to continue to your workspace."
        />
        <Link
          href="/login"
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Return to sign in
        </Link>
      </div>
    );

  return (
    <div>
      <span className="grid size-11 place-items-center rounded-lg bg-secondary text-primary">
        {status === "invalid" ? (
          <CircleAlert size={21} />
        ) : (
          <MailCheck size={21} />
        )}
      </span>
      <AuthHeading
        eyebrow={
          status === "invalid" ? "Link unavailable" : "Verify your email"
        }
        title={
          status === "invalid"
            ? "This link couldn’t be verified"
            : "One step before your workspace"
        }
        description={
          status === "invalid"
            ? "The verification link may be expired or already used. Request a new one to continue."
            : "Email verification is required before a production account can continue."
        }
      />
      {authMode === "demo" && (
        <div className="mb-4">
          <DemoModeNotice />
        </div>
      )}
      {status === "invalid" && message && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs leading-5 text-destructive"
        >
          {message}
        </p>
      )}
      <form onSubmit={resend} className="space-y-3">
        <AuthField id="verification-email" label="Email address">
          <input
            id="verification-email"
            required
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={authInputClass}
            placeholder="you@example.com"
          />
        </AuthField>
        <AuthSubmit loading={resending}>Resend verification email</AuthSubmit>
      </form>
      {message && status !== "invalid" && (
        <p
          role="status"
          className="mt-3 text-xs leading-5 text-muted-foreground"
        >
          {message}
        </p>
      )}
      <Link
        href="/login"
        className="mt-5 inline-flex w-full justify-center text-sm font-medium text-primary hover:underline"
      >
        Return to sign in
      </Link>
    </div>
  );
}
