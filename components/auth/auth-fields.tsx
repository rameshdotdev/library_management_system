"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";

export function AuthHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-7">
      <p className="text-xs font-semibold uppercase text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export function AuthField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium">{label}</label>
      {children}
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export const authInputClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

export function PasswordField({
  id,
  registration,
  placeholder = "At least 8 characters",
  autoComplete = "current-password",
  error,
}: {
  id: string;
  registration: UseFormRegisterReturn;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${authInputClass} pr-11`}
        {...registration}
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

export function AuthSubmit({
  children,
  loading,
}: {
  children: ReactNode;
  loading: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading && <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />}
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function AuthErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">{message}</p>;
}

export function DemoModeNotice() {
  return <p className="rounded-md border border-accent/70 bg-accent/30 px-3 py-2.5 text-xs leading-5 text-accent-foreground">Development demo mode: no credentials are verified, no email is sent, and no real account or session is created.</p>;
}