import type { PaymentMethod } from "@/lib/student-management";

export type InvoiceStatus = "Paid" | "Partially paid" | "Pending" | "Overdue";

export type Invoice = {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  issuedOn: string;
  dueOn: string;
  period: string;
  amount: number;
  paidAmount: number;
};

export type ExpenseCategory =
  | "Rent"
  | "Utilities"
  | "Supplies"
  | "Salaries"
  | "Maintenance"
  | "Other";

export type Expense = {
  id: string;
  category: ExpenseCategory;
  customCategory?: string;
  description: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  customMethod?: string;
  notes: string;
};

export const paymentMethods: PaymentMethod[] = [
  "Cash",
  "UPI",
  "Bank transfer",
  "Card",
  "Other",
];

export const expenseCategories: ExpenseCategory[] = [
  "Rent",
  "Utilities",
  "Supplies",
  "Salaries",
  "Maintenance",
  "Other",
];

export const demoInvoices: Invoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "RR-2026-1042",
    studentId: "stu-001",
    studentName: "Aarav Sharma",
    issuedOn: "2026-10-01",
    dueOn: "2026-10-05",
    period: "October 2026 membership",
    amount: 1800,
    paidAmount: 1800,
  },
  {
    id: "inv-002",
    invoiceNumber: "RR-2026-1043",
    studentId: "stu-002",
    studentName: "Priya Kapoor",
    issuedOn: "2026-10-02",
    dueOn: "2026-10-05",
    period: "October 2026 membership",
    amount: 2400,
    paidAmount: 1200,
  },
  {
    id: "inv-003",
    invoiceNumber: "RR-2026-1031",
    studentId: "stu-003",
    studentName: "Rohan Verma",
    issuedOn: "2026-09-01",
    dueOn: "2026-09-05",
    period: "September 2026 membership",
    amount: 3200,
    paidAmount: 0,
  },
  {
    id: "inv-004",
    invoiceNumber: "RR-2026-1044",
    studentId: "stu-004",
    studentName: "Sana Nair",
    issuedOn: "2026-10-02",
    dueOn: "2026-10-10",
    period: "October 2026 membership",
    amount: 1800,
    paidAmount: 0,
  },
  {
    id: "inv-005",
    invoiceNumber: "RR-2026-1045",
    studentId: "stu-005",
    studentName: "Dev Mehta",
    issuedOn: "2026-10-03",
    dueOn: "2026-10-03",
    period: "October 2026 membership",
    amount: 2400,
    paidAmount: 2400,
  },
  {
    id: "inv-006",
    invoiceNumber: "RR-2026-1029",
    studentId: "stu-006",
    studentName: "Anaya Iyer",
    issuedOn: "2026-09-01",
    dueOn: "2026-09-30",
    period: "September 2026 membership",
    amount: 1800,
    paidAmount: 0,
  },
  {
    id: "inv-007",
    invoiceNumber: "RR-2026-1046",
    studentId: "stu-007",
    studentName: "Kabir Shah",
    issuedOn: "2026-10-03",
    dueOn: "2026-10-08",
    period: "October 2026 membership",
    amount: 3200,
    paidAmount: 0,
  },
  {
    id: "inv-008",
    invoiceNumber: "RR-2026-1017",
    studentId: "stu-008",
    studentName: "Meera Joshi",
    issuedOn: "2026-08-01",
    dueOn: "2026-08-05",
    period: "August 2026 membership",
    amount: 1800,
    paidAmount: 1800,
  },
];

