import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { InvoiceStatus } from "@/lib/finance-management";

export function FinanceSummary({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="flex min-w-0 items-center gap-3 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
        <Icon aria-hidden="true" size={18} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-lg font-semibold">{value}</p>
        {detail && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {detail}
          </p>
        )}
      </div>
    </Card>
  );
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const color: Record<InvoiceStatus, string> = {
    Paid: "bg-primary/10 text-primary",
    "Partially paid": "bg-accent text-accent-foreground",
    Pending: "bg-muted text-muted-foreground",
    Overdue: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${color[status]}`}
    >
      {status}
    </span>
  );
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
      <p className="text-xs text-muted-foreground">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-16 text-center text-xs text-muted-foreground">
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function localDateMatch(value: string, from: string, to: string) {
  return (!from || value >= from) && (!to || value <= to);
}
