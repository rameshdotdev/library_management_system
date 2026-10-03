export type Room = {
  id: string;
  name: string;
  floor: string;
  description: string;
  seatPrefix: string;
  capacity: number;
};

export type TimeSlot = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  active?: boolean;
};

export type AssignmentStatus = "Active" | "Scheduled" | "Completed";

export type SeatAssignment = {
  id: string;
  studentId: string;
  studentName: string;
  roomId: string;
  roomName: string;
  seatNumber: string;
  timeSlotId: string;
  timeSlotName: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  status: AssignmentStatus;
  createdAt: string;
};

export const rooms: Room[] = [
  {
    id: "north-wing",
    name: "North Wing",
    floor: "Ground floor",
    description: "Quiet study area with individual desks",
    seatPrefix: "N",
    capacity: 40,
  },
  {
    id: "garden-room",
    name: "Garden Room",
    floor: "First floor",
    description: "Natural light, window-side reading desks",
    seatPrefix: "G",
    capacity: 32,
  },
  {
    id: "study-hall",
    name: "Study Hall",
    floor: "First floor",
    description: "Open hall for focused individual study",
    seatPrefix: "H",
    capacity: 48,
  },
];

export const defaultTimeSlots: TimeSlot[] = [
  { id: "morning", name: "Morning", startTime: "07:00", endTime: "15:00" },
  { id: "afternoon", name: "Afternoon", startTime: "15:00", endTime: "19:00" },
  { id: "evening", name: "Evening", startTime: "19:00", endTime: "22:00" },
  { id: "full-day", name: "Full Day", startTime: "07:00", endTime: "22:00" },
];

export const students = [
  { id: "stu-001", name: "Aarav Sharma" },
  { id: "stu-002", name: "Priya Kapoor" },
  { id: "stu-003", name: "Rohan Verma" },
  { id: "stu-004", name: "Sana Nair" },
  { id: "stu-005", name: "Dev Mehta" },
  { id: "stu-006", name: "Anaya Iyer" },
  { id: "stu-007", name: "Kabir Shah" },
  { id: "stu-008", name: "Meera Joshi" },
];

export const demoAssignments: SeatAssignment[] = [
  {
    id: "assign-001",
    studentId: "stu-001",
    studentName: "Aarav Sharma",
    roomId: "north-wing",
    roomName: "North Wing",
    seatNumber: "N-01",
    timeSlotId: "morning",
    timeSlotName: "Morning",
    startTime: "07:00",
    endTime: "15:00",
    startDate: "2026-09-01",
    endDate: "2026-12-31",
    status: "Active",
    createdAt: "2026-08-28",
  },
  {
    id: "assign-002",
    studentId: "stu-002",
    studentName: "Priya Kapoor",
    roomId: "north-wing",
    roomName: "North Wing",
    seatNumber: "N-01",
    timeSlotId: "afternoon",
    timeSlotName: "Afternoon",
    startTime: "15:00",
    endTime: "19:00",
    startDate: "2026-09-01",
    endDate: "2026-11-30",
    status: "Active",
    createdAt: "2026-08-30",
  },
  {
    id: "assign-003",
    studentId: "stu-003",
    studentName: "Rohan Verma",
    roomId: "north-wing",
    roomName: "North Wing",
    seatNumber: "N-05",
    timeSlotId: "full-day",
    timeSlotName: "Full Day",
    startTime: "07:00",
    endTime: "22:00",
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    status: "Active",
    createdAt: "2026-09-26",
  },
  {
    id: "assign-004",
    studentId: "stu-004",
    studentName: "Sana Nair",
    roomId: "garden-room",
    roomName: "Garden Room",
    seatNumber: "G-03",
    timeSlotId: "evening",
    timeSlotName: "Evening",
    startTime: "19:00",
    endTime: "22:00",
    startDate: "2026-10-02",
    endDate: "2026-10-31",
    status: "Active",
    createdAt: "2026-09-29",
  },
  {
    id: "assign-005",
    studentId: "stu-005",
    studentName: "Dev Mehta",
    roomId: "study-hall",
    roomName: "Study Hall",
    seatNumber: "H-12",
    timeSlotId: "morning",
    timeSlotName: "Morning",
    startTime: "07:00",
    endTime: "15:00",
    startDate: "2026-10-06",
    endDate: "2026-12-31",
    status: "Scheduled",
    createdAt: "2026-09-30",
  },
  {
    id: "assign-006",
    studentId: "stu-006",
    studentName: "Anaya Iyer",
    roomId: "garden-room",
    roomName: "Garden Room",
    seatNumber: "G-08",
    timeSlotId: "afternoon",
    timeSlotName: "Afternoon",
    startTime: "15:00",
    endTime: "19:00",
    startDate: "2026-07-01",
    endDate: "2026-09-30",
    status: "Completed",
    createdAt: "2026-06-25",
  },
];

export function intervalsOverlap(
  existingStart: string,
  existingEnd: string,
  requestedStart: string,
  requestedEnd: string,
) {
  return existingStart < requestedEnd && requestedStart < existingEnd;
}

export function dateRangesOverlap(
  existingStart: string,
  existingEnd: string,
  requestedStart: string,
  requestedEnd: string,
) {
  return existingStart <= requestedEnd && requestedStart <= existingEnd;
}

export function formatTimeRange(startTime: string, endTime: string) {
  const formatTime = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hour = hours % 12 || 12;
    return `${hour}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""} ${period}`;
  };
  return `${formatTime(startTime)}–${formatTime(endTime)}`;
}

export function findAssignmentConflict(
  requested: Pick<
    SeatAssignment,
    "roomId" | "seatNumber" | "startTime" | "endTime" | "startDate" | "endDate"
  >,
  assignments: SeatAssignment[],
) {
  return assignments.find(
    (existing) =>
      existing.roomId === requested.roomId &&
      existing.seatNumber === requested.seatNumber &&
      dateRangesOverlap(
        existing.startDate,
        existing.endDate,
        requested.startDate,
        requested.endDate,
      ) &&
      intervalsOverlap(
        existing.startTime,
        existing.endTime,
        requested.startTime,
        requested.endTime,
      ),
  );
}

export function isTimeSlotArray(value: unknown): value is TimeSlot[] {
  return (
    Array.isArray(value) &&
    value.every(
      (slot) =>
        typeof slot?.id === "string" &&
        typeof slot?.name === "string" &&
        typeof slot?.startTime === "string" &&
        typeof slot?.endTime === "string" &&
        (slot.active === undefined || typeof slot.active === "boolean"),
    )
  );
}

export function isAssignmentArray(value: unknown): value is SeatAssignment[] {
  return (
    Array.isArray(value) &&
    value.every(
      (assignment) =>
        typeof assignment?.id === "string" &&
        typeof assignment?.studentName === "string" &&
        typeof assignment?.roomId === "string" &&
        typeof assignment?.seatNumber === "string" &&
        typeof assignment?.timeSlotName === "string" &&
        typeof assignment?.startTime === "string" &&
        typeof assignment?.endTime === "string" &&
        typeof assignment?.startDate === "string" &&
        typeof assignment?.endDate === "string" &&
        ["Active", "Scheduled", "Completed"].includes(assignment?.status),
    )
  );
}
