"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Check, ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useRooms } from "@/components/use-rooms";
import { useLibraryConfiguration } from "@/components/use-library-configuration";
import { useSeatAssignments } from "@/components/use-seat-assignments";
import {
  defaultTimeSlots,
  findStudentAssignmentConflict,
  formatTimeRange,
  isSeatAvailableForReservation,
  type AssignmentStatus,
  type SeatAssignment,
} from "@/lib/seat-management";
import type { Student } from "@/lib/student-management";

function localToday() {
  const current = new Date();
  return new Date(current.getTime() - current.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

export function SeatAssignmentsPage() {
  const { rooms, loading: roomsLoading, error: roomsError } = useRooms();
  const {
    assignments,
    setAssignments,
    loading: assignmentsLoading,
    error: assignmentsError,
  } = useSeatAssignments();
  const { configuration } = useLibraryConfiguration();
  const slots = configuration.timeSlots.filter((slot) => slot.active !== false);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState("");
  const [studentId, setStudentId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [slotId, setSlotId] = useState(defaultTimeSlots[0].id);
  const [startDate, setStartDate] = useState(localToday);
  const [endDate, setEndDate] = useState(() => addDays(localToday(), 30));
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadStudents() {
      try {
        const response = await fetch("/api/v1/students");
        const payload = (await response.json()) as {
          students?: Student[];
          message?: string;
        };
        if (!response.ok || !Array.isArray(payload.students)) {
          throw new Error(payload.message ?? "Students could not be loaded.");
        }
        if (active) setStudents(payload.students);
      } catch (error) {
        if (active) {
          setStudentsError(
            error instanceof Error
              ? error.message
              : "Students could not be loaded.",
          );
        }
      } finally {
        if (active) setStudentsLoading(false);
      }
    }
    void loadStudents();
    return () => {
      active = false;
    };
  }, []);

  const selectedRoom = rooms.find((room) => room.id === roomId) ?? rooms[0];
  const selectedSlot = slots.find((slot) => slot.id === slotId) ?? slots[0];
  const selectedStudent =
    students.find((student) => student.id === studentId) ?? students[0];
  const roomSeats = selectedRoom
    ? Array.from(
        { length: selectedRoom.capacity },
        (_, index) =>
          `${selectedRoom.seatPrefix}-${String(index + 1).padStart(2, "0")}`,
      )
    : [];
  const availableSeatOptions =
    selectedRoom && selectedSlot
      ? roomSeats.filter((seat) =>
          isSeatAvailableForReservation(
            {
              roomId: selectedRoom.id,
              seatNumber: seat,
              startTime: selectedSlot.startTime,
              endTime: selectedSlot.endTime,
              startDate,
              endDate,
            },
            assignments,
          ),
        )
      : [];
  const selectedSeat = availableSeatOptions.includes(seatNumber)
    ? seatNumber
    : (availableSeatOptions[0] ?? "");
  const studentAssignmentConflict =
    selectedStudent && selectedSlot
      ? findStudentAssignmentConflict(
          {
            studentId: selectedStudent.id,
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            startDate,
            endDate,
          },
          assignments,
        )
      : undefined;

  async function assignSeat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const student = selectedStudent;
    const slot = selectedSlot;
    if (!student || !slot || !selectedRoom) {
      report("Choose a valid student, room, and time slot.", true);
      return;
    }
    if (startDate > endDate) {
      report("End date must be on or after the start date.", true);
      return;
    }
    if (studentAssignmentConflict) {
      report(
        `${student.name} already has ${studentAssignmentConflict.seatNumber} assigned during an overlapping date and time.`,
        true,
      );
      return;
    }
    if (!selectedSeat) {
      report("No seats are available for this date and time slot.", true);
      return;
    }
    const request = {
      roomId: selectedRoom.id,
      seatNumber: selectedSeat,
      startTime: slot.startTime,
      endTime: slot.endTime,
      startDate,
      endDate,
    };
    setSaving(true);
    try {
      const response = await fetch("/api/v1/seat-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          studentId: student.id,
          roomId: selectedRoom.id,
          timeSlotId: slot.id,
          timeSlotName: slot.name,
        }),
      });
      const payload = (await response.json()) as {
        assignment?: SeatAssignment;
        message?: string;
      };
      if (!response.ok || !payload.assignment) {
        throw new Error(payload.message ?? "Seat could not be assigned.");
      }
      setAssignments((current) => [payload.assignment!, ...current]);
      report(`${student.name} assigned to ${selectedSeat}.`, false);
    } catch (error) {
      report(
        error instanceof Error ? error.message : "Seat could not be assigned.",
        true,
      );
    } finally {
      setSaving(false);
    }
  }

  function report(text: string, error: boolean) {
    setMessage(text);
    setMessageIsError(error);
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Reserve a specific seat for a student and time range. Adjacent slots
          can share a seat; overlapping hours and dates cannot.
        </p>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <ClipboardList size={15} /> {assignments.length} assignment records
        </span>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.5fr)]">
        <Card className="p-4 sm:p-5">
          <h2 className="text-base font-semibold">New seat assignment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a student, seat, slot, and membership dates.
          </p>
          <form onSubmit={assignSeat} className="mt-5 space-y-3">
            <Field label="Student">
              <select
                value={selectedStudent?.id ?? ""}
                onChange={(event) => setStudentId(event.target.value)}
                required
                disabled={studentsLoading || students.length === 0}
                className={inputClass}
              >
                {!students.length && (
                  <option value="">
                    {studentsLoading
                      ? "Loading students…"
                      : "No students found"}
                  </option>
                )}
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Room">
                <select
                  value={roomId}
                  onChange={(event) => {
                    setRoomId(event.target.value);
                    const room = rooms.find(
                      (item) => item.id === event.target.value,
                    );
                    setSeatNumber(`${room?.seatPrefix ?? "N"}-01`);
                  }}
                  disabled={roomsLoading || rooms.length === 0}
                  className={inputClass}
                >
                  {!rooms.length && (
                    <option value="">No rooms available</option>
                  )}
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Seat">
                <select
                  value={selectedSeat}
                  onChange={(event) => setSeatNumber(event.target.value)}
                  disabled={availableSeatOptions.length === 0}
                  className={inputClass}
                >
                  {availableSeatOptions.length === 0 && (
                    <option value="">No available seats</option>
                  )}
                  {availableSeatOptions.map((seat) => (
                    <option key={seat} value={seat}>
                      {seat}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {studentAssignmentConflict && (
              <p role="alert" className="text-xs text-destructive">
                {selectedStudent?.name} already has seat{" "}
                {studentAssignmentConflict.seatNumber} during an overlapping
                date and time.
              </p>
            )}
            {selectedRoom &&
              selectedSlot &&
              availableSeatOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No seats are available for this room, date range, and time
                  slot.
                </p>
              )}
            {roomsError && (
              <p role="alert" className="text-xs text-destructive">
                {roomsError}
              </p>
            )}
            {studentsError && (
              <p role="alert" className="text-xs text-destructive">
                {studentsError}
              </p>
            )}
            <Field label="Time slot">
              <select
                value={selectedSlot?.id ?? ""}
                onChange={(event) => setSlotId(event.target.value)}
                required
                disabled={slots.length === 0}
                className={inputClass}
              >
                {slots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.name} ·{" "}
                    {formatTimeRange(slot.startTime, slot.endTime)}
                  </option>
                ))}
              </select>
            </Field>
            {selectedSlot && (
              <p className="-mt-1 text-[11px] text-muted-foreground">
                Reservation hours:{" "}
                {formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date">
                <input
                  required
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="End date">
                <input
                  required
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <button
              type="submit"
              disabled={
                slots.length === 0 ||
                !selectedRoom ||
                students.length === 0 ||
                availableSeatOptions.length === 0 ||
                Boolean(studentAssignmentConflict) ||
                saving
              }
              className="mt-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={16} /> {saving ? "Assigning…" : "Assign seat"}
            </button>
          </form>
          <p
            role="status"
            aria-live="polite"
            className={`mt-3 flex min-h-5 items-start gap-1.5 text-xs ${messageIsError ? "text-destructive" : "text-primary"}`}
          >
            {message &&
              (messageIsError ? (
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
              ) : (
                <Check size={14} className="mt-0.5 shrink-0" />
              ))}
            {message}
          </p>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-4 sm:px-5">
            <h2 className="text-base font-semibold">Assignment history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Persistent current and previous seat reservations.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 border-collapse text-left text-sm">
              <thead>
                <tr className="border-y border-border bg-muted/60 text-[11px] font-medium uppercase text-muted-foreground">
                  <th className="px-4 py-3 sm:px-5">Student / seat</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Time slot</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr
                    key={assignment.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 sm:px-5">
                      <span className="block font-medium">
                        {assignment.studentName}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {assignment.seatNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {assignment.roomName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block">{assignment.timeSlotName}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {formatTimeRange(
                          assignment.startTime,
                          assignment.endTime,
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(assignment.startDate)} –{" "}
                      {formatDate(assignment.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={assignment.status} />
                    </td>
                  </tr>
                ))}
                {assignments.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-sm text-muted-foreground"
                    >
                      {assignmentsLoading
                        ? "Loading assignments…"
                        : assignmentsError || "No assignments yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {assignmentsError && assignments.length > 0 && (
        <p role="alert" className="text-xs text-destructive">
          {assignmentsError}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "mt-1.5 h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: AssignmentStatus }) {
  const style =
    status === "Active"
      ? "bg-secondary text-primary"
      : status === "Scheduled"
        ? "bg-accent text-accent-foreground"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${style}`}
    >
      {status}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function addDays(date: string, days: number) {
  const result = new Date(`${date}T00:00:00`);
  result.setDate(result.getDate() + days);
  return new Date(result.getTime() - result.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}
