"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  BadgeIndianRupee,
  BellRing,
  BookOpen,
  Building2,
  Clock3,
  Copy,
  KeyRound,
  LogOut,
  ReceiptText,
  Save,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, inputClass } from "@/components/ui/field";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { logout } from "@/lib/auth/service";
import {
  useLibraryConfiguration,
  type LibraryConfiguration,
} from "@/components/use-library-configuration";
import { intervalsOverlap, type TimeSlot } from "@/lib/seat-management";
import {
  weekDays,
  type LibrarySettings,
  type TimeSlotPreference,
} from "@/lib/settings-management";
import type { MembershipPlan } from "@/lib/student-management";

const tabs = [
  { id: "general", label: "General", icon: Building2 },
  { id: "hours", label: "Operating hours", icon: Clock3 },
  { id: "slots", label: "Time slots", icon: Settings2 },
  { id: "memberships", label: "Membership plans", icon: BadgeIndianRupee },
  { id: "receipts", label: "Receipts", icon: ReceiptText },
  { id: "notifications", label: "Notifications", icon: BellRing },
  { id: "account", label: "Account & security", icon: ShieldCheck },
] as const;
type SettingsTab = (typeof tabs)[number]["id"];

function membershipPlanId(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "plan"
  );
}

function defaultSlotName(slot: TimeSlot) {
  return slot.name;
}

