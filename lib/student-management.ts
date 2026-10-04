export type StudentStatus = "Active" | "On hold" | "Archived";
export type PaymentMethod = "Cash" | "UPI" | "Bank transfer" | "Card" | "Other";

export type PaymentRecord = {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  customMethod?: string;
  reference: string;
  invoiceNumber?: string;
  description: string;
  notes?: string;
};

export type Student = {
  id: string;
  name: string;
  email: string;
  phone: string;
  guardianName: string;
  guardianPhone?: string;
  documentImageUrl?: string;
  documentImagePublicId?: string;
  joinedOn: string;
  status: StudentStatus;
  membershipName: string;
  membershipEndsOn: string;
  monthlyFee: number;
  payments: PaymentRecord[];
};

export type MembershipPlan = {
  id: string;
  name: string;
  monthlyPrice: number;
  description: string;
  active?: boolean;
};

export const membershipPlans: MembershipPlan[] = [
  {
    id: "standard",
    name: "Standard",
    monthlyPrice: 1800,
    description: "A dedicated seat during one selected time slot",
  },
  {
    id: "plus",
    name: "Plus",
    monthlyPrice: 2400,
    description: "Flexible study access with a reserved seat",
  },
  {
    id: "exam-prep",
    name: "Exam Prep",
    monthlyPrice: 3200,
    description: "Full-day access for focused exam preparation",
  },
];

export function isMembershipPlanArray(
  value: unknown,
): value is MembershipPlan[] {
  return (
    Array.isArray(value) &&
    value.every(
      (plan) =>
        typeof plan?.id === "string" &&
        typeof plan?.name === "string" &&
        typeof plan?.monthlyPrice === "number" &&
        typeof plan?.description === "string" &&
        (plan.active === undefined || typeof plan.active === "boolean"),
    )
  );
}

