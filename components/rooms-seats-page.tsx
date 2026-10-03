"use client";

import { useState } from "react";
import { Armchair, Building2, Layers3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useDemoState } from "@/components/use-demo-state";
import {
  dateRangesOverlap,
  demoAssignments,
  defaultTimeSlots,
  formatTimeRange,
  intervalsOverlap,
  isAssignmentArray,
  isTimeSlotArray,
  rooms,
  type Room,
  type SeatAssignment,
  type TimeSlot,
} from "@/lib/seat-management";

function todayValue() {
  const today = new Date();
  const localOffset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - localOffset).toISOString().slice(0, 10);
}

function seatLabel(room: Room, seatIndex: number) {
  return `${room.seatPrefix}-${String(seatIndex + 1).padStart(2, "0")}`;
}

export function SeatGrid({
  room,
  selectedDate,
  selectedSlot,
  slots,
  assignments,
}: {
  room: Room;
  selectedDate: string;
  selectedSlot: TimeSlot;
  slots: TimeSlot[];
  assignments: SeatAssignment[];
}) {
  const seats = Array.from({ length: room.capacity }, (_, index) => {
    const seatNumber = seatLabel(room, index);
    const booking = assignments.find(
      (assignment) =>
        assignment.roomId === room.id &&
        assignment.seatNumber === seatNumber &&
        dateRangesOverlap(
          assignment.startDate,
          assignment.endDate,
          selectedDate,
          selectedDate,
        ) &&
        intervalsOverlap(
          assignment.startTime,
          assignment.endTime,
          selectedSlot.startTime,
          selectedSlot.endTime,
        ),
    );
    return { seatNumber, booking };
  });
  const occupied = seats.filter((seat) => seat.booking).length;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Seat map</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {room.name} · {room.floor} · {occupied} of {room.capacity} occupied
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm border border-border bg-card" />
            Available
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary" /> Occupied
          </span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {seats.map(({ seatNumber, booking }) => (
          <div
            key={seatNumber}
            title={
              booking
                ? `${seatNumber}: ${booking.studentName}`
                : `${seatNumber}: Available`
            }
            aria-label={
              booking
                ? `${seatNumber}, occupied by ${booking.studentName}`
                : `${seatNumber}, available`
            }
            className={`flex min-h-14.5 flex-col items-center justify-center rounded-md border text-center ${
              booking
                ? "border-primary/30 bg-secondary text-primary"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            <Armchair aria-hidden="true" size={15} />
            <span className="mt-1 text-[11px] font-semibold">{seatNumber}</span>
          </div>
        ))}
      </div>
      {slots.length === 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          No time slots are configured.
        </p>
      )}
    </Card>
  );
}

export function RoomsSeatsPage() {
  const [configuredSlots] = useDemoState(
    "reading-room-time-slots",
    defaultTimeSlots,
    isTimeSlotArray,
  );
  const slots = configuredSlots.filter((slot) => slot.active !== false);
  const [assignments] = useDemoState(
    "reading-room-assignments",
    demoAssignments,
    isAssignmentArray,
  );
  const [roomId, setRoomId] = useState(rooms[0].id);
  const [selectedDate, setSelectedDate] = useState(todayValue);
  const [slotId, setSlotId] = useState(defaultTimeSlots[0].id);
  const room = rooms.find((item) => item.id === roomId) ?? rooms[0];
  const selectedSlot = slots.find((slot) => slot.id === slotId) ?? slots[0];
  const occupiedCount = assignments.filter(
    (assignment) =>
      assignment.roomId === room.id &&
      dateRangesOverlap(
        assignment.startDate,
        assignment.endDate,
        selectedDate,
        selectedDate,
      ) &&
      selectedSlot &&
      intervalsOverlap(
        assignment.startTime,
        assignment.endTime,
        selectedSlot.startTime,
        selectedSlot.endTime,
      ),
  ).length;
  const floors = Array.from(new Set(rooms.map((item) => item.floor)));

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Browse rooms by floor and inspect live seat availability.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Demo data · changes stay in this browser
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Room summary">
        <SummaryCard
          icon={Building2}
          label="Reading rooms"
          value={String(rooms.length)}
        />
        <SummaryCard
          icon={Layers3}
          label="Floors"
          value={String(floors.length)}
        />
        <SummaryCard
          icon={Armchair}
          label="Seats in selected room"
          value={`${room.capacity}`}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(290px,0.8fr)_minmax(0,1.6fr)]">
        <Card className="p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Rooms & floors</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a room to view its seats.
            </p>
          </div>
          <div className="space-y-5">
            {floors.map((floor) => (
              <div key={floor}>
                <h3 className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">
                  {floor}
                </h3>
                <div className="space-y-2">
                  {rooms
                    .filter((item) => item.floor === floor)
                    .map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setRoomId(item.id)}
                        aria-pressed={room.id === item.id}
                        className={`w-full rounded-md border p-3 text-left transition-colors ${
                          room.id === item.id
                            ? "border-primary/50 bg-secondary/70"
                            : "border-border hover:bg-muted/60"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {item.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.capacity} seats
                          </span>
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="min-w-0 space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-xs font-medium text-muted-foreground">
                Room
                <select
                  value={room.id}
                  onChange={(event) => setRoomId(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  {rooms.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Date
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Time slot
                <select
                  value={selectedSlot?.id ?? ""}
                  onChange={(event) => setSlotId(event.target.value)}
                  disabled={slots.length === 0}
                  className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground disabled:opacity-50"
                >
                  {slots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.name} ·{" "}
                      {formatTimeRange(slot.startTime, slot.endTime)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {room.capacity - occupiedCount} seats available for this date and
              slot.
            </p>
          </Card>
          <SeatGrid
            room={room}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot ?? defaultTimeSlots[0]}
            slots={slots}
            assignments={assignments}
          />
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
        <Icon size={18} />
      </span>
      <span>
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="mt-1 block text-lg font-semibold">{value}</span>
      </span>
    </Card>
  );
}
