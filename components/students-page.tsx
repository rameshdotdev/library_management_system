"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Armchair,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, inputClass } from "@/components/ui/field";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { useDemoState } from "@/components/use-demo-state";
import {
  dateRangesOverlap,
  demoAssignments,
  isAssignmentArray,
} from "@/lib/seat-management";
import {
  demoStudents,
  isStudentArray,
  membershipPlans,
  type Student,
  type StudentStatus,
} from "@/lib/student-management";

const pageSize = 5;
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

type StudentFormValues = Pick<
  Student,
  | "name"
  | "email"
  | "phone"
  | "guardianName"
  | "status"
  | "membershipName"
  | "membershipEndsOn"
  | "monthlyFee"
>;

function todayValue() {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

function dateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function studentNumber(students: Student[]) {
  const maxId = students.reduce((max, student) => {
    const value = Number(student.id.replace("stu-", ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `stu-${String(maxId + 1).padStart(3, "0")}`;
}

function StatusBadge({ status }: { status: StudentStatus }) {
  const colors: Record<StudentStatus, string> = {
    Active: "bg-primary/10 text-primary",
    "On hold": "bg-accent text-accent-foreground",
    Archived: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${colors[status]}`}
    >
      {status}
    </span>
  );
}

function StudentFormDialog({
  student,
  onClose,
  onSave,
}: {
  student: Student | null;
  onClose: () => void;
  onSave: (values: StudentFormValues) => void;
}) {
  const [values, setValues] = useState<StudentFormValues>(
    student
      ? {
          name: student.name,
          email: student.email,
          phone: student.phone,
          guardianName: student.guardianName,
          status: student.status,
          membershipName: student.membershipName,
          membershipEndsOn: student.membershipEndsOn,
          monthlyFee: student.monthlyFee,
        }
      : {
          name: "",
          email: "",
          phone: "",
          guardianName: "",
          status: "Active",
          membershipName: "Standard",
          membershipEndsOn: "2026-12-31",
          monthlyFee: 1800,
        },
  );

  function update<K extends keyof StudentFormValues>(
    key: K,
    value: StudentFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({ ...values, name: values.name.trim(), email: values.email.trim() });
  }

  return (
    <div
      className="fixed inset-0 z-70 grid place-items-center overflow-y-auto bg-foreground/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-form-title"
        className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="student-form-title" className="text-lg font-semibold">
              {student ? "Edit student" : "Add student"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep contact and membership details up to date.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close student form"
            onClick={onClose}
            className="rounded px-2 py-1 text-muted-foreground hover:bg-muted"
          >
            ×
          </button>
        </div>
        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Student name" className="sm:col-span-2">
            <input
              autoFocus
              required
              maxLength={80}
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Email address">
            <input
              required
              type="email"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Phone number">
            <input
              required
              type="tel"
              value={values.phone}
              onChange={(event) => update("phone", event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Parent / guardian" className="sm:col-span-2">
            <input
              required
              value={values.guardianName}
              onChange={(event) => update("guardianName", event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Membership plan">
            <select
              value={values.membershipName}
              onChange={(event) => {
                const plan = membershipPlans.find(
                  (item) => item.name === event.target.value,
                );
                update("membershipName", event.target.value);
                if (plan) update("monthlyFee", plan.monthlyPrice);
              }}
              className={inputClass}
            >
              {membershipPlans.map((plan) => (
                <option key={plan.id} value={plan.name}>
                  {plan.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Membership ends">
            <input
              required
              type="date"
              value={values.membershipEndsOn}
              onChange={(event) =>
                update("membershipEndsOn", event.target.value)
              }
              className={inputClass}
            />
          </Field>
          <Field label="Monthly fee (₹)">
            <input
              required
              type="number"
              min="0"
              value={values.monthlyFee}
              onChange={(event) =>
                update("monthlyFee", Number(event.target.value))
              }
              className={inputClass}
            />
          </Field>
          <Field label="Status">
            <select
              value={values.status}
              onChange={(event) =>
                update("status", event.target.value as StudentStatus)
              }
              className={inputClass}
            >
              <option>Active</option>
              <option>On hold</option>
              <option>Archived</option>
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {student ? "Save changes" : "Add student"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ArchiveDialog({
  student,
  onCancel,
  onConfirm,
}: {
  student: Student;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-70 grid place-items-center bg-foreground/40 p-4">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="archive-title"
        className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl"
      >
        <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <Archive size={18} />
        </div>
        <h2 id="archive-title" className="mt-4 text-base font-semibold">
          Archive {student.name}?
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This keeps the student and payment history for your records, but marks
          the profile as archived.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-md border border-border px-3.5 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 rounded-md bg-destructive px-3.5 text-sm font-medium text-white hover:opacity-90"
          >
            Archive student
          </button>
        </div>
      </section>
    </div>
  );
}

export function StudentsPage() {
  const [students, setStudents] = useDemoState(
    "reading-room-students",
    demoStudents,
    isStudentArray,
  );
  const [, setAssignments] = useDemoState(
    "reading-room-assignments",
    demoAssignments,
    isAssignmentArray,
  );

  useEffect(() => {
    let active = true;

    async function loadStudents() {
      try {
        const response = await fetch("/api/v1/students");
        const payload = (await response.json()) as { students?: Student[] };
        if (active && Array.isArray(payload.students)) {
          setStudents(payload.students);
        }
      } catch {
        if (active) {
          setStudents(demoStudents);
        }
      }
    }

    void loadStudents();
    return () => {
      active = false;
    };
  }, [setStudents]);

  const { toast, showToast, dismissToast } = useToast();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [membershipFilter, setMembershipFilter] = useState("All memberships");
  const [page, setPage] = useState(1);
  const [formStudent, setFormStudent] = useState<Student | null | undefined>();
  const [archiveStudent, setArchiveStudent] = useState<Student | null>(null);

  const filtered = students.filter((student) => {
    const term = query.trim().toLowerCase();
    const matchesSearch =
      !term ||
      [student.name, student.email, student.phone, student.id].some((value) =>
        value.toLowerCase().includes(term),
      );
    return (
      matchesSearch &&
      (statusFilter === "All statuses" || student.status === statusFilter) &&
      (membershipFilter === "All memberships" ||
        student.membershipName === membershipFilter)
    );
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageStudents = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function saveStudent(values: StudentFormValues) {
    const duplicateEmail = students.some(
      (item) =>
        item.email.toLowerCase() === values.email.toLowerCase() &&
        item.id !== formStudent?.id,
    );
    if (duplicateEmail) {
      showToast("A student with this email address already exists.", "error");
      return;
    }
    if (!values.name || !values.phone || !values.guardianName) {
      showToast("Complete all required student details.", "error");
      return;
    }

    try {
      const endpoint = formStudent
        ? `/api/v1/students/${formStudent.id}`
        : "/api/v1/students";
      const method = formStudent ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as {
        student?: Student;
        message?: string;
      };

      if (!response.ok || !payload.student) {
        throw new Error(payload.message ?? "Could not save student.");
      }

      if (formStudent) {
        setStudents((current) =>
          current.map((student) =>
            student.id === formStudent.id ? payload.student! : student,
          ),
        );
        setAssignments((current) =>
          current.map((assignment) =>
            assignment.studentId === formStudent.id
              ? { ...assignment, studentName: payload.student!.name }
              : assignment,
          ),
        );
        showToast(`${values.name}'s profile has been updated.`, "success");
      } else {
        setStudents((current) => [payload.student!, ...current]);
        showToast(`${values.name} has been added to the directory.`, "success");
      }
      setPage(1);
      setFormStudent(undefined);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "The student could not be saved.",
        "error",
      );
    }
  }

  async function archiveSelected() {
    if (!archiveStudent) return;

    try {
      const response = await fetch(`/api/v1/students/${archiveStudent.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as {
        student?: Student;
        message?: string;
      };
      if (!response.ok || !payload.student) {
        throw new Error(
          payload.message ?? "The student could not be archived.",
        );
      }

      setStudents((current) =>
        current.map((student) =>
          student.id === archiveStudent.id ? payload.student! : student,
        ),
      );
      showToast(`${archiveStudent.name} has been archived.`, "success");
      setArchiveStudent(null);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "The student could not be archived.",
        "error",
      );
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Manage student profiles, memberships, and account history.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Demo data · changes stay in this browser
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormStudent(null)}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={16} /> Add student
        </button>
      </div>

      <section
        className="grid gap-3 sm:grid-cols-3"
        aria-label="Student summary"
      >
        <SummaryCard
          label="Total students"
          value={students.length}
          icon={UsersRound}
        />
        <SummaryCard
          label="Active students"
          value={
            students.filter((student) => student.status === "Active").length
          }
          icon={UserRound}
        />
        <SummaryCard
          label="On hold"
          value={
            students.filter((student) => student.status === "On hold").length
          }
          icon={CalendarDays}
        />
      </section>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-base font-semibold">Student directory</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "profile" : "profiles"}{" "}
              found
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(200px,1fr)_150px_160px]">
            <label className="relative block">
              <Search
                aria-hidden="true"
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                aria-label="Search students"
                placeholder="Search name, email, phone…"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                className={`${inputClass} pl-9`}
              />
            </label>
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
              <option>On hold</option>
              <option>Archived</option>
            </select>
            <select
              aria-label="Filter by membership"
              value={membershipFilter}
              onChange={(event) => {
                setMembershipFilter(event.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option>All memberships</option>
              {membershipPlans.map((plan) => (
                <option key={plan.id}>{plan.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-180 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-[11px] font-medium uppercase text-muted-foreground">
                <th className="px-4 py-3 sm:px-5">Student</th>
                <th className="px-4 py-3">Membership</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Monthly fee</th>
                <th className="px-4 py-3 text-right sm:pr-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3.5 sm:px-5">
                    <Link
                      href={`/students/${student.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {student.name}
                    </Link>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {student.email}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="block font-medium">
                      {student.membershipName}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Until {dateLabel(student.membershipEndsOn)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                    {dateLabel(student.joinedOn)}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={student.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium">
                    {currency.format(student.monthlyFee)}
                  </td>
                  <td className="px-4 py-3.5 sm:pr-5">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/students/${student.id}`}
                        aria-label={`View ${student.name}`}
                        title="View profile"
                        className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <ArrowRight size={15} />
                      </Link>
                      <button
                        type="button"
                        aria-label={`Edit ${student.name}`}
                        title="Edit student"
                        onClick={() => setFormStudent(student)}
                        className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil size={15} />
                      </button>
                      {student.status !== "Archived" && (
                        <button
                          type="button"
                          aria-label={`Archive ${student.name}`}
                          title="Archive student"
                          onClick={() => setArchiveStudent(student)}
                          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Archive size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {pageStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-14 text-center text-sm text-muted-foreground"
                  >
                    No students match those filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–
            {Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-16 text-center text-xs text-muted-foreground">
              Page {page} of {pageCount}
            </span>
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </Card>

      {formStudent !== undefined && (
        <StudentFormDialog
          student={formStudent}
          onClose={() => setFormStudent(undefined)}
          onSave={saveStudent}
        />
      )}
      {archiveStudent && (
        <ArchiveDialog
          student={archiveStudent}
          onCancel={() => setArchiveStudent(null)}
          onConfirm={archiveSelected}
        />
      )}
      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

export function StudentDetailsPage({ studentId }: { studentId: string }) {
  const [students, setStudents] = useDemoState(
    "reading-room-students",
    demoStudents,
    isStudentArray,
  );
  const [assignments, setAssignments] = useDemoState(
    "reading-room-assignments",
    demoAssignments,
    isAssignmentArray,
  );

  useEffect(() => {
    let active = true;

    async function loadStudent() {
      try {
        const response = await fetch(`/api/v1/students/${studentId}`);
        const payload = (await response.json()) as { student?: Student };
        if (active && payload.student) {
          const nextStudent = payload.student;
          setStudents((current) => {
            const match = current.find((student) => student.id === studentId);
            if (match) {
              return current.map((student) =>
                student.id === studentId ? nextStudent : student,
              );
            }
            return [nextStudent, ...current];
          });
        }
      } catch {
        // Keep the existing demo data as fallback.
      }
    }

    void loadStudent();
    return () => {
      active = false;
    };
  }, [setStudents, studentId]);

  const { toast, showToast, dismissToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const student = students.find((item) => item.id === studentId);
  const today = todayValue();
  const assignment = assignments.find(
    (item) =>
      item.studentId === studentId &&
      item.status !== "Completed" &&
      dateRangesOverlap(item.startDate, item.endDate, today, today),
  );

  if (!student) {
    return (
      <Card className="mx-auto max-w-2xl p-6 text-center sm:p-10">
        <h2 className="text-lg font-semibold">Student profile not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This profile may have been removed from the local demo data.
        </p>
        <Link
          href="/students"
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft size={15} /> Back to students
        </Link>
      </Card>
    );
  }
  const profile = student;

  async function saveDetails(values: StudentFormValues) {
    if (
      students.some(
        (item) =>
          item.email.toLowerCase() === values.email.toLowerCase() &&
          item.id !== profile.id,
      )
    ) {
      showToast("A student with this email address already exists.", "error");
      return;
    }

    try {
      const response = await fetch(`/api/v1/students/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as {
        student?: Student;
        message?: string;
      };
      if (!response.ok || !payload.student) {
        throw new Error(
          payload.message ?? "Student profile could not be updated.",
        );
      }

      setStudents((current) =>
        current.map((item) =>
          item.id === profile.id ? payload.student! : item,
        ),
      );
      setAssignments((current) =>
        current.map((item) =>
          item.studentId === profile.id
            ? { ...item, studentName: payload.student!.name }
            : item,
        ),
      );
      setEditing(false);
      showToast("Student profile updated.", "success");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Student profile update failed.",
        "error",
      );
    }
  }

  async function archiveProfile() {
    try {
      const response = await fetch(`/api/v1/students/${profile.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as {
        student?: Student;
        message?: string;
      };
      if (!response.ok || !payload.student) {
        throw new Error(payload.message ?? "Student could not be archived.");
      }

      setStudents((current) =>
        current.map((item) =>
          item.id === profile.id ? payload.student! : item,
        ),
      );
      setConfirmArchive(false);
      showToast(`${profile.name} has been archived.`, "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Student archive failed.",
        "error",
      );
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={15} /> Students
        </Link>
        <div className="flex gap-2">
          {student.status !== "Archived" && (
            <button
              type="button"
              onClick={() => setConfirmArchive(true)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:border-destructive/40 hover:text-destructive"
            >
              <Archive size={15} /> Archive
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Pencil size={15} /> Edit profile
          </button>
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-secondary text-lg font-semibold text-primary">
            {student.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{student.name}</h2>
              <StatusBadge status={student.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Student ID · {student.id.toUpperCase()}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Mail size={14} />
                {student.email}
              </span>
              <span className="inline-flex items-center gap-2">
                <Phone size={14} />
                {student.phone}
              </span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-muted-foreground">Member since</p>
            <p className="mt-1 text-sm font-medium">
              {dateLabel(student.joinedOn)}
            </p>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserRound size={16} />
            <h3 className="text-sm font-semibold text-foreground">
              Contact information
            </h3>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <DetailRow label="Email" value={student.email} />
            <DetailRow label="Phone" value={student.phone} />
            <DetailRow label="Parent / guardian" value={student.guardianName} />
          </dl>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CircleDollarSign size={16} />
            <h3 className="text-sm font-semibold text-foreground">
              Membership
            </h3>
          </div>
          <p className="mt-4 text-lg font-semibold">{student.membershipName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {currency.format(student.monthlyFee)} per month
          </p>
          <div className="mt-4 border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Valid through</span>
            <span className="float-right font-medium">
              {dateLabel(student.membershipEndsOn)}
            </span>
          </div>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Armchair size={16} />
            <h3 className="text-sm font-semibold text-foreground">
              Current seat assignment
            </h3>
          </div>
          {assignment ? (
            <>
              <p className="mt-4 text-lg font-semibold">
                {assignment.seatNumber}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {assignment.roomName} · {assignment.timeSlotName}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {dateLabel(assignment.startDate)} –{" "}
                {dateLabel(assignment.endDate)}
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              No current seat reservation is recorded.
            </p>
          )}
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <div>
            <h3 className="text-base font-semibold">Payment history</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Recorded membership payments
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {student.payments.length} records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-140 text-left text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/60 text-[11px] font-medium uppercase text-muted-foreground">
                <th className="px-4 py-3 sm:px-5">Payment</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Method / reference</th>
                <th className="px-4 py-3 text-right sm:pr-5">Amount</th>
              </tr>
            </thead>
            <tbody>
              {student.payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 sm:px-5">
                    <span className="font-medium">{payment.description}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {dateLabel(payment.date)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block">
                      {payment.customMethod ?? payment.method}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {payment.reference}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium sm:pr-5">
                    {currency.format(payment.amount)}
                  </td>
                </tr>
              ))}
              {student.payments.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-muted-foreground"
                  >
                    No payments have been recorded for this student.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <StudentFormDialog
          student={student}
          onClose={() => setEditing(false)}
          onSave={saveDetails}
        />
      )}
      {confirmArchive && (
        <ArchiveDialog
          student={student}
          onCancel={() => setConfirmArchive(false)}
          onConfirm={archiveProfile}
        />
      )}
      <ToastViewport toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof UsersRound;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
        <Icon size={18} />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-semibold">{value}</p>
      </div>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-all text-right font-medium">{value}</dd>
    </div>
  );
}
