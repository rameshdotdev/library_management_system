"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  CalendarClock,
  CircleAlert,
  Clock3,
  Search,
  UsersRound,
} from "lucide-react";
import {
  FinanceSummary,
  Pagination,
  localDateMatch,
} from "@/components/finance-shared";
import { Card } from "@/components/ui/card";
import { Field, inputClass } from "@/components/ui/field";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { useDemoState } from "@/components/use-demo-state";
import {
  demoInvoices,
  formatINR,
  isInvoiceArray,
  membershipCharge,
  type Invoice,
} from "@/lib/finance-management";
import {
  demoStudents,
  isStudentArray,
  membershipPlans,
  type Student,
} from "@/lib/student-management";

const pageSize = 6;
const durationOptions = [1, 3, 6, 12];

function todayValue() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function addMonthsClamped(value: string, months: number) {
  const [year, month, day] = value.split("-").map(Number);
  const target = new Date(year, month - 1 + months, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  target.setDate(Math.min(day, lastDay));
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(value: string, today: string) {
  return Math.ceil(
    (new Date(`${value}T00:00:00`).getTime() -
      new Date(`${today}T00:00:00`).getTime()) /
      86_400_000,
  );
}

function renewalState(student: Student, today: string) {
  if (student.status === "Archived") return "Archived";
  const days = daysUntil(student.membershipEndsOn, today);
  if (days < 0) return "Expired";
  if (days <= 30) return "Expiring soon";
  return "Active";
}

function stateStyle(state: string) {
  if (state === "Expired") return "bg-destructive/10 text-destructive";
  if (state === "Expiring soon") return "bg-accent text-accent-foreground";
  if (state === "Archived") return "bg-muted text-muted-foreground";
  return "bg-primary/10 text-primary";
}

function RenewalDialog({
  student,
  onCancel,
  onConfirm,
}: {
  student: Student;
  onCancel: () => void;
  onConfirm: (planId: string, months: number) => void;
}) {
  const [planId, setPlanId] = useState(
    membershipPlans.find((plan) => plan.name === student.membershipName)?.id ??
      membershipPlans[0].id,
  );
  const [months, setMonths] = useState(1);
  const plan =
    membershipPlans.find((item) => item.id === planId) ?? membershipPlans[0];
  const amount = membershipCharge(plan.monthlyPrice, months);

  return (
    <div className="fixed inset-0 z-70 grid place-items-center overflow-y-auto bg-foreground/40 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="renew-title"
        className="my-auto w-full max-w-md rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl"
      >
        <h2 id="renew-title" className="text-lg font-semibold">
          Renew membership
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {student.name} · current expiry {formatDate(student.membershipEndsOn)}
        </p>
        <div className="mt-5 space-y-4">
          <Field label="Plan">
            <select
              value={planId}
              onChange={(event) => setPlanId(event.target.value)}
              className={inputClass}
            >
              {membershipPlans.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {formatINR(item.monthlyPrice)}/month
                </option>
              ))}
            </select>
          </Field>
          <Field label="Renewal duration">
            <select
              value={months}
              onChange={(event) => setMonths(Number(event.target.value))}
              className={inputClass}
            >
              {durationOptions.map((item) => (
                <option key={item} value={item}>
                  {item} month{item === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </Field>
          <div className="rounded-md bg-muted/60 px-3.5 py-3 text-sm">
            <span className="text-muted-foreground">Invoice amount</span>
            <strong className="float-right">{formatINR(amount)}</strong>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Renewal creates a pending demo invoice. Record a payment separately
            in Fees &amp; Payments.
          </p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-md border border-border px-3.5 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(planId, months)}
            className="h-9 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Renew &amp; create invoice
          </button>
        </div>
      </section>
    </div>
  );
}

export function MembershipsPage() {
  const [students, setStudents] = useDemoState(
    "reading-room-students",
    demoStudents,
    isStudentArray,
  );
  const [invoices, setInvoices] = useDemoState(
    "reading-room-invoices",
    demoInvoices,
    isInvoiceArray,
  );
  const { toast, showToast, dismissToast } = useToast();
  const today = todayValue();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All memberships");
  const [planFilter, setPlanFilter] = useState("All plans");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [renewStudent, setRenewStudent] = useState<Student | null>(null);

  const members = useMemo(
    () =>
      students.filter((student) => {
        const currentState = renewalState(student, today);
        const term = query.trim().toLowerCase();
        return (
          (!term ||
            [student.name, student.email, student.id].some((value) =>
              value.toLowerCase().includes(term),
            )) &&
          (status === "All memberships" || currentState === status) &&
          (planFilter === "All plans" ||
            student.membershipName === planFilter) &&
          localDateMatch(student.membershipEndsOn, fromDate, toDate)
        );
      }),
    [fromDate, planFilter, query, status, students, toDate, today],
  );
  const pageCount = Math.max(1, Math.ceil(members.length / pageSize));
  const pageMembers = members.slice((page - 1) * pageSize, page * pageSize);
  const activeCount = students.filter(
    (student) => renewalState(student, today) === "Active",
  ).length;
  const expiringCount = students.filter(
    (student) => renewalState(student, today) === "Expiring soon",
  ).length;
  const expiredCount = students.filter(
    (student) => renewalState(student, today) === "Expired",
  ).length;

  function renew(planId: string, months: number) {
    if (!renewStudent) return;
    const plan = membershipPlans.find((item) => item.id === planId);
    if (!plan) {
      showToast("Select a valid membership plan.", "error");
      return;
    }
    const today = todayValue();
    const start =
      renewStudent.membershipEndsOn >= today
        ? shiftDate(renewStudent.membershipEndsOn, 1)
        : today;
    const end = shiftDate(addMonthsClamped(start, months), -1);
    const invoice: Invoice = {
      id: `inv-${String(invoices.length + 1).padStart(3, "0")}`,
      invoiceNumber: `RR-${today.slice(0, 4)}-${String(1000 + invoices.length + 1).slice(-4)}`,
      studentId: renewStudent.id,
      studentName: renewStudent.name,
      issuedOn: today,
      dueOn: shiftDate(today, 7),
      period: `${plan.name} renewal · ${months} month${months === 1 ? "" : "s"}`,
      amount: membershipCharge(plan.monthlyPrice, months),
      paidAmount: 0,
    };
    setStudents((current) =>
      current.map((student) =>
        student.id === renewStudent.id
          ? {
              ...student,
              membershipName: plan.name,
              membershipEndsOn: end,
              monthlyFee: plan.monthlyPrice,
              status: "Active",
            }
          : student,
      ),
    );
    setInvoices((current) => [invoice, ...current]);
    showToast(
      `Membership renewed. Demo invoice ${invoice.invoiceNumber} is pending.`,
      "success",
    );
    setRenewStudent(null);
  }

  function resetFilters() {
    setQuery("");
    setStatus("All memberships");
    setPlanFilter("All plans");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Membership plans, renewals, and upcoming expiries.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Demo membership records · saved in this browser
          </p>
        </div>
        <Link
          href="/fees-payments"
          className="text-sm font-medium text-primary hover:underline"
        >
          View invoices and payments
        </Link>
      </section>

      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Membership summary"
      >
        <FinanceSummary
          label="Current memberships"
          value={String(activeCount)}
          detail="More than 30 days remaining"
          icon={UsersRound}
        />
        <FinanceSummary
          label="Expiring soon"
          value={String(expiringCount)}
          detail="Within the next 30 days"
          icon={CalendarClock}
        />
        <FinanceSummary
          label="Expired memberships"
          value={String(expiredCount)}
          detail="Renewal recommended"
          icon={CircleAlert}
        />
        <FinanceSummary
          label="Available plans"
          value={String(membershipPlans.length)}
          detail="Monthly billing · renew for 1–12 months"
          icon={BadgeIndianRupee}
        />
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Membership plans</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Pricing is per month; renewal duration is selected per student.
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {membershipPlans.map((plan) => (
            <Card key={plan.id} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plan.description}
                  </p>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                  <BadgeIndianRupee size={17} />
                </span>
              </div>
              <p className="mt-5 text-2xl font-semibold">
                {formatINR(plan.monthlyPrice)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  / month
                </span>
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock3 size={14} /> Billing duration: 1 month, renewable for 3,
                6, or 12 months
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">Member renewals</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Expiry indicators are calculated from each membership end date.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {members.length} records
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(200px,1fr)_160px_160px_145px_145px_auto]">
            <label className="relative block">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                aria-label="Search members"
                placeholder="Search name or email"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                className={`${inputClass} pl-9`}
              />
            </label>
            <select
              aria-label="Filter membership status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option>All memberships</option>
              <option>Active</option>
              <option>Expiring soon</option>
              <option>Expired</option>
              <option>Archived</option>
            </select>
            <select
              aria-label="Filter membership plan"
              value={planFilter}
              onChange={(event) => {
                setPlanFilter(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option>All plans</option>
              {membershipPlans.map((plan) => (
                <option key={plan.id}>{plan.name}</option>
              ))}
            </select>
            <input
              type="date"
              aria-label="Expiry from date"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            />
            <input
              type="date"
              aria-label="Expiry to date"
              min={fromDate || undefined}
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            />
            <button
              type="button"
              onClick={resetFilters}
              className="h-10 rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-[11px] font-medium uppercase text-muted-foreground">
                <th className="px-4 py-3 sm:px-5">Student</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Monthly price</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Indicator</th>
                <th className="px-4 py-3 text-right sm:pr-5">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageMembers.map((student) => {
                const state = renewalState(student, today);
                const remaining = daysUntil(student.membershipEndsOn, today);
                return (
                  <tr
                    key={student.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3.5 sm:px-5">
                      <Link
                        href={`/students/${student.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {student.name}
                      </Link>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {student.email}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">{student.membershipName}</td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {formatINR(student.monthlyFee)}
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        / mo
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                      {formatDate(student.membershipEndsOn)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${stateStyle(state)}`}
                      >
                        {state === "Expiring soon"
                          ? `Expires in ${remaining} days`
                          : state}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right sm:pr-5">
                      <button
                        type="button"
                        disabled={student.status === "Archived"}
                        onClick={() => setRenewStudent(student)}
                        className="h-8 rounded-md border border-border px-3 text-xs font-medium hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Renew
                      </button>
                    </td>
                  </tr>
                );
              })}
              {pageMembers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    No members match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageCount={pageCount}
          total={members.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </Card>

      {renewStudent && (
        <RenewalDialog
          student={renewStudent}
          onCancel={() => setRenewStudent(null)}
          onConfirm={renew}
        />
      )}
      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
