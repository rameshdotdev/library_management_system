"use client";

import { useState } from "react";
import {
  Armchair,
  BadgeIndianRupee,
  Banknote,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  Download,
  Printer,
  Receipt,
  Search,
  UsersRound,
} from "lucide-react";
import { FinanceSummary } from "@/components/finance-shared";
import { Card } from "@/components/ui/card";
import { inputClass } from "@/components/ui/field";
import { useRooms } from "@/components/use-rooms";
import { useLibraryConfiguration } from "@/components/use-library-configuration";
import { useDemoState } from "@/components/use-demo-state";
import {
  demoExpenses,
  demoInvoices,
  expenseCategories,
  formatINR,
  getLocalDate,
  invoiceBalance,
  invoiceStatus,
  isExpenseArray,
  isInvoiceArray,
} from "@/lib/finance-management";
import {
  dateInRange,
  downloadCsv,
  reportCollections,
  reportDateRange,
  reportExpenses,
  reportInvoices,
  seatUtilization,
  type ReportPeriod,
} from "@/lib/report-management";
import { demoAssignments, isAssignmentArray } from "@/lib/seat-management";
import { demoStudents, isStudentArray } from "@/lib/student-management";

const reportTabs = [
  { id: "collections", label: "Collections" },
  { id: "dues", label: "Outstanding dues" },
  { id: "admissions", label: "Admissions" },
  { id: "seats", label: "Seat utilization" },
  { id: "expenses", label: "Expenses" },
] as const;
type ReportTab = (typeof reportTabs)[number]["id"];

function isoLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function getRangeDays(start: string, end: string) {
  if (!start || !end) return [];
  const from = new Date(`${start}T12:00:00`);
  const to = new Date(`${end}T12:00:00`);
  const dayCount = Math.min(
    45,
    Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1),
  );
  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(from);
    date.setDate(date.getDate() + index);
    return isoLocal(date);
  });
}

