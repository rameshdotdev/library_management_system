import { NextResponse } from "next/server";

import { demoInvoices } from "@/lib/finance-management";
import { buildDashboardSummary } from "@/lib/dashboard-summary";
import { demoStudents } from "@/lib/student-management";
import { demoAssignments, rooms } from "@/lib/seat-management";

export const runtime = "nodejs";

export async function GET() {
  const payments = demoStudents.flatMap((student) =>
    student.payments.map((payment) => ({ amount: payment.amount })),
  );

  const summary = buildDashboardSummary({
    students: demoStudents.map(({ id, status, monthlyFee }) => ({
      id,
      status,
      monthlyFee,
    })),
    rooms,
    assignments: demoAssignments.map(({ roomId, seatNumber, status }) => ({
      roomId,
      seatNumber,
      status,
    })),
    payments,
    invoices: demoInvoices.map(({ amount, paidAmount }) => ({
      amount,
      paidAmount,
    })),
  });

  return NextResponse.json({ success: true, summary });
}
