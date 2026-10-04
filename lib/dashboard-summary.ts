export type DashboardSummary = {
  totalStudents: number;
  activeStudents: number;
  onHoldStudents: number;
  archivedStudents: number;
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  totalCollections: number;
  outstandingFees: number;
  paymentCount: number;
};

type SummaryStudent = {
  id?: string;
  status?: string;
  monthlyFee?: number;
};

type SummaryRoom = {
  capacity?: number;
};

type SummaryAssignment = {
  roomId?: string;
  seatNumber?: string;
  status?: string;
};

type SummaryPayment = {
  amount?: number;
};

type SummaryInvoice = {
  amount?: number;
  paidAmount?: number;
};

export function buildDashboardSummary(input: {
  students: SummaryStudent[];
  rooms: SummaryRoom[];
  assignments: SummaryAssignment[];
  payments: SummaryPayment[];
  invoices: SummaryInvoice[];
}): DashboardSummary {
  const totalStudents = input.students.length;
  const activeStudents = input.students.filter(
    (student) => student.status === "Active",
  ).length;
  const onHoldStudents = input.students.filter(
    (student) => student.status === "On hold",
  ).length;
  const archivedStudents = input.students.filter(
    (student) => student.status === "Archived",
  ).length;

  const totalSeats = input.rooms.reduce(
    (sum, room) => sum + Number(room.capacity ?? 0),
    0,
  );

  const activeAssignments = input.assignments.filter(
    (assignment) => assignment.status !== "Completed",
  );
  const occupiedSeatKeys = new Set(
    activeAssignments
      .filter(
        (assignment) =>
          typeof assignment.roomId === "string" &&
          typeof assignment.seatNumber === "string",
      )
      .map(
        (assignment) => `${assignment.roomId}:${assignment.seatNumber}`,
      ),
  );

  const occupiedSeats = occupiedSeatKeys.size;
  const availableSeats = Math.max(0, totalSeats - occupiedSeats);

  const totalCollections = input.payments.reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0,
  );

  const outstandingFees = input.invoices.reduce(
    (sum, invoice) =>
      sum + Math.max(0, Number(invoice.amount ?? 0) - Number(invoice.paidAmount ?? 0)),
    0,
  );

  return {
    totalStudents,
    activeStudents,
    onHoldStudents,
    archivedStudents,
    totalSeats,
    occupiedSeats,
    availableSeats,
    totalCollections,
    outstandingFees,
    paymentCount: input.payments.length,
  };
}
