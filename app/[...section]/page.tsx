import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AdmissionsPage } from "@/components/admissions-page";
import { ExpensesPage } from "@/components/expenses-page";
import { FeesPaymentsPage } from "@/components/fees-payments-page";
import { MembershipsPage } from "@/components/memberships-page";
import { ReportsPage } from "@/components/reports-page";
import { RoomsSeatsPage } from "@/components/rooms-seats-page";
import { SeatAssignmentsPage } from "@/components/seat-assignments-page";
import { SettingsPage } from "@/components/settings-page";
import { StaffPage } from "@/components/staff-page";
import { SubscriptionPage } from "@/components/subscription-page";
import { StudentDetailsPage, StudentsPage } from "@/components/students-page";
import { TimeSlotsPage } from "@/components/time-slots-page";

const pageNames: Record<string, string> = {
  students: "Students",
  admissions: "Admissions",
  "rooms-seats": "Rooms & Seats",
  "seat-assignments": "Seat Assignments",
  "time-slots": "Time Slots",
  memberships: "Memberships",
  "fees-payments": "Fees & Payments",
  expenses: "Expenses",
  reports: "Reports",
  staff: "Staff",
  settings: "Settings",
  subscription: "Subscription",
};

export default async function PlaceholderPage({
  params,
}: PageProps<"/[...section]">) {
  const { section } = await params;
  const slug = section.join("/");
  const title = pageNames[slug] ?? "Page";

  if (slug === "rooms-seats") return <RoomsSeatsPage />;
  if (slug === "seat-assignments") return <SeatAssignmentsPage />;
  if (slug === "time-slots") return <TimeSlotsPage />;
  if (slug === "students") return <StudentsPage />;
  if (slug === "admissions") return <AdmissionsPage />;
  if (slug === "memberships") return <MembershipsPage />;
  if (slug === "fees-payments") return <FeesPaymentsPage />;
  if (slug === "expenses") return <ExpensesPage />;
  if (slug === "reports") return <ReportsPage />;
  if (slug === "staff") return <StaffPage />;
  if (slug === "settings") return <SettingsPage />;
  if (slug === "subscription") return <SubscriptionPage />;
  if (section[0] === "students" && section[1]) {
    return <StudentDetailsPage studentId={section[1]} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <p className="text-sm text-muted-foreground">Workspace / {title}</p>
      </div>
      <Card className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-xl bg-secondary text-primary">
          <Construction aria-hidden="true" size={22} />
        </span>
        <h2 className="mt-5 text-xl font-semibold">{title}</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          This section is ready for setup. Its management tools will appear here
          as the workspace grows.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <ArrowLeft aria-hidden="true" size={15} /> Back to dashboard
        </Link>
      </Card>
    </div>
  );
}
