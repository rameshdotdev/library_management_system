import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { AuthHeading } from "@/components/auth/auth-fields";

export function UnauthorizedPanel() {
  return (
    <div>
      <span className="grid size-11 place-items-center rounded-lg bg-accent text-accent-foreground">
        <ShieldAlert size={21} />
      </span>
      <AuthHeading
        eyebrow="Access restricted"
        title="You can’t access this page"
        description="Your account does not have permission to view this resource. Contact your library administrator if you think you need access."
      />
      <div className="space-y-2">
        <Link
          href="/dashboard"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <ArrowLeft size={15} /> Back to dashboard
        </Link>
        <Link
          href="/login"
          className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border text-sm font-medium hover:bg-muted"
        >
          Return to sign in
        </Link>
      </div>
    </div>
  );
}