export const demoStudents: Student[] = [
  {
    id: "stu-001",
    name: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    phone: "+91 98765 12001",
    guardianName: "Rakesh Sharma",
    joinedOn: "2026-06-12",
    status: "Active",
    membershipName: "Standard",
    membershipEndsOn: "2026-12-31",
    monthlyFee: 1800,
    payments: [
      {
        id: "pay-001",
        date: "2026-10-01",
        amount: 1800,
        method: "UPI",
        reference: "UPI-782104",
        description: "October membership",
      },
      {
        id: "pay-002",
        date: "2026-09-01",
        amount: 1800,
        method: "UPI",
        reference: "UPI-769813",
        description: "September membership",
      },
      {
        id: "pay-003",
        date: "2026-08-01",
        amount: 1800,
        method: "Cash",
        reference: "CASH-421",
        description: "August membership",
      },
    ],
  },
  {
    id: "stu-002",
    name: "Priya Kapoor",
    email: "priya.kapoor@example.com",
    phone: "+91 98765 12002",
    guardianName: "Nitin Kapoor",
    joinedOn: "2026-05-21",
    status: "Active",
    membershipName: "Plus",
    membershipEndsOn: "2026-11-30",
    monthlyFee: 2400,
    payments: [
      {
        id: "pay-004",
        date: "2026-10-02",
        amount: 2400,
        method: "Card",
        reference: "POS-591203",
        description: "October membership",
      },
      {
        id: "pay-005",
        date: "2026-09-02",
        amount: 2400,
        method: "Card",
        reference: "POS-581112",
        description: "September membership",
      },
    ],
  },
  {
    id: "stu-003",
    name: "Rohan Verma",
    email: "rohan.verma@example.com",
    phone: "+91 98765 12003",
    guardianName: "Maya Verma",
    joinedOn: "2026-07-03",
    status: "Active",
    membershipName: "Exam Prep",
    membershipEndsOn: "2026-10-31",
    monthlyFee: 3200,
    payments: [
      {
        id: "pay-006",
        date: "2026-10-01",
        amount: 3200,
        method: "Bank transfer",
        reference: "NEFT-90137",
        description: "October membership",
      },
    ],
  },
  {
    id: "stu-004",
    name: "Sana Nair",
    email: "sana.nair@example.com",
    phone: "+91 98765 12004",
    guardianName: "Vijay Nair",
    joinedOn: "2026-08-18",
    status: "Active",
    membershipName: "Standard",
    membershipEndsOn: "2026-11-30",
    monthlyFee: 1800,
    payments: [
      {
        id: "pay-007",
        date: "2026-10-02",
        amount: 1800,
        method: "UPI",
        reference: "UPI-792203",
        description: "October membership",
      },
    ],
  },
  {
    id: "stu-005",
    name: "Dev Mehta",
    email: "dev.mehta@example.com",
    phone: "+91 98765 12005",
    guardianName: "Bhavna Mehta",
    joinedOn: "2026-09-06",
    status: "Active",
    membershipName: "Plus",
    membershipEndsOn: "2026-12-05",
    monthlyFee: 2400,
    payments: [
      {
        id: "pay-008",
        date: "2026-10-03",
        amount: 2400,
        method: "Cash",
        reference: "CASH-438",
        description: "October membership",
      },
    ],
  },
  {
    id: "stu-006",
    name: "Anaya Iyer",
    email: "anaya.iyer@example.com",
    phone: "+91 98765 12006",
    guardianName: "Suresh Iyer",
    joinedOn: "2026-04-11",
    status: "On hold",
    membershipName: "Standard",
    membershipEndsOn: "2026-09-30",
    monthlyFee: 1800,
    payments: [
      {
        id: "pay-009",
        date: "2026-09-01",
        amount: 1800,
        method: "UPI",
        reference: "UPI-751010",
        description: "September membership",
      },
    ],
  },
  {
    id: "stu-007",
    name: "Kabir Shah",
    email: "kabir.shah@example.com",
    phone: "+91 98765 12007",
    guardianName: "Alpa Shah",
    joinedOn: "2026-03-14",
    status: "Active",
    membershipName: "Exam Prep",
    membershipEndsOn: "2026-12-31",
    monthlyFee: 3200,
    payments: [
      {
        id: "pay-010",
        date: "2026-10-01",
        amount: 3200,
        method: "UPI",
        reference: "UPI-782220",
        description: "October membership",
      },
      {
        id: "pay-011",
        date: "2026-09-01",
        amount: 3200,
        method: "UPI",
        reference: "UPI-760113",
        description: "September membership",
      },
    ],
  },
  {
    id: "stu-008",
    name: "Meera Joshi",
    email: "meera.joshi@example.com",
    phone: "+91 98765 12008",
    guardianName: "Ajay Joshi",
    joinedOn: "2026-02-09",
    status: "Archived",
    membershipName: "Standard",
    membershipEndsOn: "2026-08-31",
    monthlyFee: 1800,
    payments: [
      {
        id: "pay-012",
        date: "2026-08-01",
        amount: 1800,
        method: "Cash",
        reference: "CASH-390",
        description: "August membership",
      },
    ],
  },
];

export function isStudentArray(value: unknown): value is Student[] {
  return (
    Array.isArray(value) &&
    value.every(
      (student) =>
        typeof student?.id === "string" &&
        typeof student?.name === "string" &&
        typeof student?.email === "string" &&
        typeof student?.phone === "string" &&
        typeof student?.guardianName === "string" &&
        typeof student?.joinedOn === "string" &&
        ["Active", "On hold", "Archived"].includes(student?.status) &&
        typeof student?.membershipName === "string" &&
        typeof student?.membershipEndsOn === "string" &&
        typeof student?.monthlyFee === "number" &&
        Array.isArray(student?.payments) &&
        student.payments.every(
          (payment: PaymentRecord) =>
            typeof payment.id === "string" &&
            typeof payment.date === "string" &&
            typeof payment.amount === "number" &&
            typeof payment.method === "string" &&
            typeof payment.reference === "string" &&
            typeof payment.description === "string",
        ),
    )
  );
}
