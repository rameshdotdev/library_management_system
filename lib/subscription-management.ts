export type BillingInterval = "Monthly" | "Annual";
export type SubscriptionStatus =
  | "Trial"
  | "Active"
  | "Past due"
  | "Canceled"
  | "Suspended";
export type BillingStatus = "Paid" | "Pending" | "Past due";

export type SubscriptionPlan = {
  id: string;
  name: "Starter" | "Growth" | "Professional";
  monthlyPrice: number;
  annualPrice: number;
  maxSeats: number;
  maxStaff: number;
  features: string[];
};

export type Subscription = {
  planId: string;
  status: SubscriptionStatus;
  interval: BillingInterval;
  startedOn: string;
  nextRenewalOn: string;
  trialEndsOn?: string;
  seatUsage: number;
  staffUsage: number;
};

export type SubscriptionInvoice = {
  id: string;
  invoiceNumber: string;
  date: string;
  planName: string;
  interval: BillingInterval;
  amount: number;
  status: BillingStatus;
};

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 799,
    annualPrice: 7990,
    maxSeats: 50,
    maxStaff: 3,
    features: ["Student directory", "Seat assignments", "Basic collections"],
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: 1999,
    annualPrice: 19990,
    maxSeats: 150,
    maxStaff: 10,
    features: [
      "Everything in Starter",
      "Membership renewals",
      "Reports and exports",
      "Priority support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    monthlyPrice: 4999,
    annualPrice: 49990,
    maxSeats: 500,
    maxStaff: 30,
    features: [
      "Everything in Growth",
      "Advanced reporting",
      "Multiple locations",
      "Dedicated onboarding",
    ],
  },
];

export const demoSubscription: Subscription = {
  planId: "growth",
  status: "Active",
  interval: "Annual",
  startedOn: "2026-01-15",
  nextRenewalOn: "2027-01-15",
  seatUsage: 120,
  staffUsage: 5,
};

export const demoSubscriptionInvoices: SubscriptionInvoice[] = [
  {
    id: "sub-inv-001",
    invoiceNumber: "SUB-2026-001",
    date: "2026-01-15",
    planName: "Growth",
    interval: "Annual",
    amount: 19990,
    status: "Paid",
  },
  {
    id: "sub-inv-002",
    invoiceNumber: "SUB-2025-001",
    date: "2025-01-15",
    planName: "Growth",
    interval: "Annual",
    amount: 19990,
    status: "Paid",
  },
  {
    id: "sub-inv-003",
    invoiceNumber: "SUB-2024-006",
    date: "2024-12-15",
    planName: "Growth",
    interval: "Monthly",
    amount: 1999,
    status: "Paid",
  },
];

export function subscriptionPrice(
  plan: SubscriptionPlan,
  interval: BillingInterval,
) {
  return interval === "Annual" ? plan.annualPrice : plan.monthlyPrice;
}

export function isSubscription(value: unknown): value is Subscription {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Subscription>;
  return (
    typeof item.planId === "string" &&
    ["Trial", "Active", "Past due", "Canceled", "Suspended"].includes(
      item.status ?? "",
    ) &&
    ["Monthly", "Annual"].includes(item.interval ?? "") &&
    typeof item.startedOn === "string" &&
    typeof item.nextRenewalOn === "string" &&
    typeof item.seatUsage === "number" &&
    typeof item.staffUsage === "number"
  );
}

export function isSubscriptionInvoiceArray(
  value: unknown,
): value is SubscriptionInvoice[] {
  return (
    Array.isArray(value) &&
    value.every(
      (invoice) =>
        typeof invoice?.id === "string" &&
        typeof invoice?.invoiceNumber === "string" &&
        typeof invoice?.date === "string" &&
        typeof invoice?.planName === "string" &&
        typeof invoice?.amount === "number" &&
        ["Paid", "Pending", "Past due"].includes(invoice?.status),
    )
  );
}
