"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownUp,
  Check,
  ChevronDown,
  CircleUserRound,
  Eye,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserRoundX,
  UsersRound,
  X,
} from "lucide-react";
import { FinanceSummary, Pagination } from "@/components/finance-shared";
import { Card } from "@/components/ui/card";
import { Field, inputClass } from "@/components/ui/field";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { useDemoState } from "@/components/use-demo-state";
import {
  demoStaff,
  isStaffArray,
  permissionModules,
  permissionsForRole,
  staffRoles,
  type PermissionAction,
  type PermissionModuleId,
  type StaffMember,
  type StaffPermissions,
  type StaffRole,
  type StaffStatus,
} from "@/lib/staff-management";

const pageSize = 6;
const currentUserId = "staff-001";

type StaffForm = Pick<
  StaffMember,
  "name" | "email" | "phone" | "role" | "status" | "permissions" | "notes"
>;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function dateLabel(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(
    "en-IN",
    { day: "numeric", month: "short", year: "numeric" },
  );
}

function permissionsSummary(permissions: StaffPermissions) {
  const readable = permissionModules
    .filter((module) => permissions[module.id]?.includes("View"))
    .map((module) => module.label);
  if (!readable.length) return "No modules assigned";
  if (readable.length <= 2) return readable.join(" · ");
  return `${readable.slice(0, 2).join(" · ")} +${readable.length - 2} more`;
}

