import type { Expense, Invoice } from "@/lib/finance-management";
import type { SeatAssignment, Room, TimeSlot } from "@/lib/seat-management";
import type { Student, PaymentRecord } from "@/lib/student-management";

export type ReportPeriod =
  | "today"
  | "7-days"
  | "this-month"
  | "previous-month"
  | "custom";

export type ReportFilters = {
  startDate: string;
  endDate: string;
  roomId: string;
  timeSlotId: string;
  paymentMethod: string;
  expenseCategory?: string;
};

export type ReportPayment = {
  student: Student;
  payment: PaymentRecord;
  assignments?: SeatAssignment[];
};

export function reportDateRange(
  period: Exclude<ReportPeriod, "custom">,
  today: string,
) {
  const date = new Date(`${today}T12:00:00`);
  if (period === "today") return { startDate: today, endDate: today };
  if (period === "7-days") {
    date.setDate(date.getDate() - 6);
    return { startDate: date.toISOString().slice(0, 10), endDate: today };
  }
  if (period === "previous-month") {
    const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const end = new Date(date.getFullYear(), date.getMonth(), 0);
    return { startDate: isoLocalDate(start), endDate: isoLocalDate(end) };
  }
  return {
    startDate: isoLocalDate(new Date(date.getFullYear(), date.getMonth(), 1)),
    endDate: today,
  };
}

function isoLocalDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function dateInRange(value: string, startDate: string, endDate: string) {
  return (!startDate || value >= startDate) && (!endDate || value <= endDate);
}

export function reportCollections(
  payments: ReportPayment[],
  filters: ReportFilters,
) {
  return payments.filter(
    ({ payment, assignments }) =>
      dateInRange(payment.date, filters.startDate, filters.endDate) &&
      (!filters.paymentMethod || payment.method === filters.paymentMethod) &&
      (!filters.roomId && !filters.timeSlotId || assignments?.some((assignment) =>
        (!filters.roomId || assignment.roomId === filters.roomId) &&
        (!filters.timeSlotId || assignment.timeSlotId === filters.timeSlotId),
      )),
  );
}

export function reportExpenses(expenses: Expense[], filters: ReportFilters) {
  return expenses.filter(
    (expense) =>
      dateInRange(expense.date, filters.startDate, filters.endDate) &&
      (!filters.expenseCategory || expense.category === filters.expenseCategory) &&
      (!filters.paymentMethod || expense.method === filters.paymentMethod),
  );
}

export function reportInvoices(invoices: Invoice[], filters: ReportFilters) {
  return invoices.filter((invoice) =>
    dateInRange(invoice.dueOn, filters.startDate, filters.endDate),
  );
}

export function dailyTotals<T>(
  values: T[],
  getDate: (value: T) => string,
  getAmount: (value: T) => number,
) {
  const totals = new Map<string, number>();
  values.forEach((value) => {
    const date = getDate(value);
    totals.set(date, (totals.get(date) ?? 0) + getAmount(value));
  });
  return Array.from(totals, ([date, amount]) => ({ date, amount })).sort(
    (a, b) => a.date.localeCompare(b.date),
  );
}

export function collectionMethodTotals(payments: ReportPayment[]) {
  return payments.reduce<Record<string, number>>((totals, { payment }) => {
    const method = payment.customMethod || payment.method;
    totals[method] = (totals[method] ?? 0) + payment.amount;
    return totals;
  }, {});
}

export function expenseCategoryTotals(expenses: Expense[]) {
  return expenses.reduce<Record<string, number>>((totals, expense) => {
    const category = expense.customCategory || expense.category;
    totals[category] = (totals[category] ?? 0) + expense.amount;
    return totals;
  }, {});
}

export function seatUtilization(
  assignments: SeatAssignment[],
  rooms: Room[],
  slots: TimeSlot[],
  date: string,
) {
  const active = assignments.filter(
    (assignment) =>
      assignment.startDate <= date &&
      assignment.endDate >= date &&
      assignment.status !== "Completed",
  );
  const byRoom = rooms.map((room) => {
    const occupiedSeats = new Set(
      active
        .filter((assignment) => assignment.roomId === room.id)
        .map((assignment) => assignment.seatNumber),
    ).size;
    return {
      name: room.name,
      occupied: occupiedSeats,
      available: Math.max(0, room.capacity - occupiedSeats),
      total: room.capacity,
    };
  });
  const bySlot = slots.map((slot) => {
    const occupiedSeats = new Set(
      active
        .filter((assignment) => assignment.timeSlotId === slot.id)
        .map((assignment) => `${assignment.roomId}:${assignment.seatNumber}`),
    ).size;
    return { name: slot.name, occupied: occupiedSeats };
  });
  const totalSeats = rooms.reduce((total, room) => total + room.capacity, 0);
  const occupied = new Set(
    active
      .filter((assignment) => rooms.some((room) => room.id === assignment.roomId))
      .map((assignment) => `${assignment.roomId}:${assignment.seatNumber}`),
  ).size;
  return {
    totalSeats,
    occupied: Math.min(totalSeats, occupied),
    available: Math.max(0, totalSeats - occupied),
    byRoom,
    bySlot,
  };
}

export function downloadCsv(filename: string, rows: string[][]) {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const csv = rows.map((row) => row.map(escape).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function isReportPeriod(value: string): value is ReportPeriod {
  return ["today", "7-days", "this-month", "previous-month", "custom"].includes(
    value,
  );
}
