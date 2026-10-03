export const staffRoles = [
  "Library Director",
  "Manager",
  "Receptionist",
  "Accountant",
  "Staff",
] as const;

export type StaffRole = (typeof staffRoles)[number];
export type StaffStatus = "Active" | "Inactive";
export type PermissionAction = "View" | "Create" | "Edit" | "Delete";

export const permissionModules = [
  { id: "dashboard", label: "Dashboard", actions: ["View"] },
  {
    id: "students",
    label: "Students",
    actions: ["View", "Create", "Edit", "Delete"],
  },
  {
    id: "admissions",
    label: "Admissions",
    actions: ["View", "Create", "Edit", "Delete"],
  },
  {
    id: "rooms",
    label: "Rooms and seats",
    actions: ["View", "Create", "Edit", "Delete"],
  },
  {
    id: "assignments",
    label: "Seat assignments",
    actions: ["View", "Create", "Edit", "Delete"],
  },
  {
    id: "memberships",
    label: "Memberships",
    actions: ["View", "Create", "Edit", "Delete"],
  },
  {
    id: "finance",
    label: "Fees and payments",
    actions: ["View", "Create", "Edit", "Delete"],
  },
  {
    id: "expenses",
    label: "Expenses",
    actions: ["View", "Create", "Edit", "Delete"],
  },
  { id: "reports", label: "Reports", actions: ["View"] },
  {
    id: "staff",
    label: "Staff management",
    actions: ["View", "Create", "Edit", "Delete"],
  },
  { id: "settings", label: "Settings", actions: ["View", "Edit"] },
] as const;

export type PermissionModuleId = (typeof permissionModules)[number]["id"];
export type StaffPermissions = Partial<
  Record<PermissionModuleId, PermissionAction[]>
>;

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  permissions: StaffPermissions;
  dateAdded: string;
  lastActive?: string;
  notes: string;
};

export function permissionsForRole(role: StaffRole): StaffPermissions {
  const viewAll: PermissionModuleId[] = [
    "dashboard",
    "students",
    "admissions",
    "rooms",
    "assignments",
    "memberships",
    "finance",
    "expenses",
    "reports",
    "staff",
    "settings",
  ];
  if (role === "Library Director") {
    return Object.fromEntries(
      permissionModules.map(({ id, actions }) => [id, [...actions]]),
    ) as StaffPermissions;
  }
  if (role === "Manager") {
    return Object.fromEntries(
      viewAll.map((id) => [
        id,
        permissionModules
          .find((module) => module.id === id)
          ?.actions.filter((action) => action !== "Delete") ?? [],
      ]),
    ) as StaffPermissions;
  }
  const defaults: Record<
    Exclude<StaffRole, "Library Director" | "Manager">,
    PermissionModuleId[]
  > = {
    Receptionist: [
      "dashboard",
      "students",
      "admissions",
      "rooms",
      "assignments",
      "memberships",
    ],
    Accountant: [
      "dashboard",
      "students",
      "memberships",
      "finance",
      "expenses",
      "reports",
    ],
    Staff: ["dashboard", "rooms", "assignments"],
  };
  return Object.fromEntries(
    defaults[role].map((id) => [
      id,
      permissionModules
        .find((module) => module.id === id)
        ?.actions.filter(
          (action) =>
            action === "View" ||
            (role === "Receptionist" &&
              ["students", "admissions", "assignments"].includes(id) &&
              action === "Create"),
        ) ?? [],
    ]),
  ) as StaffPermissions;
}

export const demoStaff: StaffMember[] = [
  {
    id: "staff-001",
    name: "Admin Manager",
    email: "admin@readingroom.in",
    phone: "+91 98765 40001",
    role: "Library Director",
    status: "Active",
    permissions: permissionsForRole("Library Director"),
    dateAdded: "2025-03-12",
    lastActive: "2026-10-03T09:42:00",
    notes: "Primary account",
  },
  {
    id: "staff-002",
    name: "Nisha Patel",
    email: "nisha.patel@readingroom.in",
    phone: "+91 98765 40002",
    role: "Manager",
    status: "Active",
    permissions: permissionsForRole("Manager"),
    dateAdded: "2025-08-21",
    lastActive: "2026-10-03T08:15:00",
    notes: "North wing operations",
  },
  {
    id: "staff-003",
    name: "Rahul Desai",
    email: "rahul.desai@readingroom.in",
    phone: "+91 98765 40003",
    role: "Receptionist",
    status: "Active",
    permissions: permissionsForRole("Receptionist"),
    dateAdded: "2026-01-08",
    lastActive: "2026-10-02T19:04:00",
    notes: "Evening desk",
  },
  {
    id: "staff-004",
    name: "Aditi Rao",
    email: "aditi.rao@readingroom.in",
    phone: "+91 98765 40004",
    role: "Accountant",
    status: "Active",
    permissions: permissionsForRole("Accountant"),
    dateAdded: "2025-11-19",
    lastActive: "2026-10-03T07:52:00",
    notes: "Billing and reconciliation",
  },
  {
    id: "staff-005",
    name: "Vikram Singh",
    email: "vikram.singh@readingroom.in",
    phone: "+91 98765 40005",
    role: "Staff",
    status: "Inactive",
    permissions: permissionsForRole("Staff"),
    dateAdded: "2026-04-15",
    lastActive: "2026-09-27T14:30:00",
    notes: "Weekend support",
  },
];

export function isStaffArray(value: unknown): value is StaffMember[] {
  return (
    Array.isArray(value) &&
    value.every(
      (member) =>
        typeof member?.id === "string" &&
        typeof member?.name === "string" &&
        typeof member?.email === "string" &&
        typeof member?.phone === "string" &&
        staffRoles.includes(member?.role) &&
        ["Active", "Inactive"].includes(member?.status) &&
        typeof member?.permissions === "object" &&
        typeof member?.dateAdded === "string" &&
        typeof member?.notes === "string",
    )
  );
}
