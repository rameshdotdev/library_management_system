"use client";

import { useState } from "react";
import {
  BadgeCheck,
  CalendarClock,
  Check,
  CircleAlert,
  CreditCard,
  Crown,
  Download,
  HardDrive,
  UsersRound,
  X,
} from "lucide-react";
import { FinanceSummary } from "@/components/finance-shared";
import { Card } from "@/components/ui/card";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { useDemoState } from "@/components/use-demo-state";
import { formatINR, getLocalDate } from "@/lib/finance-management";
import {
  demoSubscription,
  demoSubscriptionInvoices,
  isSubscription,
  isSubscriptionInvoiceArray,
  subscriptionPlans,
  subscriptionPrice,
  type BillingInterval,
  type Subscription,
  type SubscriptionInvoice,
  type SubscriptionPlan,
} from "@/lib/subscription-management";

function dateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function addBillingInterval(date: string, interval: BillingInterval) {
  const value = new Date(`${date}T12:00:00`);
  value.setMonth(value.getMonth() + (interval === "Annual" ? 12 : 1));
  return value.toISOString().slice(0, 10);
}

function statusStyle(status: Subscription["status"]) {
  if (status === "Active") return "bg-primary/10 text-primary";
  if (status === "Trial") return "bg-secondary text-secondary-foreground";
  if (status === "Canceled" || status === "Suspended")
    return "bg-muted text-muted-foreground";
  return "bg-destructive/10 text-destructive";
}

function UsageMeter({
  label,
  used,
  maximum,
  icon: Icon,
}: {
  label: string;
  used: number;
  maximum: number;
  icon: typeof UsersRound;
}) {
  const percent = maximum > 0 ? Math.round((used / maximum) * 100) : 0;
  const nearLimit = percent >= 85;
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-primary" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {used} / {maximum}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${nearLimit ? "bg-accent-foreground" : "bg-primary"}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <p
        className={`mt-2 text-xs ${nearLimit ? "text-accent-foreground" : "text-muted-foreground"}`}
      >
        {percent >= 100
          ? "Plan limit reached"
          : nearLimit
            ? "Approaching plan limit"
            : `${Math.max(0, maximum - used)} remaining`}
      </p>
    </div>
  );
}

function ActionConfirm({
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-70 grid place-items-center bg-foreground/40 p-4">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="subscription-confirm-title"
        className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl"
      >
        <h2 id="subscription-confirm-title" className="text-base font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function InvoicePreview({
  invoice,
  onClose,
}: {
  invoice: SubscriptionInvoice;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-70 grid place-items-center overflow-y-auto bg-foreground/40 p-4">
      <article className="receipt-print my-auto w-full max-w-md rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase text-primary">
              Reading Room Management · Demo
            </p>
            <h2 className="mt-1 text-lg font-semibold">Subscription invoice</h2>
          </div>
          <button
            type="button"
            aria-label="Close invoice preview"
            onClick={onClose}
            className="receipt-no-print grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <X size={16} />
          </button>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <InvoiceField label="Invoice number" value={invoice.invoiceNumber} />
          <InvoiceField label="Date" value={dateLabel(invoice.date)} />
          <InvoiceField label="Plan" value={invoice.planName} />
          <InvoiceField label="Billing interval" value={invoice.interval} />
          <InvoiceField label="Status" value={invoice.status} />
        </dl>
        <div className="mt-5 flex justify-between border-y border-border py-4 text-base font-semibold">
          <span>Demo amount</span>
          <span>{formatINR(invoice.amount)}</span>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          This sample invoice is for demonstration only. No subscription charge
          or payment was processed.
        </p>
        <div className="receipt-no-print mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Download size={14} /> Print preview
          </button>
        </div>
      </article>
    </div>
  );
}

function InvoiceField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-1 wrap-break-word text-sm font-medium">{value}</dd>
    </div>
  );
}

