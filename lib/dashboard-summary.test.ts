import { describe, expect, it } from "vitest";

import { buildDashboardSummary } from "./dashboard-summary";

describe("buildDashboardSummary", () => {
  it("aggregates student, seat, and collections metrics for the dashboard", () => {
    const summary = buildDashboardSummary({
      students: [
        { id: "stu-001", status: "Active", monthlyFee: 1800 },
        { id: "stu-002", status: "On hold", monthlyFee: 2400 },
        { id: "stu-003", status: "Archived", monthlyFee: 3200 },
      ],
      rooms: [
        { id: "north-wing", capacity: 40 },
        { id: "garden-room", capacity: 32 },
      ],
      assignments: [
        { roomId: "north-wing", status: "Active", seatNumber: "N-01" },
        { roomId: "north-wing", status: "Active", seatNumber: "N-02" },
        { roomId: "garden-room", status: "Completed", seatNumber: "G-05" },
      ],
      payments: [{ amount: 1800 }, { amount: 2400 }, { amount: 500 }],
      invoices: [{ amount: 3200, paidAmount: 800 }],
    });

    expect(summary.totalStudents).toBe(3);
    expect(summary.activeStudents).toBe(1);
    expect(summary.onHoldStudents).toBe(1);
    expect(summary.totalSeats).toBe(72);
    expect(summary.occupiedSeats).toBe(2);
    expect(summary.totalCollections).toBe(4700);
    expect(summary.outstandingFees).toBe(2400);
  });
});