function PermissionMatrix({
  permissions,
  onChange,
}: {
  permissions: StaffPermissions;
  onChange: (permissions: StaffPermissions) => void;
}) {
  function toggle(
    moduleId: PermissionModuleId,
    action: PermissionAction,
    checked: boolean,
  ) {
    const next = { ...permissions };
    const actions = new Set(next[moduleId] ?? []);
    if (checked) actions.add(action);
    else actions.delete(action);
    next[moduleId] = Array.from(actions);
    onChange(next);
  }

  function setAll(checked: boolean) {
    onChange(
      Object.fromEntries(
        permissionModules.map((module) => [
          module.id,
          checked ? [...module.actions] : [],
        ]),
      ) as StaffPermissions,
    );
  }

  return (
    <section className="rounded-lg border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-3">
        <div>
          <h3 className="text-sm font-semibold">Module permissions</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose available actions for this demo account.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAll(true)}
            className="h-8 rounded-md border border-border px-2.5 text-xs font-medium hover:bg-muted"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setAll(false)}
            className="h-8 rounded-md border border-border px-2.5 text-xs font-medium hover:bg-muted"
          >
            Clear all
          </button>
        </div>
      </div>
      <div className="max-h-72 overflow-auto">
        <table className="w-full min-w-130 text-left text-xs">
          <thead className="sticky top-0 bg-muted text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 font-medium">Module</th>
              {(["View", "Create", "Edit", "Delete"] as const).map((action) => (
                <th
                  key={action}
                  className="px-2 py-2.5 text-center font-medium"
                >
                  {action}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionModules.map((module) => (
              <tr key={module.id} className="border-t border-border">
                <th
                  scope="row"
                  className="px-3 py-2.5 font-medium text-foreground"
                >
                  {module.label}
                </th>
                {(["View", "Create", "Edit", "Delete"] as const).map(
                  (action) => (
                    <td key={action} className="px-2 py-2.5 text-center">
                      {(module.actions as readonly string[]).includes(action) ? (
                        <input
                          type="checkbox"
                          aria-label={`${action} ${module.label}`}
                          checked={
                            permissions[module.id]?.includes(action) ?? false
                          }
                          onChange={(event) =>
                            toggle(module.id, action, event.target.checked)
                          }
                          className="size-4 accent-primary"
                        />
                      ) : (
                        <span
                          aria-label="Not applicable"
                          className="text-muted-foreground"
                        >
                          —
                        </span>
                      )}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StaffDialog({
  staff,
  onCancel,
  onSave,
}: {
  staff: StaffMember | null;
  onCancel: () => void;
  onSave: (form: StaffForm) => void;
}) {
  const [form, setForm] = useState<StaffForm>(
    staff
      ? {
          name: staff.name,
          email: staff.email,
          phone: staff.phone,
          role: staff.role,
          status: staff.status,
          permissions: staff.permissions,
          notes: staff.notes,
        }
      : {
          name: "",
          email: "",
          phone: "",
          role: "Staff",
          status: "Active",
          permissions: permissionsForRole("Staff"),
          notes: "",
        },
  );
  const [showPermissions, setShowPermissions] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      notes: form.notes.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-70 grid place-items-center overflow-y-auto bg-foreground/40 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-dialog-title"
        className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="staff-dialog-title" className="text-lg font-semibold">
              {staff ? "Edit staff member" : "Add staff member"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Account permissions are a local UI demonstration.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onCancel}
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <X size={17} />
          </button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input
                autoFocus
                required
                maxLength={80}
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Email address">
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Phone number">
              <input
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Role">
              <select
                value={form.role}
                onChange={(event) => {
                  const role = event.target.value as StaffRole;
                  setForm((current) => ({
                    ...current,
                    role,
                    permissions: permissionsForRole(role),
                  }));
                }}
                className={inputClass}
              >
                {staffRoles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </Field>
            <Field label="Account status">
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as StaffStatus,
                  }))
                }
                className={inputClass}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </Field>
            <Field label="Optional notes">
              <input
                maxLength={160}
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                className={inputClass}
                placeholder="Internal note"
              />
            </Field>
          </div>
          <button
            type="button"
            aria-expanded={showPermissions}
            onClick={() => setShowPermissions((value) => !value)}
            className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm font-medium hover:bg-muted"
          >
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={16} /> Manage permissions
            </span>
            <ChevronDown
              size={15}
              className={showPermissions ? "rotate-180" : ""}
            />
          </button>
          {showPermissions && (
            <PermissionMatrix
              permissions={form.permissions}
              onChange={(permissions) =>
                setForm((current) => ({ ...current, permissions }))
              }
            />
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="h-9 rounded-md border border-border px-3.5 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Check size={15} /> {staff ? "Save changes" : "Add staff"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function StaffDetailDialog({
  staff,
  onClose,
  onEdit,
}: {
  staff: StaffMember;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-70 grid place-items-center overflow-y-auto bg-foreground/40 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-detail-title"
        className="my-auto w-full max-w-xl rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-secondary text-sm font-semibold text-primary">
              {initials(staff.name)}
            </span>
            <div>
              <h2 id="staff-detail-title" className="text-lg font-semibold">
                {staff.name}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {staff.role} · {staff.status}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close details"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <X size={17} />
          </button>
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <Detail label="Email" value={staff.email} icon={Mail} />
          <Detail
            label="Phone"
            value={staff.phone || "Not provided"}
            icon={Phone}
          />
          <Detail
            label="Date added"
            value={dateLabel(staff.dateAdded)}
            icon={UsersRound}
          />
          <Detail
            label="Last active"
            value={
              staff.lastActive
                ? new Date(staff.lastActive).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "Not available"
            }
            icon={CircleUserRound}
          />
        </dl>
        <div className="mt-5 rounded-lg border border-border p-3">
          <h3 className="text-xs font-semibold">Module access</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {permissionsSummary(staff.permissions)}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {permissionModules
              .filter(
                (module) => (staff.permissions[module.id]?.length ?? 0) > 0,
              )
              .map((module) => (
                <li key={module.id} className="text-xs">
                  <span className="font-medium">{module.label}</span>
                  <span className="mt-0.5 block text-muted-foreground">
                    {staff.permissions[module.id]?.join(", ")}
                  </span>
                </li>
              ))}
          </ul>
        </div>
        {staff.notes && (
          <p className="mt-4 text-sm text-muted-foreground">{staff.notes}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Pencil size={14} /> Edit staff
          </button>
        </div>
      </section>
    </div>
  );
}

function Detail({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Mail;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon size={13} />
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium">{value}</dd>
    </div>
  );
}

export function StaffPage() {
  const [staff, setStaff] = useDemoState(
    "reading-room-staff",
    demoStaff,
    isStaffArray,
  );
  const { toast, showToast, dismissToast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [sort, setSort] = useState<"name" | "dateAdded" | "role">("name");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [editTarget, setEditTarget] = useState<
    StaffMember | null | undefined
  >();
  const [detailTarget, setDetailTarget] = useState<StaffMember | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<StaffMember | null>(
    null,
  );
  // Frontend permissions are a UI convenience; real authorization must be enforced by the backend.
  const currentUser = staff.find((member) => member.id === currentUserId);
  const canManage = currentUser?.role === "Library Director";

  const filtered = useMemo(
    () =>
      staff
        .filter((member) => {
          const term = search.trim().toLowerCase();
          return (
            (!term ||
              member.name.toLowerCase().includes(term) ||
              member.email.toLowerCase().includes(term)) &&
            (roleFilter === "All roles" || member.role === roleFilter) &&
            (statusFilter === "All statuses" || member.status === statusFilter)
          );
        })
        .sort(
          (a, b) =>
            (direction === "asc" ? 1 : -1) * a[sort].localeCompare(b[sort]),
        ),
    [direction, roleFilter, search, sort, staff, statusFilter],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const active = staff.filter((member) => member.status === "Active").length;

  function saveStaff(form: StaffForm) {
    const duplicate = staff.some(
      (member) =>
        member.email.toLowerCase() === form.email.toLowerCase() &&
        member.id !== editTarget?.id,
    );
    if (duplicate) {
      showToast("A staff account with this email already exists.", "error");
      return;
    }
    if (editTarget) {
      setStaff((current) =>
        current.map((member) =>
          member.id === editTarget.id ? { ...member, ...form } : member,
        ),
      );
      showToast("Staff details updated in demo data.", "success");
    } else {
      const next =
        staff.reduce(
          (max, member) =>
            Math.max(max, Number(member.id.replace("staff-", "")) || 0),
          0,
        ) + 1;
      setStaff((current) => [
        {
          ...form,
          id: `staff-${String(next).padStart(3, "0")}`,
          dateAdded: new Date().toISOString().slice(0, 10),
        },
        ...current,
      ]);
      showToast("Staff member added to demo data.", "success");
    }
    setEditTarget(undefined);
  }

  function setActive(member: StaffMember, nextStatus: StaffStatus) {
    if (member.id === currentUserId && nextStatus === "Inactive") {
      showToast(
        "You cannot deactivate the currently signed-in demo user.",
        "error",
      );
      return;
    }
    setStaff((current) =>
      current.map((item) =>
        item.id === member.id ? { ...item, status: nextStatus } : item,
      ),
    );
    setDeactivateTarget(null);
    showToast(
      `${member.name} is now ${nextStatus.toLowerCase()} in demo data.`,
      "success",
    );
  }

  function toggleSort(key: typeof sort) {
    if (sort === key)
      setDirection((value) => (value === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDirection("asc");
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Manage staff profiles, roles, and module access.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Demo staff directory · role permissions are not security enforcement
          </p>
        </div>
        <button
          type="button"
          disabled={!canManage}
          onClick={() => setEditTarget(null)}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={16} /> Add staff
        </button>
      </section>
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Staff summary">
        <FinanceSummary
          label="Staff accounts"
          value={String(staff.length)}
          detail="All invited users"
          icon={UsersRound}
        />
        <FinanceSummary
          label="Active accounts"
          value={String(active)}
          detail="Can access the workspace"
          icon={CircleUserRound}
        />
        <FinanceSummary
          label="Roles"
          value={String(staffRoles.length)}
          detail="Permission presets available"
          icon={KeyRound}
        />
      </section>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Staff directory</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {filtered.length} team members
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck size={14} /> {currentUser?.role ?? "No role"} demo
              permissions
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_180px_160px]">
            <label className="relative block">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                aria-label="Search staff"
                placeholder="Search name or email"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className={`${inputClass} pl-9`}
              />
            </label>
            <select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option>All roles</option>
              {staffRoles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option>All statuses</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-240 text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-[11px] font-medium uppercase text-muted-foreground">
                <th className="px-4 py-3 sm:px-5">
                  <SortHead
                    label="Staff member"
                    active={sort === "name"}
                    onClick={() => toggleSort("name")}
                  />
                </th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">
                  <SortHead
                    label="Role"
                    active={sort === "role"}
                    onClick={() => toggleSort("role")}
                  />
                </th>
                <th className="px-4 py-3">Access summary</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">
                  <SortHead
                    label="Date added"
                    active={sort === "dateAdded"}
                    onClick={() => toggleSort("dateAdded")}
                  />
                </th>
                <th className="px-4 py-3 text-right sm:pr-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3.5 sm:px-5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-primary">
                        {initials(member.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {member.name}
                          {member.id === currentUserId && (
                            <span className="ml-1.5 text-[10px] text-muted-foreground">
                              You
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {member.email}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                    {member.phone || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    {member.role}
                  </td>
                  <td className="max-w-48 px-4 py-3.5 text-xs text-muted-foreground">
                    {permissionsSummary(member.permissions)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${member.status === "Active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                    {dateLabel(member.dateAdded)}
                  </td>
                  <td className="px-4 py-3.5 sm:pr-5">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        aria-label={`View ${member.name}`}
                        onClick={() => setDetailTarget(member)}
                        className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit ${member.name}`}
                        disabled={!canManage}
                        onClick={() => setEditTarget(member)}
                        className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                      >
                        <Pencil size={15} />
                      </button>
                      {member.status === "Active" ? (
                        <button
                          type="button"
                          aria-label={`Deactivate ${member.name}`}
                          disabled={!canManage || member.id === currentUserId}
                          title={
                            member.id === currentUserId
                              ? "You cannot deactivate your own account"
                              : "Deactivate staff"
                          }
                          onClick={() => setDeactivateTarget(member)}
                          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                        >
                          <UserRoundX size={15} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Activate ${member.name}`}
                          disabled={!canManage}
                          onClick={() => setActive(member, "Active")}
                          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-40"
                        >
                          <Check size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!visible.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    No staff accounts match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageCount={pageCount}
          total={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </Card>
      {!canManage && (
        <p className="text-xs text-muted-foreground">
          Your demo role does not have staff-management controls enabled.
        </p>
      )}
      {editTarget !== undefined && (
        <StaffDialog
          staff={editTarget}
          onCancel={() => setEditTarget(undefined)}
          onSave={saveStaff}
        />
      )}
      {detailTarget && (
        <StaffDetailDialog
          staff={detailTarget}
          onClose={() => setDetailTarget(null)}
          onEdit={() => {
            setEditTarget(detailTarget);
            setDetailTarget(null);
          }}
        />
      )}
      {deactivateTarget && (
        <div className="fixed inset-0 z-70 grid place-items-center bg-foreground/40 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="deactivate-title"
            className="w-full max-w-sm rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl"
          >
            <span className="grid size-10 place-items-center rounded-lg bg-destructive/10 text-destructive">
              <UserRoundX size={18} />
            </span>
            <h2 id="deactivate-title" className="mt-4 text-base font-semibold">
              Deactivate {deactivateTarget.name}?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The account will be marked inactive in demo data. Existing records
              remain unchanged.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeactivateTarget(null)}
                className="h-9 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setActive(deactivateTarget, "Inactive")}
                className="h-9 rounded-md bg-destructive px-3 text-sm font-medium text-white hover:opacity-90"
              >
                Deactivate
              </button>
            </div>
          </section>
        </div>
      )}
      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

function SortHead({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 font-medium hover:text-foreground"
    >
      {label}
      <ArrowDownUp size={12} className={active ? "text-primary" : ""} />
    </button>
  );
}
