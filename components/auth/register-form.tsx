"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthErrorBanner, AuthField, AuthHeading, AuthSubmit, authInputClass, DemoModeNotice, PasswordField } from "@/components/auth/auth-fields";
import { authMode, AuthServiceError, register } from "@/lib/auth/service";
import { registrationSchema, type RegistrationValues } from "@/lib/auth/schemas";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const { register: bind, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { fullName: "", libraryName: "", email: "", phone: "", password: "", confirmPassword: "", acceptTerms: false },
  });

  async function submit(values: RegistrationValues) {
    setServerError("");
    try {
      const result = await register({ fullName: values.fullName, libraryName: values.libraryName, email: values.email, phone: values.phone, password: values.password });
      if (result.nextStep === "verify-email") {
        router.push("/verify-email");
      } else if (result.nextStep === "dashboard") {
        router.replace("/dashboard");
        router.refresh();
      } else {
        setNeedsOnboarding(true);
      }
      toast.success(authMode === "demo" ? "Demo registration flow prepared." : "Registration request received.");
    } catch (error) {
      if (error instanceof AuthServiceError) {
        Object.entries(error.fieldErrors ?? {}).forEach(([field, message]) => {
          if (["fullName", "libraryName", "email", "phone", "password"].includes(field)) {
            setError(field as "fullName" | "libraryName" | "email" | "phone" | "password", { message });
          }
        });
        setServerError(error.message);
      } else {
        setServerError("Registration could not be completed. Please try again.");
      }
      toast.error("Unable to create the library account.");
    }
  }

  if (needsOnboarding) {
    return <div className="space-y-4"><AuthHeading eyebrow="Next step" title="Your setup is ready to continue" description="Your account request needs library onboarding before workspace access." /><div className="rounded-md border border-accent/70 bg-accent/30 p-3 text-sm leading-6 text-accent-foreground">Creating an account does not mean that a tenant has been approved or a subscription activated.</div><Link href="/login" className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">Return to sign in</Link></div>;
  }

  return (
    <div>
      <AuthHeading eyebrow="Create a library workspace" title="Start with your reading room" description="Register as the Library Director. Account approval and subscription activation are separate steps." />
      {authMode === "demo" && <div className="mb-5"><DemoModeNotice /></div>}
      <form noValidate onSubmit={handleSubmit(submit)} className="space-y-3.5">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <AuthField id="fullName" label="Full name" error={errors.fullName?.message}><input id="fullName" autoComplete="name" aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? "fullName-error" : undefined} className={authInputClass} placeholder="Your name" {...bind("fullName")} /></AuthField>
          <AuthField id="libraryName" label="Library / reading room" error={errors.libraryName?.message}><input id="libraryName" autoComplete="organization" aria-invalid={Boolean(errors.libraryName)} aria-describedby={errors.libraryName ? "libraryName-error" : undefined} className={authInputClass} placeholder="Your reading room" {...bind("libraryName")} /></AuthField>
          <AuthField id="email" label="Email address" error={errors.email?.message}><input id="email" type="email" inputMode="email" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} className={authInputClass} placeholder="you@example.com" {...bind("email")} /></AuthField>
          <AuthField id="phone" label="Phone number" error={errors.phone?.message}><input id="phone" type="tel" inputMode="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "phone-error" : undefined} className={authInputClass} placeholder="+91 98765 43210" {...bind("phone")} /></AuthField>
          <AuthField id="password" label="Password" error={errors.password?.message}><PasswordField id="password" registration={bind("password")} autoComplete="new-password" /></AuthField>
          <AuthField id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}><PasswordField id="confirmPassword" registration={bind("confirmPassword")} autoComplete="new-password" placeholder="Enter it again" error={errors.confirmPassword?.message} /></AuthField>
        </div>
        <p className="text-[11px] leading-5 text-muted-foreground">Use at least 8 characters with uppercase, lowercase, and a number.</p>
        <label className="flex items-start gap-2.5 py-1 text-xs leading-5 text-muted-foreground"><input type="checkbox" aria-invalid={Boolean(errors.acceptTerms)} {...bind("acceptTerms")} className="mt-0.5 size-4 shrink-0 accent-primary" /><span>I agree to the Terms of Service and Privacy Policy.</span></label>
        {errors.acceptTerms?.message && <p role="alert" className="text-xs text-destructive">{errors.acceptTerms.message}</p>}
        <AuthErrorBanner message={serverError} />
        <AuthSubmit loading={isSubmitting}>Create library account</AuthSubmit>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">Already have a workspace? <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link></p>
    </div>
  );
}