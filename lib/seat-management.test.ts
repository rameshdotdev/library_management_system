import { describe, expect, it } from "vitest";
import {
  findStudentAssignmentConflict,
  isSeatAvailableForReservation,
  type SeatAssignment,
} from "@/lib/seat-management";

const activeAssignment: SeatAssignment = {
  id: "assignment-1",
  studentId: "student-1",
  studentName: "Akash Gupta",
  roomId: "garden-room",
  roomName: "Garden Room",
  seatNumber: "G-01",
  timeSlotId: "morning",
  timeSlotName: "Morning",
  startTime: "07:00",
  endTime: "15:00",
  startDate: "2026-10-04",
  endDate: "2026-11-03",
  status: "Active",
  createdAt: "2026-10-04",
};

describe("seat reservation availability", () => {
  it("prevents one student from holding overlapping seats", () => {
    const conflict = findStudentAssignmentConflict(
      {
        studentId: "student-1",
        startTime: "07:00",
        endTime: "15:00",
        startDate: "2026-10-10",
        endDate: "2026-11-01",
      },
      [activeAssignment],
    );

    expect(conflict?.seatNumber).toBe("G-01");
  });

  it("allows the same student in an adjacent non-overlapping time slot", () => {
    const conflict = findStudentAssignmentConflict(
      {
        studentId: "student-1",
        startTime: "15:00",
        endTime: "19:00",
        startDate: "2026-10-10",
        endDate: "2026-11-01",
      },
      [activeAssignment],
    );

    expect(conflict).toBeUndefined();
  });

  it("marks overlapping seats unavailable but leaves other seats selectable", () => {
    const requested = {
      roomId: "garden-room",
      startTime: "07:00",
      endTime: "15:00",
      startDate: "2026-10-04",
      endDate: "2026-11-03",
    };

    expect(
      isSeatAvailableForReservation({ ...requested, seatNumber: "G-01" }, [
        activeAssignment,
      ]),
    ).toBe(false);
    expect(
      isSeatAvailableForReservation({ ...requested, seatNumber: "G-02" }, [
        activeAssignment,
      ]),
    ).toBe(true);
  });
});
