"use client";

import {
  Armchair,
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import type { DashboardSummary } from "@/lib/dashboard-summary";

const fallbackMetrics = [
  {
    label: "Total seats",
    value: "120",
    note: "Across 3 reading rooms",
    icon: Armchair,
    tone: "bg-secondary text-primary",
  },
  {
    label: "Occupied seats",
    value: "86",
    note: "72% occupancy today",
    icon: UsersRound,
    tone: "bg-[#e5f1e8] text-[#176b50] dark:bg-[#294236] dark:text-[#a9d9b9]",
  },
  {
    label: "Available seats",
    value: "34",
    note: "Across all time slots",
    icon: Armchair,
    tone: "bg-[#edf0f5] text-[#60758f] dark:bg-[#2a3542] dark:text-[#b1c4dc]",
  },
  {
    label: "Active students",
    value: "94",
    note: "+8 this month",
    icon: UsersRound,
    tone: "bg-[#f5ecdf] text-[#9a6b35] dark:bg-[#443625] dark:text-[#e4bc85]",
  },
  {
    label: "Today's collection",
    value: "₹18,450",
    note: "12 payments received",
    icon: CircleDollarSign,
    tone: "bg-[#e4f0eb] text-[#247458] dark:bg-[#244237] dark:text-[#93cfb1]",
  },
  {
    label: "Outstanding fees",
    value: "₹42,800",
    note: "17 students due",
    icon: Clock3,
    tone: "bg-[#f6e9e5] text-[#b45b4e] dark:bg-[#462e2a] dark:text-[#e89d91]",
  },
];

const collections = [
  { month: "Jan", amount: 42 },
  { month: "Feb", amount: 58 },
  { month: "Mar", amount: 49 },
  { month: "Apr", amount: 72 },
  { month: "May", amount: 65 },
  { month: "Jun", amount: 84 },
  { month: "Jul", amount: 68 },
  { month: "Aug", amount: 92 },
  { month: "Sep", amount: 76 },
  { month: "Oct", amount: 88 },
  { month: "Nov", amount: 61 },
  { month: "Dec", amount: 96 },
];

const payments = [
  {
    initials: "AS",
    name: "Aarav Sharma",
    detail: "Monthly membership",
    amount: "₹2,500",
    time: "10:42 AM",
    tone: "bg-[#e4f0eb] text-[#247458]",
  },
  {
    initials: "PK",
    name: "Priya Kapoor",
    detail: "Seat reservation",
    amount: "₹1,800",
    time: "10:18 AM",
    tone: "bg-[#f5ecdf] text-[#9a6b35]",
  },
  {
    initials: "RV",
    name: "Rohan Verma",
    detail: "Monthly membership",
    amount: "₹2,500",
    time: "09:56 AM",
    tone: "bg-[#edf0f5] text-[#60758f]",
  },
  {
    initials: "SN",
    name: "Sana Nair",
    detail: "Late fee + membership",
    amount: "₹2,650",
    time: "09:21 AM",
    tone: "bg-[#f6e9e5] text-[#b45b4e]",
  },
  {
    initials: "DM",
    name: "Dev Mehta",
    detail: "Monthly membership",
    amount: "₹2,500",
    time: "Yesterday",
    tone: "bg-[#e9e8f3] text-[#716a9b]",
  },
];

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Home() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const response = await fetch("/api/v1/dashboard");
        const payload = (await response.json()) as {
          summary?: DashboardSummary;
        };
        if (active && payload.summary) {
          setSummary(payload.summary);
        }
      } catch {
        if (active) {
          setSummary(null);
        }
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    if (!summary) {
      return fallbackMetrics;
    }

    return [
      {
        label: "Total seats",
        value: String(summary.totalSeats),
        note: "Across all rooms",
        icon: Armchair,
        tone: "bg-secondary text-primary",
      },
      {
        label: "Occupied seats",
        value: String(summary.occupiedSeats),
        note: `${Math.round((summary.occupiedSeats / Math.max(summary.totalSeats, 1)) * 100)}% occupancy today`,
        icon: UsersRound,
        tone: "bg-[#e5f1e8] text-[#176b50] dark:bg-[#294236] dark:text-[#a9d9b9]",
      },
      {
        label: "Available seats",
        value: String(summary.availableSeats),
        note: "Across all time slots",
        icon: Armchair,
        tone: "bg-[#edf0f5] text-[#60758f] dark:bg-[#2a3542] dark:text-[#b1c4dc]",
      },
      {
        label: "Active students",
        value: String(summary.activeStudents),
        note: `${summary.onHoldStudents} on hold`,
        icon: UsersRound,
        tone: "bg-[#f5ecdf] text-[#9a6b35] dark:bg-[#443625] dark:text-[#e4bc85]",
      },
      {
        label: "Today's collection",
        value: formatINR(summary.totalCollections),
        note: `${summary.paymentCount} payments received`,
        icon: CircleDollarSign,
        tone: "bg-[#e4f0eb] text-[#247458] dark:bg-[#244237] dark:text-[#93cfb1]",
      },
      {
        label: "Outstanding fees",
        value: formatINR(summary.outstandingFees),
        note: `${summary.totalStudents} students tracked`,
        icon: Clock3,
        tone: "bg-[#f6e9e5] text-[#b45b4e] dark:bg-[#462e2a] dark:text-[#e89d91]",
      },
    ];
  }, [summary]);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Here’s what’s happening at your reading room today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2 rounded-full bg-primary" />
          All rooms operating normally
        </div>
      </section>

      <section
        aria-label="Reading room overview"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-[26px] font-semibold leading-none tracking-[-0.02em]">
                    {metric.value}
                  </p>
                </div>
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-lg ${metric.tone}`}
                >
                  <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {metric.note}
              </p>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
        <Card className="min-w-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Monthly collections</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fee collections throughout the year
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <ArrowUpRight aria-hidden="true" size={16} />
              12.8%{" "}
              <span className="font-normal text-muted-foreground">
                vs last year
              </span>
            </div>
          </div>
          <div
            className="mt-7 grid h-52 grid-cols-12 gap-2 sm:gap-3"
            role="img"
            aria-label="Monthly collections chart. Highest collections were in December, at 96 thousand rupees."
          >
            {collections.map((item) => (
              <div
                key={item.month}
                className="flex min-w-0 flex-col items-center justify-end gap-2"
              >
                <div className="flex h-full w-full items-end">
                  <div
                    className={`w-full rounded-t-[3px] transition-[height] ${item.month === "Dec" ? "bg-primary" : "bg-chart-2/70 dark:bg-chart-2/60"}`}
                    style={{ height: `${item.amount}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground sm:text-xs">
                  {item.month}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
            <span>Collections in ₹ thousands</span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-sm bg-primary" />
              Current year
            </span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Today’s collection</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Payments received so far
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-lg bg-secondary text-primary">
              <CreditCard aria-hidden="true" size={18} />
            </span>
          </div>
          <p className="mt-6 text-3xl font-semibold tracking-[-0.02em]">
            ₹18,450
          </p>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">12 transactions</span>
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              <ArrowUpRight size={15} /> 8.4%
            </span>
          </div>
          <div className="mt-6 space-y-4 border-t border-border pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <span className="size-2 rounded-full bg-chart-1" />
                Membership fees
              </span>
              <span className="font-medium">₹14,950</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <span className="size-2 rounded-full bg-chart-3" />
                Seat reservations
              </span>
              <span className="font-medium">₹3,500</span>
            </div>
          </div>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-semibold">Recent payments</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Latest transactions from your students
            </p>
          </div>
          <Link
            href="/fees-payments"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all <ArrowUpRight aria-hidden="true" size={15} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-155 border-collapse text-left text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/60 text-xs font-medium uppercase text-muted-foreground">
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Payment for</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.name}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${payment.tone}`}
                      >
                        {payment.initials}
                      </span>
                      <span className="font-medium">{payment.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {payment.detail}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {payment.time}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium">
                    {payment.amount}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary">
                      Paid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
          <span>Showing 5 of 12 payments</span>
          <span className="inline-flex items-center gap-1">
            <ArrowDownLeft aria-hidden="true" size={14} /> Demo transactions
          </span>
        </div>
      </Card>
    </div>
  );
}
