import { z } from "zod";

const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const seatAssignmentCreateSchema = z
  .object({
    studentId: z.string().min(1),
    roomId: z.string().trim().min(1).max(100),
    seatNumber: z.string().trim().min(1).max(12),
    timeSlotId: z.string().trim().min(1).max(80),
    timeSlotName: z.string().trim().min(1).max(80),
    startTime: timeSchema,
    endTime: timeSchema,
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .refine((assignment) => assignment.startTime < assignment.endTime, {
    path: ["endTime"],
    message: "End time must be later than start time.",
  })
  .refine((assignment) => assignment.startDate <= assignment.endDate, {
    path: ["endDate"],
    message: "End date must be on or after start date.",
  });