export const demoExpenses: Expense[] = [
  {
    id: "exp-001",
    category: "Rent",
    description: "Reading room premises · October",
    amount: 42000,
    date: "2026-10-01",
    method: "Bank transfer",
    notes: "Monthly premises rent",
  },
  {
    id: "exp-002",
    category: "Utilities",
    description: "Electricity and internet",
    amount: 6840,
    date: "2026-10-02",
    method: "UPI",
    notes: "September usage",
  },
  {
    id: "exp-003",
    category: "Supplies",
    description: "Study lamps and stationery",
    amount: 3275,
    date: "2026-10-02",
    method: "Card",
    notes: "Front desk supplies",
  },
  {
    id: "exp-004",
    category: "Maintenance",
    description: "Air conditioning service",
    amount: 2400,
    date: "2026-09-28",
    method: "Cash",
    notes: "North Wing unit",
  },
  {
    id: "exp-005",
    category: "Salaries",
    description: "Evening shift · September",
    amount: 18500,
    date: "2026-09-30",
    method: "Bank transfer",
    notes: "Staff payroll",
  },
  {
    id: "exp-006",
    category: "Other",
    customCategory: "Water delivery",
    description: "Drinking water cans",
    amount: 960,
    date: "2026-09-26",
    method: "Cash",
    notes: "Weekly delivery",
  },
];

export function getLocalDate(value = new Date()) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function invoiceBalance(
  invoice: Pick<Invoice, "amount" | "paidAmount">,
) {
  return Math.max(0, invoice.amount - invoice.paidAmount);
}

export function invoiceStatus(
  invoice: Invoice,
  today = getLocalDate(),
): InvoiceStatus {
  if (invoice.paidAmount >= invoice.amount) return "Paid";
  if (invoice.dueOn < today && invoiceBalance(invoice) > 0) return "Overdue";
  if (invoice.paidAmount > 0) return "Partially paid";
  return "Pending";
}

export function invoiceSummary(invoices: Invoice[], today = getLocalDate()) {
  return invoices.reduce(
    (summary, invoice) => {
      summary.invoiced += invoice.amount;
      summary.collected += Math.min(invoice.paidAmount, invoice.amount);
      summary.outstanding += invoiceBalance(invoice);
      if (invoiceStatus(invoice, today) === "Overdue") {
        summary.overdue += invoiceBalance(invoice);
        summary.overdueCount += 1;
      }
      if (invoiceStatus(invoice, today) === "Paid") summary.paidCount += 1;
      return summary;
    },
    {
      invoiced: 0,
      collected: 0,
      outstanding: 0,
      overdue: 0,
      overdueCount: 0,
      paidCount: 0,
    },
  );
}

export function expenseSummary(expenses: Expense[]) {
  return expenses.reduce(
    (summary, expense) => {
      summary.total += expense.amount;
      summary.count += 1;
      return summary;
    },
    { total: 0, count: 0 },
  );
}

export function membershipCharge(monthlyPrice: number, durationMonths: number) {
  return Math.max(0, monthlyPrice) * Math.max(0, Math.floor(durationMonths));
}

export function expenseTotalForMonth(expenses: Expense[], month: string) {
  return expenses.reduce(
    (total, expense) =>
      total + (expense.date.slice(0, 7) === month ? expense.amount : 0),
    0,
  );
}

export function largestExpense(expenses: Expense[]) {
  return expenses.reduce<Expense | null>(
    (largest, expense) =>
      !largest || expense.amount > largest.amount ? expense : largest,
    null,
  );
}

export function isInvoiceArray(value: unknown): value is Invoice[] {
  return (
    Array.isArray(value) &&
    value.every(
      (invoice) =>
        typeof invoice?.id === "string" &&
        typeof invoice?.invoiceNumber === "string" &&
        typeof invoice?.studentId === "string" &&
        typeof invoice?.studentName === "string" &&
        typeof invoice?.issuedOn === "string" &&
        typeof invoice?.dueOn === "string" &&
        typeof invoice?.period === "string" &&
        typeof invoice?.amount === "number" &&
        typeof invoice?.paidAmount === "number",
    )
  );
}

export function isExpenseArray(value: unknown): value is Expense[] {
  return (
    Array.isArray(value) &&
    value.every(
      (expense) =>
        typeof expense?.id === "string" &&
        typeof expense?.category === "string" &&
        typeof expense?.description === "string" &&
        typeof expense?.amount === "number" &&
        typeof expense?.date === "string" &&
        typeof expense?.method === "string" &&
        typeof expense?.notes === "string",
    )
  );
}
