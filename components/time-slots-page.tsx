"use client";

import { useState, type FormEvent } from "react";
import { Clock3, Plus, Power } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useDemoState } from "@/components/use-demo-state";
import {
  defaultTimeSlots,
  formatTimeRange,
  isTimeSlotArray,
  type TimeSlot,
} from "@/lib/seat-management";

export function TimeSlotsPage() {
  const [slots, setSlots] = useDemoState(
    "reading-room-time-slots",
    defaultTimeSlots,
    isTimeSlotArray,
  );
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("15:00");
  const [message, setMessage] = useState("");

  function addSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (startTime >= endTime) {
      setMessage("End time must be later than start time.");
      return;
    }
    if (
      slots.some(
        (slot) => slot.name.toLowerCase() === name.trim().toLowerCase(),
      )
    ) {
      setMessage("A slot with this name already exists.");
      return;
    }
    const nextSlot: TimeSlot = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      startTime,
      endTime,
      active: true,
    };
    setSlots((current) => [...current, nextSlot]);
    setName("");
    setMessage(`${nextSlot.name} was added.`);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Configure the hours students can reserve a seat. Slot changes are
        demo-only and saved in this browser.
      </p>

      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Configured time slots"
      >
        {slots.map((slot) => (
          <Card key={slot.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-9 place-items-center rounded-md bg-secondary text-primary">
                <Clock3 size={17} />
              </span>
              <button
                type="button"
                aria-label={`${slot.active === false ? "Activate" : "Deactivate"} ${slot.name} slot`}
                title={`${slot.active === false ? "Activate" : "Deactivate"} ${slot.name}`}
                onClick={() =>
                  setSlots((current) =>
                    current.map((item) =>
                      item.id === slot.id
                        ? { ...item, active: item.active === false }
                        : item,
                    ),
                  )
                }
                className={`grid size-8 place-items-center rounded-md ${slot.active === false ? "text-muted-foreground hover:bg-primary/10 hover:text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
              >
                <Power size={15} />
              </button>
            </div>
            <h2 className="mt-4 text-sm font-semibold">{slot.name}</h2>
            <p className="mt-1 text-lg font-medium tabular-nums">
              {formatTimeRange(slot.startTime, slot.endTime)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {durationLabel(slot.startTime, slot.endTime)}
            </p>
            <p
              className={`mt-2 text-[11px] font-medium ${slot.active === false ? "text-muted-foreground" : "text-primary"}`}
            >
              {slot.active === false ? "Inactive · history retained" : "Active"}
            </p>
          </Card>
        ))}
      </section>

      <Card className="p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Add a time slot</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Inactive slots remain in history and cannot be selected for new
            assignments. Overlaps are checked against exact hours.
          </p>
        </div>
        <form
          onSubmit={addSlot}
          className="grid gap-3 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end"
        >
          <label className="block text-xs font-medium text-muted-foreground">
            Slot name
            <input
              required
              maxLength={32}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Extended morning"
              className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            Start time
            <input
              required
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            End time
            <input
              required
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus size={16} /> Add slot
          </button>
        </form>
        <p role="status" className="mt-3 min-h-4 text-xs text-muted-foreground">
          {message}
        </p>
      </Card>

      <p className="text-xs leading-5 text-muted-foreground">
        Demo validation runs only in this browser. A production booking service
        must repeat all slot and seat checks on the server before saving.
      </p>
    </div>
  );
}

function durationLabel(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const totalMinutes =
    endHour * 60 + endMinute - (startHour * 60 + startMinute);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours} hours`;
}
