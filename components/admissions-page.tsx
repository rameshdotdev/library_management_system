"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  Armchair,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  UserRound,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, inputClass } from "@/components/ui/field";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { useDemoState } from "@/components/use-demo-state";
import { useLibraryConfiguration } from "@/components/use-library-configuration";
import { useRooms } from "@/components/use-rooms";
import { useSeatAssignments } from "@/components/use-seat-assignments";
import {
  defaultTimeSlots,
  findAssignmentConflict,
  formatTimeRange,
  type SeatAssignment,
} from "@/lib/seat-management";
import { generateAdmissionEmail } from "@/lib/admissions";
import {
  demoStudents,
  isStudentArray,
  type PaymentRecord,
  type Student,
} from "@/lib/student-management";

const steps = [
  { title: "Student", icon: UserRound },
  { title: "Membership", icon: BadgeCheck },
  { title: "Seat", icon: Armchair },
  { title: "Payment", icon: CreditCard },
  { title: "Review", icon: ClipboardCheck },
];
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

type AdmissionDraft = {
  name: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  documentImageDataUrl: string;
  planId: string;
  durationMonths: string;
  roomId: string;
  seatNumber: string;
  timeSlotId: string;
  startDate: string;
  endDate: string;
  admissionFee: string;
  deposit: string;
  discount: string;
  initialPayment: string;
  paymentMethod: PaymentRecord["method"];
};

function localDate(value: Date) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

function todayValue() {
  return localDate(new Date());
}

function addDays(date: string, days: number) {
  const result = new Date(`${date}T12:00:00`);
  result.setDate(result.getDate() + days);
  return localDate(result);
}

