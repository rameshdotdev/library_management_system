"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUser } from "@/lib/auth/service";

const publicPaths = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/unauthorized",
]);

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (publicPaths.has(pathname)) return children;
  return <ProtectedDashboard>{children}</ProtectedDashboard>;
}

function ProtectedDashboard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionUnavailable, setSessionUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getCurrentUser()
      .then((user) => {
        if (!cancelled) setAuthenticated(Boolean(user));
      })
      .catch(() => {
        if (!cancelled) setSessionUnavailable(true);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (checking || authenticated || sessionUnavailable) return;
    const returnTo = `${pathname}${window.location.search}`;
    router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }, [authenticated, checking, pathname, router, sessionUnavailable]);

  if (checking || !authenticated) {
    if (!checking && sessionUnavailable) {
      return (
        <div className="grid min-h-dvh place-items-center bg-background px-5 text-center">
          <div className="max-w-sm">
            <p className="text-sm font-semibold">Session check unavailable</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The authentication service could not be reached. Your session has
              not been changed.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Continue to sign in
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-5 text-sm text-muted-foreground">
        Checking your session…
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
