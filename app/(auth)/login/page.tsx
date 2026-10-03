import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return <Suspense fallback={<div className="py-10 text-sm text-muted-foreground">Loading sign in…</div>}><LoginForm /></Suspense>;
}