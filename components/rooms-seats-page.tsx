"use client";

import { useState, type FormEvent } from "react";
import { Armchair, Building2, Layers3, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useRooms } from "@/components/use-rooms";
import { useLibraryConfiguration } from "@/components/use-library-configuration";
import { useSeatAssignments } from "@/components/use-seat-assignments";
import {
  dateRangesOverlap,
  defaultTimeSlots,
  formatTimeRange,
  intervalsOverlap,
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
  const { rooms, setRooms, loading, error } = useRooms();
  const { configuration } = useLibraryConfiguration();
  const slots = configuration.timeSlots.filter((slot) => slot.active !== false);
  const {
    assignments,
    loading: assignmentsLoading,
    error: assignmentsError,
  } = useSeatAssignments();
  const [roomId, setRoomId] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayValue);
  const [slotId, setSlotId] = useState(defaultTimeSlots[0].id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [roomForm, setRoomForm] = useState({
    name: "",
    floor: "Ground floor",
    description: "",
    seatPrefix: "A",
    capacity: "20",
  });
  const room = rooms.find((item) => item.id === roomId) ?? rooms[0];
  const selectedSlot = slots.find((slot) => slot.id === slotId) ?? slots[0];
  const occupiedCount = assignments.filter(
    (assignment) =>
      assignment.roomId === room?.id &&
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

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const response = await fetch("/api/v1/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...roomForm,
          capacity: Number(roomForm.capacity),
        }),
      });
      const payload = (await response.json()) as {
        room?: Room;
        message?: string;
      };
      if (!response.ok || !payload.room) {
        throw new Error(payload.message ?? "Room could not be created.");
      }
      setRooms((current) => [...current, payload.room!]);
      setRoomId(payload.room.id);
      setRoomForm({
        name: "",
        floor: "Ground floor",
        description: "",
        seatPrefix: "A",
        capacity: "20",
      });
      setDialogOpen(false);
    } catch (createError) {
      setFormError(
        createError instanceof Error
          ? createError.message
          : "Room could not be created.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Create rooms and seats, then inspect availability by date and slot.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError("");
            setDialogOpen(true);
          }}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={15} /> Add room
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Room summary">
        <SummaryCard
          icon={Building2}
          label="Reading rooms"
          value={loading ? "…" : String(rooms.length)}
        />
        <SummaryCard
          icon={Layers3}
          label="Floors"
          value={loading ? "…" : String(floors.length)}
        />
        <SummaryCard
          icon={Armchair}
          label="Seats in selected room"
          value={room ? String(room.capacity) : "0"}
        />
      </section>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {assignmentsError && (
        <p role="alert" className="text-sm text-destructive">
          {assignmentsError}
        </p>
      )}

      <section className="grid gap-4 xl:grid-cols-[minmax(290px,0.8fr)_minmax(0,1.6fr)]">
        <Card className="p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Rooms & floors</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading ? "Loading rooms…" : "Select a room to view its seats."}
            </p>
          </div>
          {rooms.length ? (
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
          ) : (
            !loading && (
              <p className="text-sm text-muted-foreground">No rooms found.</p>
            )
          )}
        </Card>

        <div className="min-w-0 space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-xs font-medium text-muted-foreground">
                Room
                <select
                  value={room?.id ?? ""}
                  onChange={(event) => setRoomId(event.target.value)}
                  disabled={!rooms.length}
                  className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground disabled:opacity-50"
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
              {assignmentsLoading
                ? "Loading availability…"
                : `${room ? room.capacity - occupiedCount : 0} seats available for this date and slot.`}
            </p>
          </Card>
          {room ? (
            <SeatGrid
              room={room}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot ?? defaultTimeSlots[0]}
              slots={slots}
              assignments={assignments}
            />
          ) : (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Create a room to start adding seats.
            </Card>
          )}
        </div>
      </section>

      {dialogOpen && (
        <div className="fixed inset-0 z-70 grid place-items-center overflow-y-auto bg-foreground/40 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-room-title"
            className="my-auto w-full max-w-lg rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="create-room-title" className="text-lg font-semibold">
                  Create room
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Seats are generated from the prefix and seat count.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close create room dialog"
                onClick={() => setDialogOpen(false)}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={createRoom}
              className="mt-5 grid gap-4 sm:grid-cols-2"
            >
              <label className="text-xs font-medium text-muted-foreground sm:col-span-2">
                Room name
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  value={roomForm.name}
                  onChange={(event) =>
                    setRoomForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                />
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Floor
                <input
                  required
                  maxLength={40}
                  value={roomForm.floor}
                  onChange={(event) =>
                    setRoomForm((current) => ({
                      ...current,
                      floor: event.target.value,
                    }))
                  }
                  className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                />
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Seat prefix
                <input
                  required
                  maxLength={4}
                  pattern="[A-Za-z0-9]{1,4}"
                  value={roomForm.seatPrefix}
                  onChange={(event) =>
                    setRoomForm((current) => ({
                      ...current,
                      seatPrefix: event.target.value.toUpperCase(),
                    }))
                  }
                  className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                />
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Number of seats
                <input
                  required
                  type="number"
                  min={1}
                  max={500}
                  value={roomForm.capacity}
                  onChange={(event) =>
                    setRoomForm((current) => ({
                      ...current,
                      capacity: event.target.value,
                    }))
                  }
                  className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                />
              </label>
              <label className="text-xs font-medium text-muted-foreground sm:col-span-2">
                Description
                <textarea
                  maxLength={200}
                  rows={3}
                  value={roomForm.description}
                  onChange={(event) =>
                    setRoomForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              {formError && (
                <p
                  role="alert"
                  className="text-sm text-destructive sm:col-span-2"
                >
                  {formError}
                </p>
              )}
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="h-10 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  <Plus size={15} />{" "}
                  {saving ? "Creating…" : "Create room & seats"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
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