type PendingAction =
  | { kind: "plan"; plan: SubscriptionPlan }
  | { kind: "cancel" | "reactivate" | "renew" };

export function SubscriptionPage() {
  const [subscription, setSubscription] = useDemoState(
    "reading-room-subscription",
    demoSubscription,
    isSubscription,
  );
  const [invoices, setInvoices] = useDemoState(
    "reading-room-subscription-invoices",
    demoSubscriptionInvoices,
    isSubscriptionInvoiceArray,
  );
  const { toast, showToast, dismissToast } = useToast();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [invoicePreview, setInvoicePreview] =
    useState<SubscriptionInvoice | null>(null);
  const interval = subscription.interval;
  const currentPlan =
    subscriptionPlans.find((plan) => plan.id === subscription.planId) ??
    subscriptionPlans[1];
  const currentPrice = subscriptionPrice(currentPlan, interval);
  const trialDays = subscription.trialEndsOn
    ? Math.ceil(
        (new Date(`${subscription.trialEndsOn}T00:00:00`).getTime() -
          new Date(`${getLocalDate()}T00:00:00`).getTime()) /
          86_400_000,
      )
    : null;

  function setBillingInterval(value: BillingInterval) {
    setSubscription((current) => ({ ...current, interval: value }));
    showToast(
      `Billing interval set to ${value.toLowerCase()} in demo data.`,
      "success",
    );
  }

  function performAction() {
    if (!pendingAction) return;
    const today = getLocalDate();
    if (pendingAction.kind === "plan") {
      const changed = pendingAction.plan;
      setSubscription((current) => ({ ...current, planId: changed.id }));
      showToast(
        `${changed.name} plan selected as a simulated demo change. No charge was made.`,
        "success",
      );
    } else if (pendingAction.kind === "cancel") {
      setSubscription((current) => ({ ...current, status: "Canceled" }));
      showToast(
        "Subscription marked canceled in demo state. No live subscription was changed.",
        "success",
      );
    } else if (pendingAction.kind === "reactivate") {
      setSubscription((current) => ({ ...current, status: "Active" }));
      showToast(
        "Subscription marked active in demo state. No billing was processed.",
        "success",
      );
    } else {
      const plan =
        subscriptionPlans.find((item) => item.id === subscription.planId) ??
        currentPlan;
      const invoice: SubscriptionInvoice = {
        id: `sub-inv-${String(invoices.length + 1).padStart(3, "0")}`,
        invoiceNumber: `SUB-${today.slice(0, 4)}-${String(invoices.length + 1).padStart(3, "0")}`,
        date: today,
        planName: plan.name,
        interval: subscription.interval,
        amount: subscriptionPrice(plan, subscription.interval),
        status: "Pending",
      };
      setInvoices((current) => [invoice, ...current]);
      setSubscription((current) => ({
        ...current,
        status: "Active",
        nextRenewalOn: addBillingInterval(
          current.nextRenewalOn < today ? today : current.nextRenewalOn,
          current.interval,
        ),
      }));
      showToast(
        "Renewal was simulated. A pending demo invoice was added; no payment was processed.",
        "success",
      );
    }
    setPendingAction(null);
  }

  function actionCopy() {
    if (!pendingAction)
      return {
        title: "Confirm demo action",
        body: "Continue with this simulated change?",
        confirmLabel: "Confirm",
      };
    if (pendingAction.kind === "plan")
      return {
        title: `Switch to ${pendingAction.plan.name}?`,
        body: `This will update the displayed demo plan and its included limits. The displayed example price (${formatINR(subscriptionPrice(pendingAction.plan, interval))} / ${interval.toLowerCase()}) is illustrative only. No billing will occur.`,
        confirmLabel: "Apply demo change",
      };
    if (pendingAction.kind === "cancel")
      return {
        title: "Cancel subscription?",
        body: "The demo status will change to Canceled. This will not cancel or modify a real subscription.",
        confirmLabel: "Cancel in demo",
      };
    if (pendingAction.kind === "reactivate")
      return {
        title: "Reactivate subscription?",
        body: "The demo status will change to Active. No real subscription or payment is affected.",
        confirmLabel: "Reactivate demo",
      };
    return {
      title: "Simulate renewal?",
      body: "A pending demo invoice will be created and the renewal date advanced. No payment will be processed.",
      confirmLabel: "Simulate renewal",
    };
  }

  const usageWarning =
    subscription.seatUsage > currentPlan.maxSeats ||
    subscription.staffUsage > currentPlan.maxStaff;
  const planActionLabel = (plan: SubscriptionPlan) =>
    subscriptionPlans.indexOf(plan) >
    subscriptionPlans.findIndex((item) => item.id === currentPlan.id)
      ? "Upgrade"
      : "Downgrade";

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Plan details, account usage, and billing history.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Demo subscription · sample pricing is illustrative and is not a
            production offer
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground">
          <CreditCard size={14} /> No live billing connection
        </span>
      </section>

      {(subscription.status === "Past due" ||
        subscription.status === "Suspended" ||
        subscription.status === "Canceled" ||
        (trialDays !== null && trialDays <= 7)) && (
        <div
          className={`flex flex-wrap items-start gap-3 rounded-lg border p-4 ${subscription.status === "Past due" || subscription.status === "Suspended" ? "border-destructive/40 bg-destructive/5" : "border-accent/70 bg-accent/30"}`}
        >
          <CircleAlert
            size={18}
            className={
              subscription.status === "Past due" ||
              subscription.status === "Suspended"
                ? "text-destructive"
                : "text-accent-foreground"
            }
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {subscription.status === "Past due"
                ? "Billing needs attention"
                : subscription.status === "Suspended"
                  ? "Subscription access is suspended"
                  : subscription.status === "Canceled"
                    ? "Subscription is canceled"
                    : `Trial ends in ${trialDays} days`}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              This is a demo status banner. No live billing or access state is
              affected.
            </p>
          </div>
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.8fr)]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                <Crown size={20} />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Current plan</p>
                <h2 className="mt-0.5 text-xl font-semibold">
                  {currentPlan.name}
                </h2>
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(subscription.status)}`}
            >
              {subscription.status}
            </span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <FinanceSummary
              label="Plan price"
              value={`${formatINR(currentPrice)} / ${interval === "Annual" ? "year" : "month"}`}
              detail="Illustrative demo price"
              icon={CreditCard}
            />
            <FinanceSummary
              label="Next renewal"
              value={dateLabel(subscription.nextRenewalOn)}
              detail={`Started ${dateLabel(subscription.startedOn)}`}
              icon={CalendarClock}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3.5">
            <div>
              <p className="text-xs font-medium">Billing interval</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Switching here only changes this demo view.
              </p>
            </div>
            <div className="inline-flex rounded-md border border-border bg-background p-1">
              <button
                type="button"
                aria-pressed={interval === "Monthly"}
                onClick={() => setBillingInterval("Monthly")}
                className={`h-8 rounded px-3 text-xs font-medium ${interval === "Monthly" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Monthly
              </button>
              <button
                type="button"
                aria-pressed={interval === "Annual"}
                onClick={() => setBillingInterval("Annual")}
                className={`h-8 rounded px-3 text-xs font-medium ${interval === "Annual" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Annual
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {subscription.status === "Canceled" ? (
              <button
                type="button"
                onClick={() => setPendingAction({ kind: "reactivate" })}
                className="h-9 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Reactivate demo
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setPendingAction({ kind: "renew" })}
                  className="h-9 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Renew subscription
                </button>
                <button
                  type="button"
                  onClick={() => setPendingAction({ kind: "cancel" })}
                  className="h-9 rounded-md border border-border px-3.5 text-sm font-medium hover:border-destructive/40 hover:text-destructive"
                >
                  Cancel subscription
                </button>
              </>
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <HardDrive size={16} className="text-primary" />
            <h2 className="text-sm font-semibold">Plan usage</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Live counters are not connected; showing demo usage.
          </p>
          <div className="mt-4 space-y-3">
            <UsageMeter
              label="Seats"
              used={subscription.seatUsage}
              maximum={currentPlan.maxSeats}
              icon={UsersRound}
            />
            <UsageMeter
              label="Staff accounts"
              used={subscription.staffUsage}
              maximum={currentPlan.maxStaff}
              icon={BadgeCheck}
            />
          </div>
          {usageWarning && (
            <p className="mt-3 text-xs font-medium text-destructive">
              Current demo usage exceeds this plan’s limit. Upgrade the sample
              plan to increase the displayed limits.
            </p>
          )}
        </Card>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Plan comparison</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Sample plan configuration · not actual commercial pricing
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {interval} billing
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {subscriptionPlans.map((plan) => {
            const selected = plan.id === currentPlan.id;
            const exceeded =
              subscription.seatUsage > plan.maxSeats ||
              subscription.staffUsage > plan.maxStaff;
            return (
              <Card
                key={plan.id}
                className={`flex flex-col p-4 sm:p-5 ${selected ? "border-primary/50 ring-1 ring-primary/20" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {plan.maxSeats} seats · {plan.maxStaff} staff accounts
                    </p>
                  </div>
                  {selected && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                      <Check size={12} /> Current plan
                    </span>
                  )}
                </div>
                <p className="mt-4 text-2xl font-semibold">
                  {formatINR(subscriptionPrice(plan, interval))}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    / {interval === "Annual" ? "year" : "month"}
                  </span>
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Illustrative demo amount
                </p>
                <ul className="mt-4 flex-1 space-y-2 border-t border-border pt-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-xs leading-5">
                      <Check
                        size={14}
                        className="mt-0.5 shrink-0 text-primary"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={selected || exceeded}
                  onClick={() => setPendingAction({ kind: "plan", plan })}
                  className={`mt-5 h-9 rounded-md px-3 text-sm font-medium ${selected ? "cursor-default bg-muted text-muted-foreground" : exceeded ? "cursor-not-allowed border border-border text-muted-foreground" : "bg-primary text-primary-foreground hover:opacity-90"}`}
                >
                  {selected
                    ? "Current plan"
                    : exceeded
                      ? "Usage exceeds limit"
                      : planActionLabel(plan)}
                </button>
                {exceeded && (
                  <p className="mt-2 text-center text-[10px] text-muted-foreground">
                    Plan limits are below current demo usage.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-semibold">Billing history</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Sample invoices for this library workspace
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {invoices.length} invoices
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-left text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/60 text-[11px] uppercase text-muted-foreground">
                <th className="px-4 py-3 sm:px-5">Invoice</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Plan / interval</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right sm:pr-5">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3.5 font-medium sm:px-5">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                    {dateLabel(invoice.date)}
                  </td>
                  <td className="px-4 py-3.5">
                    {invoice.planName} · {invoice.interval}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right">
                    {formatINR(invoice.amount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${invoice.status === "Paid" ? "bg-primary/10 text-primary" : invoice.status === "Pending" ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive"}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right sm:pr-5">
                    <button
                      type="button"
                      onClick={() => setInvoicePreview(invoice)}
                      className="h-8 rounded-md border border-border px-2.5 text-xs font-medium hover:bg-muted"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs leading-5 text-muted-foreground">
        Plan switches, renewals, cancellations, and invoices on this page are
        simulated in local browser state. No real subscription, payment, access
        entitlement, or billing event is created.
      </p>

      {pendingAction && (
        <ActionConfirm
          {...actionCopy()}
          onCancel={() => setPendingAction(null)}
          onConfirm={performAction}
        />
      )}
      {invoicePreview && (
        <InvoicePreview
          invoice={invoicePreview}
          onClose={() => setInvoicePreview(null)}
        />
      )}
      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