function SlotDialog({
  slot,
  existing,
  onCancel,
  onSave,
}: {
  slot: TimeSlotPreference | null;
  existing: TimeSlotPreference[];
  onCancel: () => void;
  onSave: (slot: TimeSlotPreference) => void;
}) {
  const [name, setName] = useState(slot ? defaultSlotName(slot) : "");
  const [startTime, setStartTime] = useState(slot?.startTime ?? "07:00");
  const [endTime, setEndTime] = useState(slot?.endTime ?? "15:00");
  const invalid =
    !name.trim() ||
    startTime >= endTime ||
    existing.some(
      (item) =>
        item.id !== slot?.id &&
        item.name.toLowerCase() === name.trim().toLowerCase(),
    );
  const overlaps = existing.some(
    (item) =>
      item.active !== false &&
      item.id !== slot?.id &&
      intervalsOverlap(item.startTime, item.endTime, startTime, endTime),
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (invalid) return;
    onSave({
      id: slot?.id ?? `slot-${Date.now()}`,
      name: name.trim(),
      startTime,
      endTime,
      active: slot?.active ?? true,
    });
  }

  return (
    <div className="fixed inset-0 z-70 grid place-items-center bg-foreground/40 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="slot-title"
        className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl"
      >
        <h2 id="slot-title" className="text-lg font-semibold">
          {slot ? "Edit time slot" : "Add time slot"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Historical assignments keep their original slot names and hours.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <Field label="Slot name">
            <input
              autoFocus
              required
              maxLength={32}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start time">
              <input
                required
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="End time">
              <input
                required
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          {overlaps && (
            <p className="rounded-md border border-accent/70 bg-accent/30 p-3 text-xs leading-5 text-accent-foreground">
              These hours overlap another active template. The seat-assignment
              validator checks exact hours before allowing a shared seat.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="h-9 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={invalid}
              className="h-9 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Save slot
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function MembershipPlanDialog({
  plan,
  existing,
  onCancel,
  onSave,
}: {
  plan: MembershipPlan | null;
  existing: MembershipPlan[];
  onCancel: () => void;
  onSave: (plan: MembershipPlan) => void;
}) {
  const [name, setName] = useState(plan?.name ?? "");
  const [monthlyPrice, setMonthlyPrice] = useState(
    String(plan?.monthlyPrice ?? 1800),
  );
  const [description, setDescription] = useState(plan?.description ?? "");
  const invalid =
    !name.trim() ||
    !Number.isFinite(Number(monthlyPrice)) ||
    Number(monthlyPrice) < 0 ||
    existing.some(
      (item) =>
        item.id !== plan?.id &&
        item.name.toLowerCase() === name.trim().toLowerCase(),
    );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (invalid) return;
    onSave({
      id: plan?.id ?? membershipPlanId(name),
      name: name.trim(),
      monthlyPrice: Number(monthlyPrice),
      description: description.trim(),
      active: plan?.active ?? true,
    });
  }

  return (
    <div className="fixed inset-0 z-70 grid place-items-center bg-foreground/40 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="membership-plan-title"
        className="w-full max-w-md rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xl"
      >
        <h2 id="membership-plan-title" className="text-lg font-semibold">
          {plan ? "Edit membership plan" : "Add membership plan"}
        </h2>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <Field label="Plan name">
            <input
              autoFocus
              required
              maxLength={60}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Monthly price (₹)">
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={monthlyPrice}
              onChange={(event) => setMonthlyPrice(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Description">
            <textarea
              maxLength={200}
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`${inputClass} h-auto resize-y py-2.5`}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="h-9 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={invalid}
              className="h-9 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Save plan
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function SettingsPage() {
  const { configuration, loading, error, saveConfiguration } =
    useLibraryConfiguration();
  if (loading) {
    return (
      <Card className="grid min-h-64 place-items-center p-6 text-sm text-muted-foreground">
        Loading library settings…
      </Card>
    );
  }
  if (error) {
    return (
      <Card className="p-6 text-sm text-destructive" role="alert">
        {error}
      </Card>
    );
  }
  return (
    <SettingsForm
      configuration={configuration}
      saveConfiguration={saveConfiguration}
    />
  );
}

function SettingsForm({
  configuration,
  saveConfiguration,
}: {
  configuration: LibraryConfiguration;
  saveConfiguration: (
    configuration: LibraryConfiguration,
  ) => Promise<LibraryConfiguration>;
}) {
  const [savedConfiguration, setSavedConfiguration] = useState(configuration);
  const [draft, setDraft] = useState<LibrarySettings>(configuration.settings);
  const [slots, setSlots] = useState(configuration.timeSlots);
  const [plans, setPlans] = useState(configuration.membershipPlans);
  const { toast, showToast, dismissToast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [saving, setSaving] = useState(false);
  const [slotDialog, setSlotDialog] = useState<
    TimeSlotPreference | null | undefined
  >();
  const [planDialog, setPlanDialog] = useState<
    MembershipPlan | null | undefined
  >();
  const [confirmReset, setConfirmReset] = useState(false);
  const [password, setPassword] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const isDirty =
    JSON.stringify({
      settings: draft,
      timeSlots: slots,
      membershipPlans: plans,
    }) !== JSON.stringify(savedConfiguration);

  function update<K extends keyof LibrarySettings>(
    key: K,
    value: LibrarySettings[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateHour(
    day: string,
    changes: Partial<LibrarySettings["operatingHours"][string]>,
  ) {
    setDraft((current) => ({
      ...current,
      operatingHours: {
        ...current.operatingHours,
        [day]: { ...current.operatingHours[day], ...changes },
      },
    }));
  }

  async function saveSettings() {
    if (
      !draft.libraryName.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contactEmail)
    ) {
      showToast("Enter a library name and valid contact email.", "error");
      return;
    }
    const invalidHours = weekDays.find(
      (day) =>
        !draft.operatingHours[day].closed &&
        draft.operatingHours[day].closesAt <= draft.operatingHours[day].opensAt,
    );
    if (invalidHours) {
      showToast(
        `${invalidHours}: closing time must be later than opening time.`,
        "error",
      );
      setActiveTab("hours");
      return;
    }
    if (!draft.receiptPrefix.trim() || draft.startingReceiptNumber < 1) {
      showToast(
        "Enter a receipt prefix and starting number above zero.",
        "error",
      );
      setActiveTab("receipts");
      return;
    }
    const savedSettings = {
      ...draft,
      libraryName: draft.libraryName.trim(),
      receiptPrefix: draft.receiptPrefix.trim().toUpperCase(),
    };
    setSaving(true);
    try {
      const saved = await saveConfiguration({
        settings: savedSettings,
        timeSlots: slots,
        membershipPlans: plans,
      });
      setSavedConfiguration(saved);
      setDraft(saved.settings);
      setSlots(saved.timeSlots);
      setPlans(saved.membershipPlans);
      showToast("Library settings saved.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Settings could not be saved.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  function resetSettings() {
    setDraft(savedConfiguration.settings);
    setSlots(savedConfiguration.timeSlots);
    setPlans(savedConfiguration.membershipPlans);
    setConfirmReset(false);
    showToast("Unsaved changes were discarded.", "success");
  }

  function copyMondayHours() {
    const monday = draft.operatingHours.Monday;
    setDraft((current) => ({
      ...current,
      operatingHours: Object.fromEntries(
        weekDays.map((day) => [day, day === "Monday" ? monday : { ...monday }]),
      ),
    }));
    showToast("Monday’s hours were copied to every day.", "success");
  }

  function saveSlot(next: TimeSlotPreference) {
    setSlots((current) =>
      current.some((slot) => slot.id === next.id)
        ? current.map((slot) => (slot.id === next.id ? next : slot))
        : [...current, next],
    );
    setSlotDialog(undefined);
    showToast("Time slot changes added to the settings draft.", "success");
  }

  function toggleSlot(slot: TimeSlotPreference) {
    setSlots((current) =>
      current.map((item) =>
        item.id === slot.id ? { ...item, active: item.active === false } : item,
      ),
    );
    showToast(`${slot.name} status changed in the settings draft.`, "success");
  }

  function savePlan(nextPlan: MembershipPlan) {
    setPlans((current) =>
      current.some((plan) => plan.id === nextPlan.id)
        ? current.map((plan) => (plan.id === nextPlan.id ? nextPlan : plan))
        : [...current, nextPlan],
    );
    setPlanDialog(undefined);
    showToast(
      "Membership plan changes added to the settings draft.",
      "success",
    );
  }

  function togglePlan(plan: MembershipPlan) {
    if (
      plan.active !== false &&
      plans.filter((item) => item.active !== false).length <= 1
    ) {
      showToast("Keep at least one active membership plan.", "error");
      return;
    }
    setPlans((current) =>
      current.map((item) =>
        item.id === plan.id ? { ...item, active: item.active === false } : item,
      ),
    );
  }

  function readLogo(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Choose an image file for the library logo.", "error");
      return;
    }
    if (file.size > 1_500_000) {
      showToast("Logo image must be under 1.5 MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("logoDataUrl", String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.next !== password.confirm) {
      showToast("New passwords do not match.", "error");
      return;
    }
    setPasswordSaving(true);
    try {
      const response = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: password.current,
          newPassword: password.next,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Password could not be changed.");
      }
      setPassword({ current: "", next: "", confirm: "" });
      showToast(payload.message ?? "Password changed successfully.", "success");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Password could not be changed.",
        "error",
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  async function signOut() {
    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } catch {
      showToast("Could not end the session. Please try again.", "error");
    }
  }

  const tabTitle = tabs.find((tab) => tab.id === activeTab)?.label ?? "General";

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm text-muted-foreground">
          Configure this reading room’s profile, daily schedule, receipts, and
          preferences.
        </p>
      </section>
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Card className="h-fit overflow-hidden p-2">
          <nav
            aria-label="Settings sections"
            className="grid gap-1 sm:grid-cols-3 lg:grid-cols-1"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={activeTab === tab.id ? "page" : undefined}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-h-10 items-center gap-2.5 rounded-md px-3 text-left text-sm font-medium ${activeTab === tab.id ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </Card>

        <div className="min-w-0 space-y-4">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="text-base font-semibold">{tabTitle}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Changes are saved to this library when you select Save
                  changes.
                </p>
              </div>
              {isDirty && (
                <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
                  Unsaved changes
                </span>
              )}
            </div>

            {activeTab === "general" && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Library name">
                  <input
                    value={draft.libraryName}
                    onChange={(event) =>
                      update("libraryName", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Contact email">
                  <input
                    type="email"
                    value={draft.contactEmail}
                    onChange={(event) =>
                      update("contactEmail", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Phone number">
                  <input
                    type="tel"
                    value={draft.phone}
                    onChange={(event) => update("phone", event.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Timezone">
                  <select
                    value={draft.timezone}
                    onChange={(event) => update("timezone", event.target.value)}
                    className={inputClass}
                  >
                    <option>Asia/Kolkata</option>
                    <option>Asia/Dubai</option>
                    <option>Asia/Singapore</option>
                    <option>Europe/London</option>
                    <option>America/New_York</option>
                  </select>
                </Field>
                <Field label="Address" className="sm:col-span-2">
                  <input
                    value={draft.address}
                    onChange={(event) => update("address", event.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="City">
                  <input
                    value={draft.city}
                    onChange={(event) => update("city", event.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="State">
                  <input
                    value={draft.state}
                    onChange={(event) => update("state", event.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Postal code">
                  <input
                    inputMode="numeric"
                    value={draft.postalCode}
                    onChange={(event) =>
                      update("postalCode", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Currency">
                  <input
                    readOnly
                    value="Indian Rupee (INR)"
                    className={`${inputClass} text-muted-foreground`}
                  />
                </Field>
                <Field label="Library logo" className="sm:col-span-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => readLogo(event.target.files?.[0])}
                      className="block w-full max-w-sm text-xs text-muted-foreground file:mr-3 file:h-9 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:text-xs file:font-medium file:text-secondary-foreground"
                    />
                    {draft.logoDataUrl && (
                      <span className="flex items-center gap-2">
                        <Image
                          alt="Library logo preview"
                          src={draft.logoDataUrl}
                          width={40}
                          height={40}
                          unoptimized
                          className="size-10 rounded border border-border object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => update("logoDataUrl", "")}
                          className="text-xs text-destructive hover:underline"
                        >
                          Remove logo
                        </button>
                      </span>
                    )}
                  </div>
                </Field>
              </div>
            )}

            {activeTab === "hours" && (
              <div className="mt-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    Opening and closing hours use the library timezone:{" "}
                    {draft.timezone}.
                  </p>
                  <button
                    type="button"
                    onClick={copyMondayHours}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium hover:bg-muted"
                  >
                    <Copy size={13} /> Copy Monday to all
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-150 text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-[11px] uppercase text-muted-foreground">
                        <th className="py-3 pr-3">Day</th>
                        <th className="py-3 px-2">Opening</th>
                        <th className="py-3 px-2">Closing</th>
                        <th className="py-3 px-2">Closed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekDays.map((day) => {
                        const hours = draft.operatingHours[day];
                        return (
                          <tr
                            key={day}
                            className="border-b border-border last:border-0"
                          >
                            <th className="py-3 pr-3 text-left font-medium">
                              {day}
                            </th>
                            <td className="px-2 py-2">
                              <input
                                aria-label={`${day} opening time`}
                                type="time"
                                disabled={hours.closed}
                                value={hours.opensAt}
                                onChange={(event) =>
                                  updateHour(day, {
                                    opensAt: event.target.value,
                                  })
                                }
                                className={`${inputClass} max-w-40`}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                aria-label={`${day} closing time`}
                                type="time"
                                disabled={hours.closed}
                                value={hours.closesAt}
                                onChange={(event) =>
                                  updateHour(day, {
                                    closesAt: event.target.value,
                                  })
                                }
                                className={`${inputClass} max-w-40`}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <label className="inline-flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={hours.closed}
                                  onChange={(event) =>
                                    updateHour(day, {
                                      closed: event.target.checked,
                                    })
                                  }
                                  className="size-4 accent-primary"
                                />{" "}
                                Closed
                              </label>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Closing time must be later than opening time. Save Changes
                  validates all open days.
                </p>
              </div>
            )}

            {activeTab === "slots" && (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Manage the same slot templates used by seat assignments.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Inactive templates are retained so existing assignment
                      history stays readable.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSlotDialog(null)}
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    <BookOpen size={15} /> Add slot
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-140 text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/60 text-[11px] uppercase text-muted-foreground">
                        <th className="px-3 py-3">Slot name</th>
                        <th className="px-3 py-3">Hours</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slots.map((slot) => (
                        <tr
                          key={slot.id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-3 py-3 font-medium">{slot.name}</td>
                          <td className="px-3 py-3 tabular-nums">
                            {formatTime(slot.startTime)}–
                            {formatTime(slot.endTime)}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${slot.active === false ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}
                            >
                              {slot.active === false ? "Inactive" : "Active"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setSlotDialog(slot)}
                                className="h-8 rounded-md border border-border px-2.5 text-xs font-medium hover:bg-muted"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleSlot(slot)}
                                className="h-8 rounded-md border border-border px-2.5 text-xs font-medium hover:bg-muted"
                              >
                                {slot.active === false
                                  ? "Activate"
                                  : "Deactivate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Slot edits are drafts until you save the settings.
                </p>
              </div>
            )}

            {activeTab === "memberships" && (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Set the plans and monthly prices used for admissions and
                      renewals.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Inactive plans stay on existing student records but cannot
                      be selected for new admissions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPlanDialog(null)}
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    <BadgeIndianRupee size={15} /> Add plan
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-140 text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/60 text-[11px] uppercase text-muted-foreground">
                        <th className="px-3 py-3">Plan</th>
                        <th className="px-3 py-3">Monthly price</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((plan) => (
                        <tr
                          key={plan.id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-3 py-3">
                            <span className="block font-medium">
                              {plan.name}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {plan.description || "No description"}
                            </span>
                          </td>
                          <td className="px-3 py-3 tabular-nums">
                            {new Intl.NumberFormat("en-IN", {
                              style: "currency",
                              currency: "INR",
                              maximumFractionDigits: 2,
                            }).format(plan.monthlyPrice)}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${plan.active === false ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}
                            >
                              {plan.active === false ? "Inactive" : "Active"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setPlanDialog(plan)}
                                className="h-8 rounded-md border border-border px-2.5 text-xs font-medium hover:bg-muted"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => togglePlan(plan)}
                                className="h-8 rounded-md border border-border px-2.5 text-xs font-medium hover:bg-muted"
                              >
                                {plan.active === false
                                  ? "Activate"
                                  : "Deactivate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Plan edits are drafts until you save the settings.
                </p>
              </div>
            )}

            {activeTab === "receipts" && (
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div className="grid content-start gap-4 sm:grid-cols-2">
                  <Field label="Receipt header" className="sm:col-span-2">
                    <input
                      value={draft.receiptHeader}
                      onChange={(event) =>
                        update("receiptHeader", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Footer message" className="sm:col-span-2">
                    <textarea
                      rows={3}
                      value={draft.receiptFooter}
                      onChange={(event) =>
                        update("receiptFooter", event.target.value)
                      }
                      className={`${inputClass} h-auto min-h-20 resize-y py-2.5`}
                    />
                  </Field>
                  <Field label="Contact information">
                    <input
                      value={draft.receiptContact}
                      onChange={(event) =>
                        update("receiptContact", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Receipt prefix">
                    <input
                      maxLength={8}
                      value={draft.receiptPrefix}
                      onChange={(event) =>
                        update("receiptPrefix", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Next receipt number">
                    <input
                      min="1"
                      type="number"
                      value={draft.startingReceiptNumber}
                      onChange={(event) =>
                        update(
                          "startingReceiptNumber",
                          Number(event.target.value),
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                  <div className="grid content-center gap-2">
                    <label className="inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={draft.receiptShowAddress}
                        onChange={(event) =>
                          update("receiptShowAddress", event.target.checked)
                        }
                        className="size-4 accent-primary"
                      />{" "}
                      Show address
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={draft.receiptShowContact}
                        onChange={(event) =>
                          update("receiptShowContact", event.target.checked)
                        }
                        className="size-4 accent-primary"
                      />{" "}
                      Show contact
                    </label>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-background p-4 sm:p-5">
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase text-primary">
                      {draft.libraryName}
                    </p>
                    {draft.receiptShowAddress && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {draft.address}, {draft.city}
                      </p>
                    )}
                    {draft.receiptShowContact && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {draft.receiptContact}
                      </p>
                    )}
                    <div className="my-4 border-t border-dashed border-border" />
                    <h3 className="text-sm font-semibold">Payment receipt</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {draft.receiptPrefix}-
                      {String(draft.startingReceiptNumber).padStart(5, "0")}
                    </p>
                  </div>
                  <dl className="mt-5 space-y-3 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Member</dt>
                      <dd className="font-medium">Aarav Sharma</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Date</dt>
                      <dd className="font-medium">
                        {new Date().toLocaleDateString("en-IN")}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Recorded amount</dt>
                      <dd className="font-medium">₹1,800</dd>
                    </div>
                  </dl>
                  <div className="my-4 border-t border-dashed border-border" />
                  <p className="text-center text-xs text-muted-foreground">
                    {draft.receiptHeader}
                  </p>
                  <p className="mt-2 text-center text-[10px] text-muted-foreground">
                    {draft.receiptFooter}
                  </p>
                  <p className="mt-4 text-center text-[10px] font-semibold uppercase text-destructive">
                    Demo receipt preview
                  </p>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="mt-5 space-y-2">
                {(
                  [
                    [
                      "membershipExpiry",
                      "Membership expiry reminders",
                      "Show a reminder before a membership ends.",
                    ],
                    [
                      "feeDue",
                      "Fee due reminders",
                      "Show reminders for upcoming invoice due dates.",
                    ],
                    [
                      "overduePayment",
                      "Overdue payment reminders",
                      "Highlight unpaid invoices past their due date.",
                    ],
                    [
                      "admissions",
                      "Admission notifications",
                      "Show an in-app notice when an admission is saved.",
                    ],
                    [
                      "dailyCollection",
                      "Daily collection summary",
                      "Display a daily summary preference for the library team.",
                    ],
                  ] as const
                ).map(([key, label, help]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-border p-3.5"
                  >
                    <span>
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {help}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={draft.notifications[key]}
                      onChange={(event) =>
                        update("notifications", {
                          ...draft.notifications,
                          [key]: event.target.checked,
                        })
                      }
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                    />
                  </label>
                ))}
                <p className="pt-2 text-xs leading-5 text-muted-foreground">
                  These are UI preferences only. No email, SMS, push, or
                  scheduled notifications are sent by this frontend.
                </p>
              </div>
            )}

            {activeTab === "account" && (
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <UserRound size={16} className="text-primary" />
                    <h3 className="text-sm font-semibold">Account profile</h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Name">
                      <input
                        value={draft.profileName}
                        onChange={(event) =>
                          update("profileName", event.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        type="email"
                        value={draft.profileEmail}
                        onChange={(event) =>
                          update("profileEmail", event.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Phone">
                      <input
                        type="tel"
                        value={draft.profilePhone}
                        onChange={(event) =>
                          update("profilePhone", event.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div className="rounded-md bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
                    Workspace profile details are saved with the library
                    settings. Password changes require your current password.
                  </div>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </section>
                <section>
                  <div className="flex items-center gap-2">
                    <KeyRound size={16} className="text-primary" />
                    <h3 className="text-sm font-semibold">Change password</h3>
                  </div>
                  <form onSubmit={changePassword} className="mt-4 space-y-3">
                    <Field label="Current password">
                      <input
                        required
                        type="password"
                        value={password.current}
                        onChange={(event) =>
                          setPassword((current) => ({
                            ...current,
                            current: event.target.value,
                          }))
                        }
                        className={inputClass}
                        autoComplete="current-password"
                      />
                    </Field>
                    <Field label="New password">
                      <input
                        required
                        minLength={8}
                        type="password"
                        value={password.next}
                        onChange={(event) =>
                          setPassword((current) => ({
                            ...current,
                            next: event.target.value,
                          }))
                        }
                        className={inputClass}
                        autoComplete="new-password"
                      />
                    </Field>
                    <Field label="Confirm new password">
                      <input
                        required
                        minLength={8}
                        type="password"
                        value={password.confirm}
                        onChange={(event) =>
                          setPassword((current) => ({
                            ...current,
                            confirm: event.target.value,
                          }))
                        }
                        className={inputClass}
                        autoComplete="new-password"
                      />
                    </Field>
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="h-9 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                      {passwordSaving
                        ? "Changing password…"
                        : "Change password"}
                    </button>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Password changes are verified by the authentication API.
                    </p>
                  </form>
                </section>
                <section className="rounded-lg border border-border p-4 xl:col-span-2">
                  <h3 className="text-sm font-semibold">Session information</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Authentication is managed through your secure server
                    session.
                  </p>
                </section>
              </div>
            )}
          </Card>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              disabled={!isDirty}
              className="h-9 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted disabled:opacity-40"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={saveSettings}
              disabled={!isDirty || saving}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
            >
              <Save size={15} /> {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      {slotDialog !== undefined && (
        <SlotDialog
          slot={slotDialog}
          existing={slots}
          onCancel={() => setSlotDialog(undefined)}
          onSave={saveSlot}
        />
      )}
      {planDialog !== undefined && (
        <MembershipPlanDialog
          plan={planDialog}
          existing={plans}
          onCancel={() => setPlanDialog(undefined)}
          onSave={savePlan}
        />
      )}
      {confirmReset && (
        <ConfirmDialog
          title="Discard unsaved settings?"
          body="Your current form edits will be replaced with the last saved settings."
          confirmLabel="Discard changes"
          onCancel={() => setConfirmReset(false)}
          onConfirm={resetSettings}
        />
      )}
      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-70 grid place-items-center bg-foreground/40 p-4">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl"
      >
        <h2 id="confirm-title" className="text-base font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return `${hours % 12 || 12}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""} ${hours >= 12 ? "PM" : "AM"}`;
}
