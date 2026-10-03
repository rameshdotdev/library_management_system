"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CalendarDays,
  Check,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Eye,
  Printer,
  Search,
  WalletCards,
} from "lucide-react";
import {
  FinanceSummary,
  InvoiceStatusBadge,
  Pagination,
  localDateMatch,
} from "@/components/finance-shared";
import { Card } from "@/components/ui/card";
import { Field, inputClass } from "@/components/ui/field";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { useDemoState } from "@/components/use-demo-state";
import {
  demoExpenses,
  demoInvoices,
  expenseSummary,
  formatINR,
  getLocalDate,
  invoiceBalance,
  invoiceStatus,
  invoiceSummary,
  isExpenseArray,
  isInvoiceArray,
  paymentMethods,
  type Invoice,
} from "@/lib/finance-management";
import {
  demoStudents,
  isStudentArray,
  type PaymentMethod,
  type PaymentRecord,
  type Student,
} from "@/lib/student-management";

const pageSize = 6;

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function nextPaymentId(students: Student[]) {
  const ids = students
    .flatMap((student) => student.payments)
    .map((payment) => payment.id);
  const last = ids.reduce((max, id) => {
    const number = Number(id.replace("pay-", ""));
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);
  return `pay-${String(last + 1).padStart(3, "0")}`;
}

function methodLabel(payment: PaymentRecord) {
  return payment.customMethod || payment.method;
}

type PaymentDraft = {
  amount: string;
  date: string;
  method: PaymentMethod;
  customMethod: string;
  notes: string;
};

function RecordPaymentDialog({
  invoice,
  onCancel,
  onSave,
}: {
  invoice: Invoice;
  onCancel: () => void;
  onSave: (draft: PaymentDraft) => void;
}) {
  const [draft, setDraft] = useState<PaymentDraft>({
    amount: String(invoiceBalance(invoice)),
    date: getLocalDate(),
    method: "UPI",
    customMethod: "",
    notes: "",
  });
  const outstanding = invoiceBalance(invoice);
  const amount = Number(draft.amount);
  const invalid =
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > outstanding ||
    !draft.date ||
    (draft.method === "Other" && !draft.customMethod.trim());

  return (
    <div className="fixed inset-0 z-70 grid place-items-center overflow-y-auto bg-foreground/40 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-dialog-title"
        className="my-auto w-full max-w-lg rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="payment-dialog-title" className="text-lg font-semibold">
              Record manual payment
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {invoice.studentName} · {invoice.invoiceNumber}
            </p>
          </div>
          <span className="grid size-9 place-items-center rounded-lg bg-secondary text-primary">
            <Banknote size={18} />
          </span>
        </div>
        <div className="mt-4 flex justify-between rounded-md bg-muted/60 px-3.5 py-3 text-sm">
          <span className="text-muted-foreground">Outstanding balance</span>
          <strong>{formatINR(outstanding)}</strong>
        </div>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!invalid) onSave(draft);
          }}
        >
          <Field label="Amount received (₹)">
            <input
              autoFocus
              required
              type="number"
              min="1"
              max={outstanding}
              step="1"
              value={draft.amount}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>
          <Field label="Payment date">
            <input
              required
              type="date"
              max={getLocalDate()}
              value={draft.date}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  date: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>
          <Field label="Payment method" className="sm:col-span-2">
            <select
              value={draft.method}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  method: event.target.value as PaymentMethod,
                }))
              }
              className={inputClass}
            >
              {paymentMethods.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
          </Field>
          {draft.method === "Other" && (
            <Field label="Method name" className="sm:col-span-2">
              <input
                required
                value={draft.customMethod}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    customMethod: event.target.value,
                  }))
                }
                className={inputClass}
                placeholder="e.g. Cheque, wallet"
              />
            </Field>
          )}
          <Field label="Note / reference" className="sm:col-span-2">
            <input
              value={draft.notes}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              className={inputClass}
              placeholder="Optional transaction reference"
            />
          </Field>
          <p className="rounded-md border border-accent/70 bg-accent/30 p-3 text-xs leading-5 text-accent-foreground sm:col-span-2">
            Demo transaction only. This records a local example and does not
            process or verify a real payment.
          </p>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={onCancel}
              className="h-9 rounded-md border border-border px-3.5 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={invalid}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={15} /> Save demo payment
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ReceiptDialog({
  student,
  payment,
  invoice,
  onClose,
}: {
  student: Student;
  payment: PaymentRecord;
  invoice?: Invoice;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-70 grid place-items-center overflow-y-auto bg-foreground/50 p-4 receipt-overlay">
      <article className="receipt-print my-auto w-full max-w-lg rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl sm:p-7">
        <div className="receipt-no-print mb-5 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Receipt preview</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
            >
              <Printer size={15} /> Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
            >
              Close
            </button>
          </div>
        </div>
        <div className="border-b border-dashed border-border pb-5 text-center">
          <span className="mx-auto grid size-10 place-items-center rounded-lg bg-secondary text-primary receipt-no-print">
            <WalletCards size={18} />
          </span>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-primary">
            Reading Room Management
          </p>
          <h3 className="mt-1 text-xl font-semibold">Payment receipt</h3>
          <p className="mt-2 text-[11px] font-semibold uppercase text-destructive">
            Demo transaction · not proof of real payment
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 py-5 text-sm">
          <ReceiptLine label="Receipt reference" value={payment.reference} />
          <ReceiptLine label="Date" value={formatDate(payment.date)} />
          <ReceiptLine label="Received from" value={student.name} />
          <ReceiptLine label="Student ID" value={student.id.toUpperCase()} />
          <ReceiptLine
            label="Invoice"
            value={
              payment.invoiceNumber ??
              invoice?.invoiceNumber ??
              "Membership payment"
            }
          />
          <ReceiptLine label="Method" value={methodLabel(payment)} />
          <ReceiptLine label="Description" value={payment.description} />
          {payment.notes && <ReceiptLine label="Note" value={payment.notes} />}
        </dl>
        <div className="flex justify-between border-y border-border py-4 text-base font-semibold">
          <span>Amount recorded</span>
          <span>{formatINR(payment.amount)}</span>
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
          This locally stored demo receipt does not confirm that funds were
          transferred or received.
        </p>
      </article>
    </div>
  );
}

function ReceiptLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-1 wrap-break-word text-sm font-medium">{value}</dd>
    </div>
  );
}

export function FeesPaymentsPage() {
  const [invoices, setInvoices] = useDemoState(
    "reading-room-invoices",
    demoInvoices,
    isInvoiceArray,
  );
  const [students, setStudents] = useDemoState(
    "reading-room-students",
    demoStudents,
    isStudentArray,
  );
  const [expenses] = useDemoState(
    "reading-room-expenses",
    demoExpenses,
    isExpenseArray,
  );
  const { toast, showToast, dismissToast } = useToast();
  const [tab, setTab] = useState<"invoices" | "payments">("invoices");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [recordFor, setRecordFor] = useState<Invoice | null>(null);
  const [receipt, setReceipt] = useState<{
    student: Student;
    payment: PaymentRecord;
    invoice?: Invoice;
  } | null>(null);
  const summary = invoiceSummary(invoices, getLocalDate());
  const expensesTotal = expenseSummary(expenses).total;

  const filteredInvoices = useMemo(
    () =>
      invoices.filter((invoice) => {
        const term = search.trim().toLowerCase();
        return (
          (!term ||
            [invoice.invoiceNumber, invoice.studentName, invoice.period].some(
              (value) => value.toLowerCase().includes(term),
            )) &&
          (statusFilter === "All statuses" ||
            invoiceStatus(invoice, getLocalDate()) === statusFilter) &&
          localDateMatch(invoice.issuedOn, fromDate, toDate)
        );
      }),
    [fromDate, invoices, search, statusFilter, toDate],
  );

  const paymentRows = useMemo(
    () =>
      students
        .flatMap((student) =>
          student.payments.map((payment) => {
            const invoice = invoices.find(
              (item) =>
                item.studentId === student.id &&
                (payment.invoiceNumber === item.invoiceNumber ||
                  payment.description.includes(item.period)),
            );
            return { student, payment, invoice };
          }),
        )
        .filter(({ student, payment }) => {
          const term = search.trim().toLowerCase();
          return (
            (!term ||
              [
                student.name,
                student.email,
                payment.reference,
                payment.description,
                methodLabel(payment),
              ].some((value) => value.toLowerCase().includes(term))) &&
            localDateMatch(payment.date, fromDate, toDate)
          );
        })
        .sort((a, b) => b.payment.date.localeCompare(a.payment.date)),
    [fromDate, invoices, search, students, toDate],
  );

  const rowsCount =
    tab === "invoices" ? filteredInvoices.length : paymentRows.length;
  const pageCount = Math.max(1, Math.ceil(rowsCount / pageSize));
  const visibleInvoices = filteredInvoices.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const visiblePayments = paymentRows.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  function changeTab(value: "invoices" | "payments") {
    setTab(value);
    setPage(1);
    setStatusFilter("All statuses");
  }

  function savePayment(draft: PaymentDraft) {
    if (!recordFor) return;
    const currentInvoice = invoices.find(
      (invoice) => invoice.id === recordFor.id,
    );
    const amount = Number(draft.amount);
    if (
      !currentInvoice ||
      amount <= 0 ||
      amount > invoiceBalance(currentInvoice)
    ) {
      showToast(
        "Payment amount must be within the current outstanding balance.",
        "error",
      );
      return;
    }
    const student = students.find(
      (item) => item.id === currentInvoice.studentId,
    );
    if (!student) {
      showToast("The student linked to this invoice was not found.", "error");
      return;
    }
    const paymentId = nextPaymentId(students);
    const nextPaymentNumber = paymentId.replace("pay-", "");
    const payment: PaymentRecord = {
      id: paymentId,
      date: draft.date,
      amount,
      method: draft.method,
      ...(draft.method === "Other"
        ? { customMethod: draft.customMethod.trim() }
        : {}),
      reference: `DEMO-RCPT-${nextPaymentNumber}`,
      invoiceNumber: currentInvoice.invoiceNumber,
      description: currentInvoice.period,
      notes: draft.notes.trim(),
    };
    setInvoices((current) =>
      current.map((invoice) =>
        invoice.id === currentInvoice.id
          ? {
              ...invoice,
              paidAmount: Math.min(invoice.amount, invoice.paidAmount + amount),
            }
          : invoice,
      ),
    );
    setStudents((current) =>
      current.map((item) =>
        item.id === student.id
          ? { ...item, payments: [payment, ...item.payments] }
          : item,
      ),
    );
    setRecordFor(null);
    showToast(
      "Demo payment saved locally. No real payment was processed.",
      "success",
    );
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("All statuses");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Track invoices, outstanding balances, and locally recorded payments.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            All transactions shown are demo data; no real payment is processed.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">
          <CalendarDays size={14} /> Updated{" "}
          {new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </section>

      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Finance summary"
      >
        <FinanceSummary
          label="Collected"
          value={formatINR(summary.collected)}
          detail="From listed invoices"
          icon={CircleDollarSign}
        />
        <FinanceSummary
          label="Outstanding"
          value={formatINR(summary.outstanding)}
          detail="Remaining invoice balances"
          icon={ClipboardList}
        />
        <FinanceSummary
          label="Overdue balance"
          value={formatINR(summary.overdue)}
          detail={`${summary.overdueCount} overdue invoices`}
          icon={CalendarDays}
        />
        <FinanceSummary
          label="Expenses recorded"
          value={formatINR(expensesTotal)}
          detail="All demo expense entries"
          icon={CreditCard}
        />
      </section>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Fees &amp; payments</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {tab === "invoices"
                  ? "Manage member invoices and outstanding amounts."
                  : "Review payment history and open demo receipts."}
              </p>
            </div>
            <div
              className="inline-flex rounded-md border border-border bg-background p-1"
              role="tablist"
              aria-label="Finance records"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === "invoices"}
                onClick={() => changeTab("invoices")}
                className={`h-8 rounded px-3 text-xs font-medium ${tab === "invoices" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Invoices
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "payments"}
                onClick={() => changeTab("payments")}
                className={`h-8 rounded px-3 text-xs font-medium ${tab === "payments" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Payment history
              </button>
            </div>
          </div>
          <div
            className={`grid gap-2 sm:grid-cols-2 ${tab === "invoices" ? "lg:grid-cols-[minmax(220px,1fr)_170px_150px_150px_auto]" : "lg:grid-cols-[minmax(220px,1fr)_150px_150px_auto]"}`}
          >
            <label className="relative block">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                aria-label={
                  tab === "invoices"
                    ? "Search invoices"
                    : "Search payment history"
                }
                placeholder={
                  tab === "invoices"
                    ? "Search invoice or student"
                    : "Search student or reference"
                }
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className={`${inputClass} pl-9`}
              />
            </label>
            {tab === "invoices" && (
              <select
                aria-label="Filter invoice status"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className={inputClass}
              >
                <option>All statuses</option>
                <option>Paid</option>
                <option>Partially paid</option>
                <option>Pending</option>
                <option>Overdue</option>
              </select>
            )}
            <input
              type="date"
              aria-label="Date from"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            />
            <input
              type="date"
              aria-label="Date to"
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

        {tab === "invoices" ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-220 text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-[11px] font-medium uppercase text-muted-foreground">
                    <th className="px-4 py-3 sm:px-5">Invoice / student</th>
                    <th className="px-4 py-3">Issued / due</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right sm:pr-5">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleInvoices.map((invoice) => {
                    const state = invoiceStatus(invoice, getLocalDate());
                    return (
                      <tr
                        key={invoice.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3.5 sm:px-5">
                          <span className="block font-medium">
                            {invoice.invoiceNumber}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {invoice.studentName} · {invoice.period}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <span className="block text-xs">
                            {formatDate(invoice.issuedOn)}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            Due {formatDate(invoice.dueOn)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          {formatINR(invoice.amount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 font-medium">
                          {formatINR(invoiceBalance(invoice))}
                        </td>
                        <td className="px-4 py-3.5">
                          <InvoiceStatusBadge status={state} />
                        </td>
                        <td className="px-4 py-3.5 text-right sm:pr-5">
                          {invoiceBalance(invoice) > 0 ? (
                            <button
                              type="button"
                              onClick={() => setRecordFor(invoice)}
                              className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
                            >
                              Record payment
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!visibleInvoices.length && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-sm text-muted-foreground"
                      >
                        No invoices match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageCount={pageCount}
              total={filteredInvoices.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-[11px] font-medium uppercase text-muted-foreground">
                    <th className="px-4 py-3 sm:px-5">Student / receipt</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right sm:pr-5">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePayments.map(({ student, payment, invoice }) => (
                    <tr
                      key={payment.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3.5 sm:px-5">
                        <span className="block font-medium">
                          {student.name}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {payment.reference} · demo
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                        {formatDate(payment.date)}
                      </td>
                      <td className="px-4 py-3.5">{methodLabel(payment)}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {payment.invoiceNumber ??
                          invoice?.invoiceNumber ??
                          payment.description}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium">
                        {formatINR(payment.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-right sm:pr-5">
                        <button
                          type="button"
                          onClick={() =>
                            setReceipt({ student, payment, invoice })
                          }
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium hover:bg-muted"
                        >
                          <Eye size={14} /> Preview
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!visiblePayments.length && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-sm text-muted-foreground"
                      >
                        No payment records match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageCount={pageCount}
              total={paymentRows.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      {recordFor && (
        <RecordPaymentDialog
          invoice={recordFor}
          onCancel={() => setRecordFor(null)}
          onSave={savePayment}
        />
      )}
      {receipt && (
        <ReceiptDialog {...receipt} onClose={() => setReceipt(null)} />
      )}
      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
