"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthErrorBanner, AuthField, AuthHeading, AuthSubmit, authInputClass, DemoModeNotice, PasswordField } from "@/components/auth/auth-fields";
import { authMode, AuthServiceError, getCurrentUser, login } from "@/lib/auth/service";
import { safeReturnUrl } from "@/lib/auth/return-url";
import { loginSchema, type LoginValues } from "@/lib/auth/schemas";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = safeReturnUrl(searchParams.get("returnTo"));
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  useEffect(() => {
    let cancelled = false;
    void getCurrentUser().then((user) => {
      if (user && !cancelled) router.replace(destination);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [destination, router]);

  async function submit(values: LoginValues) {
    setServerError("");
    try {
      await login(values);
      toast.success(authMode === "demo" ? "Development demo session started." : "Signed in.");
      router.replace(destination);
      router.refresh();
    } catch (error) {
      if (error instanceof AuthServiceError) {
        Object.entries(error.fieldErrors ?? {}).forEach(([field, message]) => {
          if (field === "email" || field === "password") setError(field, { message });
        });
        setServerError(error.message);
      } else {
        setServerError("Sign in could not be completed. Please try again.");
      }
      toast.error("Unable to sign in.");
    }
  }

  return (
    <div>
      <AuthHeading eyebrow="Welcome back" title="Sign in to your workspace" description="Manage your reading room, memberships, and daily operations." />
      {authMode === "demo" && <div className="mb-5"><DemoModeNotice /></div>}
      <form noValidate onSubmit={handleSubmit(submit)} className="space-y-4">
        <AuthField id="email" label="Email address" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" inputMode="email" placeholder="you@yourreadingroom.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} className={authInputClass} {...register("email")} />
        </AuthField>
        <AuthField id="password" label="Password" error={errors.password?.message}>
          <PasswordField id="password" registration={register("password")} error={errors.password?.message} placeholder="Enter your password" />
        </AuthField>
        <div className="flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" {...register("rememberMe")} className="size-4 accent-primary" /> Keep me signed in</label>
          <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
        </div>
        <AuthErrorBanner message={serverError} />
        <AuthSubmit loading={isSubmitting}>Sign in</AuthSubmit>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">New to Reading Room Manager? <Link href="/register" className="font-semibold text-primary hover:underline">Create an account</Link></p>
    </div>
  );
}