export function AdmissionsPage() {
  const { rooms, loading: roomsLoading, error: roomsError } = useRooms();
  const [students, setStudents] = useDemoState(
    "reading-room-students",
    demoStudents,
    isStudentArray,
  );
  const {
    assignments,
    setAssignments,
    loading: assignmentsLoading,
  } = useSeatAssignments();
  const { configuration } = useLibraryConfiguration();
  const slots = configuration.timeSlots.filter((slot) => slot.active !== false);
  const membershipPlans = configuration.membershipPlans.filter(
    (plan) => plan.active !== false,
  );
  const { toast, showToast, dismissToast } = useToast();
  const [step, setStep] = useState(0);
  const [completedName, setCompletedName] = useState("");
  const [savedStudent, setSavedStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draft, setDraft] = useState<AdmissionDraft>(() => {
    const today = todayValue();
    return {
      name: "",
      phone: "",
      guardianName: "",
      guardianPhone: "",
      documentImageDataUrl: "",
      planId: membershipPlans[0].id,
      durationMonths: "1",
      roomId: "",
      seatNumber: "",
      timeSlotId: defaultTimeSlots[0].id,
      startDate: today,
      endDate: addDays(today, 30),
      admissionFee: "500",
      deposit: "1000",
      discount: "0",
      initialPayment: "0",
      paymentMethod: "UPI",
    };
  });

  const selectedPlan = membershipPlans.find((plan) => plan.id === draft.planId);
  const selectedRoom =
    rooms.find((room) => room.id === draft.roomId) ?? rooms[0];
  const selectedSlot =
    slots.find((slot) => slot.id === draft.timeSlotId) ?? slots[0];
  const membershipTotal =
    (selectedPlan?.monthlyPrice ?? 0) * Number(draft.durationMonths || 0);
  const admissionFeeValue = Number(draft.admissionFee || 0);
  const depositValue = Number(draft.deposit || 0);
  const discountValue = Number(draft.discount || 0);
  const totalDue =
    membershipTotal + admissionFeeValue + depositValue - discountValue;
  const seatOptions =
    selectedRoom && selectedSlot
      ? Array.from(
          { length: selectedRoom.capacity },
          (_, index) =>
            `${selectedRoom.seatPrefix}-${String(index + 1).padStart(2, "0")}`,
        ).filter(
          (seatNumber) =>
            !findAssignmentConflict(
              {
                roomId: selectedRoom.id,
                seatNumber,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                startDate: draft.startDate,
                endDate: draft.endDate,
              },
              assignments,
            ),
        )
      : [];
  const availableSeat = seatOptions.includes(draft.seatNumber)
    ? draft.seatNumber
    : (seatOptions[0] ?? "");

  function update<K extends keyof AdmissionDraft>(
    key: K,
    value: AdmissionDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function validateStep(targetStep: number): string | null {
    if (targetStep === 0) {
      if (
        !draft.name.trim() ||
        !draft.phone.trim() ||
        !draft.guardianName.trim() ||
        !draft.guardianPhone.trim()
      ) {
        return "Complete the required student details to continue.";
      }
    }
    if (
      targetStep === 1 &&
      (!selectedPlan || !["1", "3", "6", "12"].includes(draft.durationMonths))
    ) {
      return "Choose a membership plan and valid duration.";
    }
    if (targetStep === 2) {
      if (!selectedRoom || !selectedSlot)
        return "Choose a valid room and time slot.";
      if (assignmentsLoading)
        return "Seat availability is still loading. Try again in a moment.";
      if (
        !draft.startDate ||
        !draft.endDate ||
        draft.startDate > draft.endDate
      ) {
        return "The end date must be on or after the start date.";
      }
      if (!availableSeat)
        return "No seat is available for this room, date range, and time slot.";
      if (
        findAssignmentConflict(
          {
            roomId: selectedRoom.id,
            seatNumber: availableSeat,
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            startDate: draft.startDate,
            endDate: draft.endDate,
          },
          assignments,
        )
      ) {
        return "That seat was just reserved for an overlapping date and time.";
      }
    }
    if (targetStep === 3) {
      const amounts = [
        admissionFeeValue,
        depositValue,
        discountValue,
        Number(draft.initialPayment),
      ];
      if (amounts.some((amount) => !Number.isFinite(amount) || amount < 0)) {
        return "Enter valid non-negative amounts for all payment fields.";
      }
      if (discountValue > membershipTotal + admissionFeeValue + depositValue) {
        return "The discount cannot exceed the fees and deposit.";
      }
      if (Number(draft.initialPayment) > totalDue) {
        return "Initial payment cannot be greater than the total due.";
      }
    }
    return null;
  }

  function continueStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateStep(step);
    if (error) {
      showToast(error, "error");
      return;
    }
    setStep((current) => Math.min(4, current + 1));
  }

  async function confirmAdmission() {
    if (isSubmitting) return;
    const invalidStep = [0, 1, 2, 3].find((index) => validateStep(index));
    if (invalidStep !== undefined) {
      setStep(invalidStep);
      showToast(
        validateStep(invalidStep) ?? "Review the admission details.",
        "error",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      let student = savedStudent;
      if (!student) {
        const response = await fetch("/api/v1/admissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: draft.name.trim(),
            phone: draft.phone.trim(),
            guardianName: draft.guardianName.trim(),
            guardianPhone: draft.guardianPhone.trim(),
            documentImageDataUrl: draft.documentImageDataUrl,
            planId: draft.planId,
            durationMonths: draft.durationMonths,
            startDate: draft.startDate,
            endDate: draft.endDate,
            admissionFee: draft.admissionFee,
            deposit: draft.deposit,
            discount: draft.discount,
            initialPayment: draft.initialPayment,
            paymentMethod: draft.paymentMethod,
          }),
        });
        const payload = (await response.json()) as {
          student?: Student;
          message?: string;
        };
        if (!response.ok || !payload.student) {
          throw new Error(payload.message ?? "Admission could not be saved.");
        }
        student = payload.student;
        setSavedStudent(student);
        setStudents((current) => [student!, ...current]);
      }

      const assignmentResponse = await fetch("/api/v1/seat-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          roomId: selectedRoom?.id,
          seatNumber: availableSeat,
          timeSlotId: selectedSlot?.id,
          timeSlotName: selectedSlot?.name,
          startTime: selectedSlot?.startTime,
          endTime: selectedSlot?.endTime,
          startDate: draft.startDate,
          endDate: draft.endDate,
        }),
      });
      const assignmentPayload = (await assignmentResponse.json()) as {
        assignment?: SeatAssignment;
        message?: string;
      };
      if (!assignmentResponse.ok || !assignmentPayload.assignment) {
        throw new Error(
          `Student profile is saved, but seat assignment failed: ${assignmentPayload.message ?? "Please retry the reservation."}`,
        );
      }

      setAssignments((current) => [assignmentPayload.assignment!, ...current]);
      setCompletedName(student.name);
      showToast(
        `${student.name} was admitted and assigned ${assignmentPayload.assignment.seatNumber}.`,
        "success",
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Admission could not be saved.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function startAnotherAdmission() {
    const today = todayValue();
    setDraft((current) => ({
      ...current,
      name: "",
      phone: "",
      guardianName: "",
      guardianPhone: "",
      documentImageDataUrl: "",
      startDate: today,
      endDate: addDays(today, 30),
      initialPayment: "0",
    }));
    setStep(0);
    setCompletedName("");
    setSavedStudent(null);
  }

  if (completedName) {
    const admitted = students.find((student) => student.name === completedName);
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Card className="px-5 py-10 text-center sm:px-10">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
            <Check size={25} />
          </span>
          <p className="mt-5 text-xs font-semibold uppercase text-primary">
            Admission confirmed
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Welcome, {completedName}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Student profile and initial payment were saved to your library. Seat
            availability and assignment are still stored in this browser.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {admitted && (
              <Link
                href={`/students/${admitted.id}`}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                View student <ArrowRight size={15} />
              </Link>
            )}
            <button
              type="button"
              onClick={startAnotherAdmission}
              className="h-10 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted"
            >
              Start another admission
            </button>
          </div>
        </Card>
        <ToastViewport toast={toast} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Create a student profile, membership, seat reservation, and first
            payment.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Student details save to your library · seat availability uses this
            browser’s saved assignments
          </p>
        </div>
        <Link
          href="/students"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
        >
          <ArrowLeft size={15} /> Student directory
        </Link>
      </div>

      <div
        className="grid grid-cols-5 gap-1 sm:gap-3"
        aria-label="Admission progress"
      >
        {steps.map((item, index) => {
          const Icon = item.icon;
          const active = step === index;
          const complete = step > index;
          return (
            <button
              key={item.title}
              type="button"
              disabled={index > step}
              onClick={() => setStep(index)}
              aria-current={active ? "step" : undefined}
              className={`flex min-w-0 items-center gap-2 border-t-2 px-1 pt-2.5 text-left text-xs disabled:cursor-default sm:px-2 ${active ? "border-primary text-primary" : complete ? "border-primary/40 text-foreground" : "border-border text-muted-foreground"}`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full ${active ? "bg-primary text-primary-foreground" : complete ? "bg-primary/10 text-primary" : "bg-muted"}`}
              >
                {complete ? <Check size={14} /> : <Icon size={14} />}
              </span>
              <span className="hidden truncate font-medium sm:block">
                {item.title}
              </span>
              <span className="sr-only sm:hidden">{item.title}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={continueStep}>
        <Card className="p-4 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-primary">
                STEP {step + 1} OF 5
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {step === 0
                  ? "Student details"
                  : step === 1
                    ? "Membership plan"
                    : step === 2
                      ? "Room and seat"
                      : step === 3
                        ? "Admission payment"
                        : "Review admission"}
              </h2>
            </div>
            {step === 4 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
                <ClipboardCheck size={13} /> Ready to confirm
              </span>
            )}
          </div>

          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Student full name">
                <input
                  autoFocus
                  required
                  value={draft.name}
                  onChange={(event) => update("name", event.target.value)}
                  className={inputClass}
                  placeholder="e.g. Ishita Rao"
                />
              </Field>
              <Field label="Phone number">
                <input
                  required
                  type="tel"
                  value={draft.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  className={inputClass}
                  placeholder="+91 98765 43210"
                />
              </Field>
              <Field label="Parent / guardian name">
                <input
                  required
                  value={draft.guardianName}
                  onChange={(event) =>
                    update("guardianName", event.target.value)
                  }
                  className={inputClass}
                  placeholder="Full name"
                />
              </Field>
              <Field label="Guardian contact number">
                <input
                  required
                  type="tel"
                  value={draft.guardianPhone}
                  onChange={(event) =>
                    update("guardianPhone", event.target.value)
                  }
                  className={inputClass}
                  placeholder="+91 98765 43210"
                />
              </Field>
              <Field label="Document image (optional)">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (!file) {
                      update("documentImageDataUrl", "");
                      return;
                    }
                    if (!file.type.startsWith("image/")) {
                      showToast("Choose an image file.", "error");
                      event.currentTarget.value = "";
                      return;
                    }
                    if (file.size > 1024 * 1024) {
                      showToast(
                        "The document image must be 1 MB or smaller.",
                        "error",
                      );
                      event.currentTarget.value = "";
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") {
                        update("documentImageDataUrl", reader.result);
                      }
                    };
                    reader.onerror = () =>
                      showToast(
                        "The document image could not be read.",
                        "error",
                      );
                    reader.readAsDataURL(file);
                  }}
                  className={inputClass}
                />
                {draft.documentImageDataUrl && (
                  <Image
                    src={draft.documentImageDataUrl}
                    alt="Uploaded document preview"
                    width={320}
                    height={180}
                    unoptimized
                    className="mt-2 max-h-36 w-auto rounded-md border border-border object-contain"
                  />
                )}
              </Field>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                A profile is created after the final review. All details remain
                editable in the student directory.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-3 md:grid-cols-3">
              {membershipPlans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  aria-pressed={draft.planId === plan.id}
                  onClick={() => update("planId", plan.id)}
                  className={`rounded-lg border p-4 text-left transition-colors ${draft.planId === plan.id ? "border-primary bg-secondary/70 ring-1 ring-primary" : "border-border hover:border-primary/40 hover:bg-muted/40"}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{plan.name}</span>
                    {draft.planId === plan.id && (
                      <Check size={15} className="text-primary" />
                    )}
                  </span>
                  <span className="mt-2 block text-lg font-semibold">
                    {currency.format(plan.monthlyPrice)}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      / month
                    </span>
                  </span>
                  <span className="mt-2 block min-h-10 text-xs leading-5 text-muted-foreground">
                    {plan.description}
                  </span>
                </button>
              ))}
              <Field label="Membership duration" className="md:col-span-3">
                <select
                  value={draft.durationMonths}
                  onChange={(event) =>
                    update("durationMonths", event.target.value)
                  }
                  className={`${inputClass} max-w-xs`}
                >
                  <option value="1">1 month</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                </select>
              </Field>
              <div className="rounded-md bg-muted/60 px-3.5 py-3 text-sm md:col-span-3">
                <span className="text-muted-foreground">Membership total</span>
                <strong className="float-right">
                  {currency.format(membershipTotal)}
                </strong>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Room">
                <select
                  value={selectedRoom?.id ?? ""}
                  onChange={(event) => {
                    const room = rooms.find(
                      (item) => item.id === event.target.value,
                    );
                    update("roomId", event.target.value);
                    update("seatNumber", room ? `${room.seatPrefix}-01` : "");
                  }}
                  disabled={roomsLoading || rooms.length === 0}
                  className={inputClass}
                >
                  {!rooms.length && (
                    <option value="">No rooms available</option>
                  )}
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} · {room.floor}
                    </option>
                  ))}
                </select>
                {roomsError && (
                  <span className="mt-1 block text-xs text-destructive">
                    {roomsError}
                  </span>
                )}
                {!roomsLoading && !rooms.length && (
                  <Link
                    href="/rooms-seats"
                    className="mt-1 inline-block text-xs text-primary hover:underline"
                  >
                    Create a room first
                  </Link>
                )}
              </Field>
              <Field label="Time slot">
                <select
                  value={selectedSlot?.id ?? ""}
                  onChange={(event) => update("timeSlotId", event.target.value)}
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
              <Field label="Start date">
                <input
                  required
                  type="date"
                  min={todayValue()}
                  value={draft.startDate}
                  onChange={(event) => update("startDate", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="End date">
                <input
                  required
                  type="date"
                  min={draft.startDate}
                  value={draft.endDate}
                  onChange={(event) => update("endDate", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Available seat">
                <select
                  value={availableSeat}
                  onChange={(event) => update("seatNumber", event.target.value)}
                  disabled={!seatOptions.length}
                  className={inputClass}
                >
                  {seatOptions.length ? (
                    seatOptions.map((seat) => (
                      <option key={seat} value={seat}>
                        {seat}
                      </option>
                    ))
                  ) : (
                    <option value="">No seats available</option>
                  )}
                </select>
              </Field>
              <div className="flex items-end pb-2 text-xs text-muted-foreground">
                <span>
                  {seatOptions.length} seats available for this selection
                </span>
              </div>
              <p className="rounded-md border border-accent/70 bg-accent/30 p-3 text-xs leading-5 text-accent-foreground sm:col-span-2">
                Availability is checked again by the server when you confirm.
                Adjacent time slots may share a seat; overlapping time and date
                ranges cannot.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-border p-4 sm:col-span-2">
                <CostRow
                  label={`${selectedPlan?.name ?? "Membership"} · ${draft.durationMonths} month${draft.durationMonths === "1" ? "" : "s"}`}
                  amount={membershipTotal}
                />
                <CostRow label="Admission fee" amount={admissionFeeValue} />
                <CostRow label="Refundable deposit" amount={depositValue} />
                <div className="flex justify-between gap-3 text-sm text-primary">
                  <span>Discount</span>
                  <span>− {currency.format(discountValue)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold">
                  <span>Total due</span>
                  <span>{currency.format(totalDue)}</span>
                </div>
              </div>
              <Field label="Admission fee (₹)">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={draft.admissionFee}
                  onChange={(event) =>
                    update("admissionFee", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Security deposit (₹)">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={draft.deposit}
                  onChange={(event) => update("deposit", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Discount (₹)">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={draft.discount}
                  onChange={(event) => update("discount", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Initial payment (₹)">
                <input
                  required
                  type="number"
                  min="0"
                  max={totalDue}
                  step="1"
                  value={draft.initialPayment}
                  onChange={(event) =>
                    update("initialPayment", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Payment method" className="sm:col-span-2">
                <select
                  value={draft.paymentMethod}
                  onChange={(event) =>
                    update(
                      "paymentMethod",
                      event.target.value as PaymentRecord["method"],
                    )
                  }
                  className={`${inputClass} sm:max-w-xs`}
                >
                  <option>UPI</option>
                  <option>Cash</option>
                  <option>Card</option>
                  <option>Bank transfer</option>
                </select>
              </Field>
              <div className="flex justify-between rounded-md bg-muted/60 px-3.5 py-3 text-sm sm:col-span-2">
                <span className="text-muted-foreground">
                  Balance after initial payment
                </span>
                <strong>
                  {currency.format(
                    Math.max(0, totalDue - Number(draft.initialPayment || 0)),
                  )}
                </strong>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-4 md:grid-cols-2">
              <ReviewGroup title="Student details" icon={UserRound}>
                <ReviewLine label="Name" value={draft.name || "Not provided"} />
                <ReviewLine
                  label="Email"
                  value={generateAdmissionEmail(draft.name || "student")}
                />
                <ReviewLine
                  label="Phone"
                  value={draft.phone || "Not provided"}
                />
                <ReviewLine
                  label="Guardian"
                  value={draft.guardianName || "Not provided"}
                />
                <ReviewLine
                  label="Guardian contact"
                  value={draft.guardianPhone || "Not provided"}
                />
                <ReviewLine
                  label="Document image"
                  value={
                    draft.documentImageDataUrl ? "Uploaded" : "Not provided"
                  }
                />
              </ReviewGroup>
              <ReviewGroup title="Membership" icon={BadgeCheck}>
                <ReviewLine
                  label="Plan"
                  value={selectedPlan?.name ?? "Not selected"}
                />
                <ReviewLine
                  label="Duration"
                  value={`${draft.durationMonths} month${draft.durationMonths === "1" ? "" : "s"}`}
                />
                <ReviewLine
                  label="Membership value"
                  value={currency.format(membershipTotal)}
                />
              </ReviewGroup>
              <ReviewGroup title="Seat reservation" icon={Armchair}>
                <ReviewLine
                  label="Room"
                  value={selectedRoom?.name ?? "Not selected"}
                />
                <ReviewLine
                  label="Seat"
                  value={availableSeat || "No seat selected"}
                />
                <ReviewLine
                  label="Time"
                  value={
                    selectedSlot
                      ? `${selectedSlot.name} · ${formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}`
                      : "Not selected"
                  }
                />
                <ReviewLine
                  label="Dates"
                  value={`${draft.startDate} to ${draft.endDate}`}
                />
              </ReviewGroup>
              <ReviewGroup title="Payment summary" icon={CircleDollarSign}>
                <ReviewLine
                  label="Admission + deposit"
                  value={currency.format(admissionFeeValue + depositValue)}
                />
                <ReviewLine
                  label="Discount"
                  value={`− ${currency.format(discountValue)}`}
                />
                <ReviewLine
                  label="Total due"
                  value={currency.format(totalDue)}
                  strong
                />
                <ReviewLine
                  label="Initial payment"
                  value={`${currency.format(Number(draft.initialPayment))} · ${draft.paymentMethod}`}
                />
              </ReviewGroup>
              <div className="rounded-md border border-accent/70 bg-accent/30 p-3 text-xs leading-5 text-accent-foreground md:col-span-2">
                Confirming writes demo data to this browser only. Seat
                availability and overlap checks are client-side demonstrations,
                not server-side booking validation.
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays size={14} /> Draft stays on this page while you move
              between steps
            </span>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((current) => current - 1)}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3.5 text-sm font-medium hover:bg-muted"
                >
                  <ArrowLeft size={15} /> Back
                </button>
              )}
              {step < 4 ? (
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Continue <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={confirmAdmission}
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  <Check size={15} />
                  {isSubmitting ? "Saving admission..." : "Confirm admission"}
                </button>
              )}
            </div>
          </div>
        </Card>
      </form>
      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

function CostRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{currency.format(amount)}</span>
    </div>
  );
}

function ReviewGroup({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof UserRound;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon size={16} className="text-primary" />
        {title}
      </h3>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function ReviewLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <p className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`text-right ${strong ? "font-semibold text-foreground" : "font-medium"}`}
      >
        {value}
      </span>
    </p>
  );
}