function TrendChart({
  title,
  subtitle,
  values,
  color = "var(--color-primary)",
}: {
  title: string;
  subtitle: string;
  values: { date: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(1, ...values.map((item) => item.value));
  const width = 620;
  const height = 150;
  const points = values.map((item, index) => ({
    x:
      values.length <= 1
        ? width / 2
        : 12 + index * ((width - 24) / (values.length - 1)),
    y: height - 12 - (item.value / max) * (height - 28),
  }));
  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
  const area = points.length
    ? `${line} L${points.at(-1)?.x},${height} L${points[0].x},${height} Z`
    : "";

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="text-xs font-medium text-primary">
          {formatINR(values.reduce((sum, item) => sum + item.value, 0))}
        </span>
      </div>
      <div className="mt-4 overflow-hidden">
        {values.some((item) => item.value > 0) ? (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`${title} chart`}
            className="h-40 w-full overflow-visible"
          >
            <line
              x1="0"
              y1={height - 12}
              x2={width}
              y2={height - 12}
              stroke="var(--color-border)"
              strokeDasharray="4 5"
            />
            <path d={area} fill={color} opacity="0.12" />
            <path
              d={line}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((point, index) => (
              <circle
                key={values[index].date}
                cx={point.x}
                cy={point.y}
                r="3"
                fill={color}
              >
                <title>{`${dateLabel(values[index].date)}: ${formatINR(values[index].value)}`}</title>
              </circle>
            ))}
          </svg>
        ) : (
          <div className="grid h-40 place-items-center text-sm text-muted-foreground">
            No activity in this date range.
          </div>
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{values[0] ? dateLabel(values[0].date) : ""}</span>
        <span>{values.at(-1) ? dateLabel(values.at(-1)!.date) : ""}</span>
      </div>
    </Card>
  );
}

function BarBreakdown({
  title,
  values,
  format = false,
}: {
  title: string;
  values: [string, number][];
  format?: boolean;
}) {
  const max = Math.max(1, ...values.map(([, amount]) => amount));
  return (
    <Card className="p-4 sm:p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {values.length ? (
          values.map(([label, amount]) => (
            <div key={label}>
              <div className="mb-1 flex justify-between gap-2 text-xs">
                <span className="truncate text-muted-foreground">{label}</span>
                <span className="shrink-0 font-medium">
                  {format ? formatINR(amount) : amount}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(2, (amount / max) * 100)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No matching data for this period.
          </p>
        )}
      </div>
    </Card>
  );
}

export function ReportsPage() {
  const { rooms } = useRooms();
  const { configuration } = useLibraryConfiguration();
  const [students] = useDemoState(
    "reading-room-students",
    demoStudents,
    isStudentArray,
  );
  const [invoices] = useDemoState(
    "reading-room-invoices",
    demoInvoices,
    isInvoiceArray,
  );
  const [expenses] = useDemoState(
    "reading-room-expenses",
    demoExpenses,
    isExpenseArray,
  );
  const [assignments] = useDemoState(
    "reading-room-assignments",
    demoAssignments,
    isAssignmentArray,
  );
  const slots = configuration.timeSlots.filter((slot) => slot.active !== false);
  const today = getLocalDate();
  const [period, setPeriod] = useState<ReportPeriod>("this-month");
  const [range, setRange] = useState(() =>
    reportDateRange("this-month", getLocalDate()),
  );
  const [roomId, setRoomId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [tab, setTab] = useState<ReportTab>("collections");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"dueOn" | "balance" | "studentName">(
    "dueOn",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const filters = {
    ...range,
    roomId,
    timeSlotId: slotId,
    paymentMethod,
    expenseCategory,
  };
  const paymentsWithStudents = students.flatMap((student) =>
    student.payments.map((payment) => ({
      student,
      payment,
      assignments: assignments.filter(
        (item) => item.studentId === student.id && item.status !== "Completed",
      ),
    })),
  );
  const collectionRows = reportCollections(paymentsWithStudents, filters);
  const expenseRows = reportExpenses(expenses, filters);
  const dues = reportInvoices(invoices, filters)
    .filter(
      (invoice) =>
        invoiceBalance(invoice) > 0 &&
        ((!roomId && !slotId) ||
          assignments.some(
            (assignment) =>
              assignment.studentId === invoice.studentId &&
              (!roomId || assignment.roomId === roomId) &&
              (!slotId || assignment.timeSlotId === slotId) &&
              assignment.startDate <= range.endDate &&
              assignment.endDate >= range.startDate,
          )),
    )
    .map((invoice) => ({
      ...invoice,
      balance: invoiceBalance(invoice),
      status: invoiceStatus(invoice, today),
      daysOverdue:
        invoice.dueOn < today
          ? Math.floor(
              (new Date(`${today}T00:00:00`).getTime() -
                new Date(`${invoice.dueOn}T00:00:00`).getTime()) /
                86_400_000,
            )
          : 0,
      memberStatus:
        students.find((student) => student.id === invoice.studentId)?.status ??
        "Unknown",
    }));
  const filteredDues = dues
    .filter(
      (invoice) =>
        !search.trim() ||
        [invoice.studentName, invoice.studentId, invoice.invoiceNumber].some(
          (value) => value.toLowerCase().includes(search.trim().toLowerCase()),
        ),
    )
    .sort((a, b) => {
      const first = a[sortBy];
      const second = b[sortBy];
      const comparison =
        typeof first === "number" && typeof second === "number"
          ? first - second
          : String(first).localeCompare(String(second));
      return sortDirection === "asc" ? comparison : -comparison;
    });
  const totalCollections = collectionRows.reduce(
    (sum, row) => sum + row.payment.amount,
    0,
  );
  const totalExpenses = expenseRows.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const outstanding = dues.reduce((sum, invoice) => sum + invoice.balance, 0);
  const admissionRows = students.filter(
    (student) =>
      dateInRange(student.joinedOn, range.startDate, range.endDate) &&
      ((!roomId && !slotId) ||
        assignments.some(
          (assignment) =>
            assignment.studentId === student.id &&
            (!roomId || assignment.roomId === roomId) &&
            (!slotId || assignment.timeSlotId === slotId),
        )),
  );
  const newAdmissions = admissionRows.length;
  const activeStudents = students.filter(
    (student) => student.status === "Active",
  ).length;
  const expiringSoon = students.filter(
    (student) =>
      student.status === "Active" &&
      student.membershipEndsOn >= today &&
      new Date(`${student.membershipEndsOn}T00:00:00`).getTime() -
        new Date(`${today}T00:00:00`).getTime() <=
        30 * 86_400_000,
  ).length;
  const utilizationAssignments = assignments.filter(
    (assignment) =>
      (!roomId || assignment.roomId === roomId) &&
      (!slotId || assignment.timeSlotId === slotId),
  );
  const utilization = seatUtilization(
    utilizationAssignments,
    roomId ? rooms.filter((room) => room.id === roomId) : rooms,
    slots,
    range.endDate || today,
  );
  const occupancyPercentage = utilization.totalSeats
    ? Math.round((utilization.occupied / utilization.totalSeats) * 100)
    : 0;
  const days = getRangeDays(range.startDate, range.endDate);
  const dailyCollections = new Map<string, number>();
  collectionRows.forEach(({ payment }) =>
    dailyCollections.set(
      payment.date,
      (dailyCollections.get(payment.date) ?? 0) + payment.amount,
    ),
  );
  const collectionTrend = days.map((date) => ({
    date,
    value: dailyCollections.get(date) ?? 0,
  }));
  const admissionsTrend = days.map((date) => ({
    date,
    value: admissionRows.filter((student) => student.joinedOn === date).length,
  }));
  const dailyExpenses = new Map<string, number>();
  expenseRows.forEach((expense) =>
    dailyExpenses.set(
      expense.date,
      (dailyExpenses.get(expense.date) ?? 0) + expense.amount,
    ),
  );
  const expenseTrend = days.map((date) => ({
    date,
    value: dailyExpenses.get(date) ?? 0,
  }));
  const methodTotals = collectionRows.reduce<Record<string, number>>(
    (totals, row) => {
      const method = row.payment.customMethod || row.payment.method;
      totals[method] = (totals[method] ?? 0) + row.payment.amount;
      return totals;
    },
    {},
  );
  const categoryTotals = expenseRows.reduce<Record<string, number>>(
    (totals, expense) => {
      const category = expense.customCategory || expense.category;
      totals[category] = (totals[category] ?? 0) + expense.amount;
      return totals;
    },
    {},
  );
  const planTotals = admissionRows.reduce<Record<string, number>>(
    (totals, student) => {
      totals[student.membershipName] =
        (totals[student.membershipName] ?? 0) + 1;
      return totals;
    },
    {},
  );

  function setPreset(next: Exclude<ReportPeriod, "custom">) {
    setPeriod(next);
    setRange(reportDateRange(next, today));
  }

  function sortDues(key: "dueOn" | "balance" | "studentName") {
    if (sortBy === key)
      setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDirection("asc");
    }
  }

  function exportCurrent() {
    if (tab === "collections") {
      downloadCsv("reading-room-collections.csv", [
        ["Date", "Student", "Student ID", "Method", "Reference", "Amount"],
        ...collectionRows.map(({ student, payment }) => [
          payment.date,
          student.name,
          student.id,
          payment.customMethod || payment.method,
          payment.reference,
          String(payment.amount),
        ]),
      ]);
    } else if (tab === "dues") {
      downloadCsv("reading-room-outstanding-dues.csv", [
        [
          "Student",
          "Student ID",
          "Invoice",
          "Amount due",
          "Due date",
          "Days overdue",
          "Membership status",
        ],
        ...filteredDues.map((invoice) => [
          invoice.studentName,
          invoice.studentId,
          invoice.invoiceNumber,
          String(invoice.balance),
          invoice.dueOn,
          String(invoice.daysOverdue),
          invoice.memberStatus,
        ]),
      ]);
    } else if (tab === "admissions") {
      downloadCsv("reading-room-admissions.csv", [
        ["Student", "Student ID", "Joined", "Membership plan", "Status"],
        ...admissionRows.map((student) => [
          student.name,
          student.id,
          student.joinedOn,
          student.membershipName,
          student.status,
        ]),
      ]);
    } else if (tab === "seats") {
      downloadCsv("reading-room-seat-utilization.csv", [
        ["Room", "Occupied", "Available", "Total"],
        ...utilization.byRoom.map((room) => [
          room.name,
          String(room.occupied),
          String(room.available),
          String(room.total),
        ]),
      ]);
    } else {
      downloadCsv("reading-room-expenses.csv", [
        [
          "Date",
          "Category",
          "Description",
          "Payment method",
          "Amount",
          "Notes",
        ],
        ...expenseRows.map((expense) => [
          expense.date,
          expense.customCategory || expense.category,
          expense.description,
          expense.customMethod || expense.method,
          String(expense.amount),
          expense.notes,
        ]),
      ]);
    }
  }

  return (
    <div className="reports-print space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Collections, occupancy, membership, and operating performance.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Demo report · calculated from this browser’s saved records
          </p>
        </div>
        <div className="report-no-print flex gap-2">
          <button
            type="button"
            onClick={exportCurrent}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
          >
            <Printer size={15} /> Print report
          </button>
        </div>
      </section>

      <Card className="report-no-print grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1fr)_140px_140px_150px_150px_150px_150px]">
        <label className="block text-xs font-medium text-muted-foreground">
          Period
          <select
            value={period}
            onChange={(event) =>
              setPreset(event.target.value as Exclude<ReportPeriod, "custom">)
            }
            className={`${inputClass} mt-1.5`}
          >
            <option value="today">Today</option>
            <option value="7-days">Last 7 days</option>
            <option value="this-month">This month</option>
            <option value="previous-month">Previous month</option>
          </select>
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          From
          <input
            type="date"
            value={range.startDate}
            onChange={(event) => {
              setPeriod("custom");
              setRange((current) => ({
                ...current,
                startDate: event.target.value,
              }));
            }}
            className={`${inputClass} mt-1.5`}
          />
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          To
          <input
            type="date"
            min={range.startDate || undefined}
            value={range.endDate}
            onChange={(event) => {
              setPeriod("custom");
              setRange((current) => ({
                ...current,
                endDate: event.target.value,
              }));
            }}
            className={`${inputClass} mt-1.5`}
          />
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          Room
          <select
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            className={`${inputClass} mt-1.5`}
          >
            <option value="">All rooms</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          Time slot
          <select
            value={slotId}
            onChange={(event) => setSlotId(event.target.value)}
            className={`${inputClass} mt-1.5`}
          >
            <option value="">All time slots</option>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-muted-foreground sm:col-span-2 lg:col-span-1">
          Payment method
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className={`${inputClass} mt-1.5`}
          >
            <option value="">All methods</option>
            {["Cash", "UPI", "Bank transfer", "Card", "Other"].map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-muted-foreground sm:col-span-2 lg:col-span-1">
          Expense category
          <select
            value={expenseCategory}
            onChange={(event) => setExpenseCategory(event.target.value)}
            className={`${inputClass} mt-1.5`}
          >
            <option value="">All categories</option>
            {expenseCategories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
      </Card>

      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Report summary"
      >
        <FinanceSummary
          label="Total collections"
          value={formatINR(totalCollections)}
          detail="Recorded payments in period"
          icon={CircleDollarSign}
        />
        <FinanceSummary
          label="Outstanding fees"
          value={formatINR(outstanding)}
          detail="Unpaid invoice balances"
          icon={Receipt}
        />
        <FinanceSummary
          label="Total expenses"
          value={formatINR(totalExpenses)}
          detail="Recorded expenses in period"
          icon={Banknote}
        />
        <FinanceSummary
          label="Net operating balance"
          value={formatINR(totalCollections - totalExpenses)}
          detail="Collections less expenses"
          icon={ChartNoAxesCombined}
        />
        <FinanceSummary
          label="New admissions"
          value={String(newAdmissions)}
          detail="Joined in selected period"
          icon={UsersRound}
        />
        <FinanceSummary
          label="Active students"
          value={String(activeStudents)}
          detail={`${students.length - activeStudents} inactive or archived`}
          icon={BadgeIndianRupee}
        />
        <FinanceSummary
          label="Seat occupancy"
          value={`${occupancyPercentage}%`}
          detail={`${utilization.occupied} of ${utilization.totalSeats} seats`}
          icon={Armchair}
        />
        <FinanceSummary
          label="Expiring soon"
          value={String(expiringSoon)}
          detail="Active memberships · next 30 days"
          icon={CalendarDays}
        />
      </section>

      <Card className="overflow-hidden">
        <div className="report-no-print flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div
            className="flex flex-wrap gap-1"
            role="tablist"
            aria-label="Report sections"
          >
            {reportTabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => {
                  setTab(item.id);
                  setSearch("");
                }}
                className={`rounded-md px-3 py-2 text-xs font-medium ${tab === item.id ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {tab === "dues" && (
            <label className="relative block w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                aria-label="Search outstanding dues"
                placeholder="Search student or invoice"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={`${inputClass} pl-9`}
              />
            </label>
          )}
        </div>

        {tab === "collections" && (
          <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
            <TrendChart
              title="Daily collection trend"
              subtitle="Recorded payment activity · INR"
              values={collectionTrend}
            />
            <BarBreakdown
              title="Collections by payment method"
              values={Object.entries(methodTotals).sort((a, b) => b[1] - a[1])}
              format
            />
          </div>
        )}

        {tab === "dues" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60 text-[11px] uppercase text-muted-foreground">
                  <th className="px-4 py-3 sm:px-5">
                    <SortButton
                      label="Student"
                      active={sortBy === "studentName"}
                      direction={sortDirection}
                      onClick={() => sortDues("studentName")}
                    />
                  </th>
                  <th className="px-4 py-3">Student ID / invoice</th>
                  <th className="px-4 py-3">
                    <SortButton
                      label="Amount due"
                      active={sortBy === "balance"}
                      direction={sortDirection}
                      onClick={() => sortDues("balance")}
                    />
                  </th>
                  <th className="px-4 py-3">
                    <SortButton
                      label="Due date"
                      active={sortBy === "dueOn"}
                      direction={sortDirection}
                      onClick={() => sortDues("dueOn")}
                    />
                  </th>
                  <th className="px-4 py-3">Overdue</th>
                  <th className="px-4 py-3">Membership</th>
                </tr>
              </thead>
              <tbody>
                {filteredDues.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3.5 font-medium sm:px-5">
                      {invoice.studentName}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block">
                        {invoice.studentId.toUpperCase()}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-medium">
                      {formatINR(invoice.balance)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {dateLabel(invoice.dueOn)}
                    </td>
                    <td className="px-4 py-3.5">
                      {invoice.daysOverdue
                        ? `${invoice.daysOverdue} days`
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5">{invoice.memberStatus}</td>
                  </tr>
                ))}
                {!filteredDues.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm text-muted-foreground"
                    >
                      No outstanding invoices in the selected range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "admissions" && (
          <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
            <TrendChart
              title="Admission trend"
              subtitle="Students joined per day"
              values={admissionsTrend}
              color="var(--color-chart-4)"
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <BarBreakdown
                title="Membership plan breakdown"
                values={Object.entries(planTotals).sort((a, b) => b[1] - a[1])}
              />
              <Card className="p-4">
                <h3 className="text-sm font-semibold">Student status mix</h3>
                <div className="mt-4 space-y-3">
                  {(["Active", "On hold", "Archived"] as const).map(
                    (status) => {
                      const count = students.filter(
                        (student) => student.status === status,
                      ).length;
                      return (
                        <div
                          key={status}
                          className="flex justify-between gap-2 text-sm"
                        >
                          <span className="text-muted-foreground">
                            {status}
                          </span>
                          <span className="font-medium">{count}</span>
                        </div>
                      );
                    },
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === "seats" && (
          <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
            <Card className="p-4 sm:p-5">
              <h3 className="text-sm font-semibold">Utilization by room</h3>
              <div className="mt-4 space-y-4">
                {utilization.byRoom.map((room) => (
                  <div key={room.name}>
                    <div className="mb-1 flex justify-between gap-2 text-xs">
                      <span className="font-medium">{room.name}</span>
                      <span className="text-muted-foreground">
                        {room.occupied} occupied · {room.available} available
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${room.total ? (room.occupied / room.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {utilization.totalSeats} total seats · {utilization.occupied}{" "}
                reserved on {dateLabel(range.endDate || today)}
              </p>
            </Card>
            <BarBreakdown
              title="Utilization by time slot"
              values={utilization.bySlot.map((slot) => [
                slot.name,
                slot.occupied,
              ])}
            />
            <Card className="p-4 sm:p-5 xl:col-span-2">
              <h3 className="text-sm font-semibold">
                Full Day versus partial-slot assignments
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <UsageMini
                  label="Full Day"
                  count={
                    utilizationAssignments.filter(
                      (item) =>
                        item.timeSlotId === "full-day" &&
                        item.startDate <= (range.endDate || today) &&
                        item.endDate >= (range.endDate || today),
                    ).length
                  }
                />
                <UsageMini
                  label="Partial slots"
                  count={
                    utilizationAssignments.filter(
                      (item) =>
                        item.timeSlotId !== "full-day" &&
                        item.startDate <= (range.endDate || today) &&
                        item.endDate >= (range.endDate || today),
                    ).length
                  }
                />
              </div>
            </Card>
          </div>
        )}

        {tab === "expenses" && (
          <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
            <div className="xl:col-span-2">
              <TrendChart
                title="Expense trend"
                subtitle="Recorded expense activity · INR"
                values={expenseTrend}
                color="var(--color-chart-3)"
              />
            </div>
            <BarBreakdown
              title="Expense category totals"
              values={Object.entries(categoryTotals).sort(
                (a, b) => b[1] - a[1],
              )}
              format
            />
            <div className="overflow-x-auto">
              <h3 className="mb-3 text-sm font-semibold">Recent expenses</h3>
              <table className="w-full min-w-130 text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase text-muted-foreground">
                    <th className="py-2">Date / category</th>
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseRows
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 8)
                    .map((expense) => (
                      <tr
                        key={expense.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="py-3 pr-3">
                          <span className="block">
                            {dateLabel(expense.date)}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {expense.customCategory || expense.category}
                          </span>
                        </td>
                        <td className="py-3 pr-3">{expense.description}</td>
                        <td className="whitespace-nowrap py-3 text-right font-medium">
                          {formatINR(expense.amount)}
                        </td>
                      </tr>
                    ))}
                  {!expenseRows.length && (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No expenses found in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
      <p className="text-xs leading-5 text-muted-foreground">
        Collections use recorded payment history, never invoice totals. Summary
        totals avoid counting invoice balances as payments. Report results are
        demo data and are not accounting statements.
      </p>
    </div>
  );
}

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 font-medium hover:text-foreground"
    >
      {label}
      <span aria-hidden="true">
        {active ? (direction === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </button>
  );
}

function UsageMini({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-muted/50 px-3.5 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{count} assignments</span>
    </div>
  );
}
