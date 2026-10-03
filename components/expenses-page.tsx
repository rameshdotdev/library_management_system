"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Banknote,
  CalendarDays,
  CircleDollarSign,
  FilePlus2,
  Search,
  Wallet,
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
  demoExpenses,
  expenseCategories,
  expenseTotalForMonth,
  expenseSummary,
  formatINR,
  getLocalDate,
  isExpenseArray,
  largestExpense,
  paymentMethods,
  type Expense,
  type ExpenseCategory,
} from "@/lib/finance-management";
import type { PaymentMethod } from "@/lib/student-management";

const pageSize = 6;

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function nextExpenseId(expenses: Expense[]) {
  const largest = expenses.reduce((max, expense) => {
    const value = Number(expense.id.replace("exp-", ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `exp-${String(largest + 1).padStart(3, "0")}`;
}

type ExpenseDraft = {
  category: ExpenseCategory;
  customCategory: string;
  description: string;
  amount: string;
  date: string;
  method: PaymentMethod;
  customMethod: string;
  notes: string;
};

function ExpenseDialog({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (draft: ExpenseDraft) => void;
}) {
  const [draft, setDraft] = useState<ExpenseDraft>({
    category: "Utilities",
    customCategory: "",
    description: "",
    amount: "",
    date: getLocalDate(),
    method: "UPI",
    customMethod: "",
    notes: "",
  });
  const invalid =
    !draft.description.trim() ||
    !Number.isFinite(Number(draft.amount)) ||
    Number(draft.amount) <= 0 ||
    !draft.date ||
    (draft.category === "Other" && !draft.customCategory.trim()) ||
    (draft.method === "Other" && !draft.customMethod.trim());

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invalid) onSave(draft);
  }

  return (
    <div className="fixed inset-0 z-70 grid place-items-center overflow-y-auto bg-foreground/40 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-title"
        className="my-auto w-full max-w-xl rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="expense-title" className="text-lg font-semibold">
              Record expense
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add an expense to this browser’s demo ledger.
            </p>
          </div>
          <span className="grid size-9 place-items-center rounded-lg bg-secondary text-primary">
            <Wallet size={17} />
          </span>
        </div>
        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select
              value={draft.category}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  category: event.target.value as ExpenseCategory,
                }))
              }
              className={inputClass}
            >
              {expenseCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </Field>
          <Field label="Date">
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
          {draft.category === "Other" && (
            <Field label="Category name">
              <input
                required
                value={draft.customCategory}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    customCategory: event.target.value,
                  }))
                }
                className={inputClass}
                placeholder="e.g. Water delivery"
              />
            </Field>
          )}
          <Field
            label="Description"
            className={
              draft.category === "Other" ? "sm:col-span-2" : "sm:col-span-2"
            }
          >
            <input
              required
              maxLength={100}
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className={inputClass}
              placeholder="What was this expense for?"
            />
          </Field>
          <Field label="Amount (₹)">
            <input
              required
              type="number"
              min="1"
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
          <Field label="Payment method">
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
          <Field label="Notes" className="sm:col-span-2">
            <textarea
              rows={3}
              value={draft.notes}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              className={`${inputClass} h-auto min-h-20 resize-y py-2.5`}
              placeholder="Optional details"
            />
          </Field>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Demo record only. This does not initiate or verify a payment.
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
              <FilePlus2 size={15} /> Save expense
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function ExpensesPage() {
  const [expenses, setExpenses] = useDemoState(
    "reading-room-expenses",
    demoExpenses,
    isExpenseArray,
  );
  const { toast, showToast, dismissToast } = useToast();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [method, setMethod] = useState("All methods");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const summary = expenseSummary(expenses);
  const today = getLocalDate();
  const monthTotal = expenseTotalForMonth(expenses, today.slice(0, 7));
  const largest = largestExpense(expenses);
  const filtered = useMemo(
    () =>
      expenses
        .filter((expense) => {
          const term = query.trim().toLowerCase();
          return (
            (!term ||
              [
                expense.description,
                expense.category,
                expense.customCategory ?? "",
                expense.notes,
              ].some((value) => value.toLowerCase().includes(term))) &&
            (category === "All categories" || expense.category === category) &&
            (method === "All methods" || expense.method === method) &&
            localDateMatch(expense.date, fromDate, toDate)
          );
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [category, expenses, fromDate, method, query, toDate],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  function saveExpense(draft: ExpenseDraft) {
    const amount = Number(draft.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Enter an expense amount greater than zero.", "error");
      return;
    }
    const expense: Expense = {
      id: nextExpenseId(expenses),
      category: draft.category,
      ...(draft.category === "Other"
        ? { customCategory: draft.customCategory.trim() }
        : {}),
      description: draft.description.trim(),
      amount,
      date: draft.date,
      method: draft.method,
      ...(draft.method === "Other"
        ? { customMethod: draft.customMethod.trim() }
        : {}),
      notes: draft.notes.trim(),
    };
    setExpenses((current) => [expense, ...current]);
    setPage(1);
    setDialogOpen(false);
    showToast("Demo expense saved locally.", "success");
  }

  function resetFilters() {
    setQuery("");
    setCategory("All categories");
    setMethod("All methods");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Record and review operating expenses by category, date, and payment
            method.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Demo ledger · no real transactions are initiated
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <FilePlus2 size={16} /> Record expense
        </button>
      </section>

      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Expense summary"
      >
        <FinanceSummary
          label="Total expenses"
          value={formatINR(summary.total)}
          detail="All local demo entries"
          icon={CircleDollarSign}
        />
        <FinanceSummary
          label="This month"
          value={formatINR(monthTotal)}
          detail={new Date(`${today}T00:00:00`).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          })}
          icon={CalendarDays}
        />
        <FinanceSummary
          label="Expense entries"
          value={String(summary.count)}
          detail="Across all categories"
          icon={Wallet}
        />
        <FinanceSummary
          label="Largest expense"
          value={largest ? formatINR(largest.amount) : formatINR(0)}
          detail={largest?.description ?? "No expenses recorded"}
          icon={Banknote}
        />
      </section>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">Expense ledger</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {filtered.length} matching entries
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays size={14} /> Search by date range
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(200px,1fr)_155px_155px_145px_145px_auto]">
            <label className="relative block">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                aria-label="Search expenses"
                placeholder="Search description or notes"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                className={`${inputClass} pl-9`}
              />
            </label>
            <select
              aria-label="Filter expense category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option>All categories</option>
              {expenseCategories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              aria-label="Filter payment method"
              value={method}
              onChange={(event) => {
                setMethod(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option>All methods</option>
              {paymentMethods.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <input
              type="date"
              aria-label="Expense from date"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            />
            <input
              type="date"
              aria-label="Expense to date"
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
                <th className="px-4 py-3 sm:px-5">Expense</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-right sm:pr-5">Amount</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3.5 sm:px-5">
                    <span className="block font-medium">
                      {expense.description}
                    </span>
                    <span className="mt-1 block max-w-sm truncate text-xs text-muted-foreground">
                      {expense.notes || "No note"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="block">
                      {expense.category === "Other"
                        ? (expense.customCategory ?? "Other")
                        : expense.category}
                    </span>
                    {expense.category === "Other" && (
                      <span className="mt-1 block text-[10px] text-muted-foreground">
                        Other
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-4 py-3.5">
                    {expense.customMethod ?? expense.method}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium sm:pr-5">
                    {formatINR(expense.amount)}
                  </td>
                </tr>
              ))}
              {!visible.length && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    No expenses match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageCount={pageCount}
          total={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </Card>

      {dialogOpen && (
        <ExpenseDialog
          onCancel={() => setDialogOpen(false)}
          onSave={saveExpense}
        />
      )}
      